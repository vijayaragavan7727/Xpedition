'use client';

import React, { useEffect, useState } from 'react';

interface WorkerCharacterProps {
  startPos: { x: number; y: number };
  endPos: { x: number; y: number };
  speed?: number;
  resource?: 'wood' | 'gold' | 'crystal' | 'hammer';
  color?: string;
  name?: string;
}

export default function WorkerCharacter({
  startPos,
  endPos,
  speed = 10,
  resource = 'crystal',
  color = '#38BDF8',
  name = 'Builder',
}: WorkerCharacterProps) {
  const [progress, setProgress] = useState<number>(0);
  const [isReturning, setIsReturning] = useState<boolean>(false);

  useEffect(() => {
    let animationId: number;
    let lastTime = performance.now();

    const update = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      setProgress((prev) => {
        const step = (delta / speed);
        if (!isReturning) {
          if (prev + step >= 1) {
            setIsReturning(true);
            return 1;
          }
          return prev + step;
        } else {
          if (prev - step <= 0) {
            setIsReturning(false);
            return 0;
          }
          return prev - step;
        }
      });

      animationId = requestAnimationFrame(update);
    };

    animationId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationId);
  }, [speed, isReturning]);

  const currentX = startPos.x + (endPos.x - startPos.x) * progress;
  const currentY = startPos.y + (endPos.y - startPos.y) * progress;
  const isFlipped = isReturning || endPos.x < startPos.x;

  return (
    <div
      style={{
        left: `${currentX}%`,
        top: `${currentY}%`,
      }}
      className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none z-20 flex flex-col items-center"
    >
      {/* Ground Shadow */}
      <div className="w-6 h-2.5 bg-black/40 rounded-full blur-[2px] -mb-1" />

      {/* Animated Character Sprite */}
      <div
        className={`relative flex flex-col items-center transition-transform duration-150 ${
          isFlipped ? 'scale-x-[-1]' : 'scale-x-100'
        }`}
      >
        {/* Resource on Back */}
        <div className="absolute -top-3 -right-2 text-xs animate-bounce">
          {resource === 'wood' && '🪵'}
          {resource === 'gold' && '🪙'}
          {resource === 'crystal' && '🔮'}
          {resource === 'hammer' && '🔨'}
        </div>

        {/* Hardhat / Cap */}
        <div className="w-4 h-2 bg-amber-400 rounded-t-full border border-amber-600 shadow-sm" />

        {/* Head */}
        <div className="w-3.5 h-3.5 bg-[#FDBA74] rounded-full border border-amber-700 flex items-center justify-center -mt-0.5">
          <div className="w-1 h-1 bg-slate-900 rounded-full" />
        </div>

        {/* Torso & Uniform */}
        <div
          className="w-4 h-4 rounded-md border border-slate-700 -mt-0.5 shadow-sm"
          style={{ backgroundColor: color }}
        />

        {/* Animated Feet */}
        <div className="flex gap-1 -mt-0.5">
          <div className="w-1.5 h-2 bg-slate-900 rounded-b-sm animate-pulse" />
          <div className="w-1.5 h-2 bg-slate-900 rounded-b-sm animate-pulse" />
        </div>
      </div>
    </div>
  );
}
