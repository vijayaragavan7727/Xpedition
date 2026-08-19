"use client";

import { X, Zap, HelpCircle, CheckCircle2, TrendingUp } from "lucide-react";
import { TARGET_BAND } from "@/lib/flowController";

interface FlowExplanationModalProps {
  flowDifficulty: number;
  pKnow: number;
  explanation: string;
  onClose: () => void;
}

export default function FlowExplanationModal({
  flowDifficulty,
  pKnow,
  explanation,
  onClose,
}: FlowExplanationModalProps) {
  const masteryPercent = Math.round(pKnow * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#1B1B3A] border border-[#22D3EE]/40 rounded-3xl p-6 sm:p-8 shadow-2xl glow-box-cyan">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <div className="flex items-center gap-2 text-[#22D3EE] font-mono text-xs font-bold">
            <Zap className="w-4 h-4 text-[#FBBF24]" />
            <span>FLOW ALGORITHMIC INSIGHT</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Flow Level & Mastery Stats */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-[#0A0A1A] p-4 rounded-2xl border border-white/10 text-center">
            <span className="text-[10px] text-[#94A3B8] font-mono uppercase block mb-1">
              Active Challenge
            </span>
            <span className="text-xl font-black text-white font-heading">
              Level {flowDifficulty}
            </span>
          </div>

          <div className="bg-[#0A0A1A] p-4 rounded-2xl border border-white/10 text-center">
            <span className="text-[10px] text-[#94A3B8] font-mono uppercase block mb-1">
              Estimated Mastery P(know)
            </span>
            <span className="text-xl font-black text-[#22D3EE] font-mono">
              {masteryPercent}%
            </span>
          </div>
        </div>

        {/* Target Success Band Bar */}
        <div className="bg-[#0A0A1A] p-4 rounded-2xl border border-white/10 space-y-2 mb-5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Target Flow Zone</span>
            <span className="text-[#34D399] font-bold">70% - 85% Success</span>
          </div>
          <div className="w-full h-3 bg-[#1B1B3A] rounded-full overflow-hidden border border-white/10 relative">
            {/* 70%-85% Optimal Band Highlight */}
            <div className="absolute top-0 bottom-0 left-[70%] right-[15%] bg-[#34D399]/40 border-x border-[#34D399]" />
            {/* Current Mastery Marker */}
            <div
              className="h-full bg-[#22D3EE] rounded-full transition-all duration-500 shadow-md shadow-[#22D3EE]/30"
              style={{ width: `${masteryPercent}%` }}
            />
          </div>
        </div>

        {/* Explanation Card */}
        <div className="bg-[#7C3AED]/20 border border-[#7C3AED]/40 rounded-2xl p-4 space-y-2 mb-6">
          <div className="flex items-center gap-2 text-xs font-bold text-[#22D3EE] font-heading">
            <TrendingUp className="w-4 h-4" />
            <span>Why this difficulty level?</span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed">
            {explanation || `Difficulty calibrated to Level ${flowDifficulty}. BKT estimates your mastery probability at ${masteryPercent}%, maintaining an optimal cognitive flow.`}
          </p>
        </div>

        {/* Got It Button */}
        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#22D3EE] hover:opacity-95 text-white font-bold text-sm transition-all shadow-lg shadow-[#7C3AED]/30 cursor-pointer font-heading"
        >
          Got It
        </button>
      </div>
    </div>
  );
}
