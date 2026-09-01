'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { IsometricBuildingData } from './IsometricBuilding';
import { soundFx } from '@/lib/soundEngine';
import { X, ShieldCheck, AlertTriangle, Play, ChevronRight, Sparkles } from 'lucide-react';

interface SpiresDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  buildings: IsometricBuildingData[];
  onSelectBuilding: (b: IsometricBuildingData) => void;
}

export const SpiresDrawerModal: React.FC<SpiresDrawerModalProps> = ({
  isOpen,
  onClose,
  buildings,
  onSelectBuilding,
}) => {
  const router = useRouter();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-lg bg-[#0F0B21] border-t sm:border border-white/15 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-[0_0_50px_rgba(0,240,255,0.2)] flex flex-col max-h-[80vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#00F0FF] to-[#A855F7] flex items-center justify-center text-black font-black">
              📜
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">Base Defense Sectors</h3>
              <p className="text-xs text-[#00F0FF]/80 font-mono">All course concept spires in this base</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List of Spires */}
        <div className="flex-1 overflow-y-auto space-y-2.5 py-4 pr-1">
          {buildings.map((b) => {
            const isDecaying = (b.retentionRisk || 0) > 0.35;

            return (
              <div
                key={b.id}
                onClick={() => {
                  soundFx.playTick();
                  onSelectBuilding(b);
                  onClose();
                }}
                className={`p-3.5 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer ${
                  isDecaying
                    ? 'bg-red-950/30 border-red-500/40 hover:border-red-500'
                    : 'bg-[#150F2C]/80 border-white/10 hover:border-[#00F0FF]/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono text-xs font-black ${
                      b.type === 'core'
                        ? 'bg-[#A855F7]/30 text-[#A855F7] border border-[#A855F7]/40'
                        : isDecaying
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40'
                    }`}
                  >
                    Lv.{b.level}
                  </div>

                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>{b.name}</span>
                      {isDecaying && (
                        <span className="px-1.5 py-0.2 rounded bg-red-500 text-white text-[8px] font-mono font-bold animate-pulse">
                          SIEGE
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                      Mastery: <span className="text-[#00FF87]">{b.masteryPercent}%</span>
                    </div>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
