"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toPng } from "html-to-image";
import {
  ShieldCheck,
  RefreshCw,
  Flame,
  Download,
  Copy,
  Check,
  ExternalLink,
  Clock,
  Lock,
  AlertOctagon,
} from "lucide-react";
import { GeneratedQrData } from "./MaskedQrGenerator";

interface LiveQrStandeeProps {
  qrData: GeneratedQrData;
  onUpdated: (newData: GeneratedQrData) => void;
}

export default function LiveQrStandee({
  qrData,
  onUpdated,
}: LiveQrStandeeProps) {
  const standeeRef = useRef<HTMLDivElement | null>(null);

  const [secondsLeft, setSecondsLeft] = useState<number>(qrData.ttlSeconds);
  const [isRotating, setIsRotating] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rotationCount, setRotationCount] = useState(0);

  const handleRotateToken = useCallback(async () => {
    if (isRotating || qrData.isRevoked) return;
    setIsRotating(true);
    try {
      const res = await fetch("/api/qr/rotate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentToken: qrData.token }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onUpdated(data as GeneratedQrData);
        setRotationCount((prev) => prev + 1);
      }
    } catch (err) {
      console.error("Auto-rotation failed:", err);
    } finally {
      setIsRotating(false);
    }
  }, [isRotating, qrData.isRevoked, qrData.token, onUpdated]);

  useEffect(() => {
    if (qrData.isRevoked) {
      setSecondsLeft(0);
      return;
    }

    const updateTimer = () => {
      const diff = Math.max(
        0,
        Math.floor((new Date(qrData.expiresAt).getTime() - Date.now()) / 1000)
      );
      setSecondsLeft(diff);

      if (diff === 0 && !isRotating) {
        handleRotateToken();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [qrData.expiresAt, qrData.isRevoked, isRotating, handleRotateToken]);

  const handleKillSwitch = async () => {
    if (isRevoking || qrData.isRevoked) return;
    setIsRevoking(true);
    try {
      const res = await fetch("/api/qr/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: qrData.token }),
      });
      if (res.ok) {
        onUpdated({ ...qrData, isRevoked: true });
      }
    } finally {
      setIsRevoking(false);
    }
  };

  const handleDownloadPng = async () => {
    if (!standeeRef.current) return;
    try {
      const dataUrl = await toPng(standeeRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = "MaskPay_" + qrData.ownerAlias + "_" + qrData.shortId + ".png";
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to export standee PNG:", err);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(qrData.shieldUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatCountdown = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hrs > 0) {
      return (
        hrs +
        "h " +
        String(mins).padStart(2, "0") +
        "m " +
        String(secs).padStart(2, "0") +
        "s"
      );
    }
    return (
      String(mins).padStart(2, "0") + "m : " + String(secs).padStart(2, "0") + "s"
    );
  };

  const progressPercent = Math.min(
    100,
    Math.max(0, (secondsLeft / (qrData.ttlSeconds || 3600)) * 100)
  );

  return (
    <div className="flex flex-col gap-4">
      <div
        ref={standeeRef}
        className="relative overflow-hidden rounded-2xl border border-emerald-500/40 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                MaskPay Verified Shield
              </p>
              <h3 className="text-base font-bold text-white">
                {qrData.ownerAlias}
              </h3>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-block rounded-full border border-slate-700 bg-slate-900 px-2.5 py-0.5 text-[11px] font-mono text-slate-300">
              {qrData.shortId}
            </span>
            <p className="text-[10px] text-slate-400 mt-0.5">
              VPA: {qrData.maskedPreviewVpa}
            </p>
          </div>
        </div>

        <div className="relative mx-auto flex flex-col items-center justify-center rounded-2xl bg-white p-5 w-fit shadow-inner">
          {qrData.isRevoked ? (
            <div className="flex h-[210px] w-[210px] flex-col items-center justify-center bg-red-950/95 rounded-xl p-4 text-center">
              <AlertOctagon className="h-12 w-12 text-red-400 mb-2" />
              <p className="text-sm font-extrabold uppercase text-red-300">
                QR Burned via Kill-Switch
              </p>
              <p className="text-[11px] text-red-200 mt-1">
                Token {qrData.shortId} is permanently invalidated.
              </p>
            </div>
          ) : (
            <QRCodeSVG
              value={qrData.qrPayload}
              size={210}
              level="M"
              includeMargin={false}
            />
          )}

          {!qrData.isRevoked && (
            <div className="mt-3 flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1 text-[11px] font-bold text-emerald-400">
              <Lock className="h-3 w-3" />
              {qrData.mode === "SHIELD_PROXY"
                ? "Zero-PII Ephemeral Proxy QR"
                : "Sanitized Direct UPI QR"}
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {qrData.lockedAmount && (
            <span className="rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-300">
              Locked: INR {qrData.lockedAmount}
            </span>
          )}
          <span className="rounded-lg bg-slate-900 border border-slate-800 px-3 py-1 text-xs text-slate-300">
            {qrData.maxScans > 0
              ? "Burn Limit: " + qrData.maxScans + " Scan(s)"
              : "Unlimited Scans in Window"}
          </span>
          <span className="rounded-lg bg-slate-900 border border-slate-800 px-3 py-1 text-xs text-slate-300">
            Active: {qrData.allowedStartHr}:00-{qrData.allowedEndHr}:59 IST
          </span>
        </div>

        {!qrData.isRevoked && (
          <div className="mt-5">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <Clock className="h-3.5 w-3.5 text-emerald-400" />
                Auto-Rotates In:
              </span>
              <span className="font-mono font-bold text-emerald-400">
                {formatCountdown(secondsLeft)}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-1000"
                style={{ width: progressPercent + "%" }}
              />
            </div>
            {rotationCount > 0 && (
              <p className="mt-1.5 text-center text-[11px] text-emerald-400">
                Auto-Rotated {rotationCount} time(s) during this session!
              </p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          type="button"
          onClick={handleRotateToken}
          disabled={isRotating || Boolean(qrData.isRevoked)}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-xs font-semibold text-white hover:border-emerald-500/50 hover:text-emerald-300 disabled:opacity-40 transition"
        >
          <RefreshCw
            className={"h-3.5 w-3.5 " + (isRotating ? "animate-spin" : "")}
          />
          Rotate Now
        </button>

        <button
          type="button"
          onClick={handleDownloadPng}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-xs font-semibold text-white hover:border-emerald-500/50 hover:text-emerald-300 transition"
        >
          <Download className="h-3.5 w-3.5" />
          Save Poster
        </button>

        <button
          type="button"
          onClick={handleCopyLink}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-xs font-semibold text-white hover:border-emerald-500/50 hover:text-emerald-300 transition"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy Link
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleKillSwitch}
          disabled={isRevoking || Boolean(qrData.isRevoked)}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-red-500/40 bg-red-950/50 px-3 py-2.5 text-xs font-bold text-red-300 hover:bg-red-900/60 disabled:opacity-40 transition"
        >
          <Flame className="h-3.5 w-3.5 text-red-400" />
          Kill-Switch
        </button>
      </div>

      <a
        href={"/pay/" + encodeURIComponent(qrData.token)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-4 py-3 text-xs text-emerald-200 hover:bg-emerald-950/50 transition"
      >
        <span>
          <strong>Test Payer Experience:</strong> Open Shield Checkout Page ({qrData.shortId}) in a new tab
        </span>
        <ExternalLink className="h-4 w-4 text-emerald-400 shrink-0" />
      </a>
    </div>
  );
}
