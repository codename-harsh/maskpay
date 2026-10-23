import type { Metadata } from "next";
import Link from "next/link";
import { Shield, QrCode, Terminal } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "MaskPay — Ephemeral UPI Shield & 1-Hour Rotating QR Engine",
  description:
    "Protect your personal mobile number and banking identity with auto-expiring 1-hour Masked UPI QR codes and AES-256 Vaults.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <span className="text-lg font-extrabold tracking-tight text-white">
                  Mask<span className="text-emerald-400">Pay</span>
                </span>
                <span className="ml-2 hidden rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-emerald-300 sm:inline-block">
                  AES-256 QR Firewall
                </span>
              </div>
            </Link>

            <nav className="flex items-center gap-3">
              <Link
                href="/"
                className="rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-300 hover:bg-slate-900 hover:text-white transition"
              >
                Privacy Auditor
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs sm:text-sm font-bold text-slate-950 hover:bg-emerald-400 transition"
              >
                <QrCode className="h-4 w-4" />
                Launch QR Studio
              </Link>
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <footer className="mt-20 border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500">
          <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-emerald-500" />
              <span>
                MaskPay Cryptographic Payment Firewall &bull; Ephemeral TTL + AES-256-GCM Sealed Tokens
              </span>
            </div>
            <div>Zero-Plaintext VPA Exposure</div>
          </div>
        </footer>
      </body>
    </html>
  );
}
