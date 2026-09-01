'use client';

import React, { useState } from 'react';

interface ArtBackdropProps {
  src?: string;
}

export const ArtBackdrop: React.FC<ArtBackdropProps> = ({ src = '/art/hero-left.jpg' }) => {
  const [hasError, setHasError] = useState<boolean>(false);

  const showFallback = hasError || !src;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none">
      {/* =========================================================================
          L0: IMAGE OR CSS NEON CITY FALLBACK (scale 1.04 + ambient drift)
          ========================================================================= */}
      {showFallback ? (
        <div className="absolute inset-0 neon-city-fallback z-0 ambient-drift-neon" />
      ) : (
        <div className="absolute inset-0 z-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt="Neon City Backdrop"
            onError={() => setHasError(true)}
            className="w-full h-full object-cover object-center ambient-drift-neon scale-[1.04]"
          />
        </div>
      )}

      {/* =========================================================================
          L1: COLOR UNIFICATION (rgba(120,40,200,.28), mix-blend-mode: color)
          ========================================================================= */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background: 'rgba(120, 40, 200, 0.28)',
          mixBlendMode: 'color',
        }}
      />

      {/* =========================================================================
          L2: RADIAL VIGNETTE (Transparent center to rgba(7,6,15,.92) at edges)
          ========================================================================= */}
      <div
        className="absolute inset-0 z-20"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, transparent 0%, rgba(7, 6, 15, 0.40) 60%, rgba(7, 6, 15, 0.92) 100%)',
        }}
      />

      {/* =========================================================================
          L3: CARD SCRIM (Soft radial pool of rgba(7,6,15,.80) sized 640x640, blurred 60px)
          ========================================================================= */}
      <div className="card-scrim-pool z-30" />

      {/* =========================================================================
          L4: GRAIN OVERLAY (Inline SVG feTurbulence at opacity .035)
          ========================================================================= */}
      <div className="absolute inset-0 z-40 opacity-[0.035] pointer-events-none mix-blend-overlay">
        <svg className="w-full h-full">
          <filter id="neon-grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.85"
              numOctaves="3"
              stitchTiles="stitch"
            />
          </filter>
          <rect width="100%" height="100%" filter="url(#neon-grain)" />
        </svg>
      </div>
    </div>
  );
};
