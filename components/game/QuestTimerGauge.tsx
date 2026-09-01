'use client';

import React, { useEffect } from 'react';
import { soundFx } from '@/lib/soundEngine';
import { Clock } from 'lucide-react';

interface QuestTimerGaugeProps {
  timeLeft: number;
  totalTime: number;
  isPaused?: boolean;
}

export const QuestTimerGauge: React.FC<QuestTimerGaugeProps> = ({
  timeLeft,
  totalTime,
  isPaused = false,
}) => {
  const percent = Math.max(0, Math.min(100, (timeLeft / totalTime) * 100));
  const isCritical = timeLeft <= 5 && timeLeft > 0;

  useEffect(() => {
    if (isCritical && !isPaused) {
      soundFx.playTick();
    }
  }, [timeLeft, isCritical, isPaused]);

  let gaugeColor = '#00F0FF';
  if (percent < 50 && percent >= 25) {
    gaugeColor = '#FFB800';
  } else if (percent < 25) {
    gaugeColor = '#FF2E63';
  }

  return (
    <div className="flex items-center gap-2 select-none">
      {/* Timer Pill */}
      <div
        className={`flex items-center gap-1.5 px-3 py-1 rounded-2xl bg-[#120E22]/90 backdrop-blur-md border transition-all duration-300 ${
          isCritical
            ? 'border-red-500 shadow-[0_0_15px_#FF2E63] animate-pulse bg-red-950/40'
            : 'border-white/15'
        }`}
      >
        <Clock className={`w-3.5 h-3.5 ${isCritical ? 'text-red-400 animate-spin' : 'text-[#00F0FF]'}`} />
        <span
          className={`font-mono text-xs font-bold ${
            isCritical ? 'text-red-400 font-black scale-110' : 'text-slate-200'
          }`}
        >
          {timeLeft}s
        </span>
      </div>

      {/* Progress Bar Gauge */}
      <div className="w-20 sm:w-28 h-2 bg-black/60 rounded-full overflow-hidden border border-white/10 p-0.5">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${percent}%`,
            backgroundColor: gaugeColor,
            boxShadow: `0 0 8px ${gaugeColor}`,
          }}
        />
      </div>
    </div>
  );
};
