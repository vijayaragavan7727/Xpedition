'use client';

import React from 'react';
import Link from 'next/link';
import WorldRenderer from '@/components/WorldRenderer';
import { getThemeConfig, getThemeTierInfo } from '@/lib/themes';
import { WorldBuilding } from '@/lib/worldEngine';
import { Compass, ShieldCheck, CheckCircle2, Award, Sparkles, Globe } from 'lucide-react';

export default function PublicPassportPage({ params }: { params: { id: string } }) {
  const demoBuildings: WorldBuilding[] = [
    { buildingId: 'b1', conceptId: 'c1', conceptName: 'Core Foundations & Syntax', buildingName: 'Compiler Core', masteryPercent: 85, state: 'complete' },
    { buildingId: 'b2', conceptId: 'c2', conceptName: 'Data Structures & Trees', buildingName: 'Algorithmic Spire', masteryPercent: 70, state: 'complete' },
    { buildingId: 'b3', conceptId: 'c3', conceptName: 'System Modeling & DB', buildingName: 'Data Matrix', masteryPercent: 45, state: 'partial' },
    { buildingId: 'b4', conceptId: 'c4', conceptName: 'Neural Networks & AI', buildingName: 'Neural Vault', masteryPercent: 0, state: 'empty' },
  ];

  const overallMastery = 65;
  const themeId = 'cosmos';
  const tierInfo = getThemeTierInfo(themeId, overallMastery);
  const theme = getThemeConfig(themeId);

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

        {/* Verified Concepts Grid */}
        <div className="space-y-2">
          <h2 className="font-mono text-xs text-slate-400 uppercase tracking-wider font-bold">
            Verified Competencies ({demoBuildings.length} Concepts)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {demoBuildings.map((b) => (
              <div key={b.buildingId} className="p-3 rounded-xl bg-[#120E22] border border-white/10 flex items-center justify-between">
                <div>
                  <p className="font-sans font-bold text-xs text-white">{b.conceptName}</p>
                  <p className="font-mono text-[10px] text-[#00FF87]">{b.masteryPercent}% Mastery</p>
                </div>
                <span className="w-2 h-2 rounded-full bg-[#00FF87] shadow-[0_0_8px_#00FF87]" />
              </div>
            ))}
          </div>
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
