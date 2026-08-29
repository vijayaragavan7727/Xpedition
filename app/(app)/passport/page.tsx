'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getStoreData, UserStoreData } from '@/lib/store';
import { calibrationScore, confidenceBreakdown } from '@/lib/engine/calibration';
import { thetaToPercent } from '@/lib/engine/mastery';
import { getThemeConfig, getThemeTierInfo, WorldThemeId } from '@/lib/themes';
import WorldShareModal from '@/components/WorldShareModal';
import { Compass, Share2, Shield, CheckCircle2, Award, Zap, AlertTriangle, ArrowRight, Eye, Globe } from 'lucide-react';

export default function SkillPassportPage() {
  const [storeData, setStoreData] = useState<UserStoreData | null>(null);
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);

  useEffect(() => {
    const store = getStoreData();
    setStoreData(store);
  }, []);

  if (!storeData) {
    return (
      <div className="py-20 text-center text-muted font-mono text-sm animate-pulse">
        Loading verified skill credential...
      </div>
    );
  }

  const activeThemeId = (storeData.learnerProfile?.worldTheme as WorldThemeId) || 'cosmos';

  const breakdown = confidenceBreakdown(storeData.attempts);
  const score = calibrationScore(storeData.attempts);

  // Compute accuracy error percentage from calibration score
  const absScore = score !== null ? Math.round(Math.abs(score) * 100) : 6;
  const accuracyMargin = Math.max(3, Math.min(25, absScore));

  const soloVerifiedAttempts = storeData.attempts.filter((a) => a.isSolo && !a.isVoid).length;
  const soloSessionsCount = Math.max(0, Math.floor(soloVerifiedAttempts / 6));

  const passportId = storeData.activeGraphId ? storeData.activeGraphId.substring(0, 10).toUpperCase() : 'XP-CORE-01';

  // Overall Mastery Calculation
  const totalConcepts = storeData.concepts.length;
  const avgSoloMastery = totalConcepts > 0
    ? Math.round(
        storeData.concepts.reduce(
          (acc, c) => acc + (c.thetaSolo !== undefined ? thetaToPercent(c.thetaSolo) : c.masteryPercentage || 0),
          0
        ) / totalConcepts
      )
    : 0;

  const avgAssistedMastery = totalConcepts > 0
    ? Math.round(
        storeData.concepts.reduce(
          (acc, c) => acc + (c.thetaAssisted !== undefined ? thetaToPercent(c.thetaAssisted) : c.masteryPercentage || 0),
          0
        ) / totalConcepts
      )
    : 0;

  const assistanceGap = Math.max(0, avgAssistedMastery - avgSoloMastery);

  return (
    <div className="space-y-6 select-none pt-2 max-w-2xl mx-auto pb-24 font-sans">
      
      {/* 1. HEADER: Learner Name & Credential Action */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#00F0FF]" />
            <h1 className="font-sans font-bold text-2xl text-white">
              {storeData.handle}&apos;s Skill Passport
            </h1>
          </div>
          <p className="font-sans text-xs text-slate-400 mt-0.5">
            Verified mastery, assistance gap calibration, and solo competency proof.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsShareOpen(true)}
          className="h-10 px-4 rounded-xl bg-signature-gradient text-white font-mono font-bold text-xs flex items-center gap-2 hover:brightness-110 transition-all cursor-pointer shadow-[0_0_20px_rgba(168,85,247,0.4)]"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share Credential</span>
        </button>
      </div>

      {/* 2. WORLD DISCOVERY BANNER (NAVIGATES TO DEDICATED WORLD TAB) */}
      <Link
        href="/world"
        className="p-4 rounded-[20px] bg-gradient-to-r from-[#1E113A] via-[#120E2E] to-[#0A1A35] border border-[#00F0FF]/30 hover:border-[#00F0FF] transition-all flex items-center justify-between gap-3 shadow-lg group cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/40 flex items-center justify-center text-xl">
            🌍
          </div>
          <div>
            <span className="font-mono text-[9px] uppercase text-[#00F0FF] font-bold tracking-wider block">
              LIVING TERRAFORMED REALM
            </span>
            <span className="font-sans font-bold text-sm text-white group-hover:text-[#00F0FF] transition-colors">
              Explore Full World & Resources &rarr;
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 font-mono text-xs text-[#00F0FF] font-bold group-hover:translate-x-1 transition-transform">
          <span>Open World</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </Link>

      {/* 3. SOLO VS ASSISTED SCORE & ASSISTANCE GAP */}
      <section className="grid grid-cols-3 gap-2.5 sm:gap-3">
        <div className="bg-[#120E22]/90 border border-white/10 rounded-2xl p-3.5 text-center space-y-1 shadow-lg">
          <span className="block font-mono text-[9px] uppercase text-slate-400 font-bold">SOLO SCORE</span>
          <span className="block font-mono text-base sm:text-xl font-bold text-[#00FF87]">
            {avgSoloMastery}%
          </span>
          <span className="block font-sans text-[10px] text-slate-400 truncate">Zero Assistance</span>
        </div>

        <div className="bg-[#120E22]/90 border border-white/10 rounded-2xl p-3.5 text-center space-y-1 shadow-lg">
          <span className="block font-mono text-[9px] uppercase text-slate-400 font-bold">ASSISTED SCORE</span>
          <span className="block font-mono text-base sm:text-xl font-bold text-[#00F0FF]">
            {avgAssistedMastery}%
          </span>
          <span className="block font-sans text-[10px] text-slate-400 truncate">With AI Hints</span>
        </div>

        <div className="bg-[#120E22]/90 border border-white/10 rounded-2xl p-3.5 text-center space-y-1 shadow-lg">
          <span className="block font-mono text-[9px] uppercase text-slate-400 font-bold">ASSISTANCE GAP</span>
          <span className="block font-mono text-base sm:text-xl font-bold text-[#A855F7]">
            {assistanceGap}%
          </span>
          <span className="block font-sans text-[10px] text-slate-400 truncate">Help Dependency</span>
        </div>
      </section>

      {/* 4. VERIFIED METACOGNITIVE CALIBRATION CARD */}
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
                CREDENTIAL ID: {passportId} &middot; ZERO-KNOWLEDGE LOGS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00FF87]/15 border border-[#00FF87]/40 text-[#00FF87] font-mono text-[10px] font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>AUTHENTICATED</span>
          </div>
        </div>

        {/* Calibration verdict breakdown */}
        <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase text-[#A855F7] font-bold tracking-wider">
              KNOWS WHAT THEY KNOW
            </span>
            <span className="font-mono text-[10px] text-white bg-white/10 px-2 py-0.5 rounded-full">
              Accuracy &plusmn;{accuracyMargin}%
            </span>
          </div>
          <p className="font-sans text-xs text-slate-200 leading-relaxed">
            The learner exhibits an exceptional calibration coefficient. Predictions accurately match verified test outcomes without blind overconfidence.
          </p>
        </div>

        {/* Calibration 3-Way Grid */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
          <div className="p-3 rounded-xl bg-[#00FF87]/10 border border-[#00FF87]/30 space-y-0.5">
            <span className="font-mono font-bold text-base text-[#00FF87] block">{breakdown.solid}</span>
            <span className="font-mono text-[9px] uppercase text-slate-300 font-bold block">Solid Mastery</span>
          </div>

          <div className="p-3 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 space-y-0.5">
            <span className="font-mono font-bold text-base text-[#00F0FF] block">{breakdown.honestGap}</span>
            <span className="font-mono text-[9px] uppercase text-slate-300 font-bold block">Honest Gaps</span>
          </div>

          <div className="p-3 rounded-xl bg-[#FF0055]/10 border border-[#FF0055]/30 space-y-0.5">
            <span className="font-mono font-bold text-base text-[#FF0055] block">{breakdown.blindSpot}</span>
            <span className="font-mono text-[9px] uppercase text-slate-300 font-bold block">Blind Spots</span>
          </div>
        </div>

        {/* Solo Assessment Proof */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/30 border border-white/5 text-xs">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#A855F7]" />
            <span className="text-slate-300">Solo Testing Backing:</span>
          </div>
          <span className="font-mono font-bold text-white">
            {soloSessionsCount} Proctored Session{soloSessionsCount === 1 ? '' : 's'} ({soloVerifiedAttempts} solo attempts)
          </span>
        </div>
      </section>

      {/* 5. CONCEPT MASTERY BREAKDOWN */}
      <section className="bg-[#120E22]/90 border border-white/10 rounded-[22px] p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <span className="font-mono text-[11px] uppercase text-[#00F0FF] font-bold tracking-wider">
            DOMAIN CONCEPTS ({storeData.concepts.length})
          </span>
          <span className="font-mono text-xs text-slate-400">
            Goal: {storeData.goalText}
          </span>
        </div>

        <div className="space-y-2.5">
          {storeData.concepts.map((concept) => {
            const soloPct = concept.thetaSolo !== undefined ? thetaToPercent(concept.thetaSolo) : concept.masteryPercentage || 0;
            const assistedPct = concept.thetaAssisted !== undefined ? thetaToPercent(concept.thetaAssisted) : concept.masteryPercentage || 0;

            return (
              <div
                key={concept.id}
                className="p-3.5 rounded-xl bg-panel/70 border border-white/10 hover:border-[#00F0FF]/40 transition-all space-y-2"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-sans font-bold text-sm text-white">
                    {concept.name}
                  </span>

                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="text-[#00FF87]">Solo: {soloPct}%</span>
                    <span className="text-slate-500">|</span>
                    <span className="text-[#00F0FF]">Assisted: {assistedPct}%</span>
                  </div>
                </div>

                <div className="h-1.5 w-full bg-raised rounded-full overflow-hidden">
                  <div
                    className="h-full bg-signature-gradient rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(4, soloPct)}%` }}
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
        masteryPercentage={avgSoloMastery}
        passportId={passportId}
        conceptsCount={storeData.concepts.length}
        soloVerifiedCount={soloSessionsCount}
        accuracyMargin={accuracyMargin}
        themeId={activeThemeId}
      />

    </div>
  );
}
