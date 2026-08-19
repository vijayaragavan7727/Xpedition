"use client";

import { RewardDrop } from "@/lib/QuestContext";
import { Sparkles, Flame, Trophy, Award, Gift, ChevronRight, BookOpen, Swords, Zap, Shield } from "lucide-react";
import { ArmType } from "@/lib/bandit";

interface RewardModalProps {
  reward: RewardDrop;
  onClaim: () => void;
}

export default function RewardModal({ reward, onClaim }: RewardModalProps) {
  const getRewardTreatment = () => {
    switch (reward.arm) {
      case "lore":
        return {
          icon: BookOpen,
          title: "Secret Cyber Lore Fragment",
          xpBonus: 30,
          description: "Unlocked Chapter 3: 'Origins of the Quantum Grid'. Read anytime in Passport.",
          color: "text-[#22D3EE]",
          bg: "bg-[#22D3EE]/20 border-[#22D3EE]/60",
          glow: "glow-box-cyan",
        };
      case "guild_invite":
        return {
          icon: Swords,
          title: "Guild Raid Pass",
          xpBonus: 40,
          description: "Earned an exclusive Pass for Co-op Boss Raids with matched peers!",
          color: "text-red-400",
          bg: "bg-red-500/20 border-red-500/60",
          glow: "glow-box-violet",
        };
      case "leaderboard":
        return {
          icon: Zap,
          title: "Leaderboard XP Multiplier",
          xpBonus: 45,
          description: "Active +1.5x Multiplier pushing your rank up the global standings!",
          color: "text-[#FBBF24]",
          bg: "bg-[#FBBF24]/20 border-[#FBBF24]/60",
          glow: "glow-box-amber",
        };
      case "cosmetic":
        return {
          icon: Sparkles,
          title: "Exclusive Neon Title: 'Gridmaster'",
          xpBonus: 35,
          description: "Equipped shiny cyan glowing name badge on your public adventurer avatar.",
          color: "text-pink-400",
          bg: "bg-pink-500/20 border-pink-500/60",
          glow: "glow-box-cyan",
        };
      case "badge":
      default:
        return {
          icon: Trophy,
          title: reward.title || "Rare Badge: Cyber Knight",
          xpBonus: 50,
          description: reward.description || "Unlocked rare achievement credential on your Skill Passport!",
          color: "text-[#34D399]",
          bg: "bg-[#34D399]/20 border-[#34D399]/60",
          glow: "glow-box-green",
        };
    }
  };

  const treatment = getRewardTreatment();
  const Icon = treatment.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#1B1B3A] border border-[#7C3AED]/50 rounded-3xl p-6 sm:p-8 text-center shadow-2xl overflow-hidden glow-box-violet">
        {/* Background Light Glow Orbs */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-[#7C3AED]/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#22D3EE]/30 rounded-full blur-3xl pointer-events-none" />

        {/* Top Tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7C3AED]/30 border border-[#7C3AED]/50 text-[#22D3EE] text-xs font-mono font-bold mb-6">
          <Gift className="w-3.5 h-3.5 text-[#FBBF24]" />
          THOMPSON SAMPLING BANDIT DROP
        </div>

        {/* Glowing Circle Icon */}
        <div className={`w-24 h-24 mx-auto rounded-full ${treatment.bg} border-2 flex items-center justify-center mb-6 shadow-2xl ${treatment.glow} animate-bounce`}>
          <Icon className={`w-12 h-12 ${treatment.color}`} />
        </div>

        {/* Reward Name & Description */}
        <h2 className="text-xl sm:text-2xl font-black text-white font-heading mb-2">
          {treatment.title}
        </h2>
        <p className="text-xs text-[#94A3B8] max-w-xs mx-auto mb-6">
          {treatment.description}
        </p>

        <div className="inline-block px-4 py-2 rounded-2xl bg-[#0A0A1A] border border-white/10 text-base font-bold text-[#FBBF24] font-mono mb-8">
          +{treatment.xpBonus} XP Gained!
        </div>

        {/* Claim Button */}
        <button
          onClick={onClaim}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#7C3AED] via-[#22D3EE] to-[#34D399] hover:opacity-95 text-black font-black text-base transition-all shadow-xl shadow-[#7C3AED]/30 flex items-center justify-center gap-2 cursor-pointer font-heading tracking-wide"
        >
          <span>Claim Reward</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
