"use client";

import React, { useState } from "react";
import { Question } from "@/lib/types";
import {
  Compass,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Loader2,
  Trophy,
  Award,
  Zap,
} from "lucide-react";
import XpAsset from "./XpAsset";

interface PlacementTestModalProps {
  goalTitle: string;
  onComplete: (startingLevel: number, initialPKnow: number, score: number) => void;
  onSkipBeginner: () => void;
}

export default function PlacementTestModal({
  goalTitle,
  onComplete,
  onSkipBeginner,
}: PlacementTestModalProps) {
  const [phase, setPhase] = useState<"experience_check" | "test" | "result">("experience_check");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [resultData, setResultData] = useState<{
    startingLevel: number;
    initialPKnow: number;
    score: number;
  } | null>(null);

  const startPlacementTest = async () => {
    setLoading(true);
    setPhase("test");

    try {
      const res = await fetch("/api/placement-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: goalTitle }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
          setQuestions(data.questions);
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn("Placement test fetch notice:", err);
    }
    setLoading(false);
  };

  const handleSelectOption = (idx: number) => {
    setSelectedIndex(idx);
  };

  const handleNextQuestion = () => {
    if (selectedIndex === null) return;
    const updatedAnswers = [...userAnswers, selectedIndex];
    setUserAnswers(updatedAnswers);
    setSelectedIndex(null);

    if (currentIndex + 1 >= questions.length) {
      // Evaluate Placement Score
      let score = 0;
      questions.forEach((q, qIdx) => {
        if (updatedAnswers[qIdx] === q.correctIndex) {
          score++;
        }
      });

      let startingLevel = 1;
      let initialPKnow = 0.15;

      if (score >= 8) {
        startingLevel = 3; // Advanced
        initialPKnow = 0.85;
      } else if (score >= 4) {
        startingLevel = 2; // Intermediate
        initialPKnow = 0.55;
      } else {
        startingLevel = 1; // Basics
        initialPKnow = 0.15;
      }

      setResultData({ startingLevel, initialPKnow, score });
      setPhase("result");
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const currentQ = questions[currentIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#0D0D1A] border border-[#00F0FF]/50 rounded-3xl p-6 sm:p-8 text-center shadow-2xl overflow-hidden my-auto space-y-5 glow-cyan">
        {/* Background Glows */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-[#A855F7]/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#00F0FF]/30 rounded-full blur-3xl pointer-events-none" />

        {/* PHASE 1: EXPERIENCE CHECK */}
        {phase === "experience_check" && (
          <div className="space-y-5 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/40 text-[#00F0FF] text-xs font-mono font-bold">
              <Compass className="w-4 h-4 text-[#FFB800]" />
              <span>SKILL PLACEMENT ASSESSMENT</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white font-heading">
              Have you studied {goalTitle} before?
            </h2>

            <p className="text-sm text-slate-300">
              We'll customize your skill tree and starting level so you don't waste time repeating what you already know.
            </p>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={onSkipBeginner}
                className="w-full p-4 rounded-2xl bg-[#000000] border border-white/10 text-left hover:border-[#00F0FF] transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white font-heading">🌱 Complete Beginner</h3>
                    <p className="text-xs text-slate-400">Start from scratch at Level 1 (Basics)</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-[#00F0FF] transition-all" />
                </div>
              </button>

              <button
                type="button"
                onClick={startPlacementTest}
                className="w-full p-4 rounded-2xl bg-[#000000] border border-[#00F0FF]/50 text-left hover:border-[#00F0FF] transition-all cursor-pointer group glow-cyan"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white font-heading">⚡ Some Experience / Experienced</h3>
                    <p className="text-xs text-[#00F0FF]">Take a 10-question placement test to skip basics</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#00F0FF]" />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* PHASE 2: PLACEMENT TEST QUIZ */}
        {phase === "test" && (
          <div className="space-y-5 text-left">
            {loading ? (
              <div className="py-12 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-[#00F0FF] animate-spin mx-auto" />
                <p className="text-xs font-mono text-slate-300">Generating placement test for {goalTitle}...</p>
              </div>
            ) : (
              currentQ && (
                <>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#00F0FF] font-bold">
                      Placement Question {currentIndex + 1} of {questions.length}
                    </span>
                    <span className="text-slate-400">Level {currentQ.difficulty || 1}</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-[#000000] border border-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#00F0FF] transition-all duration-300"
                      style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                    />
                  </div>

                  <h3 className="text-lg font-bold text-white font-heading leading-snug">
                    {currentQ.prompt}
                  </h3>

                  {currentQ.codeSnippet && (
                    <pre className="p-3 rounded-xl bg-[#000000] border border-white/10 text-xs font-mono text-[#00F0FF] overflow-x-auto">
                      <code>{currentQ.codeSnippet}</code>
                    </pre>
                  )}

                  {/* Option Choices */}
                  <div className="space-y-2.5 pt-1">
                    {currentQ.options?.map((opt, idx) => {
                      const isSelected = selectedIndex === idx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectOption(idx)}
                          className={`w-full min-h-[48px] p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                            isSelected
                              ? "bg-[#00F0FF]/10 border-[#00F0FF] text-white shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                              : "bg-[#000000] border-white/10 text-slate-300 hover:border-white/30"
                          }`}
                        >
                          <span className="text-xs font-medium">{opt}</span>
                          <span
                            className={`w-6 h-6 rounded-lg border flex items-center justify-center font-mono text-[10px] font-bold ${
                              isSelected ? "bg-[#00F0FF] text-black border-[#00F0FF]" : "border-white/10 text-slate-500"
                            }`}
                          >
                            {String.fromCharCode(65 + idx)}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    disabled={selectedIndex === null}
                    className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      selectedIndex !== null
                        ? "bg-[#00F0FF] text-black hover:brightness-110 glow-cyan"
                        : "bg-white/10 text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    <span>{currentIndex + 1 >= questions.length ? "Submit Placement Test →" : "Next Question →"}</span>
                  </button>
                </>
              )
            )}
          </div>
        )}

        {/* PHASE 3: PLACEMENT RESULT */}
        {phase === "result" && resultData && (
          <div className="space-y-5 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#00FF87]/20 border border-[#00FF87] flex items-center justify-center mx-auto text-[#00FF87]">
              <Trophy className="w-8 h-8" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white font-heading">
              Placement Complete!
            </h2>

            <div className="p-4 rounded-2xl bg-[#000000] border border-[#00F0FF]/40 text-left space-y-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Diagnostic Result</span>
              <p className="text-sm text-white font-semibold">
                You scored <span className="text-[#00FF87] font-bold">{resultData.score}/10</span> on the placement test.
              </p>
              <p className="text-xs text-[#00F0FF]">
                {resultData.startingLevel === 3
                  ? "🔥 Exceptional! We're starting you at Level 3 (Advanced Mastery) and marking Basics & Intermediate as passed."
                  : resultData.startingLevel === 2
                  ? "⚡ Great performance! We're starting you at Level 2 (Intermediate) and focusing on weak areas."
                  : "🌱 Based on your placement test, we're starting you at Level 1 (Basics) for a solid foundation."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onComplete(resultData.startingLevel, resultData.initialPKnow, resultData.score)}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#00FF87] via-[#00F0FF] to-[#A855F7] text-black font-black text-sm uppercase tracking-wider shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer glow-cyan"
            >
              <span>Build Custom Skill Tree →</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
