'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getStoreData, UserStoreData } from '@/lib/store';
import { calibrationScore, confidenceBreakdown } from '@/lib/engine/calibration';
import { thetaToPercent } from '@/lib/engine/mastery';
import WorldBiomeCanvas, { getWorldTier } from '@/components/WorldBiomeCanvas';
import WorldShareModal from '@/components/WorldShareModal';
import { Sparkles, Share2, Shield, CheckCircle2, Award, Zap, Compass, ChevronRight, Lock, Flame } from 'lucide-react';

export default function SkillPassportPage() {
  const [storeData, setStoreData] = useState<UserStoreData | null>(null);
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);
  const [selectedBiome, setSelectedBiome] = useState<string | null>(null);

  useEffect(() => {
    setStoreData(getStoreData());
  }, []);

  if (!storeData) {
    return (
      <div className="py-16 text-center text-muted font-mono text-sm animate-pulse">
        Generating Skill World & Passport...
      </div>
    );
  }

  const breakdown = confidenceBreakdown(storeData.attempts);
  const score = calibrationScore(storeData.attempts);

  // Compute accuracy error percentage from calibration score
  const absScore = score !== null ? Math.round(Math.abs(score) * 100) : 6;
  const accuracyMargin = Math.max(3, Math.min(25, absScore));

  // Compute overall world mastery percentage
  const totalConcepts = storeData.concepts.length;
  const overallMastery = totalConcepts > 0
    ? Math.round(
        storeData.concepts.reduce((sum, c) => {
          const pct = c.thetaAssisted !== undefined ? thetaToPercent(c.thetaAssisted) : c.masteryPercentage;
          return sum + pct;
        }, 0) / totalConcepts
      )
    : 0;

  const tierInfo = getWorldTier(overallMastery);

  // Map concepts to landmarks
  const conceptLandmarks = storeData.concepts.map((c) => ({
    id: c.id,
    name: c.name,
    masteryPercentage: c.thetaAssisted !== undefined ? thetaToPercent(c.thetaAssisted) : c.masteryPercentage,
    isSoloVerified: (c.soloAttemptsCount || 0) >= 3,
  }));

  const soloVerifiedAttempts = storeData.attempts.filter((a) => a.isSolo && !a.isVoid).length;
  const soloSessionsCount = Math.max(0, Math.floor(soloVerifiedAttempts / 6));

  const passportId = storeData.activeGraphId ? storeData.activeGraphId.substring(0, 10).toUpperCase() : 'XP-CORE-01';

  return (
    <div className="space-y-6 select-none pt-2 max-w-2xl mx-auto pb-16 font-sans">
      
      {/* Page Title & Share Trigger */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#00F0FF]" />
            <h1 className="font-sans font-bold text-2xl text-white">
              {storeData.handle}&apos;s Skill World
            </h1>
          </div>
          <p className="font-sans text-xs text-slate-400 mt-0.5">
            Verified living knowledge cosmos terraformed by your mastery & metacognitive calibration.
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

      {/* 1. LIVING WORLD VIEWPORT */}
      <section className="space-y-2">
        <WorldBiomeCanvas
          masteryPercentage={overallMastery}
          goalText={storeData.goalText}
          learnerName={storeData.handle}
          concepts={conceptLandmarks}
        />
      </section>

      {/* 2. WORLD TERRAFORM STATS STRIP */}
      <section className="grid grid-cols-3 gap-2.5 sm:gap-3">
        <div className="bg-[#120E22]/90 border border-white/10 rounded-2xl p-3.5 text-center space-y-1 shadow-lg">
          <span className="block font-mono text-[9px] uppercase text-slate-400 font-bold">WORLD TIER</span>
          <span className="block font-mono text-base sm:text-lg font-bold" style={{ color: tierInfo.color }}>
            Tier {tierInfo.tier}
          </span>
          <span className="block font-sans text-[10px] text-slate-400 truncate">{tierInfo.name}</span>
        </div>

        <div className="bg-[#120E22]/90 border border-white/10 rounded-2xl p-3.5 text-center space-y-1 shadow-lg">
          <span className="block font-mono text-[9px] uppercase text-slate-400 font-bold">TERRAFORM LEVEL</span>
          <span className="block font-mono text-base sm:text-lg font-bold text-[#00FF87]">
            {overallMastery}%
          </span>
          <span className="block font-sans text-[10px] text-slate-400 truncate">Total Competence</span>
        </div>

        <div className="bg-[#120E22]/90 border border-white/10 rounded-2xl p-3.5 text-center space-y-1 shadow-lg">
          <span className="block font-mono text-[9px] uppercase text-slate-400 font-bold">CALIBRATION</span>
          <span className="block font-mono text-base sm:text-lg font-bold text-[#00F0FF]">
            &plusmn;{accuracyMargin}%
          </span>
          <span className="block font-sans text-[10px] text-slate-400 truncate">Confidence Error</span>
        </div>
      </section>

      {/* 3. VERIFIED METACOGNITIVE PASSPORT CARD */}
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

        {/* Calibration Line */}
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

      {/* 4. BIOME LANDMARKS (CONCEPT UNLOCKS) */}
      <section className="bg-[#120E22]/90 border border-white/10 rounded-[22px] p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <span className="font-mono text-[11px] uppercase text-[#00F0FF] font-bold tracking-wider">
            TERRAFORMED BIOME LANDMARKS ({storeData.concepts.length})
          </span>
          <span className="font-mono text-xs text-slate-400">
            Goal: {storeData.goalText}
          </span>
        </div>

        <div className="space-y-2.5">
          {storeData.concepts.map((concept, idx) => {
            const hasSoloData = (concept.soloAttemptsCount || 0) >= 3 && concept.thetaSolo !== undefined;
            const assistedPct = concept.thetaAssisted !== undefined ? thetaToPercent(concept.thetaAssisted) : concept.masteryPercentage;
            const soloPct = hasSoloData ? thetaToPercent(concept.thetaSolo!) : null;

            const isHigh = assistedPct >= 70;
            const isMid = assistedPct >= 35;
            const landmarkType = isHigh
              ? 'Radiant Spire'
              : isMid
              ? 'Flourishing Sanctuary'
              : 'Primordial Seedling';

            return (
              <div
                key={concept.id}
                className="p-3.5 rounded-xl bg-panel/70 border border-white/10 hover:border-[#00F0FF]/50 transition-all space-y-2"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: isHigh ? '#00FF87' : isMid ? '#00F0FF' : '#A855F7',
                      }}
                    />
                    <span className="font-sans font-bold text-sm text-white truncate">
                      {concept.name}
                    </span>
                    <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10 shrink-0">
                      {landmarkType}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-xs">
                    <span className="text-slate-400">
                      Assisted: <strong className="text-[#00F0FF]">{assistedPct}%</strong>
                    </span>
                    <span className="text-slate-600">&middot;</span>
                    <span className="text-slate-400">
                      Solo: <strong className={hasSoloData ? 'text-[#A855F7]' : 'text-slate-600'}>
                        {soloPct !== null ? `${soloPct}%` : 'Pending'}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Biome Progress Bar */}
                <div className="h-1.5 w-full bg-raised rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${assistedPct}%`,
                      backgroundColor: isHigh ? '#00FF87' : isMid ? '#00F0FF' : '#A855F7',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. WORLD EVOLUTION TIMELINE */}
      <section className="bg-[#120E22]/90 border border-white/10 rounded-[22px] p-5 sm:p-6 space-y-4 shadow-xl">
        <span className="font-mono text-[11px] uppercase text-[#00F0FF] font-bold tracking-wider block">
          WORLD EVOLUTION MILESTONES
        </span>

        <div className="space-y-3">
          {[
            { tier: 1, name: 'The Awakening Core', min: 0, desc: 'Primordial obsidian rock with neon core.' },
            { tier: 2, name: 'Verdant Biosphere', min: 20, desc: 'Bioluminescent flora, crystal springs & monoliths.' },
            { tier: 3, name: 'Syntropy Archipelago', min: 40, desc: 'Crystalline sky islands with energy bridges.' },
            { tier: 4, name: 'Nebula Sanctuary', min: 60, desc: 'Planetary rings, floating temples & guardian drones.' },
            { tier: 5, name: 'The Celestial Utopia', min: 80, desc: 'Ascended cosmos star-world with celestial crowns.' },
          ].map((m) => {
            const isUnlocked = overallMastery >= m.min;
            const isCurrent = tierInfo.tier === m.tier;

            return (
              <div
                key={m.tier}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                  isCurrent
                    ? 'bg-[#00F0FF]/15 border-[#00F0FF] text-white shadow-md'
                    : isUnlocked
                    ? 'bg-black/40 border-white/10 text-slate-300'
                    : 'bg-black/20 border-white/5 text-slate-500 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold ${
                      isCurrent
                        ? 'bg-[#00F0FF] text-black shadow-[0_0_10px_rgba(0,240,255,0.6)]'
                        : isUnlocked
                        ? 'bg-[#00FF87]/20 text-[#00FF87] border border-[#00FF87]/40'
                        : 'bg-white/5 text-slate-600 border border-white/10'
                    }`}
                  >
                    {isUnlocked ? '✓' : m.tier}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-sans font-bold text-xs text-white">
                        Tier {m.tier}: {m.name}
                      </span>
                      {isCurrent && (
                        <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-[#00F0FF]/20 text-[#00F0FF] uppercase font-bold">
                          CURRENT
                        </span>
                      )}
                    </div>
                    <p className="font-sans text-[11px] text-slate-400 mt-0.5">{m.desc}</p>
                  </div>
                </div>

                <span className="font-mono text-xs font-bold shrink-0">
                  {m.min}%+
                </span>
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
        masteryPercentage={overallMastery}
        passportId={passportId}
        conceptsCount={storeData.concepts.length}
        soloVerifiedCount={soloSessionsCount}
        accuracyMargin={accuracyMargin}
      />

    </div>
  );
}
