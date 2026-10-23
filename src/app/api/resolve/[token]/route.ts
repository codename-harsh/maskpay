import { NextRequest, NextResponse } from "next/server";
import { cacheEngine } from "@/lib/redis";
import { unsealEphemeralToken, generateHourlyReferenceId } from "@/lib/crypto";
import { buildAppDeepLinks } from "@/lib/upi-parser";

function getCurrentIstHour(): number {
  const nowUtc = new Date();
  const istTime = new Date(nowUtc.getTime() + 330 * 60 * 1000);
  return istTime.getUTCHours();
}

function isWithinAllowedHours(currentHr: number, startHr: number, endHr: number): boolean {
  if (startHr <= endHr) {
    return currentHr >= startHr && currentHr <= endHr;
  }
  return currentHr >= startHr || currentHr <= endHr;
}

function parseDeviceLabel(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (ua.includes("iphone") || ua.includes("ipad")) return "iPhone / iOS";
  if (ua.includes("android")) return "Android Smartphone";
  if (ua.includes("macintosh")) return "MacBook / macOS";
  if (ua.includes("windows")) return "Windows Desktop";
  return "Web Scanner";
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;
    const decodedToken = decodeURIComponent(token);
    const record = unsealEphemeralToken(decodedToken);

    const userAgent = req.headers.get("user-agent") || "Unknown Scanner";
    const deviceLabel = parseDeviceLabel(userAgent);

    if (!record) {
      return NextResponse.json(
        {
          allowed: false,
          status: "BLOCKED_TAMPERED",
          title: "Invalid or Tampered Cryptographic Token",
          reason:
            "This QR code failed AES-256-GCM authentication tag verification.",
        },
        { status: 400 }
      );
    }

    const vaultId = "vlt_" + Buffer.from(record.vpa).toString("base64url").slice(0, 10);

    if (new Date(record.expiresAt).getTime() <= Date.now()) {
      await cacheEngine.pushSoundboxEvent(vaultId, {
        id: "evt_" + Date.now(),
        type: "SCAN_BLOCKED",
        status: "BLOCKED_EXPIRED",
        token: record.id,
        amount: record.lockedAmount,
        device: deviceLabel,
        message: "Blocked scan on expired QR (" + record.id + ") from " + deviceLabel,
        voiceText: "Security Alert. Someone scanned an expired QR code.",
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json(
        {
          allowed: false,
          status: "BLOCKED_EXPIRED",
          title: "This Ephemeral QR Code Has Expired",
          reason:
            "For the receiver's privacy, MaskPay QR codes automatically self-destruct after their validity window.",
        },
        { status: 410 }
      );
    }

    const isRevoked = await cacheEngine.getFlag("revoked:" + record.id);
    if (isRevoked === "true") {
      await cacheEngine.pushSoundboxEvent(vaultId, {
        id: "evt_" + Date.now(),
        type: "SCAN_BLOCKED",
        status: "BLOCKED_REVOKED",
        token: record.id,
        amount: record.lockedAmount,
        device: deviceLabel,
        message: "Blocked scan on Kill-Switch burned QR (" + record.id + ")",
        voiceText: "Security Alert. Someone attempted to scan a burned QR code.",
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json(
        {
          allowed: false,
          status: "BLOCKED_REVOKED",
          title: "QR Code Permanently Burned by Owner",
          reason:
            "The owner activated the emergency Kill-Switch for this QR code.",
        },
        { status: 410 }
      );
    }

    const currentIstHr = getCurrentIstHour();
    if (!isWithinAllowedHours(currentIstHr, record.allowedStartHr, record.allowedEndHr)) {
      return NextResponse.json(
        {
          allowed: false,
          status: "BLOCKED_TIME_WINDOW",
          title: "Blocked by Time-Window Firewall",
          reason:
            "This merchant only accepts QR scans between " +
            record.allowedStartHr +
            ":00 and " +
            record.allowedEndHr +
            ":59 IST.",
        },
        { status: 403 }
      );
    }

    let remainingScans: number | null = null;
    const scanCount = await cacheEngine.incrementCounter(
      "scans:" + record.id,
      record.ttlSeconds
    );

    if (record.maxScans > 0) {
      if (scanCount > record.maxScans) {
        await cacheEngine.pushSoundboxEvent(vaultId, {
          id: "evt_" + Date.now(),
          type: "SCAN_BLOCKED",
          status: "BLOCKED_LIMIT",
          token: record.id,
          amount: record.lockedAmount,
          device: deviceLabel,
          message: "Burn-After-Use limit exceeded on " + record.id + " by " + deviceLabel,
          voiceText: "Security Alert. Someone tried to reuse your single-use QR code.",
          timestamp: new Date().toISOString(),
        });

        return NextResponse.json(
          {
            allowed: false,
            status: "BLOCKED_LIMIT",
            title: "Maximum Scan Limit Reached",
            reason:
              "This was a Burn-After-Use QR code and has already been consumed. Screenshot reuse is blocked.",
          },
          { status: 410 }
        );
      }
      remainingScans = record.maxScans - scanCount;
    }

    const referenceId = generateHourlyReferenceId(record.id);
    const deepLinks = buildAppDeepLinks({
      vpa: record.vpa,
      maskedAlias: record.ownerAlias,
      amount: record.lockedAmount,
      note: record.lockedNote,
      referenceId,
    });

    const amountSpeech = record.lockedAmount
      ? "for Rupees " + record.lockedAmount
      : "";

    await cacheEngine.pushSoundboxEvent(vaultId, {
      id: "evt_" + Date.now(),
      type: "SCAN_ALLOWED",
      status: "ALLOWED",
      token: record.id,
      amount: record.lockedAmount,
      device: deviceLabel,
      message: "QR (" + record.id + ") scanned on " + deviceLabel,
      voiceText:
        "MaskPay Alert. Your masked QR " +
        amountSpeech +
        " was just scanned on " +
        deviceLabel +
        ".",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      allowed: true,
      status: "ALLOWED",
      token: record.id,
      ownerAlias: record.ownerAlias,
      maskedPreviewVpa: record.maskedPreviewVpa,
      lockedAmount: record.lockedAmount,
      lockedNote: record.lockedNote,
      referenceId,
      maxScans: record.maxScans,
      currentScans: scanCount,
      remainingScans,
      expiresAt: record.expiresAt,
      deepLinks,
    });
  } catch (error) {
    console.error("Resolve error:", error);
    return NextResponse.json(
      {
        allowed: false,
        status: "ERROR",
        title: "Verification Error",
        reason: "Unable to verify this ephemeral token.",
      },
      { status: 500 }
    );
  }
}
