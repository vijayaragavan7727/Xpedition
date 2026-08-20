"use client";

import React, { useState } from "react";
import { RewardDrop } from "@/lib/QuestContext";
import { Question, ReinforcementQuestion } from "@/lib/types";
import {
  Sparkles,
  Trophy,
  Gift,
  ChevronRight,
  BookOpen,
  Swords,
  Zap,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Lightbulb,
  ArrowRight,
  Forward,
} from "lucide-react";

import SquidAsset from "@/components/SquidAsset";
import XpAsset from "@/components/XpAsset";

interface RewardModalProps {
  reward: RewardDrop;
  question?: Question | null;
  onClaim: (bonusXp?: number) => void;
}

export default function RewardModal({ reward, question, onClaim }: RewardModalProps) {
  const [selectedReinforcementIndex, setSelectedReinforcementIndex] = useState<number | null>(null);
  const [isReinforcementAnswered, setIsReinforcementAnswered] = useState(false);
  const [bonusXpEarned, setBonusXpEarned] = useState(0);

  const reinforcement: ReinforcementQuestion | undefined = question?.reinforcement || {
    whyItMatters: "Gotcha to remember: Verify object references vs primitives when modifying state in place.",
    format: "true_false",
    prompt: "True or False: Concept principles learned in this module apply deterministically across all execution contexts.",
    options: ["True", "False"],
    correctIndex: 0,
    explanation: "True! Understanding core underlying mechanics guarantees reliable behavior regardless of context.",
  };

  const getRewardTreatment = () => {
    switch (reward.arm) {
      case "lore":
        return {
          icon: BookOpen,
          title: "Secret Cyber Lore Fragment",
          xpBonus: 30,
          description: "Unlocked Chapter: 'Origins of Quantum Grid'. Read anytime in Passport.",
          color: "text-[#22D3EE]",
          bg: "bg-[#22D3EE]/20 border-[#22D3EE]/60",
        };
      case "guild_invite":
        return {
          icon: Swords,
          title: "Guild Raid Pass",
          xpBonus: 40,
          description: "Earned an exclusive Pass for Co-op Boss Raids with matched peers!",
          color: "text-red-400",
          bg: "bg-red-500/20 border-red-500/60",
        };
      case "leaderboard":
        return {
          icon: Zap,
          title: "Leaderboard Multiplier",
          xpBonus: 45,
          description: "Active +1.5x Multiplier pushing your rank up global standings!",
          color: "text-[#FBBF24]",
          bg: "bg-[#FBBF24]/20 border-[#FBBF24]/60",
        };
      case "badge":
      default:
        return {
          icon: Trophy,
          title: "Cyber Master Badge",
          xpBonus: 25,
          description: "Unlocked shiny collectible badge for your public profile.",
          color: "text-[#34D399]",
          bg: "bg-[#34D399]/20 border-[#34D399]/60",
        };
    }
  };

  const treatment = getRewardTreatment();
  const Icon = treatment.icon;

  const handleReinforcementSelect = (idx: number) => {
    if (isReinforcementAnswered) return;
    setSelectedReinforcementIndex(idx);
    setIsReinforcementAnswered(true);

    if (idx === reinforcement.correctIndex) {
      setBonusXpEarned(15);
    } else {
      setBonusXpEarned(0);
    }
  };

  const handleFinish = () => {
    onClaim(bonusXpEarned);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#0D0D1A] border border-[#00F0FF]/50 rounded-3xl p-5 sm:p-6 text-center shadow-2xl overflow-hidden my-auto space-y-4 glow-cyan">
        {/* Background Glows */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-[#A855F7]/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#00F0FF]/30 rounded-full blur-3xl pointer-events-none" />

        {/* 1. COMPACT REWARD REVEAL (Top 1/3 of modal) */}
        <section className="bg-[#000000]/80 border border-white/10 rounded-2xl p-3.5 flex items-center gap-3 text-left">
          <XpAsset name="crown" alt="Crown Icon" width={40} height={40} className="shrink-0 text-[#FFB800]" />

          <div className="flex-1 truncate">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono font-bold text-[#00F0FF] uppercase tracking-wider">
                Bandit Reward Unlocked
              </span>
              <span className="text-xs font-mono font-bold text-[#FFB800]">
                +{treatment.xpBonus} XP
              </span>
            </div>
            <h3 className="text-sm font-bold text-white font-heading truncate">
              {treatment.title}
            </h3>
            <p className="text-[11px] text-[#94A3B8] truncate">{treatment.description}</p>
          </div>
        </section>

        {/* 2. REINFORCE LEARNING SECTION */}
        <section className="bg-[#000000] border border-[#A855F7]/40 rounded-2xl p-4 text-left space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#00F0FF]">
              <XpAsset name="target" alt="Target Check" width={22} height={22} className="text-[#00FF87]" />
              <span>REINFORCE YOUR MASTERY</span>
            </div>
            <span className="text-[10px] font-mono text-[#00FF87] font-bold">
              Bonus +15 XP Quick-Check
            </span>
          </div>

          {/* One-line "Why this matters" or common gotcha */}
          <div className="bg-[#0A0A1A] border border-amber-500/30 rounded-xl p-3 text-xs space-y-1">
            <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
              💡 Why This Matters / Gotcha
            </span>
            <p className="text-slate-200 text-xs leading-relaxed">
              {reinforcement.whyItMatters}
            </p>
          </div>

          {/* Follow-up question prompt (Different Format: True/False or Fill-in-the-blank) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>Quick Check ({reinforcement.format === "true_false" ? "True / False" : "Concept Check"})</span>
              {isReinforcementAnswered && bonusXpEarned > 0 && (
                <span className="text-[#34D399] font-bold">✓ +15 Bonus XP Earned!</span>
              )}
            </div>

            <p className="text-xs font-bold text-white font-heading leading-snug">
              {reinforcement.prompt}
            </p>

            {/* Option Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {reinforcement.options.map((opt, idx) => {
                let btnStyle = "bg-[#0A0A1A] border-white/10 text-slate-200 hover:border-[#22D3EE]";

                if (selectedReinforcementIndex === idx) {
                  if (idx === reinforcement.correctIndex) {
                    btnStyle = "bg-[#34D399]/20 border-[#34D399] text-[#34D399] font-bold";
                  } else {
                    btnStyle = "bg-amber-500/20 border-amber-500 text-amber-300 font-bold";
                  }
                } else if (isReinforcementAnswered && idx === reinforcement.correctIndex) {
                  btnStyle = "bg-[#34D399]/20 border-[#34D399] text-[#34D399] font-bold";
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleReinforcementSelect(idx)}
                    disabled={isReinforcementAnswered}
                    className={`py-2.5 px-3 min-h-[44px] rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {isReinforcementAnswered && idx === reinforcement.correctIndex && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399]" />
                    )}
                    {isReinforcementAnswered && selectedReinforcementIndex === idx && idx !== reinforcement.correctIndex && (
                      <XCircle className="w-3.5 h-3.5 text-amber-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Explanation panel after answering reinforcement */}
          {isReinforcementAnswered && (
            <div className={`p-3 rounded-xl border text-xs space-y-1 animate-fadeIn ${
              bonusXpEarned > 0
                ? "bg-[#34D399]/15 border-[#34D399]/40 text-[#34D399]"
                : "bg-amber-500/15 border-amber-500/40 text-amber-300"
            }`}>
              <span className="font-bold block font-heading">
                {bonusXpEarned > 0 ? "✓ Spot on! Bonus +15 XP added." : "Learning Insight (No XP Penalty)"}
              </span>
              <p className="text-[#94A3B8] text-[11px] leading-relaxed">
                {reinforcement.explanation}
              </p>
            </div>
          )}
        </section>

        {/* 3. ACTION BUTTONS: CLAIM / SKIP */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleFinish}
            className="flex-1 py-3 px-4 min-h-[44px] rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1 font-mono"
          >
            <span>Skip to Next Quest</span>
          </button>

          <button
            onClick={handleFinish}
            className="flex-1 py-3.5 px-4 min-h-[44px] rounded-2xl bg-gradient-to-r from-[#7C3AED] via-[#22D3EE] to-[#34D399] hover:opacity-95 text-black font-black text-xs transition-all shadow-lg shadow-[#7C3AED]/30 flex items-center justify-center gap-1.5 cursor-pointer font-heading tracking-wide uppercase"
          >
            <span>Start Next Quest →</span>
          </button>
        </div>
      </div>
    </div>
  );
}
