'use client';

import React, { useEffect, useState } from 'react';
import { WorldBuilding } from '@/lib/worldEngine';
import { Sparkles, Trophy, CheckCircle2 } from 'lucide-react';

interface WorldUnlockCelebrationProps {
  unlockedBuilding: WorldBuilding | null;
  allBuildings?: WorldBuilding[];
  theme?: string;
  onDismiss: () => void;
}

export default function WorldUnlockCelebration({
  unlockedBuilding,
  onDismiss,
}: WorldUnlockCelebrationProps) {
  const [visible, setVisible] = useState<boolean>(false);

  useEffect(() => {
    if (!unlockedBuilding) {
      setVisible(false);
      return;
    }

    setVisible(true);

    // Speak celebration voice via XYRA
    try {
      fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Your 3D world just evolved. Keep building.',
          language: 'english',
          speaker: 'ratan',
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data?.audioBase64) {
            const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
            audio.play().catch(() => {});
          }
        })
        .catch(() => {});
    } catch (e) {}

    // Auto-dismiss after 2.8 seconds
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, 2800);

    return () => clearTimeout(timer);
  }, [unlockedBuilding, onDismiss]);

  if (!visible || !unlockedBuilding) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn select-none">
      <div className="w-full max-w-sm bg-[#120E22] border border-[#00F0FF]/40 rounded-[24px] p-6 text-center space-y-4 shadow-[0_0_50px_rgba(0,240,255,0.4)] relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-[40px] pointer-events-none opacity-40 bg-[#00FF87]" />

        {/* Celebration Icon */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-[#00F0FF] to-[#00FF87] flex items-center justify-center text-3xl shadow-lg animate-bounce">
          🏛️
        </div>

        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00FF87]/20 border border-[#00FF87]/40 text-[#00FF87] font-mono text-[11px] font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>NEW 3D STRUCTURE CONSTRUCTED</span>
          </div>
          <h3 className="font-sans font-black text-xl text-white">
            {unlockedBuilding.buildingName || unlockedBuilding.conceptName || 'Domain Structure'}
          </h3>
          <p className="font-mono text-xs text-slate-300">
            {unlockedBuilding.conceptName} Mastered!
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setVisible(false);
            onDismiss();
          }}
          className="w-full h-11 rounded-xl bg-signature-gradient text-white font-mono font-bold text-xs flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-lg"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Enter 3D Realm</span>
        </button>
      </div>
    </div>
  );
}
