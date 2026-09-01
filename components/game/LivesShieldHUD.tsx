'use client';

import React from 'react';
import { Shield, ShieldAlert, Heart, HeartOff } from 'lucide-react';

interface LivesShieldHUDProps {
  currentLives: number;
  maxLives: number;
}

export const LivesShieldHUD: React.FC<LivesShieldHUDProps> = ({
  currentLives,
  maxLives,
}) => {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#120E22]/90 backdrop-blur-md border border-white/15 select-none shadow-xl">
      <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider mr-1">
        SHIELDS
      </span>

      <div className="flex items-center gap-1">
        {Array.from({ length: maxLives }).map((_, index) => {
          const isActive = index < currentLives;

          return (
            <div
              key={index}
              className={`transition-all duration-300 ${
                isActive
                  ? 'text-[#00F0FF] scale-100 drop-shadow-[0_0_8px_#00F0FF]'
                  : 'text-slate-600 scale-90 opacity-40'
              }`}
            >
              {isActive ? (
                <Shield className="w-4 h-4 fill-[#00F0FF]" />
              ) : (
                <ShieldAlert className="w-4 h-4" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
