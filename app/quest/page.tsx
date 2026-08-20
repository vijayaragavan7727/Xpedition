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
import {
  getOrStartSession,
  updateSessionProgress,
  closeSession,
} from "@/lib/studySessions";
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
  ShieldAlert,
} from "lucide-react";
import TutorOverlay from "@/components/TutorOverlay";
import SquidAsset from "@/components/SquidAsset";
import { getModuleTheme } from "@/lib/moduleThemes";
import ModuleTransitionModal from "@/components/ModuleTransitionModal";

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
  const [showModuleTransition, setShowModuleTransition] = useState<boolean>(true);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  useEffect(() => {
    setShowModuleTransition(true);
  }, [activeSkillIndex]);

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

  // Init / Resume Study Session for current quest
  useEffect(() => {
    let sessId: string | null = null;
    async function initSession() {
      if (!user?.id || !currentSkill?.id) return;
      const sess = await getOrStartSession(
        user.id,
        goalText || "goal-default",
        course?.title || "Python Mastery",
        currentSkill.id,
        currentSkill.name
      );
      if (sess?.id) {
        setCurrentSessionId(sess.id);
        sessId = sess.id;
      }
    }

    initSession();

    const handleBeforeUnload = () => {
      if (sessId) {
        closeSession(sessId, "abandoned");
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (sessId) {
        closeSession(sessId, "abandoned");
      }
    };
  }, [user.id, activeSkillIndex, course]);

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

    // Default fallback arms with equal priors (alpha = 1, beta = 1)
    setUserArms(
      BANDIT_ARMS.map((arm) => ({
        arm,
        alpha: 1,
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

  // Thompson Sampling arm picker (First 8 rewards force exploration across all 4 arms twice)
  const pickBanditRewardDrop = (): RewardDrop => {
    const selected = selectArm(userArms);
    const arm: ArmType = user?.cohort === "control" ? "badge" : selected.arm;

    // Increment pulls count state for selected arm
    setUserArms((prev) =>
      prev.map((a) => (a.arm === arm ? { ...a, pulls: (a.pulls || 0) + 1 } : a))
    );

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
    setSelectedIndex(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedIndex === null || isAnswered || loadingNext || activeRewardDrop) return;

    const clickTimestamp = Date.now();
    const latencyMs = Math.max(100, clickTimestamp - renderTimestamp);

    setIsAnswered(true);
    setShowExplanation(true);

    const isCorrect = selectedIndex === question.correctIndex;
    answerQuestion(isCorrect, latencyMs, hintsUsedCount);

    if (currentSessionId && currentSkill) {
      updateSessionProgress(
        currentSessionId,
        currentSkill.id,
        currentSkill.name,
        isCorrect,
        isCorrect ? 30 : 0
      );
    }

    if (lastClaimedArm && user?.id) {
      recordOutcome(user.id, lastClaimedArm, true, userArms);
      setLastClaimedArm(null);
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
      <main className="min-h-screen bg-[#0A0A1A] bg-grid-pattern p-4 sm:p-6 space-y-4">
        <div className="w-full max-w-2xl mx-auto space-y-4">
          <div className="h-14 bg-[#1B1B3A] border border-white/10 rounded-2xl animate-pulse" />
          <div className="h-20 bg-[#1B1B3A] border border-white/10 rounded-3xl animate-pulse" />
          <div className="h-80 bg-[#1B1B3A] border border-white/10 rounded-3xl animate-pulse" />
        </div>
      </main>
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
              {/* Learner Avatar Silhouette */}
              <div className="flex flex-col items-center space-y-1">
                <SquidAsset name="player_avatar" alt="Player 456 Tracksuit Avatar" width={56} height={56} className="shrink-0" />
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
        {/* Premium Black + Neon Quest Header */}
        {(() => {
          const activeModuleTheme = getModuleTheme(activeSkillIndex);
          return (
            <header className="bg-[#0D0D1A] border border-[#00F0FF]/30 rounded-3xl p-5 shadow-2xl space-y-3 glow-cyan">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5 truncate">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#00F0FF] uppercase tracking-wider">
                      Module {activeSkillIndex + 1}:
                    </span>
                    <h1 className="text-base font-black text-white font-heading truncate">
                      {currentSkill.name.toUpperCase()}
                    </h1>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                    <span>Adaptive Challenge</span>
                    <span>•</span>
                    <span className="text-[#A855F7] font-bold">Flow: Level {flowDifficulty}</span>
                  </div>
                </div>

                {/* Available XP Badge */}
                <div className="px-3.5 py-1.5 rounded-full bg-[#FFB800]/15 border border-[#FFB800]/40 text-[#FFB800] font-mono text-xs font-bold shrink-0 flex items-center gap-1.5 shadow-md">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>+120 XP available</span>
                </div>
              </div>

              {/* Progress Bar & Question Counter */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[11px] font-mono font-bold">
                  <span className="text-slate-300">Question {Math.min(10, activeSkillIndex * 2 + 1)} / 10</span>
                  <span className="text-[#00F0FF]">P(know): {(pKnow * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full h-2.5 bg-[#000000] rounded-full overflow-hidden border border-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-[#00F0FF] via-[#A855F7] to-[#00FF87] transition-all duration-500 rounded-full"
                    style={{ width: `${Math.min(100, Math.max(10, pKnow * 100))}%` }}
                  />
                </div>
              </div>
            </header>
          );
        })()}

        {/* Mastery Threshold Peer-Teach Banner */}
        {pKnow >= 0.85 && (
          <div className="bg-[#00FF87]/15 border border-[#00FF87]/40 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs animate-fadeIn glow-green">
            <div className="space-y-0.5">
              <span className="font-bold text-[#00FF87] font-heading block">
                🎉 Mastery Threshold Unlocked! (P(know): {(pKnow * 100).toFixed(0)}%)
              </span>
              <p className="text-slate-200">
                You've mastered this concept! Write a quest question for fellow learners.
              </p>
            </div>
            <Link
              href="/teach"
              className="px-3.5 py-2 rounded-xl bg-[#00FF87] hover:bg-[#00D06C] text-black font-black font-heading shrink-0 shadow-md transition-all cursor-pointer"
            >
              Write a Quest →
            </Link>
          </div>
        )}

        {/* Concept Intro Primer Card — Teaches BEFORE Quizzing */}
        {showConceptIntro && conceptIntroText && (
          <div className="bg-[#0D0D1A] border border-[#00F0FF]/40 rounded-3xl p-6 shadow-2xl glow-cyan space-y-3 animate-fadeIn relative">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 truncate">
                <span className="px-3 py-1 rounded-full bg-[#00F0FF]/20 border border-[#00F0FF]/40 text-[#00F0FF] text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 truncate">
                  <BookOpen className="w-3.5 h-3.5 text-[#FFB800] shrink-0" />
                  Concept Primer ({user.learningStyle?.toUpperCase() || "STORY"} STYLE)
                </span>
              </div>
              <button
                onClick={() => setShowConceptIntro(false)}
                className="text-xs font-mono text-slate-400 hover:text-white cursor-pointer px-2 py-0.5 rounded bg-white/5 shrink-0"
              >
                Dismiss ✕
              </button>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white font-heading">
                Module Primer: {currentSkill.name}
              </h3>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed border-l-2 border-[#00F0FF] pl-3">
                {conceptIntroText}
              </p>
            </div>

            <button
              onClick={() => setShowConceptIntro(false)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#A855F7] to-[#00F0FF] hover:opacity-95 text-black font-black font-heading text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
            >
              <span>Got the Concept — Start Skill Quest →</span>
            </button>
          </div>
        )}

        {/* Question Card */}
        <div className="bg-[#0D0D1A] border border-[#A855F7]/40 rounded-3xl p-6 sm:p-8 shadow-2xl glow-purple relative overflow-hidden">
          <div className="mb-6 space-y-3">
            <div className="flex items-center justify-between text-xs text-[#94A3B8] font-mono">
              <span className="flex items-center gap-1 text-[#00F0FF]">
                <HelpCircle className="w-4 h-4" />
                Adaptive AI Tutor Active
              </span>
              
              {/* Voice AI Hint Button */}
              <button
                onClick={() => setShowTutorOverlay(true)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#A855F7]/20 hover:bg-[#A855F7]/40 border border-[#A855F7]/50 text-[#00F0FF] text-xs font-mono font-bold transition-all shadow-md cursor-pointer animate-pulse"
              >
                <Mic className="w-3.5 h-3.5 text-[#FFB800]" />
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
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00FF87]/20 border border-[#00FF87]/40 text-[#00FF87] text-[11px] font-mono font-bold uppercase tracking-wider">
                  <Users className="w-3.5 h-3.5" />
                  Learner ({question.authorName || "Contributor"})
                </div>
              )}
            </div>

            {/* Scenario Setup Block */}
            {question.scenarioSetup && (
              <div className="bg-[#000000]/80 border border-[#00F0FF]/30 rounded-2xl p-4 my-2 text-slate-200 text-sm leading-relaxed shadow-inner">
                <div className="text-[10px] font-mono font-bold text-[#00F0FF] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#00F0FF]" /> Scenario Background
                </div>
                <p className="text-slate-200 text-sm leading-relaxed">{question.scenarioSetup}</p>
              </div>
            )}

            {/* Code Snippet Block */}
            {question.codeSnippet && (
              <div className="bg-[#000000] border border-white/10 rounded-2xl p-4 my-2 font-mono text-xs sm:text-sm text-[#00F0FF] overflow-x-auto shadow-inner">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[#00FF87]">
                    <Terminal className="w-3.5 h-3.5" /> Code Snippet
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">
                    {question.questionType === "debug" ? "Find Error" : "Predict Output"}
                  </span>
                </div>
                <pre className="whitespace-pre-wrap font-mono text-[#00F0FF]">{question.codeSnippet}</pre>
              </div>
            )}

            <h2 className="text-xl sm:text-2xl font-black text-white font-heading leading-snug">
              {question.prompt}
            </h2>
          </div>

          {/* Large Clickable Answer Cards (A, B, C, D) */}
          <div className="space-y-3 mb-6">
            {question.options.map((option, idx) => {
              const isSelected = selectedIndex === idx;
              let optionStyles =
                "bg-[#000000] border-white/10 text-slate-200 hover:border-[#00F0FF]/50 hover:bg-[#0D0D1A]";

              if (isSelected) {
                if (!isAnswered) {
                  optionStyles = "bg-[#0D0D1A] border-[#00F0FF] text-[#00F0FF] glow-cyan font-bold ring-2 ring-[#00F0FF]/50";
                } else if (idx === question.correctIndex) {
                  optionStyles = "bg-[#00FF87]/20 border-[#00FF87] text-[#00FF87] glow-green font-bold";
                } else {
                  optionStyles = "bg-[#FF0055]/20 border-[#FF0055] text-[#FF0055] glow-magenta font-bold";
                }
              } else if (isAnswered && idx === question.correctIndex) {
                optionStyles = "bg-[#00FF87]/20 border-[#00FF87] text-[#00FF87] font-bold";
              } else if (isAnswered) {
                optionStyles = "bg-[#000000]/40 border-white/5 text-slate-600 opacity-50";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={isAnswered || loadingNext}
                  className={`w-full text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex items-center justify-between text-sm sm:text-base cursor-pointer min-h-[56px] ${optionStyles}`}
                >
                  <div className="flex items-center gap-3.5">
                    <span
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center font-mono text-sm font-black shrink-0 transition-colors ${
                        isSelected
                          ? "bg-[#00F0FF] text-black border-[#00F0FF]"
                          : "bg-white/5 border-white/10 text-slate-300"
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="font-medium leading-relaxed">{option}</span>
                  </div>

                  {isAnswered && idx === question.correctIndex && (
                    <CheckCircle2 className="w-6 h-6 text-[#00FF87] shrink-0 animate-bounce" />
                  )}
                  {isAnswered && isSelected && idx !== question.correctIndex && (
                    <XCircle className="w-6 h-6 text-[#FF0055] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Prominent SUBMIT ANSWER Button */}
          {selectedIndex !== null && !isAnswered && (
            <button
              onClick={handleSubmitAnswer}
              className="w-full py-4 px-6 min-h-[50px] rounded-2xl bg-gradient-to-r from-[#00F0FF] via-[#A855F7] to-[#00FF87] hover:opacity-95 text-black font-black text-sm uppercase tracking-wider transition-all shadow-xl shadow-[#00F0FF]/30 flex items-center justify-center gap-2 cursor-pointer font-heading my-4 animate-fadeIn"
            >
              <span>Submit Answer →</span>
            </button>
          )}

          {/* Rich Explanation Panel — stays visible until learner taps Continue */}
          {showExplanation && !activeRewardDrop && (
            <div className="space-y-3 pt-2 animate-fadeIn">
              {isCorrectChoice ? (
                /* ── CORRECT ANSWER PANEL ── */
                <div className="bg-[#34D399]/10 border border-[#34D399]/40 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between text-[#34D399]">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 shrink-0" />
                      <p className="font-bold font-heading text-sm">Correct! Well done.</p>
                    </div>
                  </div>

                  {/* Visible Adaptation Line */}
                  <div className="bg-[#22D3EE]/15 border border-[#22D3EE]/40 rounded-xl p-2.5 flex items-center gap-2 text-xs font-mono text-[#22D3EE]">
                    <Sparkles className="w-4 h-4 text-[#FBBF24] shrink-0" />
                    <span>
                      Visible Adaptation: Mastery increased to {Math.round(pKnow * 100)}% P(know). Flow calibrated to Level {flowDifficulty}.
                    </span>
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
                    className="w-full mt-1 py-3 rounded-xl bg-[#00FF87] hover:bg-[#00D06C] text-black font-black font-heading text-sm uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-[#00FF87]/20"
                  >
                    {loadingNext ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Continue Quest →
                  </button>
                </div>
              ) : (
                /* ── WRONG ANSWER PANEL ── */
                <div className="bg-[#FF0055]/10 border border-[#FF0055]/40 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-3 text-[#FF0055]">
                    <XCircle className="w-6 h-6 shrink-0" />
                    <p className="font-bold font-heading text-sm">Not quite — here's why:</p>
                  </div>

                  {/* Visible Adaptation Line */}
                  <div className="bg-[#FB7185]/15 border border-[#FB7185]/40 rounded-xl p-2.5 flex items-center gap-2 text-xs font-mono text-[#FB7185]">
                    <ShieldAlert className="w-4 h-4 text-[#FB7185] shrink-0" />
                    <span>
                      Visible Adaptation: Targeted reinforcement active for {currentSkill.name}. Calibrated to Level {flowDifficulty}.
                    </span>
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

      {/* Cinematic Module Entry Transition Modal */}
      {showModuleTransition && (
        <ModuleTransitionModal
          moduleIndex={activeSkillIndex}
          moduleName={currentSkill.name}
          onComplete={() => setShowModuleTransition(false)}
        />
      )}

      <BottomNav />
    </main>
  );
}
