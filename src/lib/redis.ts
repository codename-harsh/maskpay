import { Redis } from "@upstash/redis";

const hasUpstashConfig =
  Boolean(process.env.UPSTASH_REDIS_REST_URL) &&
  Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);

export const upstashRedis = hasUpstashConfig
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

interface MemoryEntry {
  value: string;
  expiresAt: number | null;
}

const globalMemory = globalThis as unknown as {
  maskpayStore?: Map<string, MemoryEntry>;
  maskpayEvents?: Map<string, string[]>;
};

const memoryStore = globalMemory.maskpayStore ?? new Map<string, MemoryEntry>();
const memoryEvents = globalMemory.maskpayEvents ?? new Map<string, string[]>();

if (process.env.NODE_ENV !== "production") {
  globalMemory.maskpayStore = memoryStore;
  globalMemory.maskpayEvents = memoryEvents;
}

export const cacheEngine = {
  async setFlag(key: string, value: string, ttlSeconds: number): Promise<void> {
    if (upstashRedis) {
      await upstashRedis.set(key, value, { ex: ttlSeconds });
      return;
    }
    memoryStore.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  },

  async getFlag(key: string): Promise<string | null> {
    if (upstashRedis) {
      return await upstashRedis.get<string>(key);
    }
    const entry = memoryStore.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      memoryStore.delete(key);
      return null;
    }
    return entry.value;
  },

  async incrementCounter(key: string, ttlSeconds: number): Promise<number> {
    if (upstashRedis) {
      const val = await upstashRedis.incr(key);
      if (val === 1) {
        await upstashRedis.expire(key, ttlSeconds);
      }
      return val;
    }
    const existing = memoryStore.get(key);
    if (!existing || (existing.expiresAt && Date.now() > existing.expiresAt)) {
      memoryStore.set(key, {
        value: "1",
        expiresAt: Date.now() + ttlSeconds * 1000,
      });
      return 1;
    }
    const nextVal = parseInt(existing.value, 10) + 1;
    existing.value = String(nextVal);
    memoryStore.set(key, existing);
    return nextVal;
  },

  async pushSoundboxEvent(vaultId: string, eventPayload: unknown): Promise<void> {
    const listKey = "soundbox:events:" + vaultId;
    const serialized = JSON.stringify(eventPayload);
    if (upstashRedis) {
      await upstashRedis.lpush(listKey, serialized);
      await upstashRedis.ltrim(listKey, 0, 19);
      await upstashRedis.expire(listKey, 86400);
      return;
    }
    const existing = memoryEvents.get(listKey) ?? [];
    existing.unshift(serialized);
    memoryEvents.set(listKey, existing.slice(0, 20));
  },

  async getSoundboxEvents<T>(vaultId: string): Promise<T[]> {
    const listKey = "soundbox:events:" + vaultId;
    if (upstashRedis) {
      const items = await upstashRedis.lrange<string | T>(listKey, 0, 19);
      return items.map((item) =>
        typeof item === "string" ? (JSON.parse(item) as T) : item
      );
    }
    const items = memoryEvents.get(listKey) ?? [];
    return items.map((item) => JSON.parse(item) as T);
  },
};
