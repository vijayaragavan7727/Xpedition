'use client';

import React from 'react';
import Link from 'next/link';
import { PlayableGameWorldData, GameBuildingState, GameMentorDialogue } from '@/lib/engine/gameWorldAdapter';
import {
  Sparkles,
  Trophy,
  Target,
  BookOpen,
  Building2,
  Zap,
  ChevronRight,
  X,
  Flame,
  ShieldCheck,
  TrendingUp,
  Award,
} from 'lucide-react';

interface GameHUDProps {
  worldData: PlayableGameWorldData;
  activeModal: 'hq' | 'library' | 'quest_board' | 'ai_lab' | 'mentor' | 'archivist' | null;
  onCloseModal: () => void;
  onUpgradeHQ?: () => void;
  onSelectBuilding?: (type: 'hq' | 'library' | 'quest_board' | 'ai_lab') => void;
}

export default function GameHUD({
  worldData,
  activeModal,
  onCloseModal,
  onUpgradeHQ,
  onSelectBuilding,
}: GameHUDProps) {
  const { worldLevel, worldLevelName, worldProgressPercent, totalXp, xpNeededForNextTier, streakDays, resources, mentor, buildings } = worldData;

  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-3 sm:p-5 select-none font-sans">
      {/* =================================================================== */}
      {/* 1. TOP FLOATING STRATEGY HUD BAR (Level, Resources, XP, Streak) */}
      {/* =================================================================== */}
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between gap-2 sm:gap-3 pointer-events-auto">
        {/* Left: World Level & Progression Pill */}
        <div
          onClick={() => onSelectBuilding?.('hq')}
          className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-[#120E22]/90 backdrop-blur-xl border border-white/15 shadow-2xl hover:border-[#00F0FF]/50 transition-all cursor-pointer group"
        >
          {/* Level Gem */}
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#A855F7] to-[#00F0FF] flex items-center justify-center font-black text-xs text-black shadow-[0_0_12px_rgba(0,240,255,0.7)] group-hover:scale-105 transition-transform">
            {worldLevel}
          </div>

          {/* Level Title & Mini Progress Bar */}
          <div className="space-y-1 min-w-0 pr-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-white tracking-tight truncate">
                {worldLevelName}
              </span>
              <span className="font-mono text-[10px] text-[#00FF87] font-semibold">
                {worldProgressPercent}%
              </span>
            </div>

            <div className="h-1.5 w-28 sm:w-36 bg-black/60 rounded-full overflow-hidden border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-[#00F0FF] to-[#00FF87] rounded-full transition-all duration-500"
                style={{ width: `${worldProgressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Real Resources & Streak Inventory */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-2xl bg-[#120E22]/90 backdrop-blur-xl border border-white/15 shadow-2xl text-[11px] font-mono font-bold text-slate-200">
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-white/5" title="Wood Resource">
            <span>🪵</span>
            <span className="text-amber-300">{resources.wood}</span>
          </div>

          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-white/5" title="Stone Resource">
            <span>🪨</span>
            <span className="text-slate-300">{resources.stone}</span>
          </div>

          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-white/5" title="Crystal Resource">
            <span>🔮</span>
            <span className="text-purple-300">{resources.crystal}</span>
          </div>

          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-white/5" title="Gold Resource">
            <span>🪙</span>
            <span className="text-yellow-400">{resources.gold}</span>
          </div>

          {/* Streak Flame */}
          <div className="flex items-center gap-1 pl-1 border-l border-white/10 text-orange-400 font-bold" title="Active Streak Days">
            <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
            <span>{streakDays}d</span>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. BOTTOM CONTROL BAR (Quick Nav & Interactions) */}
      {/* =================================================================== */}
      <div className="w-full max-w-lg mx-auto flex items-center justify-center gap-2 pointer-events-auto pb-1">
        <button
          type="button"
          onClick={() => onSelectBuilding?.('hq')}
          className="flex-1 h-9 px-2.5 rounded-xl bg-[#120E22]/90 backdrop-blur-md border border-white/15 hover:border-[#00F0FF]/60 text-white font-mono text-[11px] font-bold flex items-center justify-center gap-1 transition-all shadow-xl cursor-pointer"
        >
          <span>🏠 HQ</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectBuilding?.('library')}
          className="flex-1 h-9 px-2.5 rounded-xl bg-[#120E22]/90 backdrop-blur-md border border-white/15 hover:border-[#C084FC]/60 text-white font-mono text-[11px] font-bold flex items-center justify-center gap-1 transition-all shadow-xl cursor-pointer"
        >
          <span>📚 Library</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectBuilding?.('quest_board')}
          className="flex-1 h-9 px-2.5 rounded-xl bg-[#120E22]/90 backdrop-blur-md border border-white/15 hover:border-[#F59E0B]/60 text-white font-mono text-[11px] font-bold flex items-center justify-center gap-1 transition-all shadow-xl cursor-pointer"
        >
          <span>🎯 Quests</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectBuilding?.('ai_lab')}
          className="flex-1 h-9 px-2.5 rounded-xl bg-[#120E22]/90 backdrop-blur-md border border-white/15 hover:border-[#00FF87]/60 text-white font-mono text-[11px] font-bold flex items-center justify-center gap-1 transition-all shadow-xl cursor-pointer"
        >
          <span>🤖 AI Lab</span>
        </button>
      </div>

      {/* =================================================================== */}
      {/* 3. INTERACTIVE BUILDING / NPC MODALS */}
      {/* =================================================================== */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md pointer-events-auto animate-fadeIn">
          <div className="w-full max-w-md bg-[#120E22] border border-white/20 rounded-[24px] p-5 sm:p-6 space-y-4 shadow-[0_20px_60px_rgba(0,0,0,0.9)] relative overflow-hidden">
            
            {/* Ambient Background Glow */}
            <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-[50px] pointer-events-none opacity-40 bg-[#00F0FF]" />

            {/* Close Button */}
            <button
              type="button"
              onClick={onCloseModal}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* --- MODAL 1: LEARNING HQ --- */}
            {activeModal === 'hq' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0284C7] to-[#00F0FF] flex items-center justify-center text-2xl shadow-lg">
                    🏠
                  </div>
                  <div>
                    <h2 className="font-sans font-black text-lg text-white">
                      {buildings.hq.title}
                    </h2>
                    <p className="font-mono text-xs text-[#00F0FF] font-semibold">
                      {buildings.hq.subtitle}
                    </p>
                  </div>
                </div>

                {/* Progress Details */}
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-slate-400">World Evolution Progress</span>
                    <span className="font-bold text-[#00FF87]">{worldProgressPercent}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#00F0FF] to-[#00FF87] rounded-full transition-all"
                      style={{ width: `${worldProgressPercent}%` }}
                    />
                  </div>
                  <p className="font-mono text-[11px] text-slate-400 pt-0.5">
                    {xpNeededForNextTier > 0
                      ? `${xpNeededForNextTier} XP needed to ascend to next realm tier`
                      : 'World is ready for elevation!'}
                  </p>
                </div>

                {/* Stat Grid */}
                <div className="grid grid-cols-2 gap-2 text-center font-mono">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[10px] text-slate-400 block uppercase">Total Power</span>
                    <span className="font-bold text-sm text-cyan-300">{totalXp} XP</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[10px] text-slate-400 block uppercase">Attendance</span>
                    <span className="font-bold text-sm text-amber-300">{streakDays} Day Streak</span>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  type="button"
                  onClick={() => {
                    onUpgradeHQ?.();
                    onCloseModal();
                  }}
                  className="w-full h-11 rounded-xl bg-signature-gradient text-white font-mono font-bold text-xs flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer shadow-lg"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{worldProgressPercent >= 100 ? 'Ascend World Realm' : 'Construct & Upgrade'}</span>
                </button>
              </div>
            )}

            {/* --- MODAL 2: LIBRARY --- */}
            {activeModal === 'library' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#C084FC] flex items-center justify-center text-2xl shadow-lg">
                    📚
                  </div>
                  <div>
                    <h2 className="font-sans font-black text-lg text-white">
                      {buildings.library.title}
                    </h2>
                    <p className="font-mono text-xs text-[#C084FC] font-semibold">
                      {buildings.library.subtitle}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1.5 font-mono text-xs text-slate-300">
                  <div className="flex items-center justify-between">
                    <span>Domain Mastery:</span>
                    <span className="text-purple-300 font-bold">{buildings.library.statsLabel}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Mastered Topics:</span>
                    <span className="text-[#00FF87] font-bold">
                      {worldData.masteredTopicsCount} / {worldData.totalTopicsCount}
                    </span>
                  </div>
                </div>

                <Link
                  href="/home"
                  onClick={onCloseModal}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#C084FC] text-white font-mono font-bold text-xs flex items-center justify-center gap-1.5 hover:brightness-110 transition-all cursor-pointer shadow-lg"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Explore Concepts &rarr;</span>
                </Link>
              </div>
            )}

            {/* --- MODAL 3: QUEST BOARD --- */}
            {activeModal === 'quest_board' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#D97706] to-[#F59E0B] flex items-center justify-center text-2xl shadow-lg">
                    🎯
                  </div>
                  <div>
                    <h2 className="font-sans font-black text-lg text-white">
                      {buildings.questBoard.title}
                    </h2>
                    <p className="font-mono text-xs text-[#F59E0B] font-semibold">
                      {buildings.questBoard.subtitle}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
                  <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider block">
                    Target Concept Bounty
                  </span>
                  <p className="font-sans font-bold text-sm text-white">
                    {mentor.recommendedConceptName}
                  </p>
                  <p className="font-mono text-[11px] text-amber-300">
                    Reward: +100 XP &middot; +50 Wood &middot; +30 Gold
                  </p>
                </div>

                <Link
                  href={mentor.actionUrl}
                  onClick={onCloseModal}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-[#D97706] to-[#F59E0B] text-black font-mono font-black text-xs flex items-center justify-center gap-1.5 hover:brightness-110 transition-all cursor-pointer shadow-lg"
                >
                  <Target className="w-4 h-4" />
                  <span>Start Bounty Quest &rarr;</span>
                </Link>
              </div>
            )}

            {/* --- MODAL 4: AI RESEARCH LAB --- */}
            {activeModal === 'ai_lab' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#059669] to-[#00FF87] flex items-center justify-center text-2xl shadow-lg">
                    🤖
                  </div>
                  <div>
                    <h2 className="font-sans font-black text-lg text-white">
                      AI Research Laboratory
                    </h2>
                    <p className="font-mono text-xs text-[#00FF87] font-semibold">
                      Adaptive BKT Flow & Calibration
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-black/40 border border-[#00FF87]/30 space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Quest Accuracy:</span>
                    <span className="font-bold text-[#00FF87]">{worldData.accuracyRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Knowledge Retention:</span>
                    <span className="font-bold text-cyan-300">Optimum (BKT 0.85)</span>
                  </div>
                </div>

                <Link
                  href="/passport"
                  onClick={onCloseModal}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-[#059669] to-[#00FF87] text-black font-mono font-black text-xs flex items-center justify-center gap-1.5 hover:brightness-110 transition-all cursor-pointer shadow-lg"
                >
                  <Zap className="w-4 h-4" />
                  <span>Inspect Skill Passport &rarr;</span>
                </Link>
              </div>
            )}

            {/* --- MODAL 5: MENTOR NPC (XYRA) --- */}
            {activeModal === 'mentor' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#00F0FF] to-[#00FF87] flex items-center justify-center text-2xl shadow-lg">
                    🤖
                  </div>
                  <div>
                    <h2 className="font-sans font-black text-lg text-white">
                      {mentor.npcName}
                    </h2>
                    <p className="font-mono text-xs text-[#00FF87] font-semibold">
                      Personal Adaptive AI Coach
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-black/40 border border-[#00F0FF]/30 space-y-2">
                  <p className="font-sans text-xs text-slate-200 leading-relaxed">
                    &ldquo;{mentor.greeting}&rdquo;
                  </p>

                  <div className="pt-2 border-t border-white/10 space-y-1">
                    <div className="flex items-center justify-between font-mono text-[10px]">
                      <span className="text-slate-400">Recommended Challenge</span>
                      <span className="px-1.5 py-0.2 rounded bg-cyan-400/20 text-[#00F0FF] font-bold uppercase">
                        {mentor.difficultyLabel}
                      </span>
                    </div>
                    <p className="font-sans font-bold text-xs text-white truncate">
                      {mentor.challengeTitle}
                    </p>
                  </div>
                </div>

                <Link
                  href={mentor.actionUrl}
                  onClick={onCloseModal}
                  className="w-full h-11 rounded-xl bg-signature-gradient text-white font-mono font-bold text-xs flex items-center justify-center gap-1.5 hover:brightness-110 transition-all cursor-pointer shadow-lg"
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>Accept Mentor Challenge</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {/* --- MODAL 6: ARCHIVIST NPC (LEXI) --- */}
            {activeModal === 'archivist' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#9333EA] to-[#C084FC] flex items-center justify-center text-2xl shadow-lg">
                    📜
                  </div>
                  <div>
                    <h2 className="font-sans font-black text-lg text-white">
                      Lexi the Archivist
                    </h2>
                    <p className="font-mono text-xs text-[#C084FC] font-semibold">
                      Keeper of Domain Chronicles
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-black/40 border border-[#C084FC]/30 space-y-2">
                  <p className="font-sans text-xs text-slate-200 leading-relaxed">
                    &ldquo;Greetings Traveler! You have unlocked {worldData.masteredTopicsCount} out of {worldData.totalTopicsCount} core concepts in this world realm. Keep up your daily consistency!&rdquo;
                  </p>
                </div>

                <Link
                  href="/history"
                  onClick={onCloseModal}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-[#9333EA] to-[#C084FC] text-white font-mono font-bold text-xs flex items-center justify-center gap-1.5 hover:brightness-110 transition-all cursor-pointer shadow-lg"
                >
                  <span>Review Learning History &rarr;</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
