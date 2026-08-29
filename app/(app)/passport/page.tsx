'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getStoreData, UserStoreData } from '@/lib/store';
import { calibrationScore, confidenceBreakdown } from '@/lib/engine/calibration';
import { thetaToPercent } from '@/lib/engine/mastery';
import { getThemeConfig, getThemeTierInfo, WorldThemeId } from '@/lib/themes';
import { computeWorldState, syncWorldState, WorldState, WorldBuilding } from '@/lib/worldEngine';
import WorldRenderer from '@/components/WorldRenderer';
import WorldShareModal from '@/components/WorldShareModal';
import { Sparkles, Share2, Shield, CheckCircle2, Award, Zap, Compass, Globe, Info } from 'lucide-react';

export default function SkillPassportPage() {
  const [storeData, setStoreData] = useState<UserStoreData | null>(null);
  const [worldState, setWorldState] = useState<WorldState | null>(null);
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);

  useEffect(() => {
    const store = getStoreData();
    setStoreData(store);
    const world = computeWorldState(store);
    setWorldState(world);
    syncWorldState(store);
  }, []);

  if (!storeData || !worldState) {
    return (
      <div className="py-16 text-center text-muted font-mono text-sm animate-pulse">
        Terraforming Skill World & Passport...
      </div>
    );
  }

  const activeThemeId = (storeData.learnerProfile?.worldTheme as WorldThemeId) || 'cosmos';
  const themeConfig = getThemeConfig(activeThemeId);
  const tierInfo = getThemeTierInfo(activeThemeId, worldState.totalMasteryPercent);

  const breakdown = confidenceBreakdown(storeData.attempts);
  const score = calibrationScore(storeData.attempts);

  // Compute accuracy error percentage from calibration score
  const absScore = score !== null ? Math.round(Math.abs(score) * 100) : 6;
  const accuracyMargin = Math.max(3, Math.min(25, absScore));

  const soloVerifiedAttempts = storeData.attempts.filter((a) => a.isSolo && !a.isVoid).length;
  const soloSessionsCount = Math.max(0, Math.floor(soloVerifiedAttempts / 6));

  const passportId = storeData.activeGraphId ? storeData.activeGraphId.substring(0, 10).toUpperCase() : 'XP-CORE-01';

  return (
    <div className="space-y-6 select-none pt-2 max-w-2xl mx-auto pb-16 font-sans">
      
      {/* 1. HEADER: Learner Name & Share Button */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#00F0FF]" />
            <h1 className="font-sans font-bold text-2xl text-white">
              {storeData.handle}&apos;s Skill World
            </h1>
          </div>
          <p className="font-sans text-xs text-slate-400 mt-0.5">
            Learning-driven isometric world terraformed by your concept mastery.
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

      {/* 2. ISOMETRIC SVG WORLD RENDERER VIEWPORT */}
      <section className="space-y-2.5">
        <WorldRenderer
          theme={activeThemeId}
          buildings={worldState.buildings}
          height={280}
        />

        {/* Tier & Terraformed Level Banner */}
        <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-[#120E24] border border-white/10 shadow-lg">
          <div className="flex items-center gap-2 font-mono text-xs text-white font-bold">
            <span className="text-base">{themeConfig.icon}</span>
            <span>Tier {worldState.tier} &middot; {worldState.tierName}</span>
          </div>

          <span
            className="font-mono text-xs font-bold px-3 py-1 rounded-full border"
            style={{
              backgroundColor: `${tierInfo.color}20`,
              color: tierInfo.color,
              borderColor: `${tierInfo.color}40`,
            }}
          >
            {worldState.totalMasteryPercent}% Terraformed
          </span>
        </div>
      </section>

      {/* 3. VERIFIED METACOGNITIVE & MASTERY STATS */}
      <section className="grid grid-cols-3 gap-2.5 sm:gap-3">
        <div className="bg-[#120E22]/90 border border-white/10 rounded-2xl p-3.5 text-center space-y-1 shadow-lg">
          <span className="block font-mono text-[9px] uppercase text-slate-400 font-bold">BUILDINGS BUILT</span>
          <span className="block font-mono text-base sm:text-lg font-bold text-[#00FF87]">
            {worldState.buildings.filter((b) => b.state === 'complete').length} / {worldState.buildings.length}
          </span>
          <span className="block font-sans text-[10px] text-slate-400 truncate">Constructed</span>
        </div>

        <div className="bg-[#120E22]/90 border border-white/10 rounded-2xl p-3.5 text-center space-y-1 shadow-lg">
          <span className="block font-mono text-[9px] uppercase text-slate-400 font-bold">TERRAFORM LEVEL</span>
          <span className="block font-mono text-base sm:text-lg font-bold text-[#00F0FF]">
            {worldState.totalMasteryPercent}%
          </span>
          <span className="block font-sans text-[10px] text-slate-400 truncate">Overall Competence</span>
        </div>

        <div className="bg-[#120E22]/90 border border-white/10 rounded-2xl p-3.5 text-center space-y-1 shadow-lg">
          <span className="block font-mono text-[9px] uppercase text-slate-400 font-bold">CALIBRATION</span>
          <span className="block font-mono text-base sm:text-lg font-bold text-[#A855F7]">
            &plusmn;{accuracyMargin}%
          </span>
          <span className="block font-sans text-[10px] text-slate-400 truncate">Confidence Error</span>
        </div>
      </section>

      {/* 4. VERIFIED METACOGNITIVE PASSPORT CARD */}
      <section className="p-5 sm:p-6 rounded-[22px] bg-[#120E22]/90 border border-[#00F0FF]/30 space-y-4 shadow-xl backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#00F0FF]/20 border border-[#00F0FF] flex items-center justify-center font-mono font-bold text-xs text-[#00F0FF]">
              XP
            </div>
            <div>
              <h3 className="font-sans font-bold text-sm text-white">
                Metacognitive Verification Seal
              </h3>
              <span className="font-mono text-[9px] text-[#00F0FF] uppercase tracking-wider block">
                AUTHENTICATED LEARNING CREDENTIAL &middot; ID: {passportId}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00FF87]/15 border border-[#00FF87]/40 text-[#00FF87] font-mono text-[10px] font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>VERIFIED</span>
          </div>
        </div>

        {/* Metacognitive Calibration Summary */}
        <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase text-[#A855F7] font-bold">
              KNOWS WHAT THEY KNOW
            </span>
            <span className="font-mono text-[10px] text-slate-400">
              {breakdown.totalWithConfidence} Items Assessed
            </span>
          </div>
          <p className="font-sans text-xs text-slate-200 leading-relaxed">
            Calibration accuracy margin: <strong>&plusmn;{accuracyMargin}%</strong>. The learner is aware of their competence boundaries ({breakdown.solid} solid mastery items, {breakdown.honestGap} self-identified gaps, {breakdown.blindSpot} blind spots).
          </p>
        </div>

        {/* Solo Assessments Backing */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5 text-xs">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#A855F7]" />
            <span className="text-slate-300">Solo Assessment Proof:</span>
          </div>
          <span className="font-mono font-bold text-white">
            {soloSessionsCount} Verified Session{soloSessionsCount === 1 ? '' : 's'} ({soloVerifiedAttempts} solo attempts)
          </span>
        </div>
      </section>

      {/* 5. CONCEPT TO BUILDING MATRIX */}
      <section className="bg-[#120E22]/90 border border-white/10 rounded-[22px] p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <span className="font-mono text-[11px] uppercase text-[#00F0FF] font-bold tracking-wider">
            WORLD BUILDINGS & LANDMARKS ({worldState.buildings.length})
          </span>
          <span className="font-mono text-xs text-slate-400">
            Goal: {storeData.goalText}
          </span>
        </div>

        <div className="space-y-2.5">
          {worldState.buildings.map((bldg) => {
            const isComplete = bldg.state === 'complete';
            const isPartial = bldg.state === 'partial';

            return (
              <div
                key={bldg.buildingId}
                className="p-3.5 rounded-xl bg-panel/70 border border-white/10 hover:border-[#00F0FF]/50 transition-all space-y-2"
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

                  <span className="font-mono text-xs font-bold text-white">
                    {bldg.masteryPercent}%
                  </span>
                </div>

                <div className="h-1.5 w-full bg-raised rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${bldg.masteryPercent}%`,
                      backgroundColor: isComplete ? '#00FF87' : isPartial ? '#00F0FF' : '#64748B',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Navigation Return Button */}
      <div className="pt-2">
        <Link
          href="/home"
          className="w-full h-12 rounded-2xl bg-signature-gradient text-white font-sans font-semibold text-xs flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-lg cursor-pointer"
        >
          <span>&larr; Back to Dashboard</span>
        </Link>
      </div>

      {/* Share Modal Dialog */}
      <WorldShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        learnerName={storeData.handle}
        goalText={storeData.goalText}
        masteryPercentage={worldState.totalMasteryPercent}
        passportId={passportId}
        conceptsCount={worldState.buildings.length}
        soloVerifiedCount={soloSessionsCount}
        accuracyMargin={accuracyMargin}
        themeId={activeThemeId}
      />

    </div>
  );
}
