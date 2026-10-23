import { NextRequest, NextResponse } from "next/server";
import { cacheEngine } from "@/lib/redis";
import {
  sealEphemeralToken,
  generateShortId,
  generateHourlyReferenceId,
  SealedQrPayload,
} from "@/lib/crypto";
import { auditUpiString, buildSanitizedUpiUri } from "@/lib/upi-parser";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawVpa: string = body.vpa || "";
    const ownerAlias: string = (body.ownerAlias || "PSIT_Verified_Store").trim();
    const mode: "SHIELD_PROXY" | "SANITIZED_DIRECT" =
      body.mode === "SANITIZED_DIRECT" ? "SANITIZED_DIRECT" : "SHIELD_PROXY";

    const audit = auditUpiString(rawVpa);
    if (!audit.isValidUpi) {
      return NextResponse.json(
        { error: "Please provide a valid UPI ID (e.g. 9876543210@paytm)." },
        { status: 400 }
      );
    }

    const ttlSeconds = Math.max(
      60,
      Math.min(Number(body.ttlSeconds) || 3600, 604800)
    );
    const lockedAmount =
      body.lockedAmount !== undefined &&
      body.lockedAmount !== null &&
      body.lockedAmount !== "" &&
      Number(body.lockedAmount) > 0
        ? Number(body.lockedAmount)
        : null;
    const lockedNote = body.lockedNote ? String(body.lockedNote).trim() : null;
    const maxScans = Math.max(0, Number(body.maxScans) || 0);
    const allowedStartHr =
      body.allowedStartHr !== undefined ? Number(body.allowedStartHr) : 0;
    const allowedEndHr =
      body.allowedEndHr !== undefined ? Number(body.allowedEndHr) : 23;

    const shortId = generateShortId();
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    const createdAt = new Date().toISOString();

    const payload: SealedQrPayload = {
      id: shortId,
      vpa: audit.vpa,
      ownerAlias,
      maskedPreviewVpa: audit.maskedPreviewVpa,
      mode,
      lockedAmount,
      lockedNote,
      maxScans,
      allowedStartHr,
      allowedEndHr,
      ttlSeconds,
      expiresAt,
      createdAt,
    };

    const token = sealEphemeralToken(payload);
    const vaultId = "vlt_" + Buffer.from(audit.vpa).toString("base64url").slice(0, 10);

    const origin =
      req.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";
    const shieldUrl = origin + "/pay/" + encodeURIComponent(token);
    const referenceId = generateHourlyReferenceId(shortId);

    const sanitizedDirectUri = buildSanitizedUpiUri({
      vpa: audit.vpa,
      maskedAlias: ownerAlias,
      amount: lockedAmount,
      note: lockedNote,
      referenceId,
    });

    await cacheEngine.pushSoundboxEvent(vaultId, {
      id: "evt_" + Date.now(),
      type: "GENERATED",
      status: "ACTIVE",
      token: shortId,
      amount: lockedAmount,
      device: "Merchant Studio",
      message: "Generated new Ephemeral Masked QR (" + shortId + ")",
      timestamp: createdAt,
    });

    return NextResponse.json({
      success: true,
      shortId,
      token,
      vaultId,
      ownerAlias,
      maskedPreviewVpa: audit.maskedPreviewVpa,
      mode,
      shieldUrl,
      sanitizedDirectUri,
      qrPayload: mode === "SHIELD_PROXY" ? shieldUrl : sanitizedDirectUri,
      referenceId,
      lockedAmount,
      lockedNote,
      maxScans,
      currentScans: 0,
      allowedStartHr,
      allowedEndHr,
      ttlSeconds,
      expiresAt,
    });
  } catch (error) {
    console.error("QR generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate Masked QR token." },
      { status: 500 }
    );
  }
}
