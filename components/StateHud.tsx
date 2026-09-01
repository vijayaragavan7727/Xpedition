'use client';

import React, { useState } from 'react';
import { FlowState } from '@/lib/store';

interface StateHudProps {
  flowState: FlowState;
  hesitationSeconds: number;
  timeOnItemSeconds?: number;
  retryCount: number;
  hintCount: number;
  tabSwitchCount?: number;
  latencyBaselineSeconds?: number; // e.g. 14.2s
  abilityTheta?: number; // e.g. +0.45
  nextDifficultyB?: number; // e.g. +0.50
  targetSuccessRate?: number; // e.g. 75%
  whySignals?: string[];
}

export const StateHud: React.FC<StateHudProps> = ({
  flowState = 'flow',
  hesitationSeconds = 0,
  timeOnItemSeconds = 0,
  retryCount = 0,
  hintCount = 0,
  tabSwitchCount = 0,
  latencyBaselineSeconds = 14.2,
  abilityTheta = 0.45,
  nextDifficultyB = 0.50,
  targetSuccessRate = 75,
  whySignals = ['Steady response latency', 'High accuracy trend', 'No scaffolding needed'],
}) => {
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(true);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const getFlowStateBadge = (state: FlowState) => {
    switch (state) {
      case 'flow':
        return {
          label: 'FLOW BAND',
          colorClass: 'bg-success/15 border-success/40 text-success shadow-[0_0_12px_rgba(52,229,196,0.2)]',
        };
      case 'frustrated':
        return {
          label: 'HIGH FRICTION',
          colorClass: 'bg-danger/15 border-danger/40 text-danger shadow-[0_0_12px_rgba(255,77,109,0.2)]',
        };
      case 'bored':
        return {
          label: 'LOW ENGAGEMENT',
          colorClass: 'bg-amber-400/15 border-amber-400/40 text-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.2)]',
        };
      case 'drifting':
        return {
          label: 'DRIFTING',
          colorClass: 'bg-amber-400/15 border-amber-400/40 text-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.2)]',
        };
      default:
        return {
          label: 'CALIBRATING',
          colorClass: 'bg-muted/15 border-muted/40 text-muted',
        };
    }
  };

  const badge = getFlowStateBadge(flowState);

  return (
    <aside className="w-full lg:w-[280px] bg-[#120E22]/90 border border-line rounded-[16px] overflow-hidden backdrop-blur-xl transition-all">
      {/* Mobile Header Row (Collapsible Toggle) */}
      <button
        type="button"
        onClick={() => setIsOpenMobile(!isOpenMobile)}
        className="w-full p-3.5 flex items-center justify-between bg-panel border-b border-line/60 lg:cursor-default"
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] tracking-eyebrow uppercase text-muted font-bold">
            STATE ENGINE
          </span>
          <span
            className={`font-mono text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase transition-all duration-300 motion-reduce:transition-none ${badge.colorClass}`}
          >
            {badge.label}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="font-mono text-xs font-semibold text-cyan">
            {targetSuccessRate}% target
          </span>
          <span className="lg:hidden text-muted text-xs">
            {isOpenMobile ? '▲' : '▼'}
          </span>
        </div>
      </button>

      {/* Main HUD Body */}
      <div className={`${isOpenMobile ? 'block' : 'hidden lg:block'} p-4 space-y-3.5`}>
        {/* Row 1: Hesitation & Time-on-Item */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-raised p-2.5 rounded-[10px] space-y-0.5">
            <span className="block font-mono text-[9px] uppercase text-muted">HESITATION</span>
            <span className="block font-mono text-sm font-bold text-cyan animate-pulse">
              {formatTime(hesitationSeconds)}
            </span>
          </div>

          <div className="bg-raised p-2.5 rounded-[10px] space-y-0.5">
            <span className="block font-mono text-[9px] uppercase text-muted">TIME ON ITEM</span>
            <span className="block font-mono text-sm font-bold text-text">
              {formatTime(timeOnItemSeconds || hesitationSeconds)}
            </span>
          </div>
        </div>

        {/* Row 2: Retries, Hints, Tab Switches */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-raised p-2 rounded-[8px] text-center space-y-0.5">
            <span className="block font-mono text-[8px] uppercase text-muted">RETRIES</span>
            <span className="block font-mono text-xs font-bold text-text">{retryCount}</span>
          </div>

          <div className="bg-raised p-2 rounded-[8px] text-center space-y-0.5">
            <span className="block font-mono text-[8px] uppercase text-muted">HINTS</span>
            <span className="block font-mono text-xs font-bold text-violet">{hintCount}</span>
          </div>

          <div className="bg-raised p-2 rounded-[8px] text-center space-y-0.5">
            <span className="block font-mono text-[8px] uppercase text-muted">SWITCHES</span>
            <span className="block font-mono text-xs font-bold text-muted">{tabSwitchCount}</span>
          </div>
        </div>

        {/* Row 3: Latency Baseline & Ability Parameters */}
        <div className="bg-raised/70 p-2.5 rounded-[10px] space-y-1.5 border border-line/40">
          <div className="flex justify-between font-mono text-[10px]">
            <span className="text-muted">LATENCY BASELINE</span>
            <span className="text-text font-bold">{latencyBaselineSeconds}s</span>
          </div>
          <div className="flex justify-between font-mono text-[10px]">
            <span className="text-muted">ABILITY (θ) / DIFF (b)</span>
            <span className="text-cyan font-bold">
              θ={abilityTheta >= 0 ? `+${abilityTheta}` : abilityTheta} / b={nextDifficultyB >= 0 ? `+${nextDifficultyB}` : nextDifficultyB}
            </span>
          </div>
        </div>

        {/* Row 4: Target Success Meter */}
        <div className="space-y-1">
          <div className="flex justify-between font-mono text-[10px]">
            <span className="text-muted uppercase">TARGET SUCCESS RATE</span>
            <span className="text-cyan font-bold">{targetSuccessRate}%</span>
          </div>
          <div className="h-2 w-full bg-raised rounded-full overflow-hidden p-0.5 border border-line/40">
            <div
              className="h-full bg-signature-gradient rounded-full transition-all duration-300"
              style={{ width: `${targetSuccessRate}%` }}
            />
          </div>
        </div>

        {/* Row 5: "Why" Telemetry Signal List */}
        <div className="space-y-1.5 pt-2 border-t border-line/40">
          <span className="font-mono text-[10px] tracking-eyebrow uppercase text-muted font-bold block">
            TELEMETRY SIGNALS
          </span>
          <ul className="space-y-1">
            {whySignals.map((signal, idx) => (
              <li key={idx} className="flex items-center gap-2 font-sans text-xs text-text/90">
                <span className="text-cyan text-[10px]">◆</span>
                <span className="leading-snug">{signal}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
};
