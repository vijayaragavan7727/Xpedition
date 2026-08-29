'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getStoreData, calculateStreak, UserStoreData } from '@/lib/store';
import { computeWorldState, syncWorldState, WorldState, WorldBuilding } from '@/lib/worldEngine';
import { getThemeConfig, getThemeTierInfo, WorldThemeId } from '@/lib/themes';
import WorldRenderer from '@/components/WorldRenderer';
import WorldShareModal from '@/components/WorldShareModal';
import { Globe, Share2, Sparkles, Trophy, Shield, Zap, ChevronRight, Gem, Award, Layers, Sparkle } from 'lucide-react';

export default function WorldPage() {
  const [storeData, setStoreData] = useState<UserStoreData | null>(null);
  const [worldState, setWorldState] = useState<WorldState | null>(null);
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);
  const [characterImgPath, setCharacterImgPath] = useState<string>('/robot.png');

  useEffect(() => {
    const store = getStoreData();
    setStoreData(store);
    const world = computeWorldState(store);
    setWorldState(world);
    syncWorldState(store);
  }, []);

  // Instant render fallback state without blocking spinner
  const currentStore = storeData || getStoreData();
  const currentWorld = worldState || computeWorldState(currentStore);

  const activeThemeId = (currentStore.learnerProfile?.worldTheme as WorldThemeId) || 'cosmos';
  const themeConfig = getThemeConfig(activeThemeId);
  const tierInfo = getThemeTierInfo(activeThemeId, currentWorld.totalMasteryPercent);
  const streak = calculateStreak(currentStore.attempts);

  const completeBuildings = currentWorld.buildings.filter((b) => b.state === 'complete').length;
  const totalAttempts = currentStore.attempts?.length || 0;
  const soloAttempts = currentStore.attempts?.filter((a) => a.isSolo && !a.isVoid).length || 0;
  const soloSessions = Math.max(0, Math.floor(soloAttempts / 6));

  // Dynamic Resource Calculation based on Learning Milestones
  const wood = Math.floor(currentWorld.totalMasteryPercent * 14 + totalAttempts * 3);
  const stone = Math.floor(currentWorld.totalMasteryPercent * 9 + soloAttempts * 6);
  const crystal = Math.floor(completeBuildings * 50 + currentWorld.tier * 30);
  const gold = Math.floor(streak * 35 + currentWorld.totalMasteryPercent * 12 + soloSessions * 80);

  const passportId = currentStore.activeGraphId ? currentStore.activeGraphId.substring(0, 10).toUpperCase() : 'XP-CORE-01';

  return (
    <div className="min-h-screen select-none font-sans text-white pb-24 -mx-4 -mt-4 sm:-mx-6 sm:-mt-6">
      
      {/* =================================================================== */}
      {/* TOP HALF (CHARACTER & WORLD THEME BANNER) */}
      {/* =================================================================== */}
      <section
        className="relative min-h-[44vh] sm:min-h-[48vh] flex flex-col items-center justify-between p-4 pt-6 overflow-hidden"
        style={{
          background: `radial-gradient(circle at 50% 30%, ${themeConfig.bgGradients[0]} 0%, #080512 85%)`,
        }}
      >
        {/* Floating Particle Stars */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute top-10 left-12 w-2 h-2 rounded-full bg-[#00F0FF] animate-ping" />
          <div className="absolute top-24 right-16 w-1.5 h-1.5 rounded-full bg-[#00FF87] animate-pulse" />
          <div className="absolute bottom-16 left-20 w-2 h-2 rounded-full bg-[#A855F7] animate-ping" />
        </div>

        {/* Top Floating Action Bar */}
        <div className="w-full max-w-xl flex items-center justify-between z-10">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 font-mono text-xs font-bold text-white shadow-lg">
            <span>{themeConfig.icon}</span>
            <span>{themeConfig.name} Realm</span>
          </div>

          <button
            type="button"
            onClick={() => setIsShareOpen(true)}
            className="h-9 px-3.5 rounded-full bg-signature-gradient text-white font-mono font-bold text-xs flex items-center gap-1.5 hover:brightness-110 transition-all cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.5)]"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share World</span>
          </button>
        </div>

        {/* Centered Character Full Body Image */}
        <div className="relative my-auto flex flex-col items-center justify-center z-10 group">
          {/* Character Ambient Halo */}
          <div
            className="absolute w-44 h-44 rounded-full blur-[45px] opacity-60 pointer-events-none"
            style={{ backgroundColor: tierInfo.color }}
          />

          <img
            src={characterImgPath}
            onError={() => {
              if (characterImgPath === '/robot.png') setCharacterImgPath('/images/robot.png');
            }}
            alt="Realm Avatar"
            className="relative z-10 w-36 h-36 sm:w-44 sm:h-44 object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,0.8)] transform group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Learner Name + Title Overlay at bottom of Character */}
        <div className="w-full max-w-xl text-center space-y-1 z-10 pb-2">
          <h1 className="font-sans font-black text-2xl sm:text-3xl text-white tracking-tight drop-shadow-md">
            {currentStore.handle}
          </h1>
          <p className="font-mono text-xs text-[#00F0FF] uppercase tracking-wider font-bold">
            {currentWorld.tierName} Sovereign &middot; {currentStore.goalText}
          </p>
        </div>
      </section>

      {/* =================================================================== */}
      {/* BOTTOM HALF (ISOMETRIC WORLD RENDERER & BADGES) */}
      {/* =================================================================== */}
      <section className="p-4 sm:p-6 max-w-2xl mx-auto space-y-4 -mt-3 relative z-20">
        
        {/* Tier 2 & Terraformed Badges */}
        <div className="flex items-center justify-between gap-2 px-1">
          {/* Top-Left: Tier Badge */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#120E22]/95 border border-white/15 shadow-xl font-mono text-xs font-bold text-white">
            <span className="w-2 h-2 rounded-full bg-[#00FF87] animate-pulse" />
            <span>Tier {currentWorld.tier} &middot; {currentWorld.tierName}</span>
          </div>

          {/* Top-Right: Terraformed Badge */}
          <div
            className="px-3.5 py-1.5 rounded-full border font-mono text-xs font-bold shadow-xl"
            style={{
              backgroundColor: `${tierInfo.color}25`,
              color: tierInfo.color,
              borderColor: `${tierInfo.color}60`,
            }}
          >
            {currentWorld.totalMasteryPercent}% Terraformed
          </div>
        </div>

        {/* Isometric SVG World Viewport */}
        <div className="rounded-[24px] overflow-hidden border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
          <WorldRenderer
            theme={activeThemeId}
            buildings={currentWorld.buildings}
            height={300}
          />
        </div>

        {/* Resources Bar (Mastery-Driven) */}
        <div className="grid grid-cols-4 gap-2 pt-1">
          <div className="p-2.5 rounded-2xl bg-[#120E22]/90 border border-white/10 text-center shadow-md">
            <span className="text-base block">🪵</span>
            <span className="font-mono text-[9px] uppercase text-slate-400 font-bold block">Wood</span>
            <span className="font-mono font-bold text-xs text-amber-300">{wood}</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-[#120E22]/90 border border-white/10 text-center shadow-md">
            <span className="text-base block">🪨</span>
            <span className="font-mono text-[9px] uppercase text-slate-400 font-bold block">Stone</span>
            <span className="font-mono font-bold text-xs text-slate-200">{stone}</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-[#120E22]/90 border border-white/10 text-center shadow-md">
            <span className="text-base block">🔮</span>
            <span className="font-mono text-[9px] uppercase text-slate-400 font-bold block">Crystal</span>
            <span className="font-mono font-bold text-xs text-purple-300">{crystal}</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-[#120E22]/90 border border-white/10 text-center shadow-md">
            <span className="text-base block">🪙</span>
            <span className="font-mono text-[9px] uppercase text-slate-400 font-bold block">Gold</span>
            <span className="font-mono font-bold text-xs text-yellow-300">{gold}</span>
          </div>
        </div>

        {/* Concept Buildings Matrix */}
        <div className="bg-[#120E22]/90 border border-white/10 rounded-[22px] p-4 sm:p-5 space-y-3 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <span className="font-mono text-[10px] uppercase text-[#00F0FF] font-bold tracking-wider">
              REALM LANDMARKS ({currentWorld.buildings.length})
            </span>
            <span className="font-mono text-xs text-slate-400">
              {completeBuildings} Completed
            </span>
          </div>

          <div className="space-y-2">
            {currentWorld.buildings.map((bldg) => {
              const isComplete = bldg.state === 'complete';
              const isPartial = bldg.state === 'partial';

              return (
                <div
                  key={bldg.buildingId}
                  className="p-3 rounded-xl bg-panel/70 border border-white/10 flex items-center justify-between gap-3 hover:border-[#00F0FF]/40 transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: isComplete ? '#00FF87' : isPartial ? '#00F0FF' : '#64748B',
                      }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-sans font-bold text-xs text-white truncate">
                          {bldg.buildingName}
                        </span>
                        <span className="font-mono text-[8px] px-1.5 py-0.2 rounded bg-white/5 text-slate-300 border border-white/10 uppercase">
                          {bldg.state}
                        </span>
                      </div>
                      <span className="font-sans text-[11px] text-slate-400 block truncate">
                        {bldg.conceptName}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/quest?concept=${encodeURIComponent(bldg.conceptId)}`}
                    className="px-2.5 py-1 rounded-lg bg-[#00F0FF]/15 hover:bg-[#00F0FF]/30 border border-[#00F0FF]/40 text-[#00F0FF] font-mono text-[10px] font-bold transition-colors cursor-pointer shrink-0"
                  >
                    Drill &rarr;
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

      </section>

      {/* Share Modal Dialog */}
      <WorldShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        learnerName={currentStore.handle}
        goalText={currentStore.goalText}
        masteryPercentage={currentWorld.totalMasteryPercent}
        passportId={passportId}
        buildingsCount={completeBuildings}
        themeId={activeThemeId}
      />

    </div>
  );
}
