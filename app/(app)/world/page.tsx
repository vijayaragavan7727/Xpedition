'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { calculateStreak } from '@/lib/store';
import { useWorldState } from '@/lib/hooks/world';
import { getThemeConfig, getThemeTierInfo, WorldThemeId } from '@/lib/themes';
import WorldRenderer from '@/components/WorldRenderer';
import WorldShareModal from '@/components/WorldShareModal';
import { Globe, Share2, Sparkles, Maximize2, X, ZoomIn, ZoomOut, RotateCcw, ChevronRight, Shield, Zap } from 'lucide-react';

export default function WorldPage() {
  const { storeData, worldState, isLoading } = useWorldState();
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [characterImgPath, setCharacterImgPath] = useState<string>('/robot.png');

  if (!storeData || !worldState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080512] font-mono text-xs text-[#00F0FF]">
        Loading living realm...
      </div>
    );
  }

  const activeThemeId = (storeData.learnerProfile?.worldTheme as WorldThemeId) || 'cosmos';
  const themeConfig = getThemeConfig(activeThemeId);
  const tierInfo = getThemeTierInfo(activeThemeId, worldState.totalMasteryPercent);
  const streak = calculateStreak(storeData.attempts);

  const completeBuildings = worldState.buildings.filter((b) => b.state === 'complete').length;
  const totalAttempts = storeData.attempts?.length || 0;
  const soloAttempts = storeData.attempts?.filter((a) => a.isSolo && !a.isVoid).length || 0;
  const soloSessions = Math.max(0, Math.floor(soloAttempts / 6));

  // Dynamic Resource Calculation based on Learning Milestones
  const wood = Math.floor(worldState.totalMasteryPercent * 14 + totalAttempts * 3);
  const stone = Math.floor(worldState.totalMasteryPercent * 9 + soloAttempts * 6);
  const crystal = Math.floor(completeBuildings * 50 + worldState.tier * 30);
  const gold = Math.floor(streak * 35 + worldState.totalMasteryPercent * 12 + soloSessions * 80);

  const passportId = storeData.activeGraphId ? storeData.activeGraphId.substring(0, 10).toUpperCase() : 'XP-CORE-01';

  return (
    <div className="min-h-screen select-none font-sans text-white pb-24 -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 bg-[#080512]">
      
      {/* =================================================================== */}
      {/* 1. TOP SECTION (38vh): CHARACTER FULL BODY & THEME GRADIENT */}
      {/* =================================================================== */}
      <section
        className="relative h-[38vh] min-h-[250px] flex flex-col items-center justify-between p-3.5 pt-4 overflow-hidden"
        style={{
          background: `radial-gradient(circle at 50% 30%, ${themeConfig.bgGradients[0]} 0%, #080512 85%)`,
        }}
      >
        {/* Floating Particle Stars */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute top-8 left-10 w-2 h-2 rounded-full bg-[#00F0FF] animate-ping" />
          <div className="absolute top-16 right-12 w-1.5 h-1.5 rounded-full bg-[#00FF87] animate-pulse" />
          <div className="absolute bottom-10 left-14 w-2 h-2 rounded-full bg-[#A855F7] animate-ping" />
        </div>

        {/* Top Header Bar: [theme badge] [Share World] */}
        <div className="w-full max-w-xl flex items-center justify-between z-10">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 font-mono text-[11px] font-bold text-white shadow-lg">
            <span>{themeConfig.icon}</span>
            <span>{themeConfig.name} Realm</span>
          </div>

          <button
            type="button"
            onClick={() => setIsShareOpen(true)}
            className="h-7 px-3 rounded-full bg-signature-gradient text-white font-mono font-bold text-[11px] flex items-center gap-1.5 hover:brightness-110 transition-all cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.5)]"
          >
            <Share2 className="w-3 h-3" />
            <span>Share World</span>
          </button>
        </div>

        {/* Character Full Body Centered */}
        <div className="relative my-auto flex flex-col items-center justify-center z-10 group">
          <div
            className="absolute w-32 h-32 rounded-full blur-[35px] opacity-60 pointer-events-none"
            style={{ backgroundColor: tierInfo.color }}
          />

          <img
            src={characterImgPath}
            onError={() => {
              if (characterImgPath === '/robot.png') setCharacterImgPath('/images/robot.png');
            }}
            alt="Character"
            className="relative z-10 w-28 h-28 sm:w-36 sm:h-36 object-contain drop-shadow-[0_12px_20px_rgba(0,0,0,0.85)] transform group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Learner Name + Title below Character */}
        <div className="w-full max-w-xl text-center space-y-0.5 z-10 pb-1">
          <h1 className="font-sans font-black text-xl sm:text-2xl text-white tracking-tight drop-shadow-md">
            {storeData.handle}
          </h1>
          <p className="font-mono text-[11px] text-[#00F0FF] uppercase tracking-wider font-bold">
            {worldState.tierName} Sovereign &middot; {storeData.goalText}
          </p>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 2. WORLD SECTION (62vh): ISOMETRIC WORLD RENDERER & RESOURCES */}
      {/* =================================================================== */}
      <section className="min-h-[62vh] p-3.5 sm:p-5 max-w-2xl mx-auto space-y-3.5">
        
        {/* Tier Badges & Full Screen Action Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#120E22] border border-white/15 shadow-md font-mono text-xs font-bold text-white">
              <span className="w-2 h-2 rounded-full bg-[#00FF87] animate-pulse" />
              <span>Tier {worldState.tier} &middot; {worldState.tierName}</span>
            </div>

            <div
              className="px-2.5 py-1 rounded-full border font-mono text-xs font-bold shadow-md"
              style={{
                backgroundColor: `${tierInfo.color}25`,
                color: tierInfo.color,
                borderColor: `${tierInfo.color}60`,
              }}
            >
              {worldState.totalMasteryPercent}% Terraformed
            </div>
          </div>

          {/* ⛶ Full Screen Button (Top Right of World Panel) */}
          <button
            type="button"
            onClick={() => setIsFullScreen(true)}
            className="h-8 px-3 rounded-xl bg-raised hover:bg-black/90 border border-line hover:border-[#00F0FF]/60 text-slate-300 hover:text-white font-mono text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
          >
            <Maximize2 className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span>⛶ Full Screen</span>
          </button>
        </div>

        {/* Isometric SVG World Viewport (Fills width and height) */}
        <div className="relative rounded-[24px] overflow-hidden border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.8)] h-[320px] sm:h-[350px]">
          <WorldRenderer
            theme={activeThemeId}
            buildings={worldState.buildings}
            height="100%"
          />
        </div>

        {/* Resources Row (Wood, Stone, Crystal, Gold) */}
        <div className="grid grid-cols-4 gap-2">
          {/* Wood */}
          <div className="p-2 rounded-xl bg-[#120E22]/90 border border-white/10 text-center shadow-md">
            <span className="text-sm block">🪵</span>
            <span className="font-mono text-[8px] uppercase text-slate-400 font-bold block">Wood</span>
            <span className="font-mono font-bold text-xs text-amber-300">{wood}</span>
          </div>

          {/* Stone */}
          <div className="p-2 rounded-xl bg-[#120E22]/90 border border-white/10 text-center shadow-md">
            <span className="text-sm block">🪨</span>
            <span className="font-mono text-[8px] uppercase text-slate-400 font-bold block">Stone</span>
            <span className="font-mono font-bold text-xs text-slate-200">{stone}</span>
          </div>

          {/* Crystal */}
          <div className="p-2 rounded-xl bg-[#120E22]/90 border border-white/10 text-center shadow-md">
            <span className="text-sm block">🔮</span>
            <span className="font-mono text-[8px] uppercase text-slate-400 font-bold block">Crystal</span>
            <span className="font-mono font-bold text-xs text-purple-300">{crystal}</span>
          </div>

          {/* Gold */}
          <div className="p-2 rounded-xl bg-[#120E22]/90 border border-white/10 text-center shadow-md">
            <span className="text-sm block">🪙</span>
            <span className="font-mono text-[8px] uppercase text-slate-400 font-bold block">Gold</span>
            <span className="font-mono font-bold text-xs text-yellow-300">{gold}</span>
          </div>
        </div>

        {/* Concept Landmarks Practice Links */}
        <div className="bg-[#120E22]/90 border border-white/10 rounded-[22px] p-4 sm:p-5 space-y-2.5 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="font-mono text-[10px] uppercase text-[#00F0FF] font-bold tracking-wider">
              REALM LANDMARKS ({worldState.buildings.length})
            </span>
            <span className="font-mono text-xs text-slate-400">
              {completeBuildings} Completed
            </span>
          </div>

          <div className="space-y-2">
            {worldState.buildings.map((bldg) => {
              const isComplete = bldg.state === 'complete';
              const isPartial = bldg.state === 'partial';

              return (
                <div
                  key={bldg.buildingId}
                  className="p-2.5 rounded-xl bg-panel/70 border border-white/10 flex items-center justify-between gap-3 hover:border-[#00F0FF]/40 transition-all"
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
      {/* 3. FULL SCREEN VIEWPORT OVERLAY (100vh 100vw, CHARACTER HIDDEN) */}
      {/* =================================================================== */}
      {isFullScreen && (
        <div
          className="fixed inset-0 z-50 w-screen h-screen bg-[#080512] flex flex-col animate-fadeIn select-none overflow-hidden"
          style={{ touchAction: 'manipulation' }}
        >
          {/* Top Bar Header */}
          <div className="p-3.5 sm:p-4 flex items-center justify-between border-b border-white/10 bg-black/70 backdrop-blur-md z-10 shrink-0">
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 rounded-full bg-[#120E22] border border-[#00F0FF]/40 font-mono text-xs text-[#00F0FF] font-bold flex items-center gap-1.5">
                <span>{themeConfig.icon}</span>
                <span>{themeConfig.name} Full Realm</span>
              </div>
              <span className="font-mono text-xs text-slate-400 hidden sm:inline">
                Tier {worldState.tier} &middot; {worldState.totalMasteryPercent}% Terraformed
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Zoom In/Out/Reset Controls */}
              <button
                type="button"
                onClick={() => setZoomScale((z) => Math.min(2.2, z + 0.2))}
                className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoomScale((z) => Math.max(0.7, z - 0.2))}
                className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoomScale(1)}
                className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
                title="Reset View"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Close Button Top Right */}
              <button
                type="button"
                onClick={() => setIsFullScreen(false)}
                className="w-9 h-9 rounded-full bg-[#FF0055]/25 hover:bg-[#FF0055]/50 border border-[#FF0055]/50 text-white flex items-center justify-center transition-colors cursor-pointer ml-2"
                title="Close Full Screen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Full Screen Viewport Area */}
          <div className="flex-1 w-full h-full relative flex items-center justify-center p-2 sm:p-6 overflow-hidden">
            <div
              className="w-full h-full max-w-5xl max-h-[90vh] transition-transform duration-200"
              style={{ transform: `scale(${zoomScale})` }}
            >
              <WorldRenderer
                theme={activeThemeId}
                buildings={worldState.buildings}
                height="100%"
                isFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {/* Share Modal Dialog */}
      <WorldShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        learnerName={storeData.handle}
        goalText={storeData.goalText}
        masteryPercentage={worldState.totalMasteryPercent}
        passportId={passportId}
        buildingsCount={completeBuildings}
        themeId={activeThemeId}
      />

    </div>
  );
}
