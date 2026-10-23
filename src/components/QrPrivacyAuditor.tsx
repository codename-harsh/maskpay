"use client";

import React, { useState, useRef } from "react";
import jsQR from "jsqr";
import { useRouter } from "next/navigation";
import {
  Upload,
  ShieldAlert,
  ShieldCheck,
  Lock,
  EyeOff,
  ArrowRight,
  Sparkles,
  FileWarning,
  HelpCircle,
} from "lucide-react";
import { auditUpiString, UpiAuditResult } from "@/lib/upi-parser";
import AliasGuideModal from "./AliasGuideModal";

export default function QrPrivacyAuditor() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [auditResult, setAuditResult] = useState<UpiAuditResult | null>(null);
  const [manualVpaInput, setManualVpaInput] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setErrorMsg("Canvas context unavailable.");
          setIsScanning(false);
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);

        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const decoded = jsQR(imageData.data, imageData.width, imageData.height);

        setIsScanning(false);

        if (!decoded || !decoded.data) {
          setErrorMsg(
            "Could not detect a clear QR code in this image. Try cropping closer or click the Demo button."
          );
          return;
        }

        const result = auditUpiString(decoded.data);
        if (!result.isValidUpi) {
          setErrorMsg("Scanned QR is not a valid NPCI UPI payment code.");
          return;
        }

        setAuditResult(result);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleManualAudit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!manualVpaInput.trim()) return;

    const result = auditUpiString(manualVpaInput);
    if (!result.isValidUpi) {
      setErrorMsg("Please enter a valid UPI ID (e.g., 9876543210@paytm).");
      return;
    }
    setAuditResult(result);
  };

  const loadSamplePaytmLeak = () => {
    setErrorMsg(null);
    const sampleUri =
      "upi://pay?pa=9839123456@paytm&pn=Aarav%20Verma&mc=0000&mode=02&purpose=00&orgid=159761";
    setManualVpaInput(sampleUri);
    setAuditResult(auditUpiString(sampleUri));
  };

  const proceedToMaskDashboard = () => {
    if (!auditResult) return;
    const params = new URLSearchParams({
      vpa: auditResult.vpa,
      alias:
        auditResult.payeeName && auditResult.payeeName !== "Direct VPA Input"
          ? auditResult.payeeName.split(" ")[0] + "_Verified"
          : "PSIT_Merchant_01",
    });
    router.push("/dashboard?" + params.toString());
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 md:p-8 shadow-2xl backdrop-blur">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-400 mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              Step 1: Live Client-Side PII Scanner
            </span>
            <h2 className="text-2xl font-bold text-white">
              UPI QR Privacy Auditor &amp; Leak Detector
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Upload your Paytm, PhonePe, or Google Pay QR screenshot to see what personal data strangers can extract.
            </p>
          </div>

          <button
            onClick={() => setIsGuideOpen(true)}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-medium text-slate-200 hover:border-emerald-500/50 hover:text-emerald-300 transition"
          >
            <HelpCircle className="h-4 w-4 text-emerald-400" />
            How to Hide Phone Number in UPI Apps
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mt-6">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="group cursor-pointer rounded-xl border-2 border-dashed border-slate-700 bg-slate-950/60 p-6 text-center hover:border-emerald-500/60 hover:bg-slate-950 transition flex flex-col items-center justify-center min-h-[190px]"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition">
              <Upload className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-white">
              {isScanning ? "Decoding QR Binary..." : "Upload Paytm / PhonePe / GPay QR Image"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              100% processed inside your browser via HTML5 Canvas + jsQR
            </p>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Or Audit Any UPI ID / Raw QR URI Directly
              </label>
              <form onSubmit={handleManualAudit} className="flex gap-2">
                <input
                  type="text"
                  value={manualVpaInput}
                  onChange={(e) => setManualVpaInput(e.target.value)}
                  placeholder="e.g. 9876543210@paytm"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition"
                >
                  Audit
                </button>
              </form>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800/80">
              <p className="text-xs text-slate-400 mb-2">
                Want to test immediately?
              </p>
              <button
                type="button"
                onClick={loadSamplePaytmLeak}
                className="w-full rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition flex items-center justify-center gap-2"
              >
                <FileWarning className="h-4 w-4" />
                Load Sample Vulnerable Paytm QR (Live Demo)
              </button>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-5 rounded-xl border border-red-500/40 bg-red-950/40 p-4 text-sm text-red-200 flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {auditResult && auditResult.isValidUpi && (
          <div className="mt-6 rounded-xl border border-slate-700 bg-slate-950 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
              <div className="flex items-center gap-3.5">
                <div
                  className={
                    "flex h-14 w-14 items-center justify-center rounded-2xl font-bold text-lg " +
                    (auditResult.privacyRiskScore >= 60
                      ? "bg-red-500/20 text-red-400 border border-red-500/40"
                      : "bg-amber-500/20 text-amber-400 border border-amber-500/40")
                  }
                >
                  {auditResult.privacyRiskScore}/100
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider font-bold text-slate-400">
                      Privacy Vulnerability Score:
                    </span>
                    <span className="rounded-full px-2.5 py-0.5 text-xs font-bold bg-red-500/20 text-red-400">
                      {auditResult.riskLevel} EXPOSURE
                    </span>
                  </div>
                  <p className="text-sm text-slate-200 mt-1 font-mono break-all">
                    Detected VPA: <strong className="text-white">{auditResult.vpa}</strong> | Name:{" "}
                    <strong className="text-white">{auditResult.payeeName}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={proceedToMaskDashboard}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition"
              >
                <Lock className="h-4 w-4" />
                Shield &amp; Create 1-Hr Masked QR
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3 mt-5">
              {auditResult.findings.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 flex items-start gap-3"
                >
                  {item.severity === "SAFE" ? (
                    <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <ShieldAlert className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div className="text-xs md:text-sm">
                    <p className="font-bold text-white">{item.title}</p>
                    <p className="text-slate-300 mt-0.5">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 rounded-xl bg-slate-900/90 p-4 border border-slate-800 text-xs">
              <div>
                <p className="text-red-400 font-semibold mb-1">
                  Raw Exposed Payload Inside Your Current QR:
                </p>
                <code className="block rounded bg-slate-950 p-2.5 text-slate-300 break-all">
                  {auditResult.rawUri}
                </code>
              </div>
              <div>
                <p className="text-emerald-400 font-semibold mb-1 flex items-center gap-1">
                  <EyeOff className="h-3.5 w-3.5" />
                  What Strangers See After MaskPay Shielding:
                </p>
                <code className="block rounded bg-slate-950 p-2.5 text-emerald-300 break-all">
                  https://maskpay.app/pay/mp_9f8a7c6b (Auto-Rotates Every 1 Hr | AES-256 Sealed)
                </code>
              </div>
            </div>
          </div>
        )}
      </div>

      <AliasGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </div>
  );
}
