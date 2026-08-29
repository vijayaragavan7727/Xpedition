'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getStoreData, calculateStreak, UserStoreData } from '@/lib/store';
import { computeWorldState, syncWorldState, WorldState, WorldBuilding } from '@/lib/worldEngine';
import { getThemeConfig, getThemeTierInfo, WorldThemeId } from '@/lib/themes';
import WorldRenderer from '@/components/WorldRenderer';
import WorldShareModal from '@/components/WorldShareModal';
import { Globe, Share2, Sparkles, Maximize2, X, ZoomIn, ZoomOut, RotateCcw, ChevronRight, Shield, Zap } from 'lucide-react';

export default function WorldPage() {
  const [storeData, setStoreData] = useState<UserStoreData | null>(null);
  const [worldState, setWorldState] = useState<WorldState | null>(null);
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [characterImgPath, setCharacterImgPath] = useState<string>('/robot.png');

  useEffect(() => {
    const store = getStoreData();
    setStoreData(store);
    const world = computeWorldState(store);
    setWorldState(world);
    syncWorldState(store);
  }, []);

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
    <div className="min-h-screen select-none font-sans text-white pb-24 -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 bg-[#080512]">
      
      {/* =================================================================== */}
      {/* 1. TOP SECTION (40vh): CHARACTER FULL BODY & THEME GRADIENT */}
      {/* =================================================================== */}
      <section
        className="relative min-h-[40vh] flex flex-col items-center justify-between p-4 pt-5 overflow-hidden"
        style={{
          background: `radial-gradient(circle at 50% 30%, ${themeConfig.bgGradients[0]} 0%, #080512 85%)`,
        }}
      >
        {/* Floating Particle Stars */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute top-10 left-12 w-2 h-2 rounded-full bg-[#00F0FF] animate-ping" />
          <div className="absolute top-20 right-14 w-1.5 h-1.5 rounded-full bg-[#00FF87] animate-pulse" />
          <div className="absolute bottom-12 left-16 w-2 h-2 rounded-full bg-[#A855F7] animate-ping" />
        </div>

        {/* Top Header Bar: [theme badge] [Share World] */}
        <div className="w-full max-w-xl flex items-center justify-between z-10">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 font-mono text-xs font-bold text-white shadow-lg">
            <span>{themeConfig.icon}</span>
            <span>{themeConfig.name} Realm</span>
          </div>

          <button
            type="button"
            onClick={() => setIsShareOpen(true)}
            className="h-8 px-3.5 rounded-full bg-signature-gradient text-white font-mono font-bold text-xs flex items-center gap-1.5 hover:brightness-110 transition-all cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.5)]"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share World</span>
          </button>
        </div>

        {/* Character Full Body Centered */}
        <div className="relative my-auto flex flex-col items-center justify-center z-10 group">
          <div
            className="absolute w-36 h-36 rounded-full blur-[40px] opacity-60 pointer-events-none"
            style={{ backgroundColor: tierInfo.color }}
          />

          <img
            src={characterImgPath}
            onError={() => {
              if (characterImgPath === '/robot.png') setCharacterImgPath('/images/robot.png');
            }}
            alt="Character"
            className="relative z-10 w-32 h-32 sm:w-40 sm:h-40 object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,0.85)] transform group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Learner Name + Title below Character */}
        <div className="w-full max-w-xl text-center space-y-0.5 z-10 pb-2">
          <h1 className="font-sans font-black text-2xl sm:text-3xl text-white tracking-tight drop-shadow-md">
            {currentStore.handle}
          </h1>
          <p className="font-mono text-xs text-[#00F0FF] uppercase tracking-wider font-bold">
            {currentWorld.tierName} Sovereign &middot; {currentStore.goalText}
          </p>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 2. MIDDLE BAR: TIER & TERRAFORMED PROGRESS */}
      {/* =================================================================== */}
      <section className="px-4 sm:px-6 max-w-2xl mx-auto pt-2">
        <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-[#120E22]/90 border border-white/10 shadow-lg">
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-white">
            <span className="w-2 h-2 rounded-full bg-[#00FF87] animate-pulse" />
            <span>Tier {currentWorld.tier} &middot; {currentWorld.tierName}</span>
          </div>

          <div
            className="px-3 py-1 rounded-full border font-mono text-xs font-bold shadow-md"
            style={{
              backgroundColor: `${tierInfo.color}25`,
              color: tierInfo.color,
              borderColor: `${tierInfo.color}60`,
            }}
          >
            {currentWorld.totalMasteryPercent}% Terraformed
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 3. ISOMETRIC WORLD (40vh) WITH FULL SCREEN BUTTON */}
      {/* =================================================================== */}
      <section className="p-4 sm:p-6 max-w-2xl mx-auto space-y-2.5">
        <div className="relative rounded-[24px] overflow-hidden border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
          <WorldRenderer
            theme={activeThemeId}
            buildings={currentWorld.buildings}
            height={290}
          />
        </div>

        {/* ⛶ Full Screen Button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setIsFullScreen(true)}
            className="h-8 px-3 rounded-xl bg-black/60 hover:bg-black/90 border border-white/15 hover:border-[#00F0FF]/60 text-slate-300 hover:text-white font-mono text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
          >
            <Maximize2 className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span>⛶ Full Screen</span>
          </button>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 4. RESOURCES SECTION (20vh) */}
      {/* =================================================================== */}
      <section className="px-4 sm:px-6 max-w-2xl mx-auto space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="font-mono text-[10px] uppercase text-slate-400 font-bold tracking-wider">
            TERRAFORMING RESOURCES (MASTERY-EARNED)
          </span>
          <span className="font-mono text-[10px] text-[#00FF87]">Auto-Harvested</span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {/* Wood */}
          <div className="p-2.5 rounded-2xl bg-[#120E22]/90 border border-white/10 text-center shadow-md">
            <span className="text-base block">🪵</span>
            <span className="font-mono text-[9px] uppercase text-slate-400 font-bold block">Wood</span>
            <span className="font-mono font-bold text-xs text-amber-300">{wood}</span>
          </div>

          {/* Stone */}
          <div className="p-2.5 rounded-2xl bg-[#120E22]/90 border border-white/10 text-center shadow-md">
            <span className="text-base block">🪨</span>
            <span className="font-mono text-[9px] uppercase text-slate-400 font-bold block">Stone</span>
            <span className="font-mono font-bold text-xs text-slate-200">{stone}</span>
          </div>

          {/* Crystal */}
          <div className="p-2.5 rounded-2xl bg-[#120E22]/90 border border-white/10 text-center shadow-md">
            <span className="text-base block">🔮</span>
            <span className="font-mono text-[9px] uppercase text-slate-400 font-bold block">Crystal</span>
            <span className="font-mono font-bold text-xs text-purple-300">{crystal}</span>
          </div>

          {/* Gold */}
          <div className="p-2.5 rounded-2xl bg-[#120E22]/90 border border-white/10 text-center shadow-md">
            <span className="text-base block">🪙</span>
            <span className="font-mono text-[9px] uppercase text-slate-400 font-bold block">Gold</span>
            <span className="font-mono font-bold text-xs text-yellow-300">{gold}</span>
          </div>
        </div>

        {/* Concept Buildings Landmark Matrix */}
        <div className="bg-[#120E22]/90 border border-white/10 rounded-[22px] p-4 sm:p-5 space-y-3 shadow-xl mt-3">
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

      {/* =================================================================== */}
      {/* 5. FULL SCREEN WORLD VIEWPORT OVERLAY */}
      {/* =================================================================== */}
      {isFullScreen && (
        <div className="fixed inset-0 z-50 bg-[#080512] flex flex-col animate-fadeIn select-none">
          {/* Full Screen Top Controls */}
          <div className="p-4 flex items-center justify-between border-b border-white/10 bg-black/60 backdrop-blur-md z-10">
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 rounded-full bg-[#120E22] border border-[#00F0FF]/40 font-mono text-xs text-[#00F0FF] font-bold">
                {themeConfig.name} Full World
              </div>
              <span className="font-mono text-xs text-slate-400">
                Tier {currentWorld.tier} &middot; {currentWorld.totalMasteryPercent}% Terraformed
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <button
                type="button"
                onClick={() => setZoomScale((z) => Math.min(2, z + 0.2))}
                className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoomScale((z) => Math.max(0.8, z - 0.2))}
                className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoomScale(1)}
                className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Close Full Screen */}
              <button
                type="button"
                onClick={() => setIsFullScreen(false)}
                className="w-9 h-9 rounded-full bg-[#FF0055]/20 hover:bg-[#FF0055]/40 border border-[#FF0055]/40 text-white flex items-center justify-center transition-colors cursor-pointer ml-2"
                title="Exit Full Screen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Full-Screen Isometric Stage */}
          <div className="flex-1 overflow-hidden relative flex items-center justify-center p-4">
            <div
              className="w-full h-full max-w-4xl max-h-[85vh] transition-transform duration-200"
              style={{ transform: `scale(${zoomScale})` }}
            >
              <WorldRenderer
                theme={activeThemeId}
                buildings={currentWorld.buildings}
                height="100%"
              />
            </div>
          </div>
        </div>
      )}

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
