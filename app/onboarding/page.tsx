"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuest } from "@/lib/QuestContext";
import { GoalEngineResponse } from "@/lib/types";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { initUserArms, ArmType } from "@/lib/bandit";
import QuestModal from "@/components/QuestModal";
import {
  Compass,
  Sparkles,
  Send,
  Loader2,
  BookOpen,
  Play,
  Star,
  CheckCircle2,
  Award,
  ChevronLeft,
  Flame,
  Zap,
  Trophy,
  Swords,
  Shield,
  ArrowRight,
} from "lucide-react";

const SUGGESTED_GOALS = [
  "Python basics for a Zoho job interview",
  "DSA for a FAANG interview",
  "Fullstack Next.js & React Mastery",
  "Machine Learning Fundamentals",
];

const MOTIVATION_OPTIONS = [
  {
    id: "badge" as ArmType,
    label: "Trophy & Badges",
    desc: "Collecting rare credentials & badges on your Passport",
    icon: Trophy,
    color: "text-[#34D399] bg-[#34D399]/20 border-[#34D399]/40",
  },
  {
    id: "lore" as ArmType,
    label: "Hidden Lore & Story",
    desc: "Unlocking secret cyber lore & tech story chapters",
    icon: BookOpen,
    color: "text-[#22D3EE] bg-[#22D3EE]/20 border-[#22D3EE]/40",
  },
  {
    id: "guild_invite" as ArmType,
    label: "Squad & Co-op Raids",
    desc: "Teaming up with live matched peers to defeat bosses",
    icon: Swords,
    color: "text-red-400 bg-red-500/20 border-red-500/40",
  },
  {
    id: "leaderboard" as ArmType,
    label: "Rank & Leaderboards",
    desc: "Climbing global standings & earning XP multipliers",
    icon: Zap,
    color: "text-[#FBBF24] bg-[#FBBF24]/20 border-[#FBBF24]/40",
  },
];

const LOADING_STEPS = [
  "Searching the web via Tavily API...",
  "Analyzing real-world curriculum & requirements...",
  "Generating skill path with Groq LLM (llama-3.3-70b)...",
  "Warm-starting Thompson Sampling Bandit with Alpha = 3...",
];

export default function OnboardingPage() {
  const { user, setCourseData, setMotivationType } = useQuest();
  const [userName, setUserName] = useState("Adventurer");
  const [step, setStep] = useState<"motivation" | "goal">("motivation");
  const [motivatedArm, setMotivatedArm] = useState<ArmType>("badge");
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<GoalEngineResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (user?.name) {
      setUserName(user.name);
    }
  }, [user]);

  const handleSelectMotivation = async (arm: ArmType) => {
    setMotivatedArm(arm);

    if (setMotivationType) {
      await setMotivationType(arm);
    }

    if (isSupabaseConfigured()) {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user?.id) {
          await initUserArms(userData.user.id, arm);
        }
      } catch (err) {
        console.warn("Supabase initUserArms notice:", err);
      }
    }

    setStep("goal");
  };

  const handleGenerateCourse = async (targetGoal: string) => {
    if (!targetGoal.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setLoadingStep(0);

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 1100);

    try {
      const res = await fetch("/api/goal-engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: targetGoal }),
      });

      clearInterval(stepInterval);

      if (!res.ok) {
        throw new Error("Failed to generate course from Goal Engine.");
      }

      const data: GoalEngineResponse = await res.json();
      setResult(data);
      setCourseData(data, targetGoal);

      // Save goal and skills to Supabase DB
      if (isSupabaseConfigured()) {
        try {
          const { data: userData } = await supabase.auth.getUser();
          const userId = userData?.user?.id;

          if (userId) {
            const { data: goalRecord } = await supabase
              .from("goals")
              .insert({
                user_id: userId,
                goal_text: targetGoal,
                title: data.title,
              })
              .select("id")
              .single();

            if (goalRecord?.id && Array.isArray(data.skills)) {
              const skillRecords = data.skills.map((s, idx) => ({
                goal_id: goalRecord.id,
                name: s.name,
                difficulty: s.difficulty,
                order_index: idx,
              }));

              await supabase.from("skills").insert(skillRecords);
            }

            // Also ensure arms initialized
            await initUserArms(userId, motivatedArm);
          }
        } catch (dbErr) {
          console.warn("Supabase database insert warning:", dbErr);
        }
      }
    } catch (err: any) {
      clearInterval(stepInterval);
      setError(err.message || "An error occurred while generating your goal path.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleGenerateCourse(goal);
  };

  const handleSelectSuggested = (suggested: string) => {
    setGoal(suggested);
    handleGenerateCourse(suggested);
  };

  return (
    <main className="min-h-screen bg-[#0A0A1A] bg-grid-pattern relative flex flex-col justify-between p-4 sm:p-8">
      {/* Background Orbs */}
      <div className="absolute top-10 right-10 w-96 h-96 bg-[#7C3AED]/15 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#22D3EE]/15 rounded-full blur-[130px] pointer-events-none" />

      {/* Top Bar */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between z-10 py-2">
        <button
          onClick={() => (step === "goal" ? setStep("motivation") : router.push("/"))}
          className="flex items-center gap-2 text-xs text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{step === "goal" ? "Change Motivation" : "Back to Home"}</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1B1B3A] border border-white/10 text-xs">
            <Award className="w-4 h-4 text-[#FBBF24]" />
            <span className="text-slate-200 font-bold">{userName}</span>
            <span className="text-[#34D399] font-mono">{user.xp} XP</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="w-full max-w-3xl mx-auto z-10 my-auto py-8">
        {/* Step 1: Motivation Question Screen */}
        {step === "motivation" && !loading && (
          <div className="text-center space-y-6 animate-fadeIn">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1B1B3A] border border-[#7C3AED]/40 shadow-lg shadow-[#7C3AED]/10 text-xs text-[#22D3EE] font-mono">
              <Sparkles className="w-3.5 h-3.5 text-[#FBBF24]" />
              BANDIT COLD-START WARM PRIOR (ALPHA = 3)
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white font-heading tracking-tight">
              What motivates you most?
            </h1>
            <p className="text-sm sm:text-base text-[#94A3B8] max-w-lg mx-auto">
              Select your primary drive. Our Thompson Sampling Contextual Bandit uses this to initialize your reward arm priors.
            </p>

            {/* 4 Tappable Motivation Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto pt-2">
              {MOTIVATION_OPTIONS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectMotivation(item.id)}
                    className="bg-[#1B1B3A] border border-white/10 hover:border-[#22D3EE] p-5 rounded-3xl transition-all duration-200 hover:scale-[1.02] text-left cursor-pointer group glow-box-violet space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className={`p-3 rounded-2xl ${item.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 group-hover:text-[#22D3EE]">
                        α = 3 Prior
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white font-heading group-hover:text-[#22D3EE] transition-colors">
                        {item.label}
                      </h3>
                      <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Goal Prompt Screen */}
        {step === "goal" && !result && !loading && (
          <div className="text-center space-y-6 animate-fadeIn">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1B1B3A] border border-[#7C3AED]/40 text-xs text-[#22D3EE] font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399]" />
              MOTIVATION PRIOR SET ({motivatedArm.toUpperCase()})
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white font-heading tracking-tight">
              What's your goal?
            </h1>
            <p className="text-sm sm:text-base text-[#94A3B8] max-w-lg mx-auto">
              State your target role, exam, or skill. Tavily & Groq AI will construct your adaptive curriculum.
            </p>

            <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto">
              <div className="relative flex items-center bg-[#1B1B3A] border border-[#7C3AED]/40 rounded-2xl p-2 shadow-2xl focus-within:border-[#22D3EE] focus-within:ring-2 focus-within:ring-[#22D3EE]/30 transition-all glow-box-violet">
                <input
                  type="text"
                  required
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="e.g. Python basics, or DSA for a FAANG interview"
                  className="w-full bg-transparent text-white placeholder:text-slate-500 px-4 py-3.5 text-sm sm:text-base focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!goal.trim()}
                  className="bg-gradient-to-r from-[#7C3AED] to-[#22D3EE] hover:from-[#6D28D9] hover:to-[#06B6D4] text-white p-3.5 rounded-xl font-bold transition-all shadow-md shadow-[#7C3AED]/30 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>

            <div className="pt-4">
              <p className="text-xs text-[#94A3B8] mb-3 uppercase tracking-wider font-mono">
                Try a popular goal prompt:
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTED_GOALS.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectSuggested(item)}
                    className="px-3.5 py-2 rounded-xl bg-[#1B1B3A]/80 hover:bg-[#1B1B3A] border border-white/10 hover:border-[#7C3AED]/50 text-xs text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Flame className="w-3.5 h-3.5 text-[#FBBF24]" />
                    <span>{item}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Loading State - Streaming Real Open Web Sources */}
        {loading && (
          <div className="bg-[#1B1B3A]/90 border border-[#7C3AED]/40 rounded-3xl p-8 text-center space-y-6 shadow-2xl glow-box-violet max-w-xl mx-auto backdrop-blur-xl animate-fadeIn">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-[#7C3AED]/20 border-t-[#22D3EE] animate-spin" />
              <Compass className="w-8 h-8 text-[#7C3AED] animate-pulse" />
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-bold text-white font-heading">
                Building Your Quest Line...
              </h2>

              <div className="bg-[#0A0A1A] border border-white/10 p-4 rounded-2xl space-y-2 text-left text-xs font-mono">
                <span className="text-[#22D3EE] font-bold block mb-1">Live Web Research Progress:</span>
                {[
                  "Reading geeksforgeeks.org...",
                  "Reading developer.mozilla.org...",
                  "Reading freecodecamp.org...",
                  "Reading docs.python.org...",
                ].map((stepLabel, idx) => {
                  const isDone = loadingStep > idx;
                  const isCurrent = loadingStep === idx;

                  return (
                    <div key={idx} className="flex items-center gap-2">
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" />
                      ) : isCurrent ? (
                        <Loader2 className="w-4 h-4 text-[#22D3EE] animate-spin shrink-0" />
                      ) : (
                        <span className="w-4 h-4 rounded-full border border-white/20 shrink-0" />
                      )}
                      <span className={isDone ? "text-slate-300 font-bold" : isCurrent ? "text-[#22D3EE] font-bold" : "text-slate-500"}>
                        {stepLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && !loading && (
          <div className="bg-red-500/10 border border-red-500/40 rounded-2xl p-6 text-center space-y-4 max-w-xl mx-auto">
            <p className="text-red-400 text-sm font-semibold">{error}</p>
            <button
              onClick={() => setError(null)}
              className="px-4 py-2 rounded-xl bg-red-500/20 text-white text-xs font-bold hover:bg-red-500/30 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Generated Skill Tree View */}
        {result && !loading && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-[#1B1B3A] border border-[#7C3AED]/40 rounded-3xl p-6 sm:p-8 shadow-2xl glow-box-violet relative overflow-hidden space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#34D399]/20 border border-[#34D399]/40 text-[#34D399] text-xs font-mono font-bold mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    CURRICULUM GENERATED FROM LIVE WEB RESEARCH
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white font-heading">
                    {result.title}
                  </h2>
                  <p className="text-xs text-[#94A3B8] mt-1">
                    Target Goal: <span className="text-slate-200 font-semibold">"{goal}"</span>
                  </p>
                </div>

                <button
                  onClick={() => router.push("/home")}
                  className="bg-gradient-to-r from-[#7C3AED] to-[#22D3EE] hover:from-[#6D28D9] hover:to-[#06B6D4] text-white font-bold px-6 py-3.5 rounded-2xl transition-all shadow-lg shadow-[#7C3AED]/30 flex items-center gap-2 cursor-pointer text-sm shrink-0 glow-box-cyan"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Enter Home Arena</span>
                </button>
              </div>

              {/* Skills Tree Preview */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#94A3B8] font-mono uppercase tracking-wider block">
                  Generated Mastery Skills ({result.skills.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {result.skills.map((s, idx) => (
                    <div key={s.id || idx} className="bg-[#0A0A1A] border border-white/10 p-3 rounded-2xl flex items-center justify-between text-xs">
                      <span className="font-bold text-white truncate">{s.name}</span>
                      <span className="text-[10px] font-mono text-[#FBBF24] bg-[#FBBF24]/20 px-2 py-0.5 rounded-full border border-[#FBBF24]/40 shrink-0">
                        Lvl {s.difficulty}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grounded in these sources section */}
              {result.sources && result.sources.length > 0 && (
                <div className="bg-[#0A0A1A] border border-[#22D3EE]/30 rounded-2xl p-4 space-y-3">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-[#22D3EE] font-mono uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-[#FBBF24]" />
                      Grounded in these sources
                    </h4>
                    <p className="text-[11px] text-[#94A3B8]">
                      Your course was built from these live sources, not from a fixed template.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {result.sources.map((src, idx) => (
                      <a
                        key={idx}
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#12122C] border border-white/10 hover:border-[#22D3EE]/50 p-2.5 rounded-xl transition-all flex items-center gap-2.5 text-xs text-slate-200 hover:text-white group cursor-pointer"
                      >
                        {/* Favicon */}
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${src.domain}&sz=32`}
                          alt={src.domain}
                          className="w-5 h-5 rounded shrink-0 bg-white/10 p-0.5"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                        <div className="overflow-hidden">
                          <p className="font-bold text-white text-[11px] truncate group-hover:text-[#22D3EE] transition-colors">
                            {src.title}
                          </p>
                          <span className="text-[10px] font-mono text-slate-400 block truncate">
                            {src.domain}
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <footer className="w-full max-w-5xl mx-auto text-center text-xs text-slate-500 z-10 py-2">
        XPedition Goal Engine • Thompson Sampling Bandit & Groq AI Active
      </footer>
    </main>
  );
}
