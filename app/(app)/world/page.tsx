'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getStoreData, calculateStreak, UserStoreData } from '@/lib/store';
import { computeWorldState, syncWorldState, WorldState, WorldBuilding } from '@/lib/worldEngine';
import { getThemeConfig, getThemeTierInfo, WorldThemeId } from '@/lib/themes';
import { calibrationScore } from '@/lib/engine/calibration';
import WorldRenderer from '@/components/WorldRenderer';
import WorldShareModal from '@/components/WorldShareModal';
import { Globe, Share2, Sparkles, Trophy, Shield, Zap, ChevronRight, Gem, Award, Layers } from 'lucide-react';

export default function WorldPage() {
  const [storeData, setStoreData] = useState<UserStoreData | null>(null);
  const [worldState, setWorldState] = useState<WorldState | null>(null);
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);
  const [selectedBuilding, setSelectedBuilding] = useState<WorldBuilding | null>(null);

  useEffect(() => {
    const store = getStoreData();
    setStoreData(store);
    const world = computeWorldState(store);
    setWorldState(world);
    syncWorldState(store);
  }, []);

  if (!storeData || !worldState) {
    return (
      <div className="py-20 text-center text-muted font-mono text-sm animate-pulse">
        Generating your living world...
      </div>
    );
  }

  const activeThemeId = (storeData.learnerProfile?.worldTheme as WorldThemeId) || 'cosmos';
  const themeConfig = getThemeConfig(activeThemeId);
  const tierInfo = getThemeTierInfo(activeThemeId, worldState.totalMasteryPercent);
  const streak = calculateStreak(storeData.attempts);

  const completeBuildings = worldState.buildings.filter((b) => b.state === 'complete').length;
  const partialBuildings = worldState.buildings.filter((b) => b.state === 'partial').length;
  const totalAttempts = storeData.attempts?.length || 0;
  const soloAttempts = storeData.attempts?.filter((a) => a.isSolo && !a.isVoid).length || 0;
  const soloSessions = Math.max(0, Math.floor(soloAttempts / 6));

  // Metacognitive accuracy
  const score = calibrationScore(storeData.attempts);
  const absScore = score !== null ? Math.round(Math.abs(score) * 100) : 6;
  const accuracyMargin = Math.max(3, Math.min(25, absScore));

  // Dynamic Resource Calculation based on Learning Milestones
  const wood = Math.floor(worldState.totalMasteryPercent * 14 + totalAttempts * 3);
  const stone = Math.floor(worldState.totalMasteryPercent * 9 + soloAttempts * 6);
  const crystal = Math.floor(completeBuildings * 50 + worldState.tier * 30);
  const gold = Math.floor(streak * 35 + worldState.totalMasteryPercent * 12 + soloSessions * 80);

  // Unlocked Achievements & Titles
  const achievements = [
    {
      id: 'first_build',
      title: 'Pioneer Architect',
      desc: 'Constructed your first building foundation',
      unlocked: completeBuildings > 0 || partialBuildings > 0,
      icon: '🏗️',
    },
    {
      id: 'tier_grow',
      title: 'Terraform Master',
      desc: 'Advanced your world to Tier 2 or higher',
      unlocked: worldState.tier >= 2,
      icon: '🌱',
    },
    {
      id: 'solo_brave',
      title: 'Solo Conqueror',
      desc: 'Proved mastery in independent testing',
      unlocked: soloAttempts >= 6,
      icon: '🛡️',
    },
    {
      id: 'high_mastery',
      title: 'Realm Sovereign',
      desc: 'Achieved 80%+ full domain mastery',
      unlocked: worldState.totalMasteryPercent >= 80,
      icon: '👑',
    },
  ];

  const passportId = storeData.activeGraphId ? storeData.activeGraphId.substring(0, 10).toUpperCase() : 'XP-CORE-01';

  return (
    <div className="space-y-6 select-none pt-2 max-w-2xl mx-auto pb-24 font-sans">
      
      {/* 1. HEADER & SHARE ACTION */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#00F0FF]" />
            <h1 className="font-sans font-bold text-2xl text-white">
              {storeData.handle}&apos;s World
            </h1>
          </div>
          <p className="font-sans text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
            <span>{themeConfig.icon}</span>
            <span>{themeConfig.name} &middot; {storeData.goalText}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsShareOpen(true)}
          className="h-10 px-4 rounded-xl bg-signature-gradient text-white font-mono font-bold text-xs flex items-center gap-2 hover:brightness-110 transition-all cursor-pointer shadow-[0_0_20px_rgba(168,85,247,0.4)]"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share World</span>
        </button>
      </div>

      {/* 2. TIER PROGRESS BAR & TERRAFORMED BADGE */}
      <section className="p-4 sm:p-5 rounded-[22px] bg-[#120E22]/90 border border-white/10 space-y-3 shadow-xl backdrop-blur-xl">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="space-y-0.5">
            <span className="font-mono text-[10px] uppercase text-[#00F0FF] font-bold tracking-wider block">
              WORLD EVOLUTION
            </span>
            <h2 className="font-sans font-bold text-base text-white flex items-center gap-2">
              <span>Tier {worldState.tier}: {worldState.tierName}</span>
            </h2>
          </div>

          <div
            className="px-3 py-1 rounded-full border font-mono text-xs font-bold shadow-md"
            style={{
              backgroundColor: `${tierInfo.color}20`,
              color: tierInfo.color,
              borderColor: `${tierInfo.color}50`,
            }}
          >
            {worldState.totalMasteryPercent}% Terraformed
          </div>
        </div>

        {/* Thick Progress Bar */}
        <div className="space-y-1">
          <div className="h-2 w-full bg-black/60 rounded-full overflow-hidden border border-white/10">
            <div
              className="h-full bg-signature-gradient rounded-full transition-all duration-700 shadow-[0_0_12px_rgba(0,240,255,0.6)]"
              style={{ width: `${Math.max(4, worldState.totalMasteryPercent)}%` }}
            />
          </div>
          <div className="flex justify-between font-mono text-[9px] text-slate-400 pt-0.5">
            <span>Tier 1: Beginning</span>
            <span>Tier 3: Strong (40%)</span>
            <span>Tier 5: Complete (80%+)</span>
          </div>
        </div>
      </section>

      {/* 3. FULL-SCREEN ISOMETRIC SVG WORLD RENDERER */}
      <section className="space-y-2">
        <WorldRenderer
          theme={activeThemeId}
          buildings={worldState.buildings}
          height={320}
          onSelectBuilding={(b) => setSelectedBuilding(b)}
        />
        <span className="font-mono text-[10px] text-slate-400 block text-center">
          Tap any building on the grid to inspect details &middot; Powered by AI Game Assets
        </span>
      </section>

      {/* 4. RESOURCES EARNED (WOOD, STONE, CRYSTAL, GOLD) */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="font-mono text-[10px] uppercase text-slate-400 font-bold tracking-wider">
            TERRAFORMING RESOURCES (MASTERY-EARNED)
          </span>
          <span className="font-mono text-[10px] text-[#00FF87]">Auto-Harvested</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Wood */}
          <div className="p-3 rounded-2xl bg-[#120E22]/90 border border-white/10 flex items-center gap-3 shadow-lg">
            <div className="w-10 h-10 rounded-xl bg-amber-900/30 border border-amber-600/40 flex items-center justify-center text-lg">
              🪵
            </div>
            <div>
              <span className="font-mono text-[9px] uppercase text-slate-400 font-bold block">AETHER WOOD</span>
              <span className="font-mono font-bold text-base text-amber-300">{wood}</span>
            </div>
          </div>

          {/* Stone */}
          <div className="p-3 rounded-2xl bg-[#120E22]/90 border border-white/10 flex items-center gap-3 shadow-lg">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-600/40 flex items-center justify-center text-lg">
              🪨
            </div>
            <div>
              <span className="font-mono text-[9px] uppercase text-slate-400 font-bold block">RUNE STONE</span>
              <span className="font-mono font-bold text-base text-slate-200">{stone}</span>
            </div>
          </div>

          {/* Crystal */}
          <div className="p-3 rounded-2xl bg-[#120E22]/90 border border-white/10 flex items-center gap-3 shadow-lg">
            <div className="w-10 h-10 rounded-xl bg-purple-900/30 border border-purple-500/40 flex items-center justify-center text-lg">
              🔮
            </div>
            <div>
              <span className="font-mono text-[9px] uppercase text-slate-400 font-bold block">CRYSTAL</span>
              <span className="font-mono font-bold text-base text-purple-300">{crystal}</span>
            </div>
          </div>

          {/* Gold */}
          <div className="p-3 rounded-2xl bg-[#120E22]/90 border border-white/10 flex items-center gap-3 shadow-lg">
            <div className="w-10 h-10 rounded-xl bg-yellow-900/30 border border-yellow-500/40 flex items-center justify-center text-lg">
              🪙
            </div>
            <div>
              <span className="font-mono text-[9px] uppercase text-slate-400 font-bold block">SOLAR GOLD</span>
              <span className="font-mono font-bold text-base text-yellow-300">{gold}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. ACHIEVEMENTS & TITLES EARNED */}
      <section className="p-5 rounded-[22px] bg-[#120E22]/90 border border-white/10 space-y-3.5 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <span className="font-mono text-[10px] uppercase text-[#00F0FF] font-bold tracking-wider">
            REALM ACHIEVEMENTS & HONORS
          </span>
          <span className="font-mono text-xs text-slate-400">
            {achievements.filter((a) => a.unlocked).length} / {achievements.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                ach.unlocked
                  ? 'bg-panel/80 border-[#00F0FF]/30 text-white shadow-md'
                  : 'bg-black/30 border-white/5 text-slate-500 opacity-60'
              }`}
            >
              <div className="text-2xl shrink-0">{ach.icon}</div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-sans font-bold text-xs truncate">
                    {ach.title}
                  </span>
                  {ach.unlocked && (
                    <span className="font-mono text-[8px] px-1.5 py-0.2 rounded bg-[#00FF87]/20 text-[#00FF87] uppercase font-bold">
                      Earned
                    </span>
                  )}
                </div>
                <p className="font-sans text-[11px] text-slate-400 truncate">
                  {ach.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. CONCEPT BUILDINGS MATRIX */}
      <section className="bg-[#120E22]/90 border border-white/10 rounded-[22px] p-5 sm:p-6 space-y-3.5 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <span className="font-mono text-[10px] uppercase text-[#00F0FF] font-bold tracking-wider">
            CONSTRUCTED BUILDINGS ({worldState.buildings.length})
          </span>
          <span className="font-mono text-xs text-slate-400">
            {completeBuildings} Completed &middot; {partialBuildings} In Progress
          </span>
        </div>

        <div className="space-y-2.5">
          {worldState.buildings.map((bldg) => {
            const isComplete = bldg.state === 'complete';
            const isPartial = bldg.state === 'partial';

            return (
              <div
                key={bldg.buildingId}
                className="p-3.5 rounded-xl bg-panel/70 border border-white/10 hover:border-[#00F0FF]/40 transition-all space-y-2"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: isComplete ? '#00FF87' : isPartial ? '#00F0FF' : '#64748B',
                      }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-sans font-bold text-sm text-white">
                          {bldg.buildingName}
                        </span>
                        <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10">
                          {bldg.state.toUpperCase()}
                        </span>
                      </div>
                      <span className="font-sans text-xs text-slate-400 block mt-0.5">
                        {bldg.conceptName}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-white">
                      {bldg.masteryPercent}%
                    </span>
                    <Link
                      href={`/quest?concept=${encodeURIComponent(bldg.conceptId)}`}
                      className="px-2.5 py-1 rounded-lg bg-[#00F0FF]/15 hover:bg-[#00F0FF]/30 border border-[#00F0FF]/40 text-[#00F0FF] font-mono text-[10px] font-bold transition-colors cursor-pointer"
                    >
                      Practice &rarr;
                    </Link>
                  </div>
                </div>

                <div className="h-1.5 w-full bg-raised rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(4, bldg.masteryPercent)}%`,
                      backgroundColor: isComplete ? '#00FF87' : isPartial ? '#00F0FF' : '#64748B',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Share Modal Dialog */}
      <WorldShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        learnerName={storeData.handle}
        goalText={storeData.goalText}
        masteryPercentage={worldState.totalMasteryPercent}
        passportId={passportId}
        conceptsCount={worldState.buildings.length}
        soloVerifiedCount={soloSessions}
        accuracyMargin={accuracyMargin}
        themeId={activeThemeId}
      />

    </div>
  );
}
