"use client";

import { useState } from "react";
import { Question } from "@/lib/types";
import { X, CheckCircle2, XCircle, Trophy, Sparkles, ArrowRight } from "lucide-react";

interface QuestModalProps {
  question: Question;
  courseTitle: string;
  onClose: () => void;
}

export default function QuestModal({ question, courseTitle, onClose }: QuestModalProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [xpEarned, setXpEarned] = useState<number | null>(null);

  const handleSelectOption = (index: number) => {
    if (submitted) return;
    setSelectedIndex(index);
  };

  const handleSubmit = () => {
    if (selectedIndex === null) return;
    setSubmitted(true);
    if (selectedIndex === question.correctIndex) {
      setXpEarned(150);
    } else {
      setXpEarned(25); // Participation XP
    }
  };

  const isCorrect = selectedIndex === question.correctIndex;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-[#1B1B3A] border border-[#7C3AED]/40 rounded-3xl p-6 sm:p-8 shadow-2xl glow-box-violet overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#7C3AED]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#22D3EE]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/40 text-[#22D3EE] text-xs font-mono font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#FBBF24]" />
              FIRST QUEST
            </span>
            <span className="text-xs text-[#94A3B8] truncate max-w-[200px]">
              {courseTitle}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Question Prompt */}
        <div className="mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-white font-heading leading-snug mb-2">
            {question.prompt}
          </h3>
          <p className="text-xs text-[#94A3B8]">Select the correct option to earn XP points.</p>
        </div>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {question.options.map((option, idx) => {
            let optionStyles = "bg-[#0A0A1A] border-white/10 text-slate-200 hover:border-[#7C3AED]/50";

            if (selectedIndex === idx) {
              optionStyles = "bg-[#7C3AED]/20 border-[#7C3AED] text-white glow-box-violet";
            }

            if (submitted) {
              if (idx === question.correctIndex) {
                optionStyles = "bg-[#34D399]/20 border-[#34D399] text-[#34D399] font-semibold";
              } else if (selectedIndex === idx && idx !== question.correctIndex) {
                optionStyles = "bg-red-500/20 border-red-500 text-red-400";
              } else {
                optionStyles = "bg-[#0A0A1A]/50 border-white/5 text-slate-500 opacity-60";
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelectOption(idx)}
                disabled={submitted}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between text-sm sm:text-base cursor-pointer ${optionStyles}`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-mono text-xs font-bold text-slate-300">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>{option}</span>
                </div>

                {submitted && idx === question.correctIndex && (
                  <CheckCircle2 className="w-5 h-5 text-[#34D399] shrink-0" />
                )}
                {submitted && selectedIndex === idx && idx !== question.correctIndex && (
                  <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Result & Actions */}
        {submitted ? (
          <div className="space-y-4 animate-fadeIn">
            <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
              isCorrect ? "bg-[#34D399]/10 border-[#34D399]/30 text-[#34D399]" : "bg-[#FBBF24]/10 border-[#FBBF24]/30 text-[#FBBF24]"
            }`}>
              <Trophy className="w-6 h-6 shrink-0" />
              <div>
                <p className="font-bold text-sm">
                  {isCorrect ? "Quest Complete! Spot on!" : "Nice effort!"}
                </p>
                <p className="text-xs opacity-90">
                  {isCorrect
                    ? `You solved the initial quest and earned +${xpEarned} XP!`
                    : `Correct Answer: "${question.options[question.correctIndex]}". Earned +${xpEarned} XP for trying.`}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#22D3EE] text-white font-bold text-sm shadow-lg shadow-[#7C3AED]/30 hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continue Quest Line</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={selectedIndex === null}
            className="w-full py-3.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-sm transition-all shadow-lg shadow-[#7C3AED]/30 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
          >
            Submit Quest Answer
          </button>
        )}
      </div>
    </div>
  );
}
