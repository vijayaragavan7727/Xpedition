"use client";

import React from "react";
import { useQuest } from "@/lib/QuestContext";

export type FigureRole = "player" | "shadow";
export type RimColor = "cyan" | "violet" | "amber" | "red" | string;

interface CyberSilhouetteProps {
  role?: FigureRole;
  color?: RimColor;
  rimColor?: RimColor;
  className?: string;
  width?: number;
  height?: number;
  gapDistance?: number; // 0 (close/caught) to 10 (far)
  isDissolving?: boolean; // for escape victory animation
}

const COLOR_MAP: Record<string, string> = {
  cyan: "#00F0FF",
  violet: "#A855F7",
  amber: "#FFB800",
  red: "#FF0055",
};

export default function CyberSilhouette({
  role = "player",
  color,
  rimColor = "cyan",
  className = "",
  width = 56,
  height = 56,
  gapDistance = 6,
  isDissolving = false,
}: CyberSilhouetteProps) {
  const { accessibilitySettings } = useQuest();
  const isReducedMotion = accessibilitySettings?.reducedMotion ?? false;

  const isShadow = role === "shadow";
  const activeColor = color || (isShadow ? "red" : rimColor);
  const hexColor = COLOR_MAP[activeColor] || activeColor;

  // Calculate Shadow dynamic blur based on gap distance (0 = sharp, 10 = hazy blur(4px))
  const blurAmount = isShadow ? Math.min(4, Math.max(0, (gapDistance / 10) * 4)) : 0;
  const shadowBlurStyle = isShadow && !isReducedMotion ? `blur(${blurAmount.toFixed(1)}px)` : "none";

  // Stacked drop-shadow filters (tight bright + wide soft rim lighting)
  const playerFilter = `drop-shadow(0 0 3px ${hexColor}) drop-shadow(0 0 12px rgba(0, 240, 255, 0.45))`;
  const shadowFilter = `drop-shadow(0 0 4px ${hexColor}) drop-shadow(0 0 18px rgba(255, 0, 85, 0.55))`;

  const figureFilter = isShadow ? shadowFilter : playerFilter;

  return (
    <div
      className={`relative inline-block shrink-0 ${isShadow && !isReducedMotion ? "animate-shadow-breathing" : ""} ${className}`}
      style={{
        transform: isShadow ? "scale(1.15) scaleX(-1)" : "scale(1)",
        filter: shadowBlurStyle,
        transition: "filter 500ms cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}
    >
      <svg
        width={width}
        height={height}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: isReducedMotion ? "none" : figureFilter,
        }}
      >
        {/* Silhouette Figure Path: High-detail runner posture */}
        {/* Head */}
        <ellipse cx="50" cy="24" rx="11" ry="12" fill="#04040A" />

        {/* Neck & Torso */}
        <path
          d="M 50 36 C 42 36, 36 42, 34 52 L 32 70 C 32 74, 38 78, 50 78 C 62 78, 68 74, 68 70 L 66 52 C 64 42, 58 36, 50 36 Z"
          fill="#04040A"
        />

        {/* Shoulders & Athletic Arms */}
        <path
          d="M 34 50 L 18 64 C 15 67, 14 74, 18 76 C 22 78, 26 74, 28 68 L 36 56 Z"
          fill="#04040A"
        />
        <path
          d="M 66 50 L 82 64 C 85 67, 86 74, 82 76 C 78 78, 74 74, 72 68 L 64 56 Z"
          fill="#04040A"
        />

        {/* Legs / Stance */}
        <path
          d="M 40 74 L 28 96 C 26 100, 34 100, 36 96 L 46 80 Z"
          fill="#04040A"
        />
        <path
          d="M 60 74 L 72 96 C 74 100, 66 100, 64 96 L 54 80 Z"
          fill="#04040A"
        />

        {/* Rim Lighting Highlights */}
        <path
          d="M 50 12 C 40 12, 37 20, 37 24 C 37 32, 44 34, 50 34"
          stroke={hexColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.9"
        />
        <path
          d="M 34 50 L 18 64 M 40 74 L 28 96"
          stroke={hexColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.85"
        />
      </svg>
    </div>
  );
}
