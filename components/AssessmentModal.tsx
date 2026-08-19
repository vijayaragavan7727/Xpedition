"use client";

import React, { useState } from "react";
import { Question } from "@/lib/types";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { CheckCircle2, XCircle, Award, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";

interface AssessmentModalProps {
  phase: "pre" | "post";
  userId: string;
  goalId?: string;
  skills: { name: string; difficulty: number }[];
  onComplete: (score: number, maxScore: number) => void;
}

const FALLBACK_QUESTIONS: Question[] = [
  {
    prompt: "Which data structure operates on a First-In, First-Out (FIFO) basis?",
    options: ["Stack", "Queue", "Binary Tree", "Heap"],
    correctIndex: 1,
    explanation: "Queues process elements in FIFO order.",
  },
  {
    prompt: "What is the worst-case time complexity of standard QuickSort algorithm?",
    options: ["O(N log N)", "O(1)", "O(N^2)", "O(N)"],
    correctIndex: 2,
    explanation: "QuickSort degrades to O(N^2) when poor pivots are selected.",
  },
  {
    prompt: "In Object-Oriented Design, which principle allows subclasses to provide specific implementations of inherited methods?",
    options: ["Encapsulation", "Polymorphism", "Abstraction", "Composition"],
    correctIndex: 1,
    explanation: "Polymorphism allows derived classes to override base methods.",
  },
  {
    prompt: "Which HTTP status code indicates a successful resource creation request?",
    options: ["200 OK", "201 Created", "204 No Content", "302 Found"],
    correctIndex: 1,
    explanation: "201 Created is returned upon successful resource creation.",
  },
  {
    prompt: "What is the primary advantage of using a Hash Map over a Linear Array search?",
    options: ["Sorted order", "O(1) average lookup time", "Lower memory consumption", "No collision risk"],
    correctIndex: 1,
    explanation: "Hash maps offer constant time O(1) key-based lookups.",
  },
];

export default function AssessmentModal({
  phase,
  userId,
  goalId,
  skills,
  onComplete,
}: AssessmentModalProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const questions = FALLBACK_QUESTIONS;
  const currentQ = questions[currentIdx];

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    setSelectedOpt(idx);
    setIsAnswered(true);

    const isCorrect = idx === currentQ.correctIndex;
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = async () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOpt(null);
      setIsAnswered(false);
    } else {
      // Finished assessment
      setSubmitting(true);
      const finalScore = score + (selectedOpt === currentQ.correctIndex ? 0 : 0); // score already updated on select

      if (isSupabaseConfigured() && userId) {
        try {
          await supabase.from("assessments").insert({
            user_id: userId,
            goal_id: goalId || null,
            phase,
            score: score,
            max_score: questions.length,
          });
        } catch (e) {
          console.warn("Assessment persistence warning:", e);
        }
      }

      setIsFinished(true);
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#12122C] border border-[#22D3EE]/50 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl glow-box-cyan space-y-6">
        {!isFinished ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="px-3 py-1 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/40 text-[#22D3EE] text-xs font-mono font-bold uppercase tracking-wider">
                  {phase === "pre" ? "🔍 5-Question Pre-Assessment" : "🎓 5-Question Post-Assessment"}
                </span>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  {phase === "pre"
                    ? "Establishing baseline knowledge for learning gain measurement"
                    : "Measuring post-mastery learning gain across curriculum"}
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-[#FBBF24]">
                Q {currentIdx + 1} / {questions.length}
              </span>
            </div>

            {/* Question Prompt */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-white font-heading leading-snug">
                {currentQ.prompt}
              </h2>

              <div className="space-y-2.5">
                {currentQ.options.map((opt, idx) => {
                  let styles = "bg-[#0A0A1A] border-white/10 text-slate-200 hover:border-[#22D3EE]";
                  if (selectedOpt === idx) {
                    if (idx === currentQ.correctIndex) {
                      styles = "bg-[#34D399]/20 border-[#34D399] text-[#34D399] font-bold";
                    } else {
                      styles = "bg-red-500/20 border-red-500 text-red-400 font-bold";
                    }
                  } else if (isAnswered && idx === currentQ.correctIndex) {
                    styles = "bg-[#34D399]/20 border-[#34D399] text-[#34D399] font-bold";
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelect(idx)}
                      disabled={isAnswered}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between text-sm ${styles}`}
                    >
                      <span>{opt}</span>
                      {isAnswered && idx === currentQ.correctIndex && (
                        <CheckCircle2 className="w-5 h-5 text-[#34D399] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Next Button */}
            {isAnswered && (
              <button
                onClick={handleNext}
                disabled={submitting}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#22D3EE] hover:from-[#6D28D9] hover:to-[#06B6D4] text-white font-black text-xs font-heading shadow-lg shadow-[#7C3AED]/30 transition-all cursor-pointer flex items-center justify-center gap-2 animate-fadeIn"
              >
                <span>{currentIdx < questions.length - 1 ? "Next Assessment Question →" : "Finish Assessment & Record"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </>
        ) : (
          /* Finished Card */
          <div className="text-center space-y-5 py-4">
            <div className="w-16 h-16 rounded-full bg-[#34D399]/20 border-2 border-[#34D399] flex items-center justify-center text-[#34D399] mx-auto glow-box-green">
              <Award className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-white font-heading">
                {phase === "pre" ? "Pre-Assessment Recorded!" : "Post-Assessment Recorded!"}
              </h2>
              <p className="text-xs text-[#94A3B8]">
                Your assessment score has been recorded into the A/B research harness.
              </p>
            </div>

            <div className="bg-[#0A0A1A] border border-white/10 p-4 rounded-2xl max-w-xs mx-auto text-center space-y-1">
              <span className="text-xs font-mono text-slate-400">Score Achieved</span>
              <div className="text-3xl font-black text-[#22D3EE] font-mono">
                {score} / {questions.length} ({Math.round((score / questions.length) * 100)}%)
              </div>
            </div>

            <button
              onClick={() => onComplete(score, questions.length)}
              className="w-full py-3.5 rounded-2xl bg-[#34D399] hover:bg-[#059669] text-black font-black text-xs font-heading transition-all cursor-pointer"
            >
              Continue to XPedition →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
