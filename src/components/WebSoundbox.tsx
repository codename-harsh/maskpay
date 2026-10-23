"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Volume2,
  VolumeX,
  Radio,
  ShieldCheck,
  ShieldAlert,
  BellRing,
} from "lucide-react";

interface SoundboxEventItem {
  id: string;
  type: string;
  status: string;
  token: string;
  amount: number | null;
  device: string;
  message: string;
  voiceText?: string;
  timestamp: string;
}

interface WebSoundboxProps {
  vaultId: string | null;
}

export default function WebSoundbox({ vaultId }: WebSoundboxProps) {
  const [events, setEvents] = useState<SoundboxEventItem[]>([]);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const announcedIdsRef = useRef<Set<string>>(new Set());

  const speakAlert = useCallback(
    (text: string) => {
      if (!voiceEnabled || typeof window === "undefined") return;
      if (!("speechSynthesis" in window)) return;

      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.lang = "en-IN";
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.error("Speech synthesis error:", e);
      }
    },
    [voiceEnabled]
  );

  useEffect(() => {
    if (!vaultId) return;

    const fetchEvents = async () => {
      try {
        const res = await fetch("/api/events?vaultId=" + encodeURIComponent(vaultId));
        if (!res.ok) return;
        const data = await res.json();
        const list: SoundboxEventItem[] = data.events || [];
        setEvents(list);

        for (const item of list) {
          if (!announcedIdsRef.current.has(item.id)) {
            announcedIdsRef.current.add(item.id);
            if (item.voiceText) {
              speakAlert(item.voiceText);
            }
          }
        }
      } catch {
        // Ignore transient polling errors
      }
    };

    fetchEvents();
    const interval = setInterval(fetchEvents, 2500);
    return () => clearInterval(interval);
  }, [vaultId, speakAlert]);

  const triggerTestVoice = () => {
    setVoiceEnabled(true);
    speakAlert(
      "MaskPay Web Soundbox is online and monitoring your ephemeral QR codes."
    );
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/15 text-purple-400">
            <Radio className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Live Web-Soundbox &amp; Scan Radar
            </h3>
            <p className="text-xs text-slate-400">
              Real-time voice announcer for allowed &amp; blocked QR scans
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={triggerTestVoice}
            className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/40 bg-purple-500/10 px-3 py-1.5 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 transition"
          >
            <BellRing className="h-3.5 w-3.5" />
            Test Soundbox Voice
          </button>

          <button
            type="button"
            onClick={() => setVoiceEnabled((prev) => !prev)}
            className={
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition " +
              (voiceEnabled
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "bg-slate-800 text-slate-400 border border-slate-700")
            }
          >
            {voiceEnabled ? (
              <>
                <Volume2 className="h-3.5 w-3.5" />
                Voice ON
              </>
            ) : (
              <>
                <VolumeX className="h-3.5 w-3.5" />
                Muted
              </>
            )}
          </button>
        </div>
      </div>

      {!vaultId || events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/50 p-6 text-center text-xs text-slate-400">
          Generate a Masked QR code and scan it (or click Test Payer Experience) to see live telemetry and hear instant voice alerts here.
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
          {events.map((evt) => {
            const isBlocked = evt.status.startsWith("BLOCKED");
            return (
              <div
                key={evt.id}
                className={
                  "flex items-start justify-between gap-3 rounded-xl border p-3 text-xs " +
                  (isBlocked
                    ? "border-red-500/30 bg-red-950/25 text-red-200"
                    : "border-slate-800 bg-slate-950/80 text-slate-200")
                }
              >
                <div className="flex items-start gap-2.5">
                  {isBlocked ? (
                    <ShieldAlert className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  ) : (
                    <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-semibold text-white">{evt.message}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Device: {evt.device} &bull; Status:{" "}
                      <span
                        className={
                          isBlocked
                            ? "text-red-400 font-bold"
                            : "text-emerald-400 font-bold"
                        }
                      >
                        {evt.status}
                      </span>
                    </p>
                  </div>
                </div>
                <span className="shrink-0 font-mono text-[10px] text-slate-500">
                  {new Date(evt.timestamp).toLocaleTimeString()}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
