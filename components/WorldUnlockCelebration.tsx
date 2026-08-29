'use client';

import React, { useEffect, useState } from 'react';
import { WorldBuilding } from '@/lib/worldEngine';
import { WorldThemeId } from '@/lib/themes';
import WorldRenderer from './WorldRenderer';
import { Sparkles, Trophy, CheckCircle2 } from 'lucide-react';

interface WorldUnlockCelebrationProps {
  unlockedBuilding: WorldBuilding | null;
  allBuildings: WorldBuilding[];
  theme?: WorldThemeId | string;
  onDismiss: () => void;
}

export default function WorldUnlockCelebration({
  unlockedBuilding,
  allBuildings,
  theme = 'cosmos',
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
          text: 'Your world just grew. Keep going.',
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
    <div
      onClick={() => {
        setVisible(false);
        onDismiss();
      }}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4 select-none cursor-pointer animate-fadeIn font-sans"
    >
      <div className="max-w-md w-full text-center space-y-5 animate-scaleUp p-6 rounded-[28px] bg-[#120D28] border border-[#00F0FF]/50 shadow-[0_0_60px_rgba(0,240,255,0.4)]">
        
        {/* Celebration Header */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00FF87]/20 border border-[#00FF87]/50 text-[#00FF87] font-mono text-xs font-bold animate-bounce">
            <Trophy className="w-4 h-4" />
            <span>WORLD EXPANSION</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white font-heading tracking-tight">
            {unlockedBuilding.buildingName} Unlocked!
          </h2>

          <p className="font-sans text-xs text-cyan font-medium">
            {unlockedBuilding.conceptName} &middot; {unlockedBuilding.state === 'complete' ? 'Fully Constructed' : 'Foundation Built'}
          </p>
        </div>

        {/* Scaled Isometric World Preview */}
        <div className="rounded-2xl overflow-hidden border border-white/15 shadow-xl">
          <WorldRenderer
            theme={theme}
            buildings={allBuildings}
            height={160}
            isMiniPreview
          />
        </div>

        {/* XYRA Message */}
        <div className="p-3.5 rounded-2xl bg-black/50 border border-white/10 text-xs text-slate-200 font-sans italic">
          &ldquo;Your world just grew. Keep going.&rdquo; &mdash; <span className="text-[#00F0FF] font-mono font-bold">XYRA</span>
        </div>

        <span className="font-mono text-[10px] text-slate-400 block">
          Tap anywhere to continue
        </span>
      </div>
    </div>
  );
}
