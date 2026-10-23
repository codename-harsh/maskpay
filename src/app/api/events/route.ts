import { NextRequest, NextResponse } from "next/server";
import { cacheEngine } from "@/lib/redis";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const vaultId = searchParams.get("vaultId");
  if (!vaultId) {
    return NextResponse.json({ events: [] });
  }
  const events = await cacheEngine.getSoundboxEvents(vaultId);
  return NextResponse.json({ events });
}
