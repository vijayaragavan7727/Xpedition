"use client";

import React from "react";
import { Lock, BookOpen, Sparkles, CheckCircle2 } from "lucide-react";

export interface LevelStatus {
  level: number;
  title: string;
  status: "LOCKED" | "MODULE_UNREAD" | "TEST_PENDING" | "PASSED";
  score?: number;
}

interface LevelNavigationStripProps {
  currentLevel: number;
  levels: LevelStatus[];
  onSelectLevel?: (levelNumber: number) => void;
}

export default function LevelNavigationStrip({
  currentLevel,
  levels,
  onSelectLevel,
}: LevelNavigationStripProps) {
  const levelNames: Record<number, string> = {
    1: "Basics",
    2: "Intermediate",
    3: "Advanced",
  };

  return (
    <div className="w-full bg-[#0D0D1A] border border-white/10 rounded-2xl p-2.5 shadow-xl flex items-center justify-between gap-1.5 font-mono text-xs overflow-x-auto custom-scrollbar">
      {levels.map((lvl) => {
        const isActive = lvl.level === currentLevel;
        const isLocked = lvl.status === "LOCKED";
        const isPassed = lvl.status === "PASSED";

        return (
          <button
            key={lvl.level}
            type="button"
            disabled={isLocked}
            onClick={() => !isLocked && onSelectLevel && onSelectLevel(lvl.level)}
            className={`flex-1 min-w-[110px] py-2 px-3 rounded-xl border flex items-center justify-between gap-1.5 transition-all text-left ${
              isActive
                ? "bg-[#00F0FF]/15 border-[#00F0FF] text-white shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                : isPassed
                ? "bg-[#00FF87]/10 border-[#00FF87]/40 text-[#00FF87]"
                : isLocked
                ? "bg-[#000000]/40 border-white/5 text-slate-500 cursor-not-allowed opacity-60"
                : "bg-[#000000] border-white/10 text-slate-300 hover:border-white/30 cursor-pointer"
            }`}
          >
            <div className="truncate space-y-0.5">
              <span className="text-[10px] uppercase font-bold block opacity-80">
                Level {lvl.level} • {levelNames[lvl.level] || `L${lvl.level}`}
              </span>
              <span className="text-xs font-bold font-heading truncate block">
                {isPassed
                  ? `Passed (${lvl.score || 8}/10)`
                  : lvl.status === "TEST_PENDING"
                  ? "Test Pending"
                  : lvl.status === "MODULE_UNREAD"
                  ? "Unread Module"
                  : "Locked"}
              </span>
            </div>

            <div className="shrink-0">
              {isPassed && <CheckCircle2 className="w-4 h-4 text-[#00FF87]" />}
              {lvl.status === "TEST_PENDING" && <Sparkles className="w-4 h-4 text-[#A855F7]" />}
              {lvl.status === "MODULE_UNREAD" && <BookOpen className="w-4 h-4 text-[#00F0FF]" />}
              {isLocked && <Lock className="w-3.5 h-3.5 text-slate-500" />}
            </div>
          </button>
        );
      })}
    </div>
  );
}
