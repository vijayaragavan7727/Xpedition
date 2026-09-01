'use client';

import React from 'react';

interface HexAvatarProps {
  src?: string;
  size?: number; // size in px
  fallbackText?: string;
  className?: string;
}

export const HexAvatar: React.FC<HexAvatarProps> = ({
  src,
  size = 56,
  fallbackText = 'XP',
  className = '',
}) => {
  return (
    <div
      className={`hex-container ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      {/* 1px red outer border hexagon */}
      <div className="hex-border w-full h-full p-[1.5px] bg-red">
        {/* Inner container */}
        <div className="hex-inner w-full h-full bg-panel flex items-center justify-center overflow-hidden relative">
          {src ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={src}
              alt="Avatar"
              className="w-full h-full object-cover filter grayscale contrast-125"
            />
          ) : (
            <div className="w-full h-full bg-raised flex items-center justify-center text-red font-anton tracking-wider text-sm">
              {fallbackText}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
