"use client";

import { useState, useEffect } from "react";
import { useQuest, RewardDrop } from "@/lib/QuestContext";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import RewardModal from "@/components/RewardModal";
import FlowExplanationModal from "@/components/FlowExplanationModal";
import { Question, QuestionType } from "@/lib/types";
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
  Flame,
  HelpCircle,
  Info,
  Sparkles,
  Mic,
  Users,
  ExternalLink,
  Lightbulb,
  Terminal,
  Bug,
  Globe,
  Scale,
  BookOpen,
} from "lucide-react";
import TutorOverlay from "@/components/TutorOverlay";

export default function QuestPage() {
  const {
    user,
    isAuthLoading,
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
  // showExplanation stays true until the learner explicitly taps "Continue"
  const [showExplanation, setShowExplanation] = useState(false);
  const [loadingNext, setLoadingNext] = useState(false);
  const [activeRewardDrop, setActiveRewardDrop] = useState<RewardDrop | null>(null);
  const [userArms, setUserArms] = useState<RewardArm[]>([]);
  const [lastClaimedArm, setLastClaimedArm] = useState<ArmType | null>(null);

  // Latency tracking
  const [renderTimestamp, setRenderTimestamp] = useState<number>(Date.now());
  const [showWhyModal, setShowWhyModal] = useState(false);
  const [showTutorOverlay, setShowTutorOverlay] = useState(false);
  const [hintsUsedCount, setHintsUsedCount] = useState(0);

  // Question type rotation and anti-repetition tracking
  const [recentTypes, setRecentTypes] = useState<QuestionType[]>([]);
  const [recentPrompts, setRecentPrompts] = useState<string[]>([]);
  const [conceptIntroText, setConceptIntroText] = useState<string | null>(null);
  const [showConceptIntro, setShowConceptIntro] = useState<boolean>(true);

  useEffect(() => {
    setRenderTimestamp(Date.now());
    setHintsUsedCount(0);
    setShowExplanation(false);
    fetchUserArms();

    if (currentQuestion) {
      const qType = currentQuestion.questionType || "concept";
      setRecentTypes((prev) => (prev.includes(qType) ? prev : [...prev.slice(-2), qType]));
      if (currentQuestion.prompt) {
        setRecentPrompts((prev) => (prev.includes(currentQuestion.prompt) ? prev : [...prev.slice(-19), currentQuestion.prompt]));
      }
    }
  }, [currentQuestion, user]);

  useEffect(() => {
    async function fetchConceptPrimer() {
      if (!currentSkill?.name) return;
      try {
        const res = await fetch("/api/concept-intro", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            skillName: currentSkill.name,
            goal: goalText,
            learningStyle: user.learningStyle || "story",
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.conceptIntro) {
            setConceptIntroText(data.conceptIntro);
            setShowConceptIntro(true);
          }
        }
      } catch (e) {
        console.warn("Concept primer fetch notice:", e);
      }
    }
    fetchConceptPrimer();
  }, [activeSkillIndex, user.learningStyle]);

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
    setShowExplanation(true);

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
      setTimeout(() => setDoubtDefeated(false), 1200);
      // Reward modal will appear when learner taps Continue → handleContinueAfterAnswer
    } else {
      setConfidenceMeter((prev) => Math.max(0, prev - 15));
      setDoubtGrip((prev) => Math.min(100, prev + 20));
      // No auto-advance — learner must read the explanation and tap Continue
    }
  };

  // Called when the learner taps "Continue" in the explanation panel
  const handleContinueAfterAnswer = async () => {
    const isCorrect = selectedIndex === question.correctIndex;
    setShowExplanation(false);
    if (isCorrect) {
      const reward = pickBanditRewardDrop();
      setActiveRewardDrop(reward);
    } else {
      await fetchNextQuestion(false);
    }
  };

  const handleClaimReward = async (bonusXp: number = 0) => {
    if (activeRewardDrop) {
      const dropWithBonus =
        bonusXp > 0
          ? { ...activeRewardDrop, xpBonus: (activeRewardDrop.xpBonus || 30) + bonusXp }
          : activeRewardDrop;
      claimReward(dropWithBonus);
      if (activeRewardDrop.arm) {
        setLastClaimedArm(activeRewardDrop.arm);
      }
      setActiveRewardDrop(null);

      // Persist reinforcement attempt to DB with is_reinforcement flag
      if (isSupabaseConfigured() && user?.id) {
        try {
          await supabase.from("attempts").insert({
            user_id: user.id,
            skill_id: currentSkill.id,
            is_correct: bonusXp > 0,
            is_reinforcement: true,
            created_at: new Date().toISOString(),
          });
        } catch (e) {
          console.warn("Reinforcement attempt logging notice:", e);
        }
      }

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
          learningStyle: user.learningStyle || "story",
          recentTypes: recentTypes.slice(-3),
          recentPrompts: recentPrompts.slice(-20),
        }),
      });

      if (res.ok) {
        const nextQ: Question = await res.json();
        if (nextQ && nextQ.prompt && Array.isArray(nextQ.options)) {
          const qType = nextQ.questionType || "concept";
          setRecentTypes((prev) => [...prev.slice(-2), qType]);
          setRecentPrompts((prev) => [...prev.slice(-19), nextQ.prompt]);
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

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A1A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#22D3EE] animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0A1A] bg-grid-pattern text-white relative flex flex-col justify-between pb-24 p-4 sm:p-6 overflow-x-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#7C3AED]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-[#22D3EE]/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-2xl mx-auto space-y-4 z-10 my-auto">
        <TopBar
          title="Adaptive Skill Quest"
          subtitle={`Module ${activeSkillIndex + 1} of ${course?.skills.length || 5}: ${currentSkill.name}`}
        />
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

        {/* Concept Intro Primer Card — Teaches BEFORE Quizzing */}
        {showConceptIntro && conceptIntroText && (
          <div className="bg-gradient-to-r from-[#7C3AED]/20 via-[#1B1B3A] to-[#22D3EE]/20 border border-[#22D3EE]/50 rounded-3xl p-6 shadow-2xl glow-box-cyan space-y-3 animate-fadeIn relative">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-[#22D3EE]/20 border border-[#22D3EE]/40 text-[#22D3EE] text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#FBBF24]" />
                Concept Primer ({user.learningStyle?.toUpperCase() || "STORY"} STYLE)
              </span>
              <button
                onClick={() => setShowConceptIntro(false)}
                className="text-xs font-mono text-slate-400 hover:text-white cursor-pointer px-2 py-0.5 rounded bg-white/5"
              >
                Dismiss ✕
              </button>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white font-heading">
                Module Primer: {currentSkill.name}
              </h3>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed border-l-2 border-[#22D3EE] pl-3">
                {conceptIntroText}
              </p>
            </div>

            <button
              onClick={() => setShowConceptIntro(false)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#22D3EE] hover:from-[#6D28D9] hover:to-[#06B6D4] text-white font-black font-heading text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-[#7C3AED]/30 flex items-center justify-center gap-1.5"
            >
              <span>Got the Concept — Start Skill Quest →</span>
            </button>
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

            {/* Question Type Badge Tag */}
            <div className="flex items-center gap-2 pt-1 pb-1">
              {(() => {
                const qType = question.questionType || "concept";
                const typeBadges: Record<QuestionType, { label: string; icon: any; color: string }> = {
                  concept: { label: "Concept & Definition", icon: Lightbulb, color: "bg-amber-500/20 border-amber-500/40 text-amber-300" },
                  code_output: { label: "Code Output Prediction", icon: Terminal, color: "bg-cyan-500/20 border-cyan-500/40 text-cyan-300" },
                  debug: { label: "Debug & Error Finding", icon: Bug, color: "bg-rose-500/20 border-rose-500/40 text-rose-300" },
                  scenario: { label: "Real-World Scenario", icon: Globe, color: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" },
                  compare: { label: "Concept Comparison", icon: Scale, color: "bg-violet-500/20 border-violet-500/40 text-violet-300" },
                };
                const b = typeBadges[qType] || typeBadges.concept;
                const IconComponent = b.icon;

                return (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-mono font-bold uppercase tracking-wider ${b.color}`}>
                    <IconComponent className="w-3.5 h-3.5" />
                    {b.label}
                  </span>
                );
              })()}

              {/* Peer Quest Learner Tag */}
              {question.isPeerQuest && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#34D399]/20 border border-[#34D399]/40 text-[#34D399] text-[11px] font-mono font-bold uppercase tracking-wider">
                  <Users className="w-3.5 h-3.5" />
                  Learner ({question.authorName || "Contributor"})
                </div>
              )}
            </div>

            {/* Scenario Setup Block */}
            {question.scenarioSetup && (
              <div className="bg-[#0A0A1A]/80 border border-[#22D3EE]/30 rounded-2xl p-4 my-2 text-slate-200 text-sm leading-relaxed shadow-inner">
                <div className="text-[10px] font-mono font-bold text-[#22D3EE] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#22D3EE]" /> Scenario Background
                </div>
                <p className="text-slate-200 text-sm leading-relaxed">{question.scenarioSetup}</p>
              </div>
            )}

            {/* Code Snippet Block */}
            {question.codeSnippet && (
              <div className="bg-[#0A0A1A] border border-white/10 rounded-2xl p-4 my-2 font-mono text-xs sm:text-sm text-[#22D3EE] overflow-x-auto shadow-inner">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[#34D399]">
                    <Terminal className="w-3.5 h-3.5" /> Code Snippet
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">
                    {question.questionType === "debug" ? "Find Error" : "Predict Output"}
                  </span>
                </div>
                <pre className="whitespace-pre-wrap font-mono text-[#22D3EE]">{question.codeSnippet}</pre>
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

          {/* Rich Explanation Panel — stays visible until learner taps Continue */}
          {showExplanation && !activeRewardDrop && (
            <div className="space-y-3 pt-2 animate-fadeIn">
              {isCorrectChoice ? (
                /* ── CORRECT ANSWER PANEL ── */
                <div className="bg-[#34D399]/10 border border-[#34D399]/40 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-3 text-[#34D399]">
                    <CheckCircle2 className="w-6 h-6 shrink-0" />
                    <p className="font-bold font-heading text-sm">Correct! Well done.</p>
                  </div>
                  {/* Per-option explanation for the correct pick */}
                  {question.explanations?.[question.correctIndex] && (
                    <p className="text-sm text-[#34D399]/90 leading-relaxed border-l-2 border-[#34D399]/50 pl-3">
                      {question.explanations[question.correctIndex]}
                    </p>
                  )}
                  {/* Concept summary */}
                  {question.conceptSummary && (
                    <div className="bg-white/5 rounded-xl p-3 space-y-1">
                      <p className="text-[10px] font-mono font-bold text-[#22D3EE] uppercase tracking-wider">📚 Core Concept</p>
                      <p className="text-xs text-slate-300 leading-relaxed">{question.conceptSummary}</p>
                    </div>
                  )}
                  {/* Learn More link */}
                  {currentSkill.sourceUrl && (
                    <a
                      href={currentSkill.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-mono text-[#22D3EE] hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Learn more about this concept
                    </a>
                  )}
                  <button
                    onClick={handleContinueAfterAnswer}
                    disabled={loadingNext}
                    className="w-full mt-1 py-2.5 rounded-xl bg-[#34D399] hover:bg-[#059669] text-black font-black font-heading text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {loadingNext ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Claim Reward & Continue →
                  </button>
                </div>
              ) : (
                /* ── WRONG ANSWER PANEL ── */
                <div className="bg-red-500/10 border border-red-500/40 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-3 text-red-400">
                    <XCircle className="w-6 h-6 shrink-0" />
                    <p className="font-bold font-heading text-sm">Not quite — here's why:</p>
                  </div>
                  {/* Why THEIR choice was wrong */}
                  {selectedIndex !== null && question.explanations?.[selectedIndex] && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-mono font-bold text-red-400/80 uppercase tracking-wider">Your choice: {String.fromCharCode(65 + selectedIndex)}</p>
                      <p className="text-sm text-red-300/90 leading-relaxed border-l-2 border-red-500/50 pl-3">
                        {question.explanations[selectedIndex]}
                      </p>
                    </div>
                  )}
                  {/* Correct answer highlighted */}
                  <div className="bg-[#34D399]/10 border border-[#34D399]/30 rounded-xl p-3 space-y-1">
                    <p className="text-[10px] font-mono font-bold text-[#34D399] uppercase tracking-wider">✓ Correct Answer: {String.fromCharCode(65 + question.correctIndex)}</p>
                    <p className="text-sm font-semibold text-[#34D399]">{question.options[question.correctIndex]}</p>
                    {question.explanations?.[question.correctIndex] && (
                      <p className="text-xs text-[#34D399]/80 leading-relaxed">
                        {question.explanations[question.correctIndex]}
                      </p>
                    )}
                  </div>
                  {/* Concept summary */}
                  {question.conceptSummary && (
                    <div className="bg-white/5 rounded-xl p-3 space-y-1">
                      <p className="text-[10px] font-mono font-bold text-[#22D3EE] uppercase tracking-wider">📚 Core Concept</p>
                      <p className="text-xs text-slate-300 leading-relaxed">{question.conceptSummary}</p>
                    </div>
                  )}
                  {/* Learn More link */}
                  {currentSkill.sourceUrl && (
                    <a
                      href={currentSkill.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-mono text-[#22D3EE] hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Learn more about this concept
                    </a>
                  )}
                  <button
                    onClick={handleContinueAfterAnswer}
                    disabled={loadingNext}
                    className="w-full mt-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black font-heading text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {loadingNext ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Got it — Continue →
                  </button>
                </div>
              )}
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
        <RewardModal reward={activeRewardDrop} question={question} onClaim={handleClaimReward} />
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
        masteryLevel={pKnow}
        onHintRequested={() => setHintsUsedCount((prev) => prev + 1)}
      />

      <BottomNav />
    </main>
  );
}
