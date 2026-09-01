'use client';

import React from 'react';
import Link from 'next/link';
import { Trophy, AlertOctagon, Sparkles, RefreshCw, ArrowRight, ShieldCheck, Home } from 'lucide-react';

interface SurvivorOutcomeModalProps {
  isVictory: boolean;
  waveReached: number;
  totalWaves: number;
  score: number;
  goldEarned: number;
  crystalsEarned: number;
  onRetry: () => void;
  onBackToBase: () => void;
}

export const SurvivorOutcomeModal: React.FC<SurvivorOutcomeModalProps> = ({
  isVictory,
  waveReached,
  totalWaves,
  score,
  goldEarned,
  crystalsEarned,
  onRetry,
  onBackToBase,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-[#0F0B21] border border-white/15 rounded-3xl p-6 sm:p-7 shadow-[0_0_60px_rgba(0,240,255,0.2)] flex flex-col items-center text-center gap-5">
        
        {/* Banner Icon */}
        <div
          className={`w-20 h-20 rounded-3xl flex items-center justify-center border shadow-2xl ${
            isVictory
              ? 'bg-gradient-to-tr from-amber-500/20 to-[#00FF87]/30 border-[#00FF87]/50 shadow-[0_0_30px_rgba(0,255,135,0.4)]'
              : 'bg-gradient-to-tr from-red-500/20 to-purple-500/20 border-red-500/50 shadow-[0_0_30px_rgba(255,46,99,0.4)]'
          }`}
        >
          {isVictory ? (
            <Trophy className="w-10 h-10 text-[#00FF87] animate-bounce" />
          ) : (
            <AlertOctagon className="w-10 h-10 text-red-400" />
          )}
        </div>

        {/* Outcome Title & Subtitle */}
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            {isVictory ? 'BASE DEFENDED!' : 'SHIELDS BREACHED'}
          </h2>
          <p className="text-xs text-slate-300 mt-1 font-mono">
            {isVictory
              ? `Victory! All ${totalWaves} survivor waves cleared.`
              : `Eliminated at Wave ${waveReached} of ${totalWaves}. Memory decay destabilized the sector.`}
          </p>
        </div>

        {/* Rewards / Stats Box */}
        <div className="w-full bg-[#120D28] border border-white/10 rounded-2xl p-4 grid grid-cols-3 gap-2">
          {/* Waves */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-mono text-slate-400">WAVES</span>
            <span className="text-sm font-black text-white mt-0.5">
              {waveReached}/{totalWaves}
            </span>
          </div>

          {/* Gold */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-mono text-slate-400">GOLD GAINED</span>
            <span className="text-sm font-black text-amber-300 mt-0.5">
              +🪙 {goldEarned}
            </span>
          </div>

          {/* Crystals */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-mono text-slate-400">CRYSTALS</span>
            <span className="text-sm font-black text-cyan-300 mt-0.5">
              +💎 {crystalsEarned}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5 pt-2">
          <button
            onClick={onRetry}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#00F0FF] via-[#A855F7] to-[#F472F6] text-black font-black text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(0,240,255,0.4)] hover:opacity-95 transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Play Again</span>
          </button>

          <button
            onClick={onBackToBase}
            className="w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4 text-slate-400" />
            <span>Return to Learning Base</span>
          </button>
        </div>

      </div>
    </div>
  );
};
