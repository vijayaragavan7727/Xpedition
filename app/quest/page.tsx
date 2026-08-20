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
  ArrowRight,
  RotateCcw,
  BookOpen,
  Trophy,
} from "lucide-react";
import TutorOverlay from "@/components/TutorOverlay";
import XpAsset from "@/components/XpAsset";
import { getModuleTheme } from "@/lib/moduleThemes";
import QuestResultsView, { QuestionRecord } from "@/components/QuestResultsView";
import LearningModuleReader, { LearningModuleData } from "@/components/LearningModuleReader";

import LevelNavigationStrip, { LevelStatus } from "@/components/LevelNavigationStrip";
import ShadowChaseTrack from "@/components/ShadowChaseTrack";
import { getShadowMistakes, recordShadowMistake, resolveShadowMistake } from "@/lib/shadowMemory";

export default function QuestPage() {
  const {
    user,
    isAuthLoading,
    course,
    activeSkillIndex,
    currentQuestion,
    flowDifficulty,
    pKnow,
    goalText,
    flowExplanation,
    answerQuestion,
    claimReward,
    setNextQuestion,
  } = useQuest();

  // Learn-Then-Test Platform State
  const [viewMode, setViewMode] = useState<"module" | "test">("module");
  const [moduleData, setModuleData] = useState<LearningModuleData | null>(null);
  const [loadingModule, setLoadingModule] = useState<boolean>(false);

  // Level & Quest Progression State
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [questionNumber, setQuestionNumber] = useState<number>(1); // 1 to 10
  const [sessionAnswers, setSessionAnswers] = useState<QuestionRecord[]>([]);
  const [initialMastery, setInitialMastery] = useState<number>(pKnow || 0.15);
  const [isQuestFinished, setIsQuestFinished] = useState<boolean>(false);

  // Question UI Interaction state
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [loadingNext, setLoadingNext] = useState(false);
  const [activeRewardDrop, setActiveRewardDrop] = useState<RewardDrop | null>(null);
  const [userArms, setUserArms] = useState<RewardArm[]>([]);
  const [lastClaimedArm, setLastClaimedArm] = useState<ArmType | null>(null);

  // Latency & Overlays
  const [renderTimestamp, setRenderTimestamp] = useState<number>(Date.now());
  const [showWhyModal, setShowWhyModal] = useState(false);
  const [showTutorOverlay, setShowTutorOverlay] = useState(false);
  const [hintsUsedCount, setHintsUsedCount] = useState(0);

  // Shadow Escape state
  const [gapDistance, setGapDistance] = useState<number>(6);
  const [shadowMistakes, setShadowMistakes] = useState<string[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const currentSkill = course?.skills[activeSkillIndex] || {
    id: "s1",
    name: "Python Core Syntax & Data Structures",
    difficulty: 1,
  };

  const storageKey = `xpedition_quest_${user?.id || "anon"}_${currentSkill.id}`;

  // 1. Restore Persisted Quest State on Mount / Skill Change
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const savedStr = localStorage.getItem(storageKey);
      if (savedStr) {
        const saved = JSON.parse(savedStr);
        if (saved && typeof saved.questionNumber === "number" && !saved.isCompleted) {
          setQuestionNumber(saved.questionNumber);
          setSessionAnswers(saved.sessionAnswers || []);
          setCurrentLevel(saved.currentLevel || 1);
          setInitialMastery(saved.initialMastery ?? pKnow);
        }
      } else {
        setInitialMastery(pKnow);
      }
    } catch (e) {
      console.warn("Failed restoring quest state:", e);
    }
  }, [currentSkill.id, user?.id]);

  // 2. Persist Quest State to LocalStorage on progress updates
  const persistQuestState = (
    qNum: number,
    answers: QuestionRecord[],
    lvl: number,
    completed: boolean = false
  ) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          questionNumber: qNum,
          sessionAnswers: answers,
          currentLevel: lvl,
          initialMastery,
          isCompleted: completed,
        })
      );
    } catch (e) {
      console.warn("Failed persisting quest state:", e);
    }
  };

  useEffect(() => {
    setRenderTimestamp(Date.now());
    setHintsUsedCount(0);
    setShowExplanation(false);
    fetchUserArms();
  }, [currentQuestion, user]);

  // Init Study Session
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

  const handleSelectOption = (index: number) => {
    if (isAnswered || loadingNext || activeRewardDrop || isQuestFinished) return;
    setSelectedIndex(index);
  };

  const handleSubmitAnswer = async () => {
    if (selectedIndex === null || isAnswered || loadingNext || activeRewardDrop || !currentQuestion) return;

    const clickTimestamp = Date.now();
    const latencyMs = Math.max(100, clickTimestamp - renderTimestamp);

    setIsAnswered(true);
    setShowExplanation(true);

    const clientIsCorrect = Number(selectedIndex) === Number(currentQuestion.correctIndex);
    let finalIsCorrect = clientIsCorrect;

    // Call server-side answer verification guard
    try {
      const res = await fetch("/api/submit-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id || "anonymous-learner",
          skillId: currentSkill.id,
          skillName: currentSkill.name,
          selectedIndex: Number(selectedIndex),
          correctIndex: Number(currentQuestion.correctIndex),
          currentPKnow: pKnow,
          latencyMs,
          hintsUsed: hintsUsedCount,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        finalIsCorrect = Boolean(data.verifiedCorrect);
        answerQuestion(finalIsCorrect, latencyMs, hintsUsedCount);
      } else {
        answerQuestion(clientIsCorrect, latencyMs, hintsUsedCount);
      }
    } catch (err) {
      console.warn("Fallback to client answer evaluation notice:", err);
      answerQuestion(clientIsCorrect, latencyMs, hintsUsedCount);
    }

    // Record question answer record for session review
    const explanationText =
      Array.isArray(currentQuestion.explanations) && currentQuestion.explanations[selectedIndex]
        ? currentQuestion.explanations[selectedIndex]
        : currentQuestion.conceptSummary || "Evaluation specific to concept.";

    const newRecord: QuestionRecord = {
      question: currentQuestion,
      userAnswerIndex: selectedIndex,
      isCorrect: finalIsCorrect,
      explanation: explanationText,
    };

    if (finalIsCorrect) {
      setGapDistance((prev) => Math.min(10, prev + 1));
      resolveShadowMistake(user?.id || "anon", currentSkill.name);
    } else {
      setGapDistance((prev) => Math.max(0, prev - 2));
      recordShadowMistake(
        user?.id || "anon",
        currentQuestion.conceptSummary || currentSkill.name,
        currentSkill.name
      );
    }

    const updatedAnswers = [...sessionAnswers, newRecord];
    setSessionAnswers(updatedAnswers);
    persistQuestState(questionNumber, updatedAnswers, currentLevel, false);

    if (currentSessionId && currentSkill) {
      updateSessionProgress(
        currentSessionId,
        currentSkill.id,
        currentSkill.name,
        finalIsCorrect,
        finalIsCorrect ? 30 : 0
      );
    }

    if (lastClaimedArm && user?.id) {
      recordOutcome(user.id, lastClaimedArm, true, userArms);
      setLastClaimedArm(null);
    }
  };

  // Active Quiz Bank served directly from module data (10 of 12 questions sorted by ascending difficulty)
  const [activeQuizBank, setActiveQuizBank] = useState<Question[]>([]);

  const startTestFromModuleBank = (qList?: Question[]) => {
    const rawBank = qList || moduleData?.questions || [];
    if (rawBank.length === 0) return;

    // Sort by difficulty ascending (1 -> 5)
    const sorted = [...rawBank].sort((a, b) => (a.difficulty || 1) - (b.difficulty || 1));
    // Serve 10 of 12 (keeping 2 in reserve)
    const selectedTen = sorted.slice(0, 10);
    setActiveQuizBank(selectedTen);
    setNextQuestion(selectedTen[0]);
    setViewMode("test");
  };

  // Learner taps "NEXT QUESTION" or "FINISH QUEST" button (NO AUTO-ADVANCING)
  const handleNextQuestionClick = async () => {
    setShowExplanation(false);

    if (questionNumber >= 10) {
      // Finished all 10 questions -> trigger Results Screen
      setIsQuestFinished(true);
      persistQuestState(10, sessionAnswers, currentLevel, true);

      if (currentSessionId) {
        const correctCount = sessionAnswers.filter((a) => a.isCorrect).length;
        const status = correctCount >= 7 ? "completed" : "eliminated";
        closeSession(currentSessionId, status);
      }
    } else {
      // Advance to next question (Question N of 10) from module bank
      const nextNum = questionNumber + 1;
      setQuestionNumber(nextNum);
      if (activeQuizBank[nextNum - 1]) {
        setNextQuestion(activeQuizBank[nextNum - 1]);
      }
      persistQuestState(nextNum, sessionAnswers, currentLevel, false);
      setSelectedIndex(null);
      setIsAnswered(false);
    }
  };

  // Fetch Teaching Module & 12-Question Bank
  useEffect(() => {
    async function fetchModule() {
      if (!currentSkill?.name) return;
      setLoadingModule(true);
      try {
        const res = await fetch("/api/generate-module", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            skillId: currentSkill.id,
            skillName: currentSkill.name,
            level: currentLevel,
            learningStyle: user.learningStyle || "story",
            goal: goalText,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setModuleData(data);
          if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
            const sorted = [...data.questions].sort((a, b) => (a.difficulty || 1) - (b.difficulty || 1));
            setActiveQuizBank(sorted.slice(0, 10));
          }
        }
      } catch (err) {
        console.warn("Failed fetching learning module:", err);
      } finally {
        setLoadingModule(false);
      }
    }

    if (viewMode === "module") {
      fetchModule();
    }
  }, [currentSkill.id, currentLevel, viewMode, user.learningStyle, goalText]);

  const handleRetryLevel = async () => {
    localStorage.removeItem(storageKey);
    setSessionAnswers([]);
    setQuestionNumber(1);
    setIsQuestFinished(false);
    setViewMode("module");
    setSelectedIndex(null);
    setIsAnswered(false);
    setShowExplanation(false);

    // Regenerate fresh question bank from SAME module content
    try {
      const res = await fetch("/api/generate-module", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillId: currentSkill.id,
          skillName: currentSkill.name,
          level: currentLevel,
          learningStyle: user.learningStyle || "story",
          goal: goalText,
          regenerateQuestionsOnly: true,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setModuleData(data);
        if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
          const sorted = [...data.questions].sort((a, b) => (a.difficulty || 1) - (b.difficulty || 1));
          setActiveQuizBank(sorted.slice(0, 10));
        }
      }
    } catch (e) {
      console.warn("Failed regenerating question bank for retry:", e);
    }
  };

  const handleNextLevel = () => {
    localStorage.removeItem(storageKey);
    const nextLvl = currentLevel < 3 ? currentLevel + 1 : 3;
    setCurrentLevel(nextLvl);
    setSessionAnswers([]);
    setQuestionNumber(1);
    setIsQuestFinished(false);
    setViewMode("module");
    setSelectedIndex(null);
    setIsAnswered(false);
    setShowExplanation(false);
  };

  if (isAuthLoading) {
    return (
      <main className="min-h-screen bg-[#000000] bg-grid-pattern p-4 sm:p-6 space-y-4">
        <div className="w-full max-w-2xl mx-auto space-y-4">
          <div className="h-14 bg-[#0D0D1A] border border-white/10 rounded-2xl animate-pulse" />
          <div className="h-20 bg-[#0D0D1A] border border-white/10 rounded-3xl animate-pulse" />
          <div className="h-80 bg-[#0D0D1A] border border-white/10 rounded-3xl animate-pulse" />
        </div>
      </main>
    );
  }

  const mTheme = getModuleTheme(activeSkillIndex + 1);

  return (
    <main className="min-h-screen bg-[#000000] bg-grid-pattern text-white relative flex flex-col justify-between pb-24 p-4 sm:p-6 overflow-x-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#A855F7]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-[#00F0FF]/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-2xl mx-auto space-y-4 z-10 my-auto">
        <TopBar
          title="Adaptive Skill Quest"
          subtitle={`Module ${activeSkillIndex + 1} of ${course?.skills.length || 5}: ${currentSkill.name}`}
        />

        {/* Level Navigation Strip (Level 1 Basics / Level 2 Intermediate / Level 3 Advanced) */}
        <LevelNavigationStrip
          currentLevel={currentLevel}
          levels={[
            {
              level: 1,
              title: "Basics",
              status: currentLevel > 1 ? "PASSED" : viewMode === "test" ? "TEST_PENDING" : "MODULE_UNREAD",
              score: currentLevel > 1 ? 8 : undefined,
            },
            {
              level: 2,
              title: "Intermediate",
              status: currentLevel > 2 ? "PASSED" : currentLevel === 2 ? (viewMode === "test" ? "TEST_PENDING" : "MODULE_UNREAD") : "LOCKED",
              score: currentLevel > 2 ? 8 : undefined,
            },
            {
              level: 3,
              title: "Advanced",
              status: currentLevel === 3 ? (viewMode === "test" ? "TEST_PENDING" : "MODULE_UNREAD") : "LOCKED",
            },
          ]}
          onSelectLevel={(lvl) => {
            if (lvl <= currentLevel) {
              setCurrentLevel(lvl);
              setViewMode("module");
            }
          }}
        />

        {/* 1. RENDER RESULTS SCREEN AFTER QUESTION 10 */}
        {isQuestFinished ? (
          <QuestResultsView
            skillName={currentSkill.name}
            currentLevel={currentLevel}
            sessionAnswers={sessionAnswers}
            initialMastery={initialMastery}
            finalMastery={pKnow}
            onRetryLevel={handleRetryLevel}
            onNextLevel={handleNextLevel}
            nextSkillName={course?.skills[activeSkillIndex + 1]?.name}
            onReviewSection={(secIdx) => {
              setViewMode("module");
              setTimeout(() => {
                const el = document.getElementById(`section-${secIdx}`) || document.getElementById(`section-${secIdx + 1}`);
                if (el) {
                  el.scrollIntoView({ behavior: "smooth" });
                }
              }, 150);
            }}
          />
        ) : viewMode === "module" ? (
          /* 2. RENDER TEACHING MODULE READER FIRST BEFORE TEST */
          loadingModule || !moduleData ? (
            <div className="p-12 text-center bg-[#0D0D1A] border border-white/10 rounded-3xl shadow-2xl space-y-4">
              <Loader2 className="w-8 h-8 text-[#00F0FF] animate-spin mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-white font-heading">
                  Generating Grounded Learning Module...
                </p>
                <p className="text-xs text-slate-400 font-mono">
                  Fetching Tavily Web Sources for Level {currentLevel}: {currentSkill.name}
                </p>
              </div>
            </div>
          ) : (
            <LearningModuleReader
              skillName={currentSkill.name}
              currentLevel={currentLevel}
              learningStyle={user.learningStyle || "story"}
              moduleData={moduleData}
              onStartTest={() => startTestFromModuleBank()}
            />
          )
        ) : (
          /* 3. RENDER 10-QUESTION LEVEL TEST VIEW (1 of 10) */
          <>
            {/* BLACK + NEON QUEST HEADER */}
            <div className="bg-[#0D0D1A] border border-[#00F0FF]/30 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3 glow-cyan">
              <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/40 text-[#00F0FF] font-bold">
                    Level {currentLevel} of 3
                  </span>
                  <span className="text-white font-bold">{currentSkill.name}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[#FFB800] font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> +120 XP
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowWhyModal(true)}
                    className="p-1 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
                    title="View Adaptive AI Engine Status"
                  >
                    <Info className="w-4 h-4 text-[#A855F7]" />
                  </button>
                </div>
              </div>

              {/* Shadow Chase Track (Replaces plain progress bar) */}
              <ShadowChaseTrack
                currentLevel={currentLevel}
                gapDistance={gapDistance}
                rememberedConcepts={getShadowMistakes(user?.id || "anon").map((m) => m.conceptName).slice(0, 2)}
                timeLeftSeconds={currentLevel >= 2 ? 25 : undefined}
              />
            </div>

            {/* SINGLE QUESTION CARD */}
            {currentQuestion && (
              <div className="bg-[#0D0D1A] border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
                {/* Scenario Setup or Question Type Badge */}
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#A855F7]/10 border border-[#A855F7]/40 text-[#A855F7] font-bold uppercase">
                    {currentQuestion.questionType || "Concept Challenge"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowTutorOverlay(true)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/40 text-[#00F0FF] font-bold text-xs hover:bg-[#00F0FF]/20 transition-all cursor-pointer shadow-[0_0_10px_rgba(0,240,255,0.2)]"
                  >
                    <Mic className="w-3.5 h-3.5 animate-pulse" />
                    <span>Voice AI Tutor</span>
                  </button>
                </div>

                {currentQuestion.scenarioSetup && (
                  <div className="p-3.5 rounded-2xl bg-[#000000]/60 border border-white/10 text-xs text-slate-300 leading-relaxed font-sans">
                    <span className="font-bold text-[#00F0FF] block mb-1 font-mono uppercase text-[10px]">
                      Scenario Context:
                    </span>
                    {currentQuestion.scenarioSetup}
                  </div>
                )}

                {/* Prompt Title */}
                <h2 className="text-lg sm:text-xl font-bold text-white font-heading leading-snug">
                  {currentQuestion.prompt}
                </h2>

                {/* Code Snippet Block (If Applicable) */}
                {currentQuestion.codeSnippet && (
                  <pre className="p-4 rounded-2xl bg-[#000000] border border-[#00F0FF]/30 text-xs font-mono text-[#00F0FF] overflow-x-auto shadow-inner">
                    <code>{currentQuestion.codeSnippet}</code>
                  </pre>
                )}

                {/* LARGE CLICKABLE ANSWER CARDS (A, B, C, D) */}
                <div className="space-y-3 pt-2">
                  {currentQuestion.options?.map((optionText, idx) => {
                    const isSelected = selectedIndex === idx;
                    const letter = String.fromCharCode(65 + idx); // A, B, C, D

                    let cardStyle = "bg-[#0D0D1A] border-white/10 text-slate-200 hover:border-[#00F0FF]/50";
                    if (isSelected) {
                      cardStyle = "bg-[#0D0D1A] border-[#00F0FF] text-white shadow-[0_0_20px_rgba(0,240,255,0.3)] glow-cyan";
                    }

                    if (isAnswered) {
                      if (idx === currentQuestion.correctIndex) {
                        cardStyle = "bg-[#0D0D1A] border-[#00FF87] text-white shadow-[0_0_20px_rgba(0,255,135,0.3)] glow-green";
                      } else if (isSelected) {
                        cardStyle = "bg-[#0D0D1A] border-[#FF0055] text-white shadow-[0_0_20px_rgba(255,0,85,0.3)] glow-magenta";
                      }
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectOption(idx)}
                        disabled={isAnswered || loadingNext}
                        className={`w-full min-h-[56px] p-4 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${cardStyle}`}
                      >
                        <div className="flex items-center gap-3.5">
                          <span
                            className={`w-8 h-8 rounded-xl border flex items-center justify-center font-mono font-black text-xs shrink-0 ${
                              isSelected
                                ? "bg-[#00F0FF] text-black border-[#00F0FF]"
                                : "bg-black/40 border-white/10 text-slate-400"
                            }`}
                          >
                            {letter}
                          </span>
                          <span className="text-sm font-medium leading-normal">{optionText}</span>
                        </div>

                        {isAnswered && idx === currentQuestion.correctIndex && (
                          <CheckCircle2 className="w-5 h-5 text-[#00FF87] shrink-0" />
                        )}
                        {isAnswered && isSelected && idx !== currentQuestion.correctIndex && (
                          <XCircle className="w-5 h-5 text-[#FF0055] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* PROMINENT SUBMIT ANSWER BUTTON */}
                {selectedIndex !== null && !isAnswered && (
                  <button
                    type="button"
                    onClick={handleSubmitAnswer}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#00F0FF] via-[#A855F7] to-[#00FF87] text-black font-black font-heading text-sm uppercase tracking-wider shadow-lg hover:brightness-110 transition-all cursor-pointer mt-3 glow-cyan"
                  >
                    Submit Answer →
                  </button>
                )}
              </div>
            )}

            {/* FEEDBACK PANEL & EXPLICIT "NEXT QUESTION" ADVANCE BUTTON */}
            {isAnswered && showExplanation && currentQuestion && (
              <div
                className={`p-5 rounded-3xl border text-left space-y-4 shadow-2xl animate-fadeIn ${
                  selectedIndex === currentQuestion.correctIndex
                    ? "bg-[#0D0D1A] border-[#00FF87]/50 glow-green"
                    : "bg-[#0D0D1A] border-[#FF0055]/50 glow-magenta"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {selectedIndex === currentQuestion.correctIndex ? (
                      <CheckCircle2 className="w-6 h-6 text-[#00FF87]" />
                    ) : (
                      <XCircle className="w-6 h-6 text-[#FF0055]" />
                    )}
                    <span className="text-base font-bold font-heading text-white">
                      {selectedIndex === currentQuestion.correctIndex
                        ? "Correct Answer!"
                        : "Incorrect"}
                    </span>
                  </div>

                  <span
                    className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${
                      selectedIndex === currentQuestion.correctIndex
                        ? "bg-[#00FF87]/10 border-[#00FF87]/40 text-[#00FF87]"
                        : "bg-[#FF0055]/10 border-[#FF0055]/40 text-[#FF0055]"
                    }`}
                  >
                    {selectedIndex === currentQuestion.correctIndex ? "+120 XP" : "+0 XP"}
                  </span>
                </div>

                {/* Educational Explanation */}
                <p className="text-sm text-slate-200 font-sans leading-relaxed">
                  {selectedIndex !== null && Array.isArray(currentQuestion.explanations)
                    ? currentQuestion.explanations[selectedIndex]
                    : currentQuestion.conceptSummary}
                </p>

                {/* Visible BKT Adaptation Feedback Line */}
                <div className="p-3 rounded-2xl bg-[#000000] border border-white/10 text-xs font-mono text-slate-300 space-y-1">
                  <div className="flex items-center justify-between text-[#00F0FF] font-bold">
                    <span>Adaptive BKT Mastery Update:</span>
                    <span>P(know): {Math.round(pKnow * 100)}%</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {selectedIndex === currentQuestion.correctIndex
                      ? `✓ Mastery increased to ${Math.round(pKnow * 100)}%. Next challenge calibrated for Level ${currentLevel}.`
                      : `⚠️ Mastery decreased to ${Math.round(pKnow * 100)}%. System queued target reinforcement.`}
                  </p>
                </div>

                {/* EXPLICIT NEXT BUTTON — NO AUTO-ADVANCE */}
                <button
                  type="button"
                  onClick={handleNextQuestionClick}
                  disabled={loadingNext}
                  className="w-full py-4 rounded-2xl bg-[#00F0FF] text-black font-black font-heading text-sm uppercase tracking-wider shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer glow-cyan"
                >
                  {loadingNext ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Generating Challenge...</span>
                    </>
                  ) : (
                    <>
                      <span>{questionNumber >= 10 ? "Finish Quest & View Results →" : "Next Question →"}</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />

      {/* Voice AI Tutor Overlay Modal */}
      <TutorOverlay
        isOpen={showTutorOverlay}
        onClose={() => setShowTutorOverlay(false)}
        questionPrompt={currentQuestion?.prompt || "Current Question"}
        options={currentQuestion?.options || []}
        skillName={currentSkill.name}
        masteryLevel={Math.round(pKnow * 100)}
        onHintRequested={() => setHintsUsedCount((prev) => prev + 1)}
      />

      {/* Why AI Explanation Modal */}
      {showWhyModal && (
        <FlowExplanationModal
          pKnow={pKnow}
          flowDifficulty={flowDifficulty}
          explanation={flowExplanation}
          onClose={() => setShowWhyModal(false)}
        />
      )}

      {/* Bandit Reward Drop Modal */}
      {activeRewardDrop && (
        <RewardModal
          reward={activeRewardDrop}
          question={currentQuestion}
          onClaim={(bonusXp) => claimReward({ ...activeRewardDrop, xpBonus: (activeRewardDrop.xpBonus || 30) + (bonusXp || 0) })}
        />
      )}
    </main>
  );
}
