"use client";

import React from "react";
import { ShieldCheck, X, Smartphone, CheckCircle2 } from "lucide-react";

interface AliasGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AliasGuideModal({ isOpen, onClose }: AliasGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl rounded-2xl border border-emerald-500/30 bg-slate-900 p-6 text-slate-100 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Zero-Number UPI Shield Guide (15-Second Setup)
            </h3>
            <p className="text-xs text-slate-400">
              Combine a Custom Bank Alias with MaskPay 1-Hour Expiry Proxy for 100% anonymity
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-6 mt-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex items-center gap-2 font-semibold text-emerald-400 mb-2 text-sm">
              <Smartphone className="h-4 w-4" />
              PhonePe
            </div>
            <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside">
              <li>Tap Profile Icon (Top Left).</li>
              <li>Go to UPI Settings.</li>
              <li>Create a custom ID without digits (e.g. alex.store@ybl).</li>
              <li>Paste that ID into MaskPay Vault.</li>
            </ol>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex items-center gap-2 font-semibold text-blue-400 mb-2 text-sm">
              <Smartphone className="h-4 w-4" />
              Google Pay
            </div>
            <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside">
              <li>Tap Profile and Bank Account.</li>
              <li>Select Manage UPI IDs.</li>
              <li>Use your email-based ID (e.g. name@okaxis).</li>
              <li>Never share your mobile UPI number publicly.</li>
            </ol>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex items-center gap-2 font-semibold text-cyan-400 mb-2 text-sm">
              <Smartphone className="h-4 w-4" />
              Paytm
            </div>
            <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside">
              <li>Open Profile and UPI Settings.</li>
              <li>Tap Manage UPI ID.</li>
              <li>Create a custom handle without your phone number.</li>
              <li>Link it inside MaskPay AES-256 Vault.</li>
            </ol>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-emerald-950/40 border border-emerald-500/30 p-3.5 text-xs text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>
              MaskPay adds 1-Hour Auto-Rotation, Burn-After-1-Scan, and Time-Window Firewalls on top!
            </span>
          </div>
          <button
            onClick={onClose}
            className="ml-4 shrink-0 rounded-lg bg-emerald-500 px-4 py-1.5 font-semibold text-slate-950 hover:bg-emerald-400"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
