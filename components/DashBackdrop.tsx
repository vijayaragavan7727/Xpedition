'use client';

import React, { useState } from 'react';

interface DashBackdropProps {
  src?: string;
}

export const DashBackdrop: React.FC<DashBackdropProps> = ({ src = '/art/dashboard.jpg' }) => {
  const [hasError, setHasError] = useState<boolean>(false);

  const showFallback = hasError || !src;

  return (
    <div className="absolute top-0 left-0 right-0 h-[340px] z-0 pointer-events-none overflow-hidden select-none">
      {/* =========================================================================
          L0: IMAGE OR CSS NEON CITY FALLBACK (scale 1.03 -> 1.05 ambient drift)
          ========================================================================= */}
      {showFallback ? (
        <div className="absolute inset-0 neon-city-fallback z-0 ambient-drift-dash" />
      ) : (
        <div className="absolute inset-0 z-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt="Dashboard Backdrop"
            onError={() => setHasError(true)}
            className="w-full h-full object-cover object-top ambient-drift-dash scale-[1.03]"
          />
        </div>
      )}

      {/* =========================================================================
          L1: COLOR UNIFICATION (rgba(120,40,200,.30), mix-blend-mode: color)
          ========================================================================= */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background: 'rgba(120, 40, 200, 0.30)',
          mixBlendMode: 'color',
        }}
      />

      {/* =========================================================================
          L2: THE FADE (Fades to solid #07060F by 340px)
          ========================================================================= */}
      <div
        className="absolute inset-0 z-20"
        style={{
          background:
            'linear-gradient(180deg, rgba(7,6,15,0.25) 0%, rgba(7,6,15,0.55) 45%, rgba(7,6,15,0.92) 78%, #07060F 100%)',
        }}
      />

      {/* CSS for Dash Ambient Drift Keyframe (scale 1.03 -> 1.05 over 45s) */}
      <style jsx global>{`
        .ambient-drift-dash {
          will-change: transform;
          animation: slowDriftDash 45s ease-in-out infinite alternate;
        }
        @keyframes slowDriftDash {
          0% {
            transform: scale(1.03) translate3d(-6px, -3px, 0);
          }
          100% {
            transform: scale(1.05) translate3d(6px, 3px, 0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .ambient-drift-dash {
            animation: none !important;
            transform: scale(1.03) !important;
          }
        }
      `}</style>
    </div>
  );
};
