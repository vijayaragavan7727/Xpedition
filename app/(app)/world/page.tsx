'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useWorldState } from '@/lib/hooks/world';
import { getThemeConfig, WorldThemeId } from '@/lib/themes';
import WorldShareModal from '@/components/WorldShareModal';

const World3D = dynamic(() => import('@/components/World3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[300px] flex items-center justify-center bg-[#080512] font-mono text-xs text-[#00F0FF] rounded-[24px] border border-white/10">
      Initializing 3D Realm...
    </div>
  ),
});
import {
  Share2,
  Sparkles,
  Maximize2,
  X,
  ChevronRight,
  Shield,
  Zap,
  Target,
  Flame,
  TrendingUp,
  Award,
  Compass,
} from 'lucide-react';

export default function WorldPage() {
  const { storeData, worldState, isLoading } = useWorldState();
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [characterImgPath, setCharacterImgPath] = useState<string>('/robot.png');

  if (!storeData || !worldState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080512] font-mono text-xs text-[#00F0FF]">
        Loading living 3D world...
      </div>
    );
  }

  const activeThemeId = (storeData.learnerProfile?.worldTheme as WorldThemeId) || 'cosmos';
  const themeConfig = getThemeConfig(activeThemeId);
  const lps = worldState.lps;
  const resources = worldState.resources;
  const missions = worldState.activeMissions || [];

  // LPS Color Progression: 0-20 grey -> 21-40 green -> 41-60 blue -> 61-80 purple -> 81-100 gold
  const getLPSColor = (score: number) => {
    if (score <= 20) return '#64748B';
    if (score <= 40) return '#22C55E';
    if (score <= 60) return '#00F0FF';
    if (score <= 80) return '#A855F7';
    return '#F59E0B';
  };

  const lpsColor = getLPSColor(lps.score);
  const passportId = storeData.activeGraphId ? storeData.activeGraphId.substring(0, 10).toUpperCase() : 'XP-CORE-01';

  return (
    <div className="min-h-screen select-none font-sans text-white pb-24 -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 bg-[#080512]">
      
      {/* =================================================================== */}
      {/* 1. TOP SECTION (30vh): CHARACTER, LEARNER IDENTITY & LPS PROGRESS */}
      {/* =================================================================== */}
      <section
        className="relative min-h-[30vh] flex flex-col justify-between p-4 pt-4 overflow-hidden border-b border-white/10"
        style={{
          background: `radial-gradient(circle at 50% 20%, ${themeConfig.bgGradients[0]} 0%, #080512 85%)`,
        }}
      >
        {/* Header Bar */}
        <div className="w-full max-w-2xl mx-auto flex items-center justify-between z-10">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 font-mono text-[11px] font-bold text-white shadow-lg">
            <span>{themeConfig.icon}</span>
            <span>{themeConfig.name} Realm</span>
          </div>

          <button
            type="button"
            onClick={() => setIsShareOpen(true)}
            className="h-7 px-3 rounded-full bg-signature-gradient text-white font-mono font-bold text-[11px] flex items-center gap-1.5 hover:brightness-110 transition-all cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.4)]"
          >
            <Share2 className="w-3 h-3" />
            <span>Share World</span>
          </button>
        </div>

        {/* Character & Learner Info Row */}
        <div className="w-full max-w-2xl mx-auto flex items-center gap-4 z-10 my-auto py-2">
          {/* Avatar Graphic */}
          <div className="relative shrink-0">
            <div
              className="absolute inset-0 rounded-full blur-[25px] opacity-70 pointer-events-none"
              style={{ backgroundColor: lpsColor }}
            />
            <img
              src={characterImgPath}
              onError={() => {
                if (characterImgPath === '/robot.png') setCharacterImgPath('/images/robot.png');
              }}
              alt="Character"
              className="relative z-10 w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-[0_10px_18px_rgba(0,0,0,0.85)]"
            />
          </div>

          {/* Learner Name & LPS Summary */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <h1 className="font-sans font-black text-xl sm:text-2xl text-white tracking-tight truncate">
                {storeData.handle}
              </h1>
              <span
                className="font-mono text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 border"
                style={{
                  backgroundColor: `${lpsColor}20`,
                  color: lpsColor,
                  borderColor: `${lpsColor}50`,
                }}
              >
                {lps.profile} &middot; Tier {lps.tier}
              </span>
            </div>

            <p className="font-mono text-[11px] text-slate-300">
              {lps.tierName} Sovereign &middot; LPS Score{' '}
              <span className="font-bold font-sans" style={{ color: lpsColor }}>
                {lps.score}/100
              </span>
            </p>

            {/* LPS Colored Score Progress Bar (0-100) */}
            <div className="h-2 w-full bg-raised/90 rounded-full overflow-hidden border border-white/15">
              <div
                className="h-full rounded-full transition-all duration-700 shadow-md"
                style={{
                  width: `${lps.score}%`,
                  backgroundColor: lpsColor,
                  boxShadow: `0 0 10px ${lpsColor}`,
                }}
              />
            </div>

            {/* Breakdown Metric Chips */}
            <div className="flex items-center gap-2 pt-0.5 text-[9px] font-mono text-slate-400 overflow-x-auto no-scrollbar">
              <span className="shrink-0">Accuracy: {lps.breakdown.accuracy}/30</span>
              <span>&bull;</span>
              <span className="shrink-0">Consistency: {lps.breakdown.consistency}/25</span>
              <span>&bull;</span>
              <span className="shrink-0">Improvement: {lps.breakdown.improvement}/20</span>
              <span>&bull;</span>
              <span className="shrink-0">Depth: {lps.breakdown.depth}/10</span>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 2. THREE.JS 3D WORLD SECTION (45vh): LOW-POLY INTERACTIVE WORLD */}
      {/* =================================================================== */}
      <section className="h-[45vh] min-h-[340px] p-3.5 sm:p-5 max-w-3xl mx-auto flex flex-col space-y-2">
        {/* District & Fullscreen Bar */}
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00FF87] animate-pulse" />
            <span className="font-mono text-xs font-bold text-slate-200">
              3D REALM &middot; {worldState.unlockedAreas.length} Districts Unlocked
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsFullScreen(true)}
            className="h-7 px-3 rounded-xl bg-raised hover:bg-black/90 border border-line hover:border-[#00F0FF]/60 text-slate-300 hover:text-white font-mono text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-md"
          >
            <Maximize2 className="w-3 h-3 text-[#00F0FF]" />
            <span>Full Screen</span>
          </button>
        </div>

        {/* 3D World Stage */}
        <div className="flex-1 w-full relative rounded-[24px] overflow-hidden">
          <World3D
            buildings={worldState.buildings3D}
            tier={lps.tier}
            environment={worldState.environment}
            theme={activeThemeId}
          />
        </div>
      </section>

      {/* =================================================================== */}
      {/* 3. ACTIVE MISSIONS SECTION (25vh): WEAKEST CONCEPT QUESTS */}
      {/* =================================================================== */}
      <section className="min-h-[25vh] p-3.5 sm:p-5 max-w-3xl mx-auto space-y-3 pt-2">
        {/* Section Header & Resources Bar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-1.5">
            <Target className="w-4 h-4 text-[#00F0FF]" />
            <span className="font-mono text-xs uppercase text-[#00F0FF] font-bold tracking-wider">
              ACTIVE MISSIONS ({missions.length})
            </span>
          </div>

          {/* Resources Mini Strip */}
          <div className="flex items-center gap-3 text-[11px] font-mono font-bold text-slate-300">
            <span>🪵 {resources.wood}</span>
            <span>🪨 {resources.stone}</span>
            <span>🔮 {resources.crystal}</span>
            <span>🪙 {resources.gold}</span>
          </div>
        </div>

        {/* 3 Mission Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {missions.map((mission) => (
            <div
              key={mission.id}
              className="p-3.5 rounded-2xl bg-[#120E22]/90 border border-white/10 hover:border-[#00F0FF]/40 transition-all flex flex-col justify-between space-y-3 shadow-lg"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-white/10 text-cyan-300 font-bold uppercase">
                    {mission.buildingType}
                  </span>
                  <span className="font-mono text-[10px] text-amber-400 font-bold">
                    {mission.currentMastery}% &rarr; {mission.targetMastery}%
                  </span>
                </div>

                <h3 className="font-sans font-bold text-xs text-white leading-tight">
                  {mission.title}
                </h3>
                <p className="font-sans text-[11px] text-slate-400 leading-snug">
                  {mission.description}
                </p>
              </div>

              <div className="space-y-2 pt-1 border-t border-white/5">
                {/* Rewards Strip */}
                <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
                  <span>+🪵{mission.reward.wood}</span>
                  <span>+🪨{mission.reward.stone}</span>
                  <span>+🔮{mission.reward.crystal}</span>
                  <span>+🪙{mission.reward.gold}</span>
                </div>

                <Link
                  href={mission.actionUrl}
                  className="w-full h-8 rounded-xl bg-[#00F0FF]/15 hover:bg-[#00F0FF]/30 border border-[#00F0FF]/50 text-[#00F0FF] font-mono text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <span>Go Learn</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =================================================================== */}
      {/* 4. FULL SCREEN 3D VIEWPORT OVERLAY (100vh 100vw) */}
      {/* =================================================================== */}
      {isFullScreen && (
        <div className="fixed inset-0 z-50 w-screen h-screen bg-[#080512] flex flex-col animate-fadeIn select-none">
          {/* Header */}
          <div className="p-3.5 sm:p-4 flex items-center justify-between border-b border-white/10 bg-black/70 backdrop-blur-md z-10 shrink-0">
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 rounded-full bg-[#120E22] border border-[#00F0FF]/40 font-mono text-xs text-[#00F0FF] font-bold flex items-center gap-1.5">
                <span>{themeConfig.icon}</span>
                <span>{themeConfig.name} Full 3D Realm</span>
              </div>
              <span className="font-mono text-xs text-slate-400 hidden sm:inline">
                {lps.tierName} &middot; LPS {lps.score}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsFullScreen(false)}
              className="w-9 h-9 rounded-full bg-[#FF0055]/25 hover:bg-[#FF0055]/50 border border-[#FF0055]/50 text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Close Full Screen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Full Canvas */}
          <div className="flex-1 w-full h-full relative">
            <World3D
              buildings={worldState.buildings3D}
              tier={lps.tier}
              environment={worldState.environment}
              theme={activeThemeId}
            />
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
        buildingsCount={worldState.buildings3D.filter((b) => b.stage !== 'empty').length}
        themeId={activeThemeId}
      />

    </div>
  );
}
