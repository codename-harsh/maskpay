import crypto from "crypto";

function getMasterKeyBuffer(): Buffer {
  const secret =
    process.env.ENCRYPTION_MASTER_KEY ||
    "default_fallback_master_key_maskpay_2026_secure";
  return crypto.createHash("sha256").update(secret).digest();
}

export interface SealedQrPayload {
  id: string;
  vpa: string;
  ownerAlias: string;
  maskedPreviewVpa: string;
  mode: "SHIELD_PROXY" | "SANITIZED_DIRECT";
  lockedAmount: number | null;
  lockedNote: string | null;
  maxScans: number;
  allowedStartHr: number;
  allowedEndHr: number;
  ttlSeconds: number;
  expiresAt: string;
  createdAt: string;
}

export function sealEphemeralToken(payload: SealedQrPayload): string {
  const key = getMasterKeyBuffer();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const jsonStr = JSON.stringify(payload);
  const encrypted = Buffer.concat([
    cipher.update(jsonStr, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  const ivB64 = iv.toString("base64url");
  const tagB64 = authTag.toString("base64url");
  const encB64 = encrypted.toString("base64url");

  return "mp_" + ivB64 + "." + tagB64 + "." + encB64;
}

export function unsealEphemeralToken(token: string): SealedQrPayload | null {
  try {
    if (!token.startsWith("mp_")) return null;
    const raw = token.slice(3);
    const parts = raw.split(".");
    if (parts.length !== 3) return null;

    const key = getMasterKeyBuffer();
    const iv = Buffer.from(parts[0], "base64url");
    const authTag = Buffer.from(parts[1], "base64url");
    const encryptedText = Buffer.from(parts[2], "base64url");

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encryptedText),
      decipher.final(),
    ]);

    return JSON.parse(decrypted.toString("utf8")) as SealedQrPayload;
  } catch {
    return null;
  }
}

export function generateShortId(): string {
  return "mp_" + crypto.randomBytes(4).toString("hex");
}

export function generateHourlyReferenceId(shortId: string): string {
  const hourBucket = Math.floor(Date.now() / (1000 * 60 * 60));
  const hmac = crypto
    .createHmac("sha256", getMasterKeyBuffer())
    .update(shortId + ":" + String(hourBucket))
    .digest("hex")
    .slice(0, 8)
    .toUpperCase();
  return "MP" + hmac;
}
