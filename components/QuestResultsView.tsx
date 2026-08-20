"use client";

import React, { useState } from "react";
import { Question } from "@/lib/types";
import {
  Trophy,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowRight,
  Sparkles,
  TrendingUp,
  TrendingDown,
  BookOpen,
  Award,
  AlertTriangle,
} from "lucide-react";
import XpAsset from "./XpAsset";

export interface QuestionRecord {
  question: Question;
  userAnswerIndex: number;
  isCorrect: boolean;
  explanation: string;
}

interface QuestResultsViewProps {
  skillName: string;
  currentLevel: number;
  sessionAnswers: QuestionRecord[];
  initialMastery: number;
  finalMastery: number;
  onRetryLevel: () => void;
  onNextLevel: () => void;
  onReviewSection?: (sectionIndex: number) => void;
}

export default function QuestResultsView({
  skillName,
  currentLevel,
  sessionAnswers,
  initialMastery,
  finalMastery,
  onRetryLevel,
  onNextLevel,
  onReviewSection,
}: QuestResultsViewProps) {
  const [filterMode, setFilterMode] = useState<"all" | "wrong">("all");

  const totalQuestions = sessionAnswers.length || 10;
  const correctCount = sessionAnswers.filter((a) => a.isCorrect).length;
  const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
  const isPassed = correctCount >= 7;

  const filteredAnswers =
    filterMode === "wrong"
      ? sessionAnswers.filter((a) => !a.isCorrect)
      : sessionAnswers;

  const masteryBeforePct = Math.round(initialMastery * 100);
  const masteryAfterPct = Math.round(finalMastery * 100);
  const masteryDelta = masteryAfterPct - masteryBeforePct;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5 animate-fadeIn">
      {/* 1. Header Banner: Pass vs Need Practice */}
      <div
        className={`p-6 rounded-3xl border shadow-2xl text-center space-y-3 relative overflow-hidden ${
          isPassed
            ? "bg-[#0D0D1A] border-[#00FF87]/50 shadow-[0_0_30px_rgba(0,255,135,0.2)]"
            : "bg-[#0D0D1A] border-[#FF0055]/50 shadow-[0_0_30px_rgba(255,0,85,0.2)]"
        }`}
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#000000] border border-white/10 text-xs font-mono font-bold">
          <XpAsset
            name={isPassed ? "crown" : "target"}
            alt="Status Icon"
            width={20}
            height={20}
            className={isPassed ? "text-[#FFB800]" : "text-[#FF0055]"}
          />
          <span className="text-white">
            Level {currentLevel} • {isPassed ? "PASSED" : "NEEDS PRACTICE"}
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-white font-heading">
          {isPassed ? "🎉 Quest Complete!" : "⚠️ Level Not Passed"}
        </h1>

        <p className="text-sm text-slate-300 max-w-md mx-auto">
          {isPassed
            ? `Fantastic work! You scored ${correctCount}/${totalQuestions} (${scorePercentage}%) and unlocked the next challenge.`
            : `You scored ${correctCount}/${totalQuestions} (${scorePercentage}%). The pass threshold is 7/10. Review your missed concepts below and retry!`}
        </p>

        {/* Score & Mastery Badges */}
        <div className="grid grid-cols-2 gap-3 pt-2 max-w-md mx-auto">
          <div className="bg-[#000000]/80 p-3 rounded-2xl border border-white/10 text-left">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Score</span>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl font-black font-mono ${isPassed ? "text-[#00FF87]" : "text-[#FF0055]"}`}>
                {correctCount} / {totalQuestions}
              </span>
              <span className="text-xs text-slate-400 font-mono">({scorePercentage}%)</span>
            </div>
          </div>

          <div className="bg-[#000000]/80 p-3 rounded-2xl border border-white/10 text-left">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">BKT Mastery P(know)</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-white font-mono">{masteryBeforePct}%</span>
              <span className="text-xs text-slate-400">→</span>
              <span className={`text-xl font-black font-mono ${masteryDelta >= 0 ? "text-[#00FF87]" : "text-[#FF0055]"}`}>
                {masteryAfterPct}%
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          {isPassed ? (
            <button
              type="button"
              onClick={onNextLevel}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#00FF87] via-[#00F0FF] to-[#A855F7] text-black font-black text-sm uppercase tracking-wider shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{currentLevel < 3 ? `Continue to Level ${currentLevel + 1} →` : "Explore Skill Tree →"}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onRetryLevel}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#FF0055] text-white font-black text-sm uppercase tracking-wider shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer glow-magenta"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Retry Level {currentLevel} (Fresh Questions) →</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Review List Filter & Section Header */}
      <div className="bg-[#0D0D1A] border border-white/10 rounded-3xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#00F0FF]" />
            <h2 className="text-lg font-bold text-white font-heading">Question Review</h2>
          </div>

          <div className="flex border border-white/10 rounded-xl p-0.5 bg-[#000000]">
            <button
              type="button"
              onClick={() => setFilterMode("all")}
              className={`px-3 py-1 text-xs font-mono font-bold rounded-lg transition-all ${
                filterMode === "all" ? "bg-[#00F0FF] text-black" : "text-slate-400 hover:text-white"
              }`}
            >
              All ({sessionAnswers.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("wrong")}
              className={`px-3 py-1 text-xs font-mono font-bold rounded-lg transition-all ${
                filterMode === "wrong" ? "bg-[#FF0055] text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Missed ({sessionAnswers.filter((a) => !a.isCorrect).length})
            </button>
          </div>
        </div>

        {/* Question Cards Review List */}
        <div className="space-y-3">
          {filteredAnswers.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-400 font-mono bg-[#000000]/40 rounded-2xl border border-white/5">
              {filterMode === "wrong" ? "🎉 Perfect score! No missed questions to review." : "No question records found."}
            </div>
          ) : (
            filteredAnswers.map((rec, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border text-left space-y-2.5 transition-all ${
                  rec.isCorrect
                    ? "bg-[#000000]/60 border-[#00FF87]/30"
                    : "bg-[#000000]/80 border-[#FF0055]/50 shadow-[0_0_15px_rgba(255,0,85,0.1)]"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {rec.isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-[#00FF87] shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-[#FF0055] shrink-0" />
                    )}
                    <span className="text-xs font-mono font-bold text-slate-300">
                      Q{idx + 1}. {rec.question.questionType || "Concept"}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      rec.isCorrect
                        ? "bg-[#00FF87]/10 border-[#00FF87]/40 text-[#00FF87]"
                        : "bg-[#FF0055]/10 border-[#FF0055]/40 text-[#FF0055]"
                    }`}
                  >
                    {rec.isCorrect ? "CORRECT" : "MISSED"}
                  </span>
                </div>

                <p className="text-sm font-semibold text-white leading-relaxed">
                  {rec.question.prompt}
                </p>

                {rec.question.codeSnippet && (
                  <pre className="p-2.5 rounded-xl bg-[#0A0A1A] border border-white/10 text-xs font-mono text-[#00F0FF] overflow-x-auto">
                    <code>{rec.question.codeSnippet}</code>
                  </pre>
                )}

                <div className="space-y-1.5 pt-1 text-xs font-mono">
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="text-slate-500">Your choice:</span>
                    <span className={rec.isCorrect ? "text-[#00FF87] font-bold" : "text-[#FF0055] font-bold"}>
                      {rec.question.options?.[rec.userAnswerIndex] || `Option ${rec.userAnswerIndex}`}
                    </span>
                  </div>

                  {!rec.isCorrect && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <span className="text-slate-500">Correct answer:</span>
                      <span className="text-[#00FF87] font-bold">
                        {rec.question.options?.[rec.question.correctIndex] || `Option ${rec.question.correctIndex}`}
                      </span>
                    </div>
                  )}
                </div>

                {rec.explanation && (
                  <div className="p-3 rounded-xl bg-[#0D0D1A] border border-white/10 text-xs text-slate-300 leading-relaxed font-sans mt-2 space-y-2">
                    <div>
                      <span className="font-bold text-[#00F0FF] block mb-0.5">Explanation:</span>
                      {rec.explanation}
                    </div>

                    {!rec.isCorrect && (
                      <button
                        type="button"
                        onClick={() => {
                          const secIdx = typeof rec.question.sourceSection === "number" ? rec.question.sourceSection : (idx % 4);
                          if (onReviewSection) {
                            onReviewSection(secIdx);
                          } else {
                            onRetryLevel();
                          }
                        }}
                        className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-[#00F0FF] bg-[#00F0FF]/10 border border-[#00F0FF]/30 px-3 py-1.5 rounded-xl hover:bg-[#00F0FF]/20 hover:border-[#00F0FF] transition-all cursor-pointer mt-1"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-[#00FF87]" />
                        <span>
                          Review: Section {(typeof rec.question.sourceSection === "number" ? rec.question.sourceSection : (idx % 4)) + 1} ({skillName}) →
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
