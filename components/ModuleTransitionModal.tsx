"use client";

import React, { useEffect, useState } from "react";
import SquidAsset from "@/components/SquidAsset";
import { getModuleTheme } from "@/lib/moduleThemes";
import { useQuest } from "@/lib/QuestContext";
import { Sparkles, ArrowRight, X } from "lucide-react";

interface ModuleTransitionModalProps {
  moduleIndex: number;
  moduleName: string;
  onComplete: () => void;
}

export default function ModuleTransitionModal({
  moduleIndex,
  moduleName,
  onComplete,
}: ModuleTransitionModalProps) {
  const { accessibilitySettings } = useQuest();
  const theme = getModuleTheme(moduleIndex);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // If reduced motion is requested, complete transition instantly
    if (accessibilitySettings?.reducedMotion) {
      onComplete();
      return;
    }

    // Auto dismiss after 1.5 seconds for snappy, non-blocking flow
    const timer = setTimeout(() => {
      handleDismiss();
    }, 1500);

    return () => clearTimeout(timer);
  }, [accessibilitySettings?.reducedMotion]);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => {
      onComplete();
    }, 200);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn transition-opacity duration-200">
      <div
        className={`relative w-full max-w-sm bg-[#1B1B3A] border ${theme.borderColor} rounded-3xl p-6 text-center shadow-2xl space-y-4 glow-box-violet overflow-hidden my-auto ${
          accessibilitySettings?.reducedMotion ? "" : "animate-scaleUp"
        }`}
      >
        {/* Background Ambient Orbs */}
        <div className="absolute -top-10 -left-10 w-36 h-36 bg-[#7C3AED]/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-36 h-36 bg-[#22D3EE]/30 rounded-full blur-3xl pointer-events-none" />

        {/* Dismiss Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Dismiss transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Stage Intensity Badge */}
        <div className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border text-[10px] font-mono font-bold uppercase tracking-wider ${theme.badgeStyle}`}>
          <Sparkles className="w-3 h-3 text-[#FBBF24]" />
          <span>{theme.intensityLabel}</span>
        </div>

        {/* Cinematic Themed Image */}
        <div className="py-2 flex items-center justify-center">
          <div className="w-24 h-24 rounded-3xl bg-[#0A0A1A] border border-white/10 flex items-center justify-center p-3 shadow-xl ring-2 ring-[#22D3EE]/30">
            <SquidAsset name={theme.assetName} alt={theme.themeName} width={72} height={72} priority />
          </div>
        </div>

        {/* Module Title & Theme Subtitle */}
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-white font-heading truncate">
            {moduleName}
          </h2>
          <p className="text-xs text-[#22D3EE] font-mono font-semibold">
            {theme.themeName} • {theme.subtitle}
          </p>
        </div>

        {/* Enter Button CTA */}
        <button
          onClick={handleDismiss}
          className="w-full py-3 px-5 min-h-[44px] rounded-2xl bg-gradient-to-r from-[#7C3AED] via-[#22D3EE] to-[#34D399] hover:opacity-95 text-black font-black text-xs font-heading shadow-lg shadow-[#7C3AED]/30 flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider transition-all"
        >
          <span>Enter Challenge</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
