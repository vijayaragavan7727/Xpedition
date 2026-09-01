'use client';

import React from 'react';
import { PlayableGameWorldData } from '@/lib/engine/gameWorldAdapter';
import { Shield, Sparkles, Flame, Users, Hammer, Trophy } from 'lucide-react';

interface GameTopHudProps {
  worldData: PlayableGameWorldData;
  onOpenHQ?: () => void;
}

export default function GameTopHud({ worldData, onOpenHQ }: GameTopHudProps) {
  const {
    learnerName,
    learnerLevel,
    totalXp,
    worldLevel,
    worldLevelName,
    worldProgressPercent,
    workerCount,
    totalWorkers,
    shieldHoursRemaining,
    streakDays,
    resources,
  } = worldData;

  return (
    <div className="absolute top-0 inset-x-0 z-30 pointer-events-none p-2 sm:p-4 select-none font-sans flex flex-col gap-2">
      {/* Top Bar Container */}
      <div className="w-full max-w-6xl mx-auto flex items-center justify-between gap-2">
        {/* Left: Player Level Badge & XP Bar */}
        <div
          onClick={onOpenHQ}
          className="pointer-events-auto flex items-center gap-2 sm:gap-3 px-3 py-1.5 rounded-2xl bg-[#0F172A]/90 border-2 border-[#38BDF8]/40 shadow-[0_8px_24px_rgba(0,0,0,0.6)] backdrop-blur-md cursor-pointer hover:border-[#38BDF8] transition-all group"
        >
          {/* Blue Shield Star Level Badge */}
          <div className="relative w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0284C7] to-[#38BDF8] rounded-xl rotate-45 shadow-[0_0_12px_rgba(56,189,248,0.7)] group-hover:rotate-90 transition-transform duration-300" />
            <span className="relative z-10 font-black text-xs sm:text-sm text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {learnerLevel}
            </span>
          </div>

          {/* Name & XP Meter */}
          <div className="min-w-0 pr-1 space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs sm:text-sm text-white truncate max-w-[110px] sm:max-w-[160px]">
                {learnerName}
              </span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-md bg-[#38BDF8]/20 text-[#38BDF8] font-bold border border-[#38BDF8]/40">
                T{worldLevel}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-2 w-24 sm:w-36 bg-[#020617] rounded-full overflow-hidden border border-white/20">
                <div
                  className="h-full bg-gradient-to-r from-[#38BDF8] via-[#818CF8] to-[#C084FC] rounded-full transition-all duration-500"
                  style={{ width: `${worldProgressPercent}%` }}
                />
              </div>
              <span className="font-mono text-[10px] text-slate-300 font-semibold">
                {totalXp} XP
              </span>
            </div>
          </div>
        </div>

        {/* Center: Builders & Shield status */}
        <div className="hidden md:flex items-center gap-2 pointer-events-auto">
          {/* Builder Count */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0F172A]/90 border border-amber-400/40 text-xs font-mono font-bold text-amber-300 backdrop-blur-md shadow-lg">
            <Hammer className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>
              {workerCount}/{totalWorkers}
            </span>
          </div>

          {/* Shield Status */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0F172A]/90 border border-emerald-400/40 text-xs font-mono font-bold text-emerald-300 backdrop-blur-md shadow-lg">
            <Shield className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
            <span>{shieldHoursRemaining}h Shield</span>
          </div>

          {/* Streak Flame */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0F172A]/90 border border-orange-500/40 text-xs font-mono font-bold text-orange-400 backdrop-blur-md shadow-lg">
            <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
            <span>{streakDays}d Streak</span>
          </div>
        </div>

        {/* Right: Strategy Resource Bars (Gold, Mana / Elixir, Dark Crystal, Gems) */}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
          {/* Gold Storage Pill */}
          <div className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 rounded-xl bg-[#0F172A]/90 border border-amber-400/50 shadow-md text-xs font-mono font-black text-amber-300">
            <span className="text-sm">🪙</span>
            <span>{resources.gold.toLocaleString()}</span>
          </div>

          {/* Mana / Elixir Storage Pill */}
          <div className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 rounded-xl bg-[#0F172A]/90 border border-purple-400/50 shadow-md text-xs font-mono font-black text-purple-300">
            <span className="text-sm">🔮</span>
            <span>{resources.crystal.toLocaleString()}</span>
          </div>

          {/* Wood / Stone Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#0F172A]/90 border border-emerald-400/50 shadow-md text-xs font-mono font-black text-emerald-300">
            <span className="text-sm">🪵</span>
            <span>{resources.wood.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
