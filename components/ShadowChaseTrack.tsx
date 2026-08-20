"use client";

import React from "react";
import CyberSilhouette from "./CyberSilhouette";
import { Zap, ShieldAlert, Clock, Eye } from "lucide-react";

interface ShadowChaseTrackProps {
  currentLevel: number;
  gapDistance: number; // 0 (caught) to 10 (escaped)
  rememberedConcepts?: string[];
  timeLeftSeconds?: number;
  isHesitating?: boolean;
}

export default function ShadowChaseTrack({
  currentLevel,
  gapDistance,
  rememberedConcepts = [],
  timeLeftSeconds,
  isHesitating = false,
}: ShadowChaseTrackProps) {
  // Clamp distance between 0 and 10
  const safeGap = Math.max(0, Math.min(10, gapDistance));
  const isCaught = safeGap === 0;

  return (
    <div className="w-full bg-[#0D0D1A] border border-[#00F0FF]/30 rounded-2xl p-3.5 shadow-2xl space-y-2.5 font-mono text-xs glow-cyan relative overflow-hidden">
      {/* Top Status Line */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-[#00F0FF]/20 border border-[#00F0FF]/40 text-[#00F0FF] font-bold text-[11px]">
            SHADOW ESCAPE • LEVEL {currentLevel}
          </span>

          {currentLevel >= 2 && typeof timeLeftSeconds === "number" && (
            <div className={`flex items-center gap-1 font-bold ${timeLeftSeconds <= 5 ? "text-[#FF0055] animate-pulse" : "text-[#FFB800]"}`}>
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
          <span className="text-slate-400 text-[10px]">
            {isCaught ? "CAUGHT!" : `Distance Gap: ${safeGap}/10`}
          </span>
        </div>
      </div>

      {/* Shadow Memory Recall Banner */}
      {rememberedConcepts.length > 0 && (
        <div className="p-2 rounded-xl bg-[#FF0055]/10 border border-[#FF0055]/30 flex items-center justify-between text-[11px] text-[#FF7185]">
          <div className="flex items-center gap-1.5 truncate">
            <Eye className="w-3.5 h-3.5 shrink-0 text-[#FF0055]" />
            <span className="truncate">
              <span className="font-bold">Shadow Remembers:</span> {rememberedConcepts.join(", ")}
            </span>
          </div>
          <span className="text-[10px] text-white/80 shrink-0 font-bold ml-2">Answer right to shrink!</span>
        </div>
      )}

      {/* Horizontal Distance Track */}
      <div className="relative w-full h-12 bg-[#000000] border border-white/10 rounded-xl p-2 flex items-center justify-between overflow-hidden">
        {/* Track Grid Lines */}
        <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />

        {/* Player Marker (Surges forward left -> right) */}
        <div
          className="relative z-10 transition-all duration-500 flex items-center gap-1"
          style={{ left: `${Math.min(85, (10 - safeGap) * 8)}%` }}
        >
          <CyberSilhouette rimColor="#00F0FF" width={28} height={28} />
          <span className="text-[9px] font-bold text-[#00F0FF] uppercase">YOU</span>
        </div>

        {/* Shadow Marker (Chases from right) */}
        <div
          className="relative z-10 transition-all duration-500 flex items-center gap-1"
          style={{ right: `${Math.min(85, safeGap * 8)}%` }}
        >
          <span className="text-[9px] font-bold text-[#FF0055] uppercase">SHADOW</span>
          <CyberSilhouette rimColor="#FB7185" width={28} height={28} />
        </div>
      </div>
    </div>
  );
}
