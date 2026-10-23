"use client";
import React, { useEffect, useState } from "react";

export default function PayTokenPage() {
  const [pa, setPa] = useState("6969@upi");
  const [pn, setPn] = useState("XavieR");
  const [am, setAm] = useState("");
  const [tn, setTn] = useState("");
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get("pa")) setPa(sp.get("pa")!);
      if (sp.get("pn")) setPn(sp.get("pn")!);
      if (sp.get("am")) setAm(sp.get("am")!);
      if (sp.get("tn")) setTn(sp.get("tn")!);
      const exp = Number(sp.get("exp") || "0");
      if (exp > 0 && Date.now() > exp) setExpired(true);
    }
  }, []);

  let upiUri = `upi://pay?pa=${pa}&pn=${encodeURIComponent(pn)}&cu=INR`;
  if (am) upiUri += `&am=${am}`;
  if (tn) upiUri += `&tn=${encodeURIComponent(tn)}`;

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-[#121215] border border-zinc-800 hover:border-zinc-700 rounded-3xl p-7 text-center space-y-5 shadow-2xl transition-all duration-300">
        <span className="inline-block text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-700">
          MaskPay Verified Pass
        </span>
        <div>
          <h1 className="text-2xl font-bold">{pn}</h1>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            UPI: {pa.slice(0, 2)}******@{pa.split("@")[1] || "upi"}
          </p>
        </div>
        {am && <div className="text-4xl font-black text-white">{"\u20B9"}{am}</div>}
        {tn && <p className="text-xs text-zinc-400 italic">&ldquo;{tn}&rdquo;</p>}
        {expired ? (
          <div className="p-4 rounded-2xl bg-red-950/50 border border-red-800 text-red-300 text-sm">
            This payment pass has expired.
          </div>
        ) : (
          <a
            href={upiUri}
            className="block w-full bg-white text-black font-bold py-3.5 rounded-2xl transition-all duration-300 ease-out hover:bg-zinc-100 hover:shadow-[0_0_24px_rgba(255,255,255,0.45)] hover:-translate-y-0.5 active:scale-95"
          >
            Pay via UPI App (GPay / PhonePe / Paytm)
          </a>
        )}
      </div>

      <a
        href="https://www.linkedin.com/in/codenameharsh07/"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 text-xs text-zinc-500 hover:text-zinc-200 transition-colors duration-300"
      >
        Built by Harsh (@codenameharsh07) — Connect on LinkedIn ↗
      </a>
    </div>
  );
}