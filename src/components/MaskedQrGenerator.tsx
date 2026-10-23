"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  Clock,
  Flame,
  IndianRupee,
  Lock,
  Sparkles,
  HelpCircle,
  Sliders,
} from "lucide-react";

export interface GeneratedQrData {
  shortId: string;
  token: string;
  vaultId: string;
  ownerAlias: string;
  maskedPreviewVpa: string;
  mode: "SHIELD_PROXY" | "SANITIZED_DIRECT";
  shieldUrl: string;
  sanitizedDirectUri: string;
  qrPayload: string;
  referenceId: string;
  lockedAmount: number | null;
  lockedNote: string | null;
  maxScans: number;
  currentScans: number;
  allowedStartHr: number;
  allowedEndHr: number;
  ttlSeconds: number;
  expiresAt: string;
  isRevoked?: boolean;
}

interface MaskedQrGeneratorProps {
  initialVpa?: string;
  initialAlias?: string;
  onGenerated: (data: GeneratedQrData) => void;
  onOpenGuide: () => void;
}

export default function MaskedQrGenerator({
  initialVpa = "",
  initialAlias = "",
  onGenerated,
  onOpenGuide,
}: MaskedQrGeneratorProps) {
  const [vpa, setVpa] = useState(initialVpa || "9839123456@paytm");
  const [ownerAlias, setOwnerAlias] = useState(
    initialAlias || "PSIT_Verified_Merchant"
  );
  const [mode, setMode] = useState<"SHIELD_PROXY" | "SANITIZED_DIRECT">(
    "SHIELD_PROXY"
  );
  const [ttlSeconds, setTtlSeconds] = useState<number>(3600);
  const [maxScans, setMaxScans] = useState<number>(0);
  const [lockedAmount, setLockedAmount] = useState<string>("");
  const [lockedNote, setLockedNote] = useState<string>("");
  const [allowedStartHr, setAllowedStartHr] = useState<number>(0);
  const [allowedEndHr, setAllowedEndHr] = useState<number>(23);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialVpa) setVpa(initialVpa);
    if (initialAlias) setOwnerAlias(initialAlias);
  }, [initialVpa, initialAlias]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/qr/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vpa: vpa.trim(),
          ownerAlias: ownerAlias.trim() || "MaskPay_Verified",
          mode,
          ttlSeconds,
          maxScans,
          lockedAmount: lockedAmount ? Number(lockedAmount) : null,
          lockedNote: lockedNote.trim() || null,
          allowedStartHr,
          allowedEndHr,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Failed to generate Masked QR.");
        setIsLoading(false);
        return;
      }

      onGenerated(data as GeneratedQrData);
    } catch {
      setErrorMsg("Network error while communicating with MaskPay Vault.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleGenerate}
      className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl"
    >
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
            <Sliders className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              Ephemeral QR Firewall Rules
            </h2>
            <p className="text-xs text-slate-400">
              Configure AES-256 Vault, Auto-Expiry &amp; Scan Limits
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenGuide}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-emerald-300 hover:border-emerald-500/50 transition"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          Alias Guide
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Real UPI ID (AES-256-GCM Sealed)
          </label>
          <input
            type="text"
            required
            value={vpa}
            onChange={(e) => setVpa(e.target.value)}
            placeholder="e.g. 9876543210@paytm"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Public Masked Display Alias
          </label>
          <input
            type="text"
            required
            value={ownerAlias}
            onChange={(e) => setOwnerAlias(e.target.value)}
            placeholder="e.g. PSIT_Fest_Desk_01"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="mb-5">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
          QR Protection Architecture
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setMode("SHIELD_PROXY")}
            className={
              "rounded-xl border p-3.5 text-left transition " +
              (mode === "SHIELD_PROXY"
                ? "border-emerald-500 bg-emerald-500/10 text-white"
                : "border-slate-800 bg-slate-950/60 text-slate-400")
            }
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase">
                Mode A: Web-Shield Proxy
              </span>
              <Shield className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="mt-1 text-xs text-slate-300">
              Enforces strict 1-Hr Expiry, Burn-After-1-Scan, Time Firewall &amp; Live Soundbox voice alerts.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setMode("SANITIZED_DIRECT")}
            className={
              "rounded-xl border p-3.5 text-left transition " +
              (mode === "SANITIZED_DIRECT"
                ? "border-cyan-500 bg-cyan-500/10 text-white"
                : "border-slate-800 bg-slate-950/60 text-slate-400")
            }
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400 uppercase">
                Mode B: Sanitized Direct UPI
              </span>
              <Lock className="h-4 w-4 text-cyan-400" />
            </div>
            <p className="mt-1 text-xs text-slate-300">
              Strips banking name &amp; tracking tags for direct inside-app scanning.
            </p>
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-5">
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            <Clock className="h-3.5 w-3.5 text-emerald-400" />
            Auto-Rotation Expiry Window (TTL)
          </label>
          <select
            value={ttlSeconds}
            onChange={(e) => setTtlSeconds(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
          >
            <option value={60}>60 Seconds (Live Demo / Viva Test)</option>
            <option value={900}>15 Minutes (High Security)</option>
            <option value={3600}>1 Hour (Standard Auto-Rotate)</option>
            <option value={21600}>6 Hours (Shift Collection)</option>
            <option value={86400}>24 Hours (Daily Standee)</option>
          </select>
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            <Flame className="h-3.5 w-3.5 text-amber-400" />
            Burn-After-Use Scan Limit
          </label>
          <select
            value={maxScans}
            onChange={(e) => setMaxScans(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
          >
            <option value={0}>Unlimited Scans within Expiry Window</option>
            <option value={1}>Burn After 1 Scan (Single Buyer / OLX)</option>
            <option value={3}>Max 3 Scans Allowed</option>
            <option value={5}>Max 5 Scans Allowed</option>
            <option value={10}>Max 10 Scans Allowed</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-5">
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            <IndianRupee className="h-3.5 w-3.5 text-emerald-400" />
            Hard Amount Lock (Optional)
          </label>
          <input
            type="number"
            min="1"
            step="0.01"
            value={lockedAmount}
            onChange={(e) => setLockedAmount(e.target.value)}
            placeholder="Leave blank for open amount"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Locked Transaction Note
          </label>
          <input
            type="text"
            value={lockedNote}
            onChange={(e) => setLockedNote(e.target.value)}
            placeholder="e.g. Order #402 Verification"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Active Collection Hours Firewall (IST)
          </span>
          <span className="text-[11px] text-emerald-400 font-mono">
            {allowedStartHr}:00 hrs to {allowedEndHr}:59 hrs IST
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              Start Hour (0-23 IST)
            </label>
            <input
              type="number"
              min={0}
              max={23}
              value={allowedStartHr}
              onChange={(e) => setAllowedStartHr(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              End Hour (0-23 IST)
            </label>
            <input
              type="number"
              min={0}
              max={23}
              value={allowedEndHr}
              onChange={(e) => setAllowedEndHr(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white"
            />
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 rounded-xl border border-red-500/40 bg-red-950/40 p-3 text-xs text-red-200">
          {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 disabled:opacity-50 transition"
      >
        <Sparkles className="h-4 w-4" />
        {isLoading
          ? "Sealing AES-256 Ephemeral Token..."
          : "Generate Ephemeral Masked QR Code"}
      </button>
    </form>
  );
}
