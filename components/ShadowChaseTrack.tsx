"use client";

import React, { useEffect, useState } from "react";
import CyberSilhouette from "./CyberSilhouette";
import { DoorOpen, Clock, ShieldAlert, Sparkles, AlertTriangle } from "lucide-react";
import { useQuest } from "@/lib/QuestContext";

interface ShadowChaseTrackProps {
  currentLevel: number;
  gapDistance: number; // 0 (caught) to 10 (escaped)
  rememberedConcepts?: string[];
  timeLeftSeconds?: number;
  isHesitating?: boolean;
  lastOutcome?: "correct" | "wrong" | null;
}

export default function ShadowChaseTrack({
  currentLevel,
  gapDistance,
  rememberedConcepts = [],
  timeLeftSeconds,
  isHesitating = false,
  lastOutcome = null,
}: ShadowChaseTrackProps) {
  const { accessibilitySettings } = useQuest();
  const isReducedMotion = accessibilitySettings?.reducedMotion ?? false;

  // Clamp distance between 0 and 10
  const safeGap = Math.max(0, Math.min(10, gapDistance));
  const isCaught = safeGap === 0;
  const isEscaped = safeGap >= 10;

  // Track animation trigger state for lunges, pulse ripples, and afterimages
  const [pulseActive, setPulseActive] = useState(false);
  const [shakeActive, setShakeActive] = useState(false);
  const [afterimagePosition, setAfterimagePosition] = useState<number | null>(null);

  useEffect(() => {
    if (isReducedMotion) return;

    if (lastOutcome === "correct") {
      setPulseActive(true);
      const timer = setTimeout(() => setPulseActive(false), 650);
      return () => clearTimeout(timer);
    } else if (lastOutcome === "wrong") {
      setShakeActive(true);
      const timer = setTimeout(() => setShakeActive(false), 350);
      return () => clearTimeout(timer);
    }
  }, [lastOutcome, isReducedMotion]);

  // Calculate percentages along horizontal track (door at far left 2%)
  // Player runs on the left (18% when escaped to 40% when caught)
  // Shadow chases from the right (82% when far behind to 58% when caught)
  // Minimum separation is 18% (70px on a 390px screen), ensuring zero label collision!
  const playerPercent = Math.min(42, Math.max(16, 18 + (10 - safeGap) * 2.4));
  const shadowPercent = Math.min(85, Math.max(56, 58 + safeGap * 2.7));

  return (
    <div
      className={`w-full bg-[#0D0D1A]/95 border border-[#00F0FF]/35 rounded-2xl p-4 shadow-2xl space-y-3 font-mono text-xs glow-cyan relative overflow-hidden transition-all duration-300 ${
        shakeActive && !isReducedMotion ? "animate-screen-shake border-[#FF0055]" : ""
      }`}
    >
      {/* Top HUD Line (Condensed Heavy Display Headings + HUD Monospace Stats) */}
      <div className="flex items-center justify-between flex-wrap gap-2 z-10 relative">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] font-bold text-[11px] uppercase tracking-wider font-mono">
            SHADOW ESCAPE • LEVEL {currentLevel}
          </span>

          {currentLevel >= 2 && typeof timeLeftSeconds === "number" && (
            <div
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/60 border font-mono font-bold text-[11px] ${
                timeLeftSeconds <= 5
                  ? "border-[#FF0055] text-[#FF0055] animate-pulse"
                  : "border-[#FFB800]/40 text-[#FFB800]"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{timeLeftSeconds}s</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isHesitating && currentLevel === 3 && (
            <span className="text-[10px] text-[#FF0055] font-bold animate-bounce flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" /> Hesitation! Shadow gaining...
            </span>
          )}
          <span
            className={`px-2.5 py-1 rounded-md border font-mono text-[10px] font-bold uppercase tracking-wider ${
              isCaught
                ? "bg-[#FF0055]/20 border-[#FF0055] text-[#FF0055]"
                : isEscaped
                ? "bg-[#00FF87]/20 border-[#00FF87] text-[#00FF87]"
                : "bg-black/60 border-white/10 text-slate-300"
            }`}
          >
            {isCaught ? "⚠ CAUGHT!" : isEscaped ? "✓ ESCAPED!" : `Gap: ${safeGap}/10`}
          </span>
        </div>
      </div>

      {/* Shadow Memory Recall Banner */}
      {rememberedConcepts.length > 0 && (
        <div className="p-2.5 rounded-xl bg-[#FF0055]/15 border border-[#FF0055]/40 flex items-center justify-between text-[11px] text-[#FF7185] z-10 relative">
          <div className="flex items-center gap-1.5 truncate">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-[#FF0055]" />
            <span className="truncate">
              <span className="font-bold uppercase">Shadow Remembers:</span> {rememberedConcepts.join(", ")}
            </span>
          </div>
          <span className="text-[10px] text-white/90 shrink-0 font-bold ml-2">Answer right to recoil!</span>
        </div>
      )}

      {/* HORIZONTAL CHASE TRACK STAGE */}
      <div className="relative w-full h-16 bg-[#04040A] border border-white/15 rounded-xl p-2 flex items-center overflow-hidden">
        {/* Stage Floor Line (70% Height streak) */}
        <div
          className="absolute inset-x-0 pointer-events-none z-0"
          style={{
            top: "70%",
            height: "1px",
            background: "linear-gradient(90deg, #00FF87 0%, #00F0FF 40%, #A855F7 70%, #FF0055 100%)",
            opacity: 0.6,
            filter: "blur(0.5px)",
          }}
        />

        {/* 1. ESCAPE DOOR GOAL (Far Left Target) */}
        <div className="absolute left-2 z-10 flex flex-col items-center gap-0.5">
          <div
            className={`p-1.5 rounded-xl border flex items-center justify-center transition-all ${
              isEscaped
                ? "bg-[#00FF87]/30 border-[#00FF87] text-[#00FF87] shadow-[0_0_20px_rgba(0,255,135,0.6)] animate-pulse"
                : "bg-[#00F0FF]/15 border-[#00F0FF]/40 text-[#00F0FF]"
            }`}
          >
            <DoorOpen className="w-5 h-5" />
          </div>
          <span className="text-[8px] font-mono font-bold text-[#00FF87] uppercase">ESCAPE</span>
        </div>

        {/* 2. PLAYER MARKER (Spring-bezier CSS transform movement left <- right towards door) */}
        <div
          className={`absolute top-2 z-20 flex flex-col items-center gap-0.5 ${
            pulseActive && !isReducedMotion ? "animate-cyan-ripple rounded-full" : ""
          }`}
          style={{
            left: `${playerPercent}%`,
            transition: isReducedMotion ? "none" : "left 600ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          <CyberSilhouette role="player" rimColor="#00F0FF" width={32} height={32} />
          <span className="text-[8px] font-mono font-bold text-[#00F0FF] uppercase tracking-wider">YOU</span>
        </div>

        {/* 3. SHADOW MARKER (Chases from right behind Player) */}
        <div
          className="absolute top-1.5 z-20 flex flex-col items-center gap-0.5"
          style={{
            left: `${shadowPercent}%`,
            transition: isReducedMotion ? "none" : "left 600ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          <CyberSilhouette role="shadow" rimColor="#FF0055" width={36} height={36} gapDistance={safeGap} />
          <span className="text-[8px] font-mono font-bold text-[#FF0055] uppercase tracking-wider">SHADOW</span>
        </div>
      </div>
    </div>
  );
}
