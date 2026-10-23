"use client";
import React, { useState, useEffect, useCallback } from "react";
import QRCode from "qrcode";
import Link from "next/link";

type Persona = {
  id: string;
  label: string;
  vpa: string;
  alias: string;
};

const DEFAULT_PERSONAS: Persona[] = [
  { id: "p1", label: "Personal", vpa: "6969@upi", alias: "XavieR" },
  { id: "p2", label: "Freelance", vpa: "studio69@upi", alias: "Harsh Studio" },
  { id: "p3", label: "Squad Pool", vpa: "squad69@upi", alias: "Squad Pool" },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"studio" | "split" | "personas" | "creator">("studio");
  const [vpa, setVpa] = useState("6969@upi");
  const [alias, setAlias] = useState("XavieR");
  const [mode, setMode] = useState<"A" | "B">("B");
  const [ttl, setTtl] = useState(15);
  const [burnLimit, setBurnLimit] = useState(3);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [token, setToken] = useState("mp_8f92a1c0");
  const [secondsLeft, setSecondsLeft] = useState(15 * 60);
  const [revoked, setRevoked] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [cardTheme, setCardTheme] = useState<"obsidian" | "titanium" | "midnight">("obsidian");

  const [billTotal, setBillTotal] = useState("1200");
  const [splitCount, setSplitCount] = useState(4);
  const [tipPercent, setTipPercent] = useState(0);

  const [personas, setPersonas] = useState<Persona[]>(DEFAULT_PERSONAS);
  const [newPersonaLabel, setNewPersonaLabel] = useState("");
  const [activePersonaId, setActivePersonaId] = useState("p1");

  const [kudos, setKudos] = useState(128);
  const [kudosGiven, setKudosGiven] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("maskpay_personas_v1");

      const sp = new URLSearchParams(window.location.search);
      if (sp.get("vpa")) setVpa(sp.get("vpa")!);
      if (sp.get("alias")) setAlias(sp.get("alias")!);

      const saved = localStorage.getItem("maskpay_personas_v2");
      if (saved) {
        try {
          setPersonas(JSON.parse(saved));
        } catch {}
      }
    }
  }, []);

  const rotateToken = useCallback(() => {
    const rand = Math.random().toString(16).substring(2, 10);
    setToken("mp_" + rand);
    setSecondsLeft(ttl * 60);
    setRevoked(false);
  }, [ttl]);

  useEffect(() => {
    setSecondsLeft(ttl * 60);
  }, [ttl]);

  useEffect(() => {
    if (revoked) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          rotateToken();
          return ttl * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [revoked, ttl, rotateToken]);

  const perPersonAmount = Math.ceil(
    ((Number(billTotal) || 0) * (1 + tipPercent / 100)) / Math.max(1, splitCount)
  );

  const applySplitToQr = () => {
    setAmount(String(perPersonAmount));
    setBurnLimit(splitCount);
    setNote(`Split Bill (${splitCount} way)`);
    rotateToken();
  };

  const getShareUrl = useCallback(() => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "https://maskpay-umber.vercel.app";
    const exp = Date.now() + secondsLeft * 1000;
    const params = new URLSearchParams({
      pa: vpa.trim() || "6969@upi",
      pn: alias.trim() || "MaskPay_User",
      am: amount.trim(),
      tn: note.trim(),
      exp: String(exp),
      lim: String(burnLimit),
    });
    return `${origin}/pay/${token}?${params.toString()}`;
  }, [vpa, alias, amount, note, secondsLeft, burnLimit, token]);

  const getUpiUri = useCallback(() => {
    const cleanVpa = vpa.trim() || "6969@upi";
    const cleanAlias = encodeURIComponent(alias.trim() || "MaskPay");
    let uri = `upi://pay?pa=${cleanVpa}&pn=${cleanAlias}&cu=INR`;
    if (amount.trim() && !isNaN(Number(amount)) && Number(amount) > 0) {
      uri += `&am=${Number(amount).toFixed(2)}`;
    }
    if (note.trim()) {
      uri += `&tn=${encodeURIComponent(note.trim())}`;
    }
    return uri;
  }, [vpa, alias, amount, note]);

  useEffect(() => {
    if (revoked) {
      setQrDataUrl("");
      return;
    }
    const payload = mode === "B" ? getUpiUri() : getShareUrl();
    QRCode.toDataURL(payload, {
      width: 480,
      margin: 2,
      color: { dark: "#09090b", light: "#ffffff" },
      errorCorrectionLevel: "M",
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error(err));
  }, [mode, getUpiUri, getShareUrl, revoked]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const maskedVpa = vpa.includes("@")
    ? vpa.slice(0, 2) + "******@" + vpa.split("@")[1]
    : vpa;

  const handleCopy = () => {
    navigator.clipboard.writeText(getShareUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const speakSoundbox = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const text = amount
        ? `MaskPay pass active for ${alias}. Locked amount Rupees ${amount}.`
        : `MaskPay pass active for ${alias}. Ready to scan.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.02;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSavePersona = () => {
    if (!vpa.trim()) return;
    const item: Persona = {
      id: "p_" + Date.now(),
      label: newPersonaLabel.trim() || (alias || "Custom"),
      vpa: vpa.trim(),
      alias: alias.trim() || "MaskPay",
    };
    const updated = [...personas, item];
    setPersonas(updated);
    setActivePersonaId(item.id);
    setNewPersonaLabel("");
    if (typeof window !== "undefined") {
      localStorage.setItem("maskpay_personas_v2", JSON.stringify(updated));
    }
  };

  const handleDeletePersona = (id: string) => {
    const updated = personas.filter((p) => p.id !== id);
    setPersonas(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("maskpay_personas_v2", JSON.stringify(updated));
    }
  };

  const handleDownloadPoster = () => {
    if (!qrDataUrl) return;
    const canvas = document.createElement("canvas");
    canvas.width = 720;
    canvas.height = 960;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#09090b";
    ctx.fillRect(0, 0, 720, 960);

    ctx.fillStyle = "#121216";
    ctx.strokeStyle = "#27272a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(48, 48, 624, 864, 36);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#a1a1aa";
    ctx.font = "600 18px sans-serif";
    ctx.fillText("MASKPAY VERIFIED PASS", 96, 115);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 42px sans-serif";
    ctx.fillText(alias || "Merchant", 96, 168);

    ctx.fillStyle = "#71717a";
    ctx.font = "500 20px monospace";
    ctx.fillText(`UPI: ${maskedVpa}`, 96, 204);

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(140, 245, 440, 440, 28);
    ctx.fill();

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 160, 265, 400, 400);

      ctx.fillStyle = "#18181b";
      ctx.beginPath();
      ctx.roundRect(140, 720, 440, 78, 20);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 26px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        amount ? `Pay Rs.${amount} • Scan with any UPI App` : "Scan with GPay • PhonePe • Paytm",
        360,
        768
      );

      ctx.fillStyle = "#71717a";
      ctx.font = "500 17px sans-serif";
      ctx.fillText("Crafted by @codenameharsh07 • maskpay-umber.vercel.app", 360, 865);

      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `MaskPay-Pass-${alias || "QR"}.png`;
      a.click();
    };
    img.src = qrDataUrl;
  };

  const quickAmounts = ["50", "100", "250", "500", "1000"];

  const themeClasses = {
    obsidian: "bg-[#111114] border-zinc-800/90 hover:border-zinc-700/90",
    titanium: "bg-gradient-to-b from-zinc-800/90 to-zinc-950 border-zinc-700 hover:border-zinc-500",
    midnight: "bg-gradient-to-b from-[#0f172a] to-[#090d16] border-slate-800 hover:border-slate-600",
  };

  const primaryGlowBtn =
    "bg-white text-black font-bold transition-all duration-300 ease-out hover:bg-zinc-100 hover:shadow-[0_0_24px_rgba(255,255,255,0.45)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95";

  const secondaryGlowBtn =
    "bg-zinc-900/90 border border-zinc-700/80 text-zinc-100 font-semibold transition-all duration-300 ease-out hover:bg-zinc-800 hover:border-zinc-500 hover:shadow-[0_0_16px_rgba(255,255,255,0.14)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95";

  const inputGlow =
    "w-full bg-[#09090b] border border-zinc-800 focus:border-white focus:shadow-[0_0_16px_rgba(255,255,255,0.12)] hover:border-zinc-700 rounded-xl px-4 py-3 text-sm text-white outline-none transition-all duration-300";

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-white selection:text-black flex flex-col justify-between">
      <header className="sticky top-0 z-30 border-b border-zinc-800/80 bg-[#09090b]/85 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center font-black text-sm tracking-tighter transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_18px_rgba(255,255,255,0.5)]">
                M
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-white block leading-none">
                  MaskPay
                </span>
                <span className="text-[11px] text-zinc-500 font-medium">
                  Private UPI Studio
                </span>
              </div>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-800/80 p-1 rounded-full">
            {personas.slice(0, 3).map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setVpa(p.vpa);
                  setAlias(p.alias);
                  setActivePersonaId(p.id);
                }}
                className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${
                  activePersonaId === p.id
                    ? "bg-white text-black shadow-[0_0_14px_rgba(255,255,255,0.4)]"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            <a
              href="https://www.linkedin.com/in/codenameharsh07/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-700/80 text-xs font-semibold text-zinc-200 transition-all duration-300 ease-out hover:bg-zinc-800 hover:border-sky-400/60 hover:shadow-[0_0_18px_rgba(56,189,248,0.25)] hover:-translate-y-0.5 active:scale-95"
            >
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              <span>Built by Harsh</span>
              <span className="text-zinc-400">↗</span>
            </a>

            <button
              onClick={rotateToken}
              className={`text-xs px-4 py-2 rounded-full ${primaryGlowBtn}`}
            >
              New Pass
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-7">
          <div className="inline-flex p-1.5 rounded-2xl bg-[#121215] border border-zinc-800/90 gap-1">
            {[
              { id: "studio", label: "QR Studio" },
              { id: "split", label: "Split Bill" },
              { id: "personas", label: "Personas" },
              { id: "creator", label: "Praise Author" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ease-out ${
                  activeTab === tab.id
                    ? "bg-white text-black shadow-[0_0_18px_rgba(255,255,255,0.35)] scale-[1.02]"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="inline-flex items-center p-1 rounded-xl bg-[#121215] border border-zinc-800/90 text-xs">
            <button
              onClick={() => setMode("B")}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all duration-300 ${
                mode === "B"
                  ? "bg-white text-black shadow-[0_0_14px_rgba(255,255,255,0.35)]"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Direct UPI Scan
            </button>
            <button
              onClick={() => setMode("A")}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all duration-300 ${
                mode === "A"
                  ? "bg-white text-black shadow-[0_0_14px_rgba(255,255,255,0.35)]"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Web Shield Link
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          <div className="lg:col-span-7 bg-[#121215] border border-zinc-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl">
            {activeTab === "studio" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight">
                      Configure Payment Pass
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Enter your UPI ID and set a custom alias & scan rules in one tap.
                    </p>
                  </div>
                  <button
                    onClick={speakSoundbox}
                    className={`px-3.5 py-1.5 rounded-xl text-xs ${secondaryGlowBtn}`}
                  >
                    Voice Alert
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-2">
                      Your UPI ID (Example Default Shown)
                    </label>
                    <input
                      value={vpa}
                      onChange={(e) => setVpa(e.target.value)}
                      placeholder="e.g. 6969@upi"
                      className={inputGlow}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-2">
                      Display Alias (Shown on Pass)
                    </label>
                    <input
                      value={alias}
                      onChange={(e) => setAlias(e.target.value)}
                      placeholder="e.g. XavieR / Studio"
                      className={inputGlow}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-zinc-400">
                      Lock Amount (Optional)
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {quickAmounts.map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setAmount(amt)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all duration-300 ${
                            amount === amt
                              ? "bg-white text-black shadow-[0_0_12px_rgba(255,255,255,0.4)]"
                              : "bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-600 border border-zinc-800"
                          }`}
                        >
                          {"\u20B9"}{amt}
                        </button>
                      ))}
                      {amount && (
                        <button
                          type="button"
                          onClick={() => setAmount("")}
                          className="px-2 py-1 rounded-lg text-[11px] text-zinc-400 hover:text-white bg-zinc-900 transition-colors"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-zinc-400 text-sm font-semibold">
                        {"\u20B9"}
                      </span>
                      <input
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Open amount"
                        className={`${inputGlow} pl-8`}
                      />
                    </div>
                    <input
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Payment note (e.g. Coffee / Order #12)"
                      className={inputGlow}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-2">
                      Auto-Rotate Timer
                    </label>
                    <div className="grid grid-cols-4 gap-1.5 bg-[#09090b] p-1.5 rounded-xl border border-zinc-800">
                      {[
                        { label: "15m", val: 15 },
                        { label: "30m", val: 30 },
                        { label: "1h", val: 60 },
                        { label: "24h", val: 1440 },
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => setTtl(item.val)}
                          className={`py-2 rounded-lg text-xs font-semibold transition-all duration-300 ${
                            ttl === item.val
                              ? "bg-white text-black shadow-[0_0_12px_rgba(255,255,255,0.35)]"
                              : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-2">
                      Burn After Scans
                    </label>
                    <div className="grid grid-cols-4 gap-1.5 bg-[#09090b] p-1.5 rounded-xl border border-zinc-800">
                      {[
                        { label: "1 Scan", val: 1 },
                        { label: "3 Scans", val: 3 },
                        { label: "5 Scans", val: 5 },
                        { label: "50 Scans", val: 50 },
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => setBurnLimit(item.val)}
                          className={`py-2 rounded-lg text-xs font-semibold transition-all duration-300 ${
                            burnLimit === item.val
                              ? "bg-white text-black shadow-[0_0_12px_rgba(255,255,255,0.35)]"
                              : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "split" && (
              <div className="space-y-6">
                <div className="border-b border-zinc-800/80 pb-4">
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Group Split Bill Generator
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Enter total bill and headcount — MaskPay locks the exact per-person share on the QR.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-2">
                      Total Bill Amount ({"\u20B9"})
                    </label>
                    <input
                      type="number"
                      value={billTotal}
                      onChange={(e) => setBillTotal(e.target.value)}
                      className={`${inputGlow} text-lg font-bold`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-2">
                      Split Between ({splitCount} People)
                    </label>
                    <div className="flex items-center gap-2">
                      {[2, 3, 4, 5, 6].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setSplitCount(num)}
                          className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all duration-300 ${
                            splitCount === num
                              ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.35)]"
                              : "bg-[#09090b] text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-600"
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setSplitCount((c) => c + 1)}
                        className={`px-3.5 py-3 rounded-xl text-xs font-bold ${secondaryGlowBtn}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2">
                    Add Tip / Service Charge
                  </label>
                  <div className="flex gap-2">
                    {[0, 5, 10, 15].map((tip) => (
                      <button
                        key={tip}
                        type="button"
                        onClick={() => setTipPercent(tip)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-300 ${
                          tipPercent === tip
                            ? "bg-white text-black border-white shadow-[0_0_14px_rgba(255,255,255,0.35)]"
                            : "bg-[#09090b] text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-600"
                        }`}
                      >
                        {tip === 0 ? "No Tip" : `+${tip}%`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#09090b] border border-zinc-800/90 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-zinc-400 block">Each Person Pays</span>
                    <span className="text-3xl font-black text-white">
                      {"\u20B9"}{perPersonAmount}
                    </span>
                    <span className="text-[11px] text-zinc-500 block mt-0.5">
                      Auto-locks QR for {splitCount} scans
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={applySplitToQr}
                    className={`text-xs sm:text-sm px-5 py-3.5 rounded-xl ${primaryGlowBtn}`}
                  >
                    Lock {"\u20B9"}{perPersonAmount} on QR
                  </button>
                </div>
              </div>
            )}

            {activeTab === "personas" && (
              <div className="space-y-6">
                <div className="border-b border-zinc-800/80 pb-4">
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Saved Identity Personas
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Switch between your Personal, Freelance, or Squad UPI aliases in one click.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {personas.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setVpa(p.vpa);
                        setAlias(p.alias);
                        setActivePersonaId(p.id);
                      }}
                      className={`cursor-pointer p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between hover:-translate-y-0.5 ${
                        activePersonaId === p.id
                          ? "bg-zinc-900 border-white shadow-[0_0_18px_rgba(255,255,255,0.16)]"
                          : "bg-[#09090b] border-zinc-800/90 hover:border-zinc-600 hover:shadow-[0_0_14px_rgba(255,255,255,0.07)]"
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-white">{p.label}</div>
                        <div className="text-sm font-semibold text-zinc-300 mt-0.5">
                          {p.alias}
                        </div>
                        <div className="text-[11px] font-mono text-zinc-500">{p.vpa}</div>
                      </div>
                      {personas.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePersona(p.id);
                          }}
                          className="text-xs text-zinc-500 hover:text-red-400 px-2 py-1 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-zinc-800/80">
                  <label className="block text-xs font-medium text-zinc-400 mb-2">
                    Save Current Setup ({alias} • {vpa}) as New Persona
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={newPersonaLabel}
                      onChange={(e) => setNewPersonaLabel(e.target.value)}
                      placeholder="Tag name (e.g. Thrift Store)"
                      className={`flex-1 ${inputGlow}`}
                    />
                    <button
                      type="button"
                      onClick={handleSavePersona}
                      className={`text-xs px-5 py-2.5 rounded-xl shrink-0 ${primaryGlowBtn}`}
                    >
                      + Save Persona
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "creator" && (
              <div className="space-y-6">
                <div className="flex items-start justify-between border-b border-zinc-800/80 pb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white to-zinc-400 text-black font-black text-xl flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                      H
                    </div>
                    <div>
                      <span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 mb-1">
                        Creator & Architect
                      </span>
                      <h2 className="text-xl font-bold text-white">
                        Harsh (@codenameharsh07)
                      </h2>
                      <p className="text-xs text-zinc-400">
                        Building privacy-first fintech tools & sleek full-stack experiences.
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-zinc-300 leading-relaxed">
                  MaskPay was built to give you dynamic QR passes, auto-expiring links, and instant group split-bill generation. If you liked the experience, connect with me on LinkedIn or send some kudos below!
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <a
                    href="https://www.linkedin.com/in/codenameharsh07/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-center gap-2.5 text-sm py-3.5 px-5 rounded-2xl ${primaryGlowBtn}`}
                  >
                    <span>Connect on LinkedIn</span>
                    <span>↗</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      if (!kudosGiven) {
                        setKudos((k) => k + 1);
                        setKudosGiven(true);
                      }
                    }}
                    className={`flex items-center justify-center gap-2 font-bold text-sm py-3.5 px-5 rounded-2xl border transition-all duration-300 ease-out hover:-translate-y-0.5 active:scale-95 ${
                      kudosGiven
                        ? "bg-zinc-800 border-zinc-500 text-white shadow-[0_0_18px_rgba(255,255,255,0.2)]"
                        : "bg-[#09090b] hover:bg-zinc-900 border-zinc-800 hover:border-zinc-600 text-zinc-200 hover:shadow-[0_0_16px_rgba(255,255,255,0.12)]"
                    }`}
                  >
                    <span>{kudosGiven ? "Appreciation Sent!" : "Praise the Author"}</span>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-zinc-900 text-zinc-300">
                      {kudos}
                    </span>
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-[#09090b] border border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-white">
                      Demo Tip Jar Preset
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      Loads a sample {"\u20B9"}99 coffee tip preset onto the QR studio
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setVpa("6969@upi");
                      setAlias("Harsh (Creator Tip)");
                      setAmount("99");
                      setNote("Coffee for MaskPay Creator");
                    }}
                    className={`px-4 py-2 rounded-xl text-xs shrink-0 ${secondaryGlowBtn}`}
                  >
                    Load {"\u20B9"}99 Demo QR
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-medium text-zinc-400">Pass Finish</span>
              <div className="flex gap-1.5">
                {(["obsidian", "titanium", "midnight"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setCardTheme(t)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium capitalize transition-all duration-300 ${
                      cardTheme === t
                        ? "bg-white text-black font-semibold shadow-[0_0_12px_rgba(255,255,255,0.35)]"
                        : "bg-zinc-900 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div
              className={`rounded-3xl border p-6 shadow-2xl transition-all duration-300 ${themeClasses[cardTheme]}`}
            >
              <div className="flex items-start justify-between mb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                      MaskPay Pass
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mt-1 tracking-tight">
                    {alias || "Merchant"}
                  </h3>
                  <p className="text-xs font-mono text-zinc-400">{maskedVpa}</p>
                </div>

                <div className="text-right">
                  {amount ? (
                    <div className="px-3 py-1 rounded-xl bg-white text-black font-black text-base shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                      {"\u20B9"}{amount}
                    </div>
                  ) : (
                    <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-zinc-900/90 border border-zinc-700/80 text-zinc-300 block">
                      Open Amount
                    </span>
                  )}
                  <span className="text-[11px] font-mono text-zinc-400 mt-1.5 block">
                    {mins}m {secs < 10 ? "0" + secs : secs}s
                  </span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl w-64 h-64 mx-auto flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.12)] relative transition-transform duration-300 hover:scale-[1.02]">
                {revoked ? (
                  <div className="text-center space-y-2 px-4">
                    <div className="text-red-600 font-black text-base">PASS REVOKED</div>
                    <p className="text-xs text-zinc-500">
                      Click Rotate below to mint a fresh QR pass.
                    </p>
                  </div>
                ) : qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Scannable UPI QR"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-zinc-400 text-xs">Encoding QR...</div>
                )}
              </div>

              <div className="mt-5 text-center space-y-2">
                <div className="inline-flex items-center gap-2 text-xs px-3.5 py-1 rounded-full bg-zinc-900/90 border border-zinc-700/70 text-zinc-200">
                  <span>
                    {mode === "B"
                      ? "Scans in GPay • PhonePe • Paytm • FamPay"
                      : "Opens Web Shield on Camera Scan"}
                  </span>
                </div>
                {note && (
                  <p className="text-xs text-zinc-400 italic">&ldquo;{note}&rdquo;</p>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-6 pt-5 border-t border-zinc-800/80">
                <button
                  onClick={rotateToken}
                  className={`text-xs py-2.5 rounded-xl ${secondaryGlowBtn}`}
                >
                  Rotate
                </button>
                <button
                  onClick={handleDownloadPoster}
                  className={`text-xs py-2.5 rounded-xl ${primaryGlowBtn}`}
                >
                  Save Pass
                </button>
                <button
                  onClick={handleCopy}
                  className={`text-xs py-2.5 rounded-xl ${secondaryGlowBtn}`}
                >
                  {copied ? "Copied!" : "Copy Link"}
                </button>
                <button
                  onClick={() => setRevoked(true)}
                  className="bg-red-950/50 border border-red-800/60 text-xs py-2.5 rounded-xl text-red-300 font-semibold transition-all duration-300 ease-out hover:bg-red-900/60 hover:border-red-500/80 hover:shadow-[0_0_18px_rgba(239,68,68,0.35)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
                >
                  Kill QR
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-800/80 bg-[#0c0c0f] py-4 px-4 sm:px-6 mt-12">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">MaskPay</span>
            <span>— Crafted by</span>
            <a
              href="https://www.linkedin.com/in/codenameharsh07/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white font-semibold underline decoration-zinc-600 hover:decoration-white transition-colors"
            >
              Harsh (@codenameharsh07)
            </a>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab("creator")}
              className="text-zinc-300 hover:text-white font-medium transition-colors"
            >
              Praise Author
            </button>
            <a
              href="https://www.linkedin.com/in/codenameharsh07/"
              target="_blank"
              rel="noopener noreferrer"
              className={`px-3.5 py-1.5 rounded-full ${primaryGlowBtn}`}
            >
              Connect on LinkedIn ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}