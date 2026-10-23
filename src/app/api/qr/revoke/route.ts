import { NextRequest, NextResponse } from "next/server";
import { cacheEngine } from "@/lib/redis";
import { unsealEphemeralToken } from "@/lib/crypto";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    const decoded = unsealEphemeralToken(token || "");
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    await cacheEngine.setFlag("revoked:" + decoded.id, "true", 86400);
    const vaultId = "vlt_" + Buffer.from(decoded.vpa).toString("base64url").slice(0, 10);

    await cacheEngine.pushSoundboxEvent(vaultId, {
      id: "evt_" + Date.now(),
      type: "KILL_SWITCH",
      status: "BLOCKED_REVOKED",
      token: decoded.id,
      amount: decoded.lockedAmount,
      device: "Merchant Kill-Switch",
      message: "Emergency Kill-Switch activated! Token " + decoded.id + " burned.",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, status: "REVOKED" });
  } catch {
    return NextResponse.json({ error: "Failed to revoke" }, { status: 500 });
  }
}
