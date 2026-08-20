"use client";

import React from "react";

export type RimColor = "cyan" | "violet" | "amber" | "red" | string;

interface CyberSilhouetteProps {
  color?: RimColor;
  rimColor?: RimColor;
  className?: string;
  width?: number;
  height?: number;
}

const COLOR_MAP: Record<string, string> = {
  cyan: "#22D3EE",
  violet: "#7C3AED",
  amber: "#FBBF24",
  red: "#FB7185",
};

export default function CyberSilhouette({
  color,
  rimColor = "cyan",
  className = "",
  width = 64,
  height = 64,
}: CyberSilhouetteProps) {
  const activeColor = color || rimColor;
  const hexColor = COLOR_MAP[activeColor] || activeColor;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      <defs>
        <filter id={`glow-${hexColor.replace("#", "")}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <linearGradient id={`rimGrad-${hexColor.replace("#", "")}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={hexColor} stopOpacity="0.9" />
          <stop offset="100%" stopColor={hexColor} stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* Outer Rim Light Glow */}
      <path
        d="M50 15 C 38 15, 30 25, 30 38 C 30 48, 36 55, 42 58 C 28 65, 18 78, 15 95 L 85 95 C 82 78, 72 65, 58 58 C 64 55, 70 48, 70 38 C 70 25, 62 15, 50 15 Z"
        fill="none"
        stroke={hexColor}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#glow-${hexColor.replace("#", "")})`}
      />

      {/* Dark Body Silhouette */}
      <path
        d="M50 16 C 39 16, 31 26, 31 38 C 31 47, 37 54, 43 57 C 29 64, 19 77, 16 94 L 84 94 C 81 77, 71 64, 57 57 C 63 54, 69 47, 69 38 C 69 26, 61 16, 50 16 Z"
        fill="#0D0D1A"
      />

      {/* Inner Shadow / Depth */}
      <path
        d="M50 20 C 42 20, 36 27, 36 38 C 36 45, 40 50, 45 53 C 34 59, 26 70, 23 85 L 77 85 C 74 70, 66 59, 55 53 C 60 50, 64 45, 64 38 C 64 27, 58 20, 50 20 Z"
        fill="#04040A"
        opacity="0.8"
      />
    </svg>
  );
}
