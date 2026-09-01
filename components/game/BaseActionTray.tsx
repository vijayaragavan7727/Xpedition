'use client';

import React from 'react';
import { Swords, Bot, Sparkles, Shield, Trophy, BookOpen, Briefcase, Flame } from 'lucide-react';
import { soundFx } from '@/lib/soundEngine';

interface BaseActionTrayProps {
  onAttack: () => void;
  onOpenXyra: () => void;
  onOpenHero: () => void;
  onOpenUpgrades: () => void;
  onOpenSyllabus: () => void;
  onOpenCareerHub?: () => void;
  fadingCount?: number;
  streakCount?: number;
}

export const BaseActionTray: React.FC<BaseActionTrayProps> = ({
  onAttack,
  onOpenXyra,
  onOpenHero,
  onOpenUpgrades,
  onOpenSyllabus,
  onOpenCareerHub,
  fadingCount = 0,
  streakCount = 0,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto flex items-end justify-between gap-2 p-2 sm:p-4 select-none pointer-events-none">
      {/* 1. Clash-Style Left ARENA / ATTACK Button */}
      <div className="pointer-events-auto">
        <button
          onClick={() => {
            soundFx.playTick();
            onAttack();
          }}
          className="relative group flex items-center gap-2.5 sm:gap-3 px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-[0_0_35px_rgba(255,46,99,0.6)] border-2 border-white/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          {/* Pulsing Flame & Swords Icon */}
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-black/40 border border-white/20 flex items-center justify-center text-amber-300 group-hover:rotate-12 transition-transform shrink-0">
            <Swords className="w-4 h-4 sm:w-5 sm:h-5 fill-amber-300" />
          </div>

          <div className="text-left">
            <div className="text-[9px] sm:text-[10px] font-mono text-amber-200 font-bold leading-none">
              LEARN OR LOSE
            </div>
            <div className="text-xs sm:text-sm font-black tracking-tight drop-shadow">
              SURVIVOR ARENA
            </div>
          </div>

          {/* Under Siege Alert Badge */}
          {fadingCount > 0 && (
            <span className="absolute -top-3 -right-2 px-2 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-mono font-black border border-white shadow-lg animate-bounce">
              {fadingCount} UNDER SIEGE
            </span>
          )}
        </button>
      </div>

      {/* 2. Right Tray Actions */}
      <div className="pointer-events-auto flex items-center gap-1 sm:gap-2">
        {/* XYRA AI Advisor */}
        <button
          onClick={() => {
            soundFx.playTick();
            onOpenXyra();
          }}
          className="flex flex-col items-center justify-center w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-[#120E24]/90 backdrop-blur-xl border border-[#00F0FF]/40 text-[#00F0FF] hover:border-[#00F0FF] hover:scale-105 active:scale-95 shadow-lg transition-all cursor-pointer"
          title="Ask XYRA AI Tutor"
        >
          <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[8px] sm:text-[9px] font-bold font-mono mt-0.5">XYRA</span>
        </button>

        {/* Hero Champions */}
        <button
          onClick={() => {
            soundFx.playTick();
            onOpenHero();
          }}
          className="flex flex-col items-center justify-center w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-[#120E24]/90 backdrop-blur-xl border border-white/15 text-slate-200 hover:border-[#F472F6]/60 hover:text-[#F472F6] hover:scale-105 active:scale-95 shadow-lg transition-all cursor-pointer"
          title="Hero Champions Dossier"
        >
          <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[8px] sm:text-[9px] font-bold font-mono mt-0.5">HERO</span>
        </button>

        {/* Base Upgrades / Citadel */}
        <button
          onClick={() => {
            soundFx.playTick();
            onOpenUpgrades();
          }}
          className="flex flex-col items-center justify-center w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-[#120E24]/90 backdrop-blur-xl border border-white/15 text-slate-200 hover:border-amber-400 hover:text-amber-300 hover:scale-105 active:scale-95 shadow-lg transition-all cursor-pointer"
          title="Base Upgrades"
        >
          <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[8px] sm:text-[9px] font-bold font-mono mt-0.5">CITADEL</span>
        </button>

        {/* Course Topics / Spires */}
        <button
          onClick={() => {
            soundFx.playTick();
            onOpenSyllabus();
          }}
          className="flex flex-col items-center justify-center w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-[#120E24]/90 backdrop-blur-xl border border-white/15 text-slate-200 hover:border-[#A855F7] hover:text-[#A855F7] hover:scale-105 active:scale-95 shadow-lg transition-all cursor-pointer"
          title="Course Spires"
        >
          <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[8px] sm:text-[9px] font-bold font-mono mt-0.5">SPIRES</span>
        </button>

        {/* Career Hub */}
        {onOpenCareerHub && (
          <button
            onClick={() => {
              soundFx.playTick();
              onOpenCareerHub();
            }}
            className="flex flex-col items-center justify-center w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-[#120E24]/90 backdrop-blur-xl border border-white/15 text-slate-200 hover:border-fuchsia-400 hover:text-fuchsia-300 hover:scale-105 active:scale-95 shadow-lg transition-all cursor-pointer"
            title="Career Hub & Industry Pathways"
          >
            <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[8px] sm:text-[9px] font-bold font-mono mt-0.5">CAREER</span>
          </button>
        )}
      </div>
    </div>
  );
};
