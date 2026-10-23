import Link from "next/link";
import {
  ShieldCheck,
  Clock,
  Flame,
  Volume2,
  Lock,
  ArrowRight,
} from "lucide-react";
import QrPrivacyAuditor from "@/components/QrPrivacyAuditor";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 pb-16 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-300 mb-5">
          <ShieldCheck className="h-4 w-4" />
          Stop Leaking Your Personal Mobile Number via UPI QR Codes
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Mask Your Payment QR with{" "}
          <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            1-Hour Self-Destructing
          </span>{" "}
          Tokens
        </h1>

        <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed">
          Standard Paytm, PhonePe, and Google Pay QR codes expose your 10-digit mobile number and never expire.{" "}
          <strong className="text-slate-200">MaskPay</strong> seals your UPI inside an AES-256-GCM token and generates ephemeral QR codes that auto-rotate every hour.
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition"
          >
            Create 1-Hour Masked QR Now
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <QrPrivacyAuditor />

      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
            <Clock className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-white text-base">1-Hour Auto-Rotating QR</h3>
          <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
            Even if someone screenshots your QR code today, it automatically becomes dead after 60 minutes.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
            <Flame className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-white text-base">Burn-After-1-Scan Mode</h3>
          <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
            Selling on OLX or collecting from one client? Set Max Scans to 1 to destroy the QR right after the first scan.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400">
            <Lock className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-white text-base">AES-256-GCM Sealed</h3>
          <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
            Your real UPI VPA is encrypted with 96-bit IVs and GCM authentication tags so nobody can inspect or tamper with it.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/15 text-purple-400">
            <Volume2 className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-white text-base">Live Web-Soundbox</h3>
          <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
            Get instant voice announcements and blocked-scan security alerts right from your browser dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
