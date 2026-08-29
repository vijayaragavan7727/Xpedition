"use client";

import React from "react";
import { useQuest } from "@/lib/QuestContext";

interface ShadowStageProps {
  children: React.ReactNode;
  shadowProximity?: number; // 0.0 (caught/close) to 1.0 (far away/escaped)
  readingProgress?: number; // 0 to 100 (for module mode)
  mode?: "quest" | "module" | "results" | "test";
  className?: string;
}

export default function ShadowStage({
  children,
  shadowProximity = 0.6,
  readingProgress = 0,
  mode = "quest",
  className = "",
}: ShadowStageProps) {
  const { accessibilitySettings } = useQuest();
  const isReducedMotion = accessibilitySettings?.reducedMotion ?? false;

  // Calculate vignette intensity based on proximity (closer = darker, redder vignette)
  // shadowProximity: 0 (caught) -> 1 (far)
  const clampedProximity = Math.max(0, Math.min(1, shadowProximity));
  const dangerFactor = 1 - clampedProximity; // 0 (safe) -> 1 (danger)

  // Dynamic vignette box-shadow styling
  const insetBlur = Math.round(50 + dangerFactor * 70); // 50px to 120px
  const redAlpha = (0.2 + dangerFactor * 0.55).toFixed(2);
  const vignetteShadow = `inset 0 0 ${insetBlur}px rgba(180, 10, 50, ${redAlpha}), inset 0 0 40px rgba(0, 0, 0, 0.95)`;

  // Ambient spotlight opacity (brightens with reading progress or standard quest lighting)
  const spotlightOpacity = (0.12 + (readingProgress / 100) * 0.15).toFixed(2);

  return (
    <div
      className={`min-h-screen bg-[#07070B] text-white relative flex flex-col justify-between overflow-x-hidden ${className}`}
    >
      {/* 1. LAYER 1: BASE GRADIENT (#07070B to #030306) */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: "linear-gradient(180deg, #07070B 0%, #030306 100%)",
        }}
      />

      {/* 2. LAYER 2: FLOOR LINE AT 70% HEIGHT (Horizontal light streak with blur) */}
      <div
        className="fixed inset-x-0 pointer-events-none z-0 transition-opacity duration-700"
        style={{
          top: "70%",
          height: "2px",
          background: "linear-gradient(90deg, transparent 0%, rgba(34, 211, 238, 0.35) 25%, rgba(168, 85, 247, 0.4) 60%, rgba(255, 0, 85, 0.5) 90%, transparent 100%)",
          filter: "blur(1px)",
          boxShadow: "0 0 12px rgba(34, 211, 238, 0.4)",
        }}
      />

      {/* 3. LAYER 3: AMBIENT SPOTLIGHT (Cyan-tinted, centered on learner content) */}
      <div
        className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-700"
        style={{
          background: "radial-gradient(ellipse 65% 55% at 45% 40%, rgba(0, 240, 255, 0.18) 0%, rgba(13, 13, 26, 0) 80%)",
          opacity: spotlightOpacity,
        }}
      />

      {/* 4. LAYER 4: FAR EDGE SHADOW AURA (Dark violet-red aura where Shadow lives) */}
      <div
        className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-700"
        style={{
          background: "radial-gradient(circle at 95% 65%, rgba(255, 0, 85, 0.28) 0%, rgba(124, 58, 237, 0.12) 40%, transparent 75%)",
          opacity: 0.5 + dangerFactor * 0.5,
        }}
      />

      {/* 5. LAYER 5: CSS NOISE/GRAIN OVERLAY (Subtle repeating gradient, static if reduced motion) */}
      {!isReducedMotion && (
        <div className="fixed inset-0 bg-noise-grain pointer-events-none opacity-[0.035] z-0" />
      )}

      {/* 6. LAYER 6: VIGNETTE ON ALL FOUR EDGES (Intensifies as Shadow approaches) */}
      <div
        className="fixed inset-0 pointer-events-none z-10 transition-all duration-700"
        style={{
          boxShadow: isReducedMotion
            ? "inset 0 0 60px rgba(0, 0, 0, 0.85)"
            : vignetteShadow,
        }}
      />

      {/* CONTENT SHELL */}
      <div className="relative z-20 w-full min-h-screen flex flex-col justify-between">
        {children}
      </div>
    </div>
  );
}
