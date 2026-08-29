'use client';

import React from 'react';
import Link from 'next/link';
import WorldBiomeCanvas, { getWorldTier } from '@/components/WorldBiomeCanvas';
import { Compass, ShieldCheck, CheckCircle2, Award, Sparkles } from 'lucide-react';

export default function PublicPassportPage({ params }: { params: { id: string } }) {
  // Public demo / verified credential view
  const demoConcepts = [
    { id: 'c1', name: 'Core Foundations & Principles', masteryPercentage: 85, isSoloVerified: true },
    { id: 'c2', name: 'Applied Problem Solving', masteryPercentage: 70, isSoloVerified: true },
    { id: 'c3', name: 'System Architecture & Modeling', masteryPercentage: 55, isSoloVerified: false },
    { id: 'c4', name: 'Optimization & Production Execution', masteryPercentage: 40, isSoloVerified: false },
  ];

  const overallMastery = 65;
  const tierInfo = getWorldTier(overallMastery);

  return (
    <div className="min-h-screen bg-[#070414] text-white p-4 sm:p-8 select-none font-sans flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#00F0FF]/20 border border-[#00F0FF] flex items-center justify-center font-mono font-bold text-sm text-[#00F0FF]">
              XP
            </div>
            <div>
              <h1 className="font-sans font-bold text-lg text-white">
                Verified Skill Passport & World
              </h1>
              <p className="font-mono text-[10px] text-[#00F0FF] uppercase tracking-wider">
                CRYPTOGRAPHIC CREDENTIAL &middot; ID: {params.id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#00FF87]/15 border border-[#00FF87]/40 text-[#00FF87] font-mono text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>AUTHENTICATED</span>
          </div>
        </div>

        {/* Living World Canvas */}
        <div className="space-y-2">
          <WorldBiomeCanvas
            masteryPercentage={overallMastery}
            goalText="Verified Skill Mastery Domain"
            learnerName="Learner Domain"
            concepts={demoConcepts}
          />
        </div>

        {/* Metacognitive & Verification Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-[#120E22]/90 border border-white/10 space-y-1">
            <span className="font-mono text-[10px] uppercase text-slate-400 font-bold">CALIBRATION VERDICT</span>
            <p className="font-sans font-bold text-sm text-white">Knows what they know (&plusmn;5% accuracy)</p>
            <p className="font-sans text-xs text-slate-400">High metacognitive precision without overconfidence.</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#120E22]/90 border border-white/10 space-y-1">
            <span className="font-mono text-[10px] uppercase text-slate-400 font-bold">SOLO VERIFICATION</span>
            <p className="font-sans font-bold text-sm text-white">Zero-Assistance Assessments</p>
            <p className="font-sans text-xs text-slate-400">Backed by authenticated weekly solo testing sessions.</p>
          </div>
        </div>

        {/* CTA */}
        <div className="pt-2 text-center">
          <Link
            href="/"
            className="inline-flex h-11 px-8 rounded-xl bg-signature-gradient text-white font-mono font-bold text-xs items-center justify-center gap-2 hover:brightness-110 shadow-xl transition-all"
          >
            <span>Start Building Your Skill World on XPedition &rarr;</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
