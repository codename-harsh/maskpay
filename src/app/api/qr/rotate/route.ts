import { NextRequest, NextResponse } from "next/server";
import { cacheEngine } from "@/lib/redis";
import {
  unsealEphemeralToken,
  sealEphemeralToken,
  generateShortId,
  generateHourlyReferenceId,
  SealedQrPayload,
} from "@/lib/crypto";
import { buildSanitizedUpiUri } from "@/lib/upi-parser";

export async function POST(req: NextRequest) {
  try {
    const { currentToken } = await req.json();
    if (!currentToken) {
      return NextResponse.json({ error: "Missing currentToken." }, { status: 400 });
    }

    const existing = unsealEphemeralToken(currentToken);
    if (!existing) {
      return NextResponse.json({ error: "Invalid token." }, { status: 400 });
    }

    await cacheEngine.setFlag("revoked:" + existing.id, "true", 86400);

    const newShortId = generateShortId();
    const expiresAt = new Date(Date.now() + existing.ttlSeconds * 1000).toISOString();
    const createdAt = new Date().toISOString();

    const newPayload: SealedQrPayload = {
      ...existing,
      id: newShortId,
      expiresAt,
      createdAt,
    };

    const newToken = sealEphemeralToken(newPayload);
    const vaultId = "vlt_" + Buffer.from(existing.vpa).toString("base64url").slice(0, 10);

    const origin =
      req.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";
    const shieldUrl = origin + "/pay/" + encodeURIComponent(newToken);
    const referenceId = generateHourlyReferenceId(newShortId);

    const sanitizedDirectUri = buildSanitizedUpiUri({
      vpa: existing.vpa,
      maskedAlias: existing.ownerAlias,
      amount: existing.lockedAmount,
      note: existing.lockedNote,
      referenceId,
    });

    await cacheEngine.pushSoundboxEvent(vaultId, {
      id: "evt_" + Date.now(),
      type: "ROTATED",
      status: "ROTATED",
      token: newShortId,
      amount: existing.lockedAmount,
      device: "Auto-Rotation Engine",
      message: "Rotated " + existing.id + " to " + newShortId + ". Previous QR burned.",
      timestamp: createdAt,
    });

    return NextResponse.json({
      success: true,
      shortId: newShortId,
      token: newToken,
      vaultId,
      ownerAlias: existing.ownerAlias,
      maskedPreviewVpa: existing.maskedPreviewVpa,
      mode: existing.mode,
      shieldUrl,
      sanitizedDirectUri,
      qrPayload: existing.mode === "SHIELD_PROXY" ? shieldUrl : sanitizedDirectUri,
      referenceId,
      lockedAmount: existing.lockedAmount,
      lockedNote: existing.lockedNote,
      maxScans: existing.maxScans,
      currentScans: 0,
      allowedStartHr: existing.allowedStartHr,
      allowedEndHr: existing.allowedEndHr,
      ttlSeconds: existing.ttlSeconds,
      expiresAt,
    });
  } catch (error) {
    console.error("Rotate error:", error);
    return NextResponse.json({ error: "Failed to rotate token." }, { status: 500 });
  }
}
