"use client";

import { useState, useEffect } from "react";
import { useQuest, RewardDrop } from "@/lib/QuestContext";
import BottomNav from "@/components/BottomNav";
import RewardModal from "@/components/RewardModal";
import FlowExplanationModal from "@/components/FlowExplanationModal";
import { Question } from "@/lib/types";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  selectArm,
  recordOutcome,
  sampleBeta,
  ArmType,
  RewardArm,
  BANDIT_ARMS,
} from "@/lib/bandit";
import Link from "next/link";
import {
  Zap,
  CheckCircle2,
  XCircle,
  Loader2,
  Trophy,
  Flame,
  HelpCircle,
  Info,
  Sparkles,
  Mic,
  Users,
  ExternalLink,
} from "lucide-react";
import TutorOverlay from "@/components/TutorOverlay";

export default function QuestPage() {
  const {
    user,
    course,
    activeSkillIndex,
    currentQuestion,
    flowDifficulty,
    pKnow,
    correctStreak,
    wrongStreak,
    goalText,
    flowExplanation,
    visualTheme,
    answerQuestion,
    claimReward,
    setNextQuestion,
  } = useQuest();

  // Shadow Duel Theme State (Confidence Meter & Doubt's Grip)
  const [confidenceMeter, setConfidenceMeter] = useState(40);
  const [doubtGrip, setDoubtGrip] = useState(60);
  const [doubtDefeated, setDoubtDefeated] = useState(false);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [loadingNext, setLoadingNext] = useState(false);
  const [activeRewardDrop, setActiveRewardDrop] = useState<RewardDrop | null>(null);
  const [userArms, setUserArms] = useState<RewardArm[]>([]);
  const [lastClaimedArm, setLastClaimedArm] = useState<ArmType | null>(null);

  // Latency tracking
  const [renderTimestamp, setRenderTimestamp] = useState<number>(Date.now());
  const [showWhyModal, setShowWhyModal] = useState(false);
  const [showTutorOverlay, setShowTutorOverlay] = useState(false);
  const [hintsUsedCount, setHintsUsedCount] = useState(0);

  useEffect(() => {
    setRenderTimestamp(Date.now());
    setHintsUsedCount(0);
    fetchUserArms();
  }, [currentQuestion, user]);

  const fetchUserArms = async () => {
    if (isSupabaseConfigured() && user?.id) {
      try {
        const { data } = await supabase
          .from("reward_arms")
          .select("*")
          .eq("user_id", user.id);

        if (data && data.length > 0) {
          setUserArms(
            data.map((d) => ({
              arm: d.arm as ArmType,
              alpha: d.alpha,
              beta: d.beta,
              pulls: d.pulls,
              returns: d.returns,
            }))
          );
          return;
        }
      } catch (err) {
        console.warn("Supabase fetch user arms notice:", err);
      }
    }

    // Default fallback arms
    setUserArms(
      BANDIT_ARMS.map((arm) => ({
        arm,
        alpha: arm === "badge" ? 3 : 1,
        beta: 1,
        pulls: 0,
        returns: 0,
      }))
    );
  };

  const currentSkill = course?.skills[activeSkillIndex] || {
    id: "s1",
    name: "Python Core Syntax & Data Structures",
    difficulty: 1,
  };

  const question: Question = currentQuestion || {
    prompt: "In Python, which data structure is defined using parentheses and is immutable?",
    options: ["List", "Tuple", "Dictionary", "Set"],
    correctIndex: 1,
    explanation: "Tuples are defined with parentheses and cannot be modified after creation.",
  };

  // Thompson Sampling arm picker (Control cohort always gets 'badge')
  const pickBanditRewardDrop = (): RewardDrop => {
    const selected = selectArm(userArms);
    const arm: ArmType = user?.cohort === "control" ? "badge" : selected.arm;

    const armDetails: Record<ArmType, { title: string; xpBonus: number; description: string }> = {
      badge: {
        title: "Rare Badge: Cyber Knight",
        xpBonus: 50,
        description: "Unlocked rare achievement credential on your Skill Passport!",
      },
      lore: {
        title: "Secret Cyber Lore Fragment",
        xpBonus: 30,
        description: "Unlocked Chapter 3: 'Origins of the Quantum Grid'. Read in Passport.",
      },
      guild_invite: {
        title: "Guild Raid Pass",
        xpBonus: 40,
        description: "Earned an exclusive Pass for Co-op Boss Raids with matched peers!",
      },
      leaderboard: {
        title: "Leaderboard XP Multiplier",
        xpBonus: 45,
        description: "Active +1.5x Multiplier pushing your rank up the global standings!",
      },
      cosmetic: {
        title: "Exclusive Neon Title: 'Gridmaster'",
        xpBonus: 35,
        description: "Equipped shiny cyan glowing name badge on your public adventurer avatar.",
      },
    };

    const details = armDetails[arm] || armDetails.badge;

    return {
      type: "+20 XP",
      arm,
      title: details.title,
      xpBonus: details.xpBonus,
      description: details.description,
    };
  };

  const handleSelectOption = (index: number) => {
    if (isAnswered || loadingNext || activeRewardDrop) return;

    const clickTimestamp = Date.now();
    const latencyMs = Math.max(100, clickTimestamp - renderTimestamp);

    setSelectedIndex(index);
    setIsAnswered(true);

    const isCorrect = index === question.correctIndex;
    answerQuestion(isCorrect, latencyMs, hintsUsedCount);

    // If user previously claimed a reward drop and answered another question, record bandit return success!
    if (lastClaimedArm && user?.id) {
      recordOutcome(user.id, lastClaimedArm, true, userArms);
      setLastClaimedArm(null);
    }

    if (isCorrect) {
      setConfidenceMeter((prev) => Math.min(100, prev + 30));
      setDoubtGrip((prev) => Math.max(0, prev - 30));
      setDoubtDefeated(true);

      setTimeout(() => {
        setDoubtDefeated(false);
        const reward = pickBanditRewardDrop();
        setActiveRewardDrop(reward);
      }, 1000);
    } else {
      setConfidenceMeter((prev) => Math.max(0, prev - 15));
      setDoubtGrip((prev) => Math.min(100, prev + 20));
      setTimeout(() => {
        fetchNextQuestion(false);
      }, 1500);
    }
  };

  const handleClaimReward = async () => {
    if (activeRewardDrop) {
      claimReward(activeRewardDrop);
      if (activeRewardDrop.arm) {
        setLastClaimedArm(activeRewardDrop.arm);
      }
      setActiveRewardDrop(null);
      await fetchNextQuestion(true);
    }
  };

  const fetchNextQuestion = async (wasCorrect: boolean) => {
    setLoadingNext(true);
    try {
      const res = await fetch("/api/next-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillId: currentSkill.id,
          skillName: currentSkill.name,
          difficulty: flowDifficulty,
          wasCorrect,
          goal: goalText,
        }),
      });

      if (res.ok) {
        const nextQ: Question = await res.json();
        if (nextQ && nextQ.prompt && Array.isArray(nextQ.options)) {
          setNextQuestion(nextQ);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch next question:", err);
    } finally {
      setSelectedIndex(null);
      setIsAnswered(false);
      setLoadingNext(false);
    }
  };

  const isCorrectChoice = selectedIndex !== null && selectedIndex === question.correctIndex;

  const isShadowDuelMode = flowDifficulty >= 4 || visualTheme === "Shadow Duel";

  return (
    <main className="min-h-screen bg-[#0A0A1A] bg-grid-pattern relative flex flex-col justify-between pb-24 p-4 sm:p-6 overflow-x-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#7C3AED]/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-2xl mx-auto space-y-6 z-10 my-auto">
        {/* Shadow Duel Mode Theme Header */}
        {isShadowDuelMode && (
          <div className="bg-[#12122C] border border-[#FB7185]/40 rounded-3xl p-6 shadow-2xl space-y-4 glow-box-red animate-fadeIn relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-[#FB7185]/20 border border-[#FB7185]/40 text-[#FB7185] text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#FBBF24]" />
                SHADOW DUEL MODE ACTIVE (LEVEL {flowDifficulty})
              </span>
              <span className="text-xs font-mono text-slate-400 font-bold">VS DOUBT SILHOUETTE</span>
            </div>

            {/* Backlit Silhouette Arena Graphic */}
            <div className="flex items-center justify-around py-3 relative bg-[#0A0A1A]/80 border border-white/10 rounded-2xl">
              {/* Learner Avatar Silhouette (Cyan Rim Light) */}
              <div className="flex flex-col items-center space-y-1">
                <div className="w-16 h-16 rounded-full bg-[#22D3EE]/20 border-2 border-[#22D3EE] shadow-lg shadow-[#22D3EE]/40 flex items-center justify-center text-white font-black text-xl font-heading animate-pulse">
                  YOU
                </div>
                <span className="text-[10px] font-mono text-[#22D3EE] font-bold">Confidence</span>
              </div>

              {/* VS Marker */}
              <div className="text-xl font-black font-heading text-[#FBBF24] animate-bounce">
                VS
              </div>

              {/* Doubt Silhouette (Red Rim Light) */}
              <div className="flex flex-col items-center space-y-1">
                <div
                  className={`w-16 h-16 rounded-full bg-[#FB7185]/20 border-2 border-[#FB7185] shadow-lg shadow-[#FB7185]/40 flex items-center justify-center text-[#FB7185] font-black text-xs font-heading transition-all duration-500 ${
                    doubtDefeated ? "scale-0 opacity-0 animate-ping" : "scale-100 opacity-100"
                  }`}
                >
                  DOUBT
                </div>
                <span className="text-[10px] font-mono text-[#FB7185] font-bold">
                  {doubtDefeated ? "DEFEATED!" : "Doubt's Grip"}
                </span>
              </div>
            </div>

            {/* Confidence Meter vs Doubt's Grip Meter */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-[#22D3EE] font-bold">
                  <span>Confidence Meter</span>
                  <span>{confidenceMeter}%</span>
                </div>
                <div className="w-full h-2 bg-[#0A0A1A] rounded-full overflow-hidden border border-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-[#7C3AED] to-[#22D3EE] transition-all duration-500"
                    style={{ width: `${confidenceMeter}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-[#FB7185] font-bold">
                  <span>Doubt's Grip</span>
                  <span>{doubtGrip}%</span>
                </div>
                <div className="w-full h-2 bg-[#0A0A1A] rounded-full overflow-hidden border border-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-red-600 to-[#FB7185] transition-all duration-500"
                    style={{ width: `${doubtGrip}%` }}
                  />
                </div>
              </div>
            </div>

            {doubtDefeated && (
              <div className="text-center p-2 rounded-xl bg-[#34D399]/20 border border-[#34D399] text-[#34D399] font-bold text-xs font-heading animate-bounce">
                ✨ DOUBT DEFEATED! Particle Scatter Unlocked!
              </div>
            )}
          </div>
        )}
        {/* Header Flow Bar */}
        <header className="flex items-center justify-between bg-[#1B1B3A] border border-white/10 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#94A3B8] font-mono">Module {activeSkillIndex + 1}:</span>
            <span className="text-xs font-bold text-white truncate max-w-[140px] sm:max-w-[200px]">
              {currentSkill.name}
            </span>
          </div>

          {/* Flow Level Chip + Why Button */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#7C3AED]/30 to-[#22D3EE]/30 border border-[#22D3EE]/50 text-[#22D3EE] font-mono text-xs font-bold shadow-md shadow-[#22D3EE]/20 animate-pulse">
              <Zap className="w-3.5 h-3.5 text-[#FBBF24]" />
              <span>Flow: Level {flowDifficulty}</span>
            </div>

            {/* Why? Algorithmic Explanation Button */}
            <button
              onClick={() => setShowWhyModal(true)}
              className="px-2.5 py-1 rounded-full bg-[#1B1B3A] border border-white/20 hover:border-[#22D3EE] text-[11px] font-mono text-slate-300 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Info className="w-3 h-3 text-[#22D3EE]" />
              <span>Why?</span>
            </button>

            {/* Streak Counter Chip */}
            <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-[#FBBF24] bg-[#0A0A1A] px-2 py-1 rounded-full border border-[#FBBF24]/30">
              <Flame className="w-3.5 h-3.5" />
              <span>P(know): {(pKnow * 100).toFixed(0)}%</span>
            </div>
          </div>
        </header>

        {/* Mastery Threshold Peer-Teach Banner */}
        {pKnow >= 0.85 && (
          <div className="bg-[#34D399]/15 border border-[#34D399]/40 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs animate-fadeIn glow-box-green">
            <div className="space-y-0.5">
              <span className="font-bold text-[#34D399] font-heading block">
                🎉 Mastery Threshold Unlocked! (P(know): {(pKnow * 100).toFixed(0)}%)
              </span>
              <p className="text-slate-200">
                You've mastered this concept! Write a quest question for fellow learners.
              </p>
            </div>
            <Link
              href="/teach"
              className="px-3.5 py-2 rounded-xl bg-[#34D399] hover:bg-[#059669] text-black font-black font-heading shrink-0 shadow-md transition-all cursor-pointer"
            >
              Write a Quest →
            </Link>
          </div>
        )}

        {/* Question Card */}
        <div className="bg-[#1B1B3A] border border-[#7C3AED]/40 rounded-3xl p-6 sm:p-8 shadow-2xl glow-box-violet relative overflow-hidden">
          <div className="mb-6 space-y-2">
            <div className="flex items-center justify-between text-xs text-[#94A3B8] font-mono">
              <span className="flex items-center gap-1 text-[#22D3EE]">
                <HelpCircle className="w-4 h-4" />
                Thompson Sampling Bandit Active
              </span>
              
              {/* Voice AI Hint Button */}
              <button
                onClick={() => setShowTutorOverlay(true)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7C3AED]/20 hover:bg-[#7C3AED]/40 border border-[#7C3AED]/50 text-[#22D3EE] text-xs font-mono font-bold transition-all shadow-md shadow-[#7C3AED]/20 cursor-pointer animate-pulse"
              >
                <Mic className="w-3.5 h-3.5 text-[#FBBF24]" />
                <span>Voice AI Hint {hintsUsedCount > 0 && `(${hintsUsedCount})`}</span>
              </button>
            </div>

            {/* Peer Quest Learner Tag */}
            {question.isPeerQuest && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#34D399]/20 border border-[#34D399]/40 text-[#34D399] text-[11px] font-mono font-bold">
                <Users className="w-3.5 h-3.5" />
                Written by a learner ({question.authorName || "Learner"})
              </div>
            )}

            <h2 className="text-xl sm:text-2xl font-black text-white font-heading leading-snug">
              {question.prompt}
            </h2>
          </div>

          {/* Tappable Option Cards */}
          <div className="space-y-3 mb-6">
            {question.options.map((option, idx) => {
              let optionStyles =
                "bg-[#0A0A1A] border-white/10 text-slate-200 hover:border-[#22D3EE]/60 hover:bg-[#0A0A1A]/80";

              if (selectedIndex === idx) {
                if (idx === question.correctIndex) {
                  optionStyles = "bg-[#34D399]/20 border-[#34D399] text-[#34D399] glow-box-green font-semibold";
                } else {
                  optionStyles = "bg-red-500/20 border-red-500 text-red-400 font-semibold";
                }
              } else if (isAnswered && idx === question.correctIndex) {
                optionStyles = "bg-[#34D399]/20 border-[#34D399] text-[#34D399] font-semibold";
              } else if (isAnswered) {
                optionStyles = "bg-[#0A0A1A]/40 border-white/5 text-slate-600 opacity-50";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={isAnswered || loadingNext}
                  className={`w-full text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex items-center justify-between text-sm sm:text-base cursor-pointer ${optionStyles}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-mono text-xs font-bold text-slate-300 shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{option}</span>
                  </div>

                  {isAnswered && idx === question.correctIndex && (
                    <CheckCircle2 className="w-6 h-6 text-[#34D399] shrink-0 animate-bounce" />
                  )}
                  {isAnswered && selectedIndex === idx && idx !== question.correctIndex && (
                    <XCircle className="w-6 h-6 text-red-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Feedback & Loading State */}
          {isAnswered && !activeRewardDrop && (
            <div className="space-y-3 pt-2 animate-fadeIn">
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between ${
                  isCorrectChoice
                    ? "bg-[#34D399]/10 border-[#34D399]/40 text-[#34D399]"
                    : "bg-red-500/10 border-red-500/40 text-red-400"
                }`}
              >
                <div className="flex items-center gap-3">
                  {isCorrectChoice ? (
                    <Trophy className="w-6 h-6 shrink-0" />
                  ) : (
                    <XCircle className="w-6 h-6 shrink-0" />
                  )}
                  <div>
                    <p className="font-bold text-sm font-heading">
                      {isCorrectChoice ? "Correct! Sampling Bandit Drop..." : "Incorrect Answer"}
                    </p>
                    <p className="text-xs opacity-90">
                      {question.explanation ||
                        (isCorrectChoice
                          ? "Thompson Sampling selected optimal reward arm."
                          : `Correct option: "${question.options[question.correctIndex]}"`)}
                    </p>
                  </div>
                </div>

                {loadingNext && (
                  <div className="flex items-center gap-2 text-xs font-mono text-[#22D3EE]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">Generating...</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Info Banner & Skill Source Attribution Link */}
        <div className="bg-[#1B1B3A]/60 border border-white/5 rounded-2xl p-4 text-xs text-[#94A3B8] flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Target Flow Band: 70% - 85% Accuracy</span>

          <a
            href={currentSkill.sourceUrl || "https://developer.mozilla.org"}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono font-bold text-[#22D3EE] hover:underline flex items-center gap-1.5 cursor-pointer bg-[#22D3EE]/10 px-3 py-1 rounded-full border border-[#22D3EE]/30"
          >
            <span>Learn more on web source</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Reward Drop Modal */}
      {activeRewardDrop && (
        <RewardModal reward={activeRewardDrop} onClaim={handleClaimReward} />
      )}

      {/* Why? Flow Explanation Modal */}
      {showWhyModal && (
        <FlowExplanationModal
          flowDifficulty={flowDifficulty}
          pKnow={pKnow}
          explanation={flowExplanation}
          onClose={() => setShowWhyModal(false)}
        />
      )}

      {/* Voice AI Tutor Overlay */}
      <TutorOverlay
        isOpen={showTutorOverlay}
        onClose={() => setShowTutorOverlay(false)}
        questionPrompt={question.prompt}
        skillName={currentSkill.name}
        options={question.options}
        onHintRequested={() => setHintsUsedCount((prev) => prev + 1)}
      />

      <BottomNav />
    </main>
  );
}
