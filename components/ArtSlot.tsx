'use client';

import React, { useState } from 'react';

export type ArtSlotType = 'hero-left' | 'hero-banner' | 'avatar';

interface ArtSlotProps {
  src?: string;
  slot: ArtSlotType;
  alt?: string;
  className?: string;
  children?: React.ReactNode;
}

export const ArtSlot: React.FC<ArtSlotProps> = ({
  src,
  slot,
  alt = 'Comic Noir Artwork',
  className = '',
  children,
}) => {
  const [hasError, setHasError] = useState(false);

  const isAvatar = slot === 'avatar';
  const showFallback = !src || hasError;

  return (
    <div
      className={`relative overflow-hidden ${
        isAvatar ? 'hex w-24 h-24' : 'w-full h-full'
      } ${className}`}
    >
      {/* 1. Base Container / Fallback (.city CSS skyline) */}
      <div className="absolute inset-0 city z-0" />

      {/* 2. Image Layer with Duotone Filter if present */}
      {!showFallback && (
        <div
          className="absolute inset-0 z-10 w-full h-full overflow-hidden"
          style={{
            maskImage: isAvatar
              ? 'none'
              : 'linear-gradient(to bottom, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 95%)',
            WebkitMaskImage: isAvatar
              ? 'none'
              : 'linear-gradient(to bottom, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 95%)',
          }}
        >
          {/* Base Image with Grayscale & High Contrast */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            onError={() => setHasError(true)}
            className="w-full h-full object-cover filter grayscale contrast-[1.25]"
          />

          {/* Duotone Color Overlay (Red to Blood gradient) with mix-blend-mode: color */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, rgba(225,29,46,0.55) 0%, rgba(110,9,18,0.85) 100%)',
              mixBlendMode: 'color',
            }}
          />

          {/* Halftone Texture Overlay at 0.35 opacity */}
          <div className="absolute inset-0 halftone opacity-35 pointer-events-none" />
        </div>
      )}

      {/* 3. Global Halftone Layer over Fallback */}
      {showFallback && (
        <div className="absolute inset-0 halftone opacity-50 pointer-events-none z-10" />
      )}

      {/* 4. Bottom 40% fade gradient overlay for non-avatar slots */}
      {!isAvatar && (
        <div
          className="absolute bottom-0 left-0 right-0 h-[45%] pointer-events-none z-20"
          style={{
            background: 'linear-gradient(to bottom, transparent 0%, var(--ink) 100%)',
          }}
        />
      )}

      {/* Content slot overlay */}
      {children && <div className="relative z-30 h-full w-full">{children}</div>}
    </div>
  );
};
