"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuest } from "@/lib/QuestContext";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import {
  Briefcase,
  Target,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Compass,
  Award,
  BookOpen,
} from "lucide-react";

export default function CareerGuidancePage() {
  const router = useRouter();
  const { user, isAuthLoading, course, goalText, pKnow, setCourseData, setActiveSkillIndex } = useQuest();

  const [loading, setLoading] = useState(true);
  const [careerData, setCareerData] = useState<any | null>(null);
  const [switchingGoal, setSwitchingGoal] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCareerGuidance() {
      if (isAuthLoading) return;
      setLoading(true);

      const userSkills = course?.skills?.map((s) => ({
        id: s.id,
        name: s.name,
        pKnow: pKnow || 0.15,
      })) || [];

      try {
        const res = await fetch("/api/career-map", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            goalText: goalText || "Software Engineer",
            userSkills,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setCareerData(data);
        }
      } catch (err) {
        console.warn("Career map fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchCareerGuidance();
  }, [goalText, course, pKnow, isAuthLoading]);

  const handleSelectCareerPath = async (roleTitle: string) => {
    setSwitchingGoal(roleTitle);
    try {
      const res = await fetch("/api/goal-engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalText: roleTitle }),
      });

      if (res.ok) {
        const newCourse = await res.json();
        setCourseData(newCourse, roleTitle);
      }
    } catch (e) {
      console.warn("Notice regenerating skill tree for career path:", e);
    } finally {
      setSwitchingGoal(null);
      router.push("/home");
    }
  };

  if (isAuthLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0A0A1A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00F0FF] animate-spin" />
      </div>
    );
  }

  const isEmptyState = !careerData || careerData.overallReadiness === 0;

  return (
    <main className="min-h-screen bg-[#0A0A1A] text-white relative pb-28 pt-4 px-3 sm:px-6 font-sans">
      <TopBar title="Career Guidance & Gap Analysis" fallbackUrl="/home" />

      <div className="w-full max-w-4xl mx-auto space-y-6 animate-fadeIn mt-3">
        {/* 1. TOP HERO CARD: Target Goal + Real Computed Career Readiness Ring */}
        <section className="bg-[#0D0D1A] border border-[#00F0FF]/40 rounded-3xl p-6 shadow-2xl glow-cyan space-y-5 relative overflow-hidden">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <span className="px-3 py-1 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/40 text-[#00F0FF] text-xs font-mono font-bold flex items-center gap-1.5 w-fit mb-2">
                <Target className="w-3.5 h-3.5 text-[#FFB800]" />
                CURRENT TARGET CAREER GOAL
              </span>
              <h1 className="text-xl sm:text-3xl font-black text-white font-heading leading-tight">
                {careerData?.roleName || goalText}
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Grounded in Tavily Real-Time Job Market Requirements
              </p>
            </div>

            {/* REAL COMPUTED READINESS CIRCULAR RING */}
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#000000]/80 border border-[#00F0FF]/40 shrink-0">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-white/10"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-[#00F0FF] transition-all duration-1000"
                    strokeDasharray={`${careerData?.overallReadiness || 0}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-xl font-black font-heading text-white">
                    {careerData?.overallReadiness || 0}%
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-[#00FF87] font-bold uppercase mt-1">
                Role Readiness
              </span>
            </div>
          </div>
        </section>

        {/* 5. HONEST EMPTY STATE (IF NO MASTERY COMPLETED YET) */}
        {isEmptyState ? (
          <div className="p-8 text-center bg-[#0D0D1A] border border-white/10 rounded-3xl space-y-4 shadow-xl">
            <Compass className="w-12 h-12 text-[#00F0FF] mx-auto animate-bounce" />
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white font-heading">
                Complete your first quest to unlock career guidance
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Career readiness percentages are computed from real BKT mastery data in Supabase. Take your first module test!
              </p>
            </div>
            <button
              onClick={() => router.push("/quest")}
              className="px-6 py-3 rounded-2xl bg-[#00F0FF] text-black font-black text-xs uppercase tracking-wider font-mono hover:brightness-110 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <span>Start First Quest</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            {/* 2. SKILL READINESS TABLE (YOUR LEVEL VS REQUIRED LEVEL PAIRED BARS) */}
            <section className="bg-[#0D0D1A] border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white font-heading flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#00FF87]" />
                  Skill Readiness & Market Gap Analysis
                </h2>
                <span className="text-xs font-mono text-slate-400">
                  Target vs Current Level
                </span>
              </div>

              <div className="space-y-4 pt-1">
                {careerData?.skillReadiness?.map((sk: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-2xl bg-[#000000] border border-white/10 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-white font-bold">{sk.skillName}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sk.gapPct > 20
                            ? "bg-[#FF0055]/20 text-[#FF7185] border border-[#FF0055]/40"
                            : "bg-[#00FF87]/20 text-[#00FF87] border border-[#00FF87]/40"
                        }`}
                      >
                        {sk.gapPct > 0 ? `-${sk.gapPct}% Gap` : "✓ Requirement Met"}
                      </span>
                    </div>

                    {/* PAIRED PROGRESS BARS */}
                    <div className="space-y-1.5 font-mono text-[11px]">
                      {/* Your Level */}
                      <div className="space-y-0.5">
                        <div className="flex justify-between text-slate-400 text-[10px]">
                          <span>Your Mastery Level</span>
                          <span className="text-[#00F0FF] font-bold">{sk.userLevelPct}%</span>
                        </div>
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#00F0FF] rounded-full transition-all duration-500"
                            style={{ width: `${sk.userLevelPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Required Level */}
                      <div className="space-y-0.5">
                        <div className="flex justify-between text-slate-400 text-[10px]">
                          <span>Market Required Level (Tavily Grounded)</span>
                          <span className="text-[#A855F7] font-bold">{sk.requiredLevelPct}%</span>
                        </div>
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#A855F7] rounded-full transition-all duration-500"
                            style={{ width: `${sk.requiredLevelPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 3. RECOMMENDED NEXT STEPS */}
            <section className="bg-[#0D0D1A] border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4">
              <h2 className="text-base font-bold text-white font-heading flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#FFB800]" />
                Recommended High-Impact Next Steps
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {careerData?.recommendedNextSteps?.map((step: any, sIdx: number) => (
                  <div
                    key={sIdx}
                    className="p-4 rounded-2xl bg-[#000000] border border-white/10 flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-[#00F0FF] font-bold uppercase">
                        Action {sIdx + 1}
                      </span>
                      <p className="text-xs font-bold text-white font-heading leading-snug">
                        {step.action || `Master ${step.skillName}`}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setActiveSkillIndex(0);
                        router.push("/quest");
                      }}
                      className="px-3.5 py-2 rounded-xl bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 border border-[#00F0FF]/40 text-[#00F0FF] font-mono text-xs font-bold flex items-center justify-between transition-all cursor-pointer"
                    >
                      <span>Start Level Test</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* 4. AI SUGGESTED CAREER PATHS (GROUNDED IN TAVILY SEARCH & GROQ) */}
            <section className="bg-[#0D0D1A] border border-[#A855F7]/40 rounded-3xl p-5 shadow-2xl space-y-4 glow-violet">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white font-heading flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#A855F7]" />
                  AI Suggested Alternative Career Paths
                </h2>
                <span className="text-xs font-mono text-slate-400">
                  Skill-Overlap Match %
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {careerData?.suggestedCareerPaths?.map((path: any, pIdx: number) => (
                  <div
                    key={pIdx}
                    className="p-4 rounded-2xl bg-[#000000] border border-white/10 flex flex-col justify-between space-y-3 hover:border-[#A855F7]/50 transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#A855F7]/20 text-[#A855F7] font-mono text-[10px] font-bold border border-[#A855F7]/40">
                          {path.matchPercent}% MATCH
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white font-heading leading-tight">
                        {path.roleTitle}
                      </h3>
                      <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                        {path.description}
                      </p>
                    </div>

                    <button
                      disabled={switchingGoal === path.roleTitle}
                      onClick={() => handleSelectCareerPath(path.roleTitle)}
                      className="w-full py-2.5 px-3 rounded-xl bg-[#A855F7] hover:brightness-110 text-white font-bold text-xs font-mono flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                    >
                      {switchingGoal === path.roleTitle ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <span>Switch Goal</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
