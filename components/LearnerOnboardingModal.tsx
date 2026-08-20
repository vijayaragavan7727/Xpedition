"use client";

import React, { useState } from "react";
import { LearnerProfile, LearningStyle } from "@/lib/types";
import { useQuest } from "@/lib/QuestContext";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  User,
  GraduationCap,
  Sparkles,
  BookOpen,
  Clock,
  Heart,
  ArrowRight,
  ChevronLeft,
  X,
  Check,
  Award,
} from "lucide-react";

interface LearnerOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (profile: LearnerProfile) => void;
}

const INTEREST_CHIPS = [
  "Cricket",
  "Anime",
  "Gaming",
  "Movies",
  "Music",
  "Sports",
  "Tech",
];

export default function LearnerOnboardingModal({
  isOpen,
  onClose,
  onComplete,
}: LearnerOnboardingModalProps) {
  const { user, setLearningStyle } = useQuest();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [name, setName] = useState(user?.name || "");
  const [currentStatus, setCurrentStatus] = useState<string>("college");
  const [yearAndBranch, setYearAndBranch] = useState<string>("");

  const [learnerRating, setLearnerRating] = useState<string>("getting_there");
  const [lastExamMarks, setLastExamMarks] = useState<string>("70_85");

  const [selectedStyle, setSelectedStyle] = useState<LearningStyle>("story");
  const [dailyTime, setDailyTime] = useState<string>("30 min");
  const [selectedInterests, setSelectedInterests] = useState<string[]>(["Tech", "Gaming"]);

  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    const profile: LearnerProfile = {
      name: name.trim() || "Adventurer",
      currentStatus,
      yearAndBranch: yearAndBranch.trim(),
      learnerRating,
      lastExamMarks,
      learningStyle: selectedStyle,
      dailyTime,
      interests: selectedInterests,
    };

    if (setLearningStyle) {
      await setLearningStyle(selectedStyle);
    }

    if (isSupabaseConfigured()) {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user?.id) {
          await supabase.from("users").upsert({
            id: authData.user.id,
            email: authData.user.email,
            display_name: profile.name,
            current_status: profile.currentStatus,
            year_and_branch: profile.yearAndBranch,
            learner_rating: profile.learnerRating,
            last_exam_marks: profile.lastExamMarks,
            learning_style: profile.learningStyle,
            daily_time: profile.dailyTime,
            interests: profile.interests,
          });
        }
      } catch (err) {
        console.warn("Notice updating user profile in Supabase:", err);
      }
    }

    setSaving(false);
    if (onComplete) onComplete(profile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#0D0D1A] border border-[#00F0FF]/40 rounded-3xl p-6 sm:p-8 text-left shadow-2xl overflow-hidden my-auto space-y-6 glow-cyan">
        {/* Background Radial Orbs */}
        <div className="absolute -top-12 -right-12 w-44 h-44 bg-[#A855F7]/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-44 h-44 bg-[#00F0FF]/25 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header & Progress Dots */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[#00F0FF] uppercase">
              Step {step} of 3
            </span>
            <div className="flex items-center gap-1.5 ml-2">
              <span className={`w-2.5 h-2.5 rounded-full transition-all ${step === 1 ? "bg-[#00F0FF] w-5" : "bg-white/20"}`} />
              <span className={`w-2.5 h-2.5 rounded-full transition-all ${step === 2 ? "bg-[#00F0FF] w-5" : "bg-white/20"}`} />
              <span className={`w-2.5 h-2.5 rounded-full transition-all ${step === 3 ? "bg-[#00F0FF] w-5" : "bg-white/20"}`} />
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-xs font-mono text-slate-400 hover:text-white px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 transition-all cursor-pointer"
          >
            Skip for now
          </button>
        </div>

        {/* STEP 1: ABOUT YOU */}
        {step === 1 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-white font-heading">
                👋 Tell us about yourself
              </h2>
              <p className="text-xs text-slate-300">
                Help us personalize your learning path and adaptive recommendations.
              </p>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-400 mb-1">
                  YOUR NAME
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex"
                  className="w-full p-3.5 rounded-2xl bg-[#000000] border border-white/10 text-sm text-white focus:border-[#00F0FF] focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-400 mb-1.5">
                  CURRENT STATUS
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "school", label: "School student", icon: "🏫" },
                    { id: "college", label: "College student", icon: "🎓" },
                    { id: "jobseeker", label: "Job seeker", icon: "🚀" },
                    { id: "professional", label: "Working pro", icon: "💼" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCurrentStatus(item.id)}
                      className={`p-3 rounded-2xl border text-xs text-left font-medium flex items-center gap-2 transition-all cursor-pointer ${
                        currentStatus === item.id
                          ? "bg-[#00F0FF]/15 border-[#00F0FF] text-white"
                          : "bg-[#000000] border-white/10 text-slate-300 hover:border-white/30"
                      }`}
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {(currentStatus === "school" || currentStatus === "college") && (
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-400 mb-1">
                    YEAR & BRANCH / STREAM (OPTIONAL)
                  </label>
                  <input
                    type="text"
                    value={yearAndBranch}
                    onChange={(e) => setYearAndBranch(e.target.value)}
                    placeholder="e.g. 3rd Year CSE / Class 12 Science"
                    className="w-full p-3.5 rounded-2xl bg-[#000000] border border-white/10 text-sm text-white focus:border-[#00F0FF] focus:outline-none transition-all"
                  />
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-3.5 rounded-2xl bg-[#00F0FF] text-black font-black text-xs uppercase tracking-wider hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer glow-cyan"
              >
                <span>Continue to Background →</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: YOUR BACKGROUND */}
        {step === 2 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-white font-heading">
                📊 Your academic background
              </h2>
              <p className="text-xs text-slate-300">
                Used purely as a soft prior for initial difficulty (placement test overrides).
              </p>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-400 mb-1.5">
                  HOW WOULD YOU RATE YOURSELF OVERALL AS A LEARNER?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "starting", label: "Just starting out", desc: "Building fundamentals" },
                    { id: "getting_there", label: "Getting there", desc: "Making steady progress" },
                    { id: "confident", label: "Fairly confident", desc: "Solid problem solver" },
                    { id: "advanced", label: "Advanced", desc: "Mastering complex topics" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setLearnerRating(item.id)}
                      className={`p-3 rounded-2xl border text-left space-y-0.5 transition-all cursor-pointer ${
                        learnerRating === item.id
                          ? "bg-[#00F0FF]/15 border-[#00F0FF] text-white"
                          : "bg-[#000000] border-white/10 text-slate-300 hover:border-white/30"
                      }`}
                    >
                      <h4 className="text-xs font-bold font-heading">{item.label}</h4>
                      <p className="text-[10px] text-slate-400">{item.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-400 mb-1.5">
                  ROUGHLY WHAT WERE YOUR LAST EXAM/SEMESTER MARKS?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: "below_50", label: "Below 50%" },
                    { id: "50_70", label: "50% - 70%" },
                    { id: "70_85", label: "70% - 85%" },
                    { id: "above_85", label: "Above 85%" },
                    { id: "prefer_not", label: "Prefer not to say" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setLastExamMarks(item.id)}
                      className={`p-2.5 rounded-xl border text-xs text-center font-medium transition-all cursor-pointer ${
                        lastExamMarks === item.id
                          ? "bg-[#A855F7]/20 border-[#A855F7] text-white"
                          : "bg-[#000000] border-white/10 text-slate-300 hover:border-white/30"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-3.5 rounded-2xl bg-white/10 border border-white/10 text-white font-bold text-xs hover:bg-white/20 transition-all cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="w-2/3 py-3.5 rounded-2xl bg-[#00F0FF] text-black font-black text-xs uppercase tracking-wider hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer glow-cyan"
              >
                <span>Continue to Preferences →</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: HOW YOU LEARN */}
        {step === 3 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-white font-heading">
                🎯 How you learn
              </h2>
              <p className="text-xs text-slate-300">
                Tailors teaching style, daily goal pacing, and contextual quest theming.
              </p>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-400 mb-1.5">
                  PREFERRED LEARNING STYLE
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "story" as LearningStyle, label: "Story & analogy" },
                    { id: "theory" as LearningStyle, label: "Theory & concepts" },
                    { id: "code" as LearningStyle, label: "Code & examples" },
                    { id: "stepwise" as LearningStyle, label: "Step-by-step" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedStyle(item.id)}
                      className={`p-3 rounded-2xl border text-xs text-left font-medium transition-all cursor-pointer ${
                        selectedStyle === item.id
                          ? "bg-[#00FF87]/20 border-[#00FF87] text-white"
                          : "bg-[#000000] border-white/10 text-slate-300 hover:border-white/30"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-400 mb-1.5">
                  DAILY TIME AVAILABLE
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {["10 min", "30 min", "1 hour", "More"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setDailyTime(t)}
                      className={`p-2.5 rounded-xl border text-xs text-center font-medium transition-all cursor-pointer ${
                        dailyTime === t
                          ? "bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF] font-bold"
                          : "bg-[#000000] border-white/10 text-slate-300 hover:border-white/30"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-400 mb-1.5">
                  INTERESTS FOR QUEST THEMING (MULTI-SELECT CHIPS)
                </label>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_CHIPS.map((chip) => {
                    const isSelected = selectedInterests.includes(chip);
                    return (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => toggleInterest(chip)}
                        className={`px-3 py-1.5 rounded-full border text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-[#A855F7] border-[#A855F7] text-white"
                            : "bg-[#000000] border-white/10 text-slate-400 hover:border-white/30"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        <span>{chip}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-1/3 py-3.5 rounded-2xl bg-white/10 border border-white/10 text-white font-bold text-xs hover:bg-white/20 transition-all cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleFinish}
                disabled={saving}
                className="w-2/3 py-3.5 rounded-2xl bg-gradient-to-r from-[#00FF87] via-[#00F0FF] to-[#A855F7] text-black font-black text-xs uppercase tracking-wider hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer glow-cyan"
              >
                <span>{saving ? "Saving Profile..." : "Complete Setup & Launch →"}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
