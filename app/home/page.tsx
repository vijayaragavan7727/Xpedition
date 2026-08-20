"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuest } from "@/lib/QuestContext";
import { getDueSkills } from "@/lib/forgetting";
import { xpProgress } from "@/lib/progression";
import BottomNav from "@/components/BottomNav";
import Link from "next/link";
import {
  Flame,
  Zap,
  Play,
  CheckCircle2,
  Lock,
  Compass,
  Sparkles,
  Trophy,
  ArrowRight,
  Mic,
  Swords,
  ShieldAlert,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { getResumeSession, StudySession } from "@/lib/studySessions";
import SquidAsset from "@/components/SquidAsset";
import { getModuleTheme } from "@/lib/moduleThemes";
import SkillTreeGraph from "@/components/SkillTreeGraph";

import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export default function HomePage() {
  const { user, isAuthLoading, course, activeSkillIndex, pKnow, setActiveSkillIndex } = useQuest();
  const [dueCount, setDueCount] = useState<number>(0);
  const [courseProgressPct, setCourseProgressPct] = useState<number>(0);
  const [resumeSession, setResumeSession] = useState<StudySession | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (isAuthLoading) return;

    if (!user || !user.email) {
      const storedEmail = typeof window !== "undefined" ? localStorage.getItem("xpedition_email") : null;
      if (!storedEmail) {
        router.push("/");
        return;
      }
    }

    async function checkDueSkills() {
      const skills = await getDueSkills(user?.id);
      setDueCount(skills.length);
    }

    async function checkResumeSession() {
      const resume = await getResumeSession(user?.id || "demo-user-1");
      setResumeSession(resume);
    }

    async function computeCourseProgress() {
      if (!course?.skills || course.skills.length === 0) {
        setCourseProgressPct(0);
        return;
      }

      let masteredCount = 0;

      if (isSupabaseConfigured() && user?.id) {
        try {
          const { data: masteryRecords } = await supabase
            .from("mastery")
            .select("skill_id, p_know")
            .eq("user_id", user.id);

          if (masteryRecords) {
            const masteredSet = new Set(
              masteryRecords
                .filter((m) => (m.p_know || 0) > 0.85)
                .map((m) => m.skill_id)
            );
            masteredCount = course.skills.filter((s) => masteredSet.has(s.id)).length;
          }
        } catch (e) {
          console.warn("Error calculating course progress:", e);
        }
      }

      const pct = Math.round((masteredCount / course.skills.length) * 100);
      setCourseProgressPct(pct);
    }

    checkDueSkills();
    computeCourseProgress();
    checkResumeSession();
  }, [user, isAuthLoading, course, router]);

  const currentSkill = course?.skills[activeSkillIndex] || {
    id: "s1",
    name: "Python Core Syntax & Data Structures",
    difficulty: 1,
  };

  // Real Level Growth Curve Progress
  const progress = xpProgress(user.xp);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A1A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#22D3EE] animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0A1A] bg-grid-pattern relative flex flex-col justify-between pb-24 p-4 sm:p-6 overflow-x-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#7C3AED]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-[#22D3EE]/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-xl mx-auto space-y-4 z-10">
        {/* 1. XP / Level Header */}
        <header className="bg-[#1B1B3A] border border-white/10 rounded-2xl p-4 shadow-md flex items-center justify-between gap-3">
          <Link href="/profile" className="flex items-center gap-3 truncate group cursor-pointer hover:opacity-90">
            <div className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-gradient-to-br from-[#7C3AED] to-[#22D3EE] flex items-center justify-center text-white font-black text-base font-heading ring-2 ring-[#22D3EE]/40 group-hover:scale-105 transition-transform shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2 truncate">
                <h1 className="text-sm font-bold text-white font-heading truncate group-hover:text-[#22D3EE] transition-colors">{user.name}</h1>
                <span className="px-2 py-0.5 rounded-full bg-[#7C3AED]/30 text-[#22D3EE] text-[10px] font-mono font-bold border border-[#7C3AED]/40 shrink-0">
                  Lvl {progress.level}
                </span>
              </div>
              <p className="text-[11px] text-[#94A3B8] truncate">{user.email}</p>
            </div>
          </Link>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1 text-xs text-[#FBBF24] font-mono font-bold">
                <Trophy className="w-3.5 h-3.5" />
                <span>{user.xp} XP</span>
              </div>
              <div className="w-20 sm:w-28 h-2 bg-[#0A0A1A] rounded-full overflow-hidden border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-[#7C3AED] to-[#22D3EE] rounded-full transition-all duration-500"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-1 px-2.5 py-1.5 min-h-[44px] rounded-xl bg-[#0A0A1A] border border-[#FBBF24]/30 text-[#FBBF24] font-mono text-xs font-bold shrink-0">
              <Flame className="w-4 h-4 text-[#FBBF24] animate-pulse" />
              <span>{user.streak}d</span>
            </div>
          </div>
        </header>

        {/* Resume Banner Prompt */}
        {resumeSession && resumeSession.last_skill_name && (
          <div className="bg-[#1B1B3A] border border-[#22D3EE]/50 rounded-2xl p-4 shadow-xl flex items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-3 truncate">
              <div className="w-10 h-10 rounded-full bg-[#22D3EE]/20 border border-[#22D3EE]/40 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5 text-[#22D3EE]" />
              </div>
              <div className="truncate">
                <span className="text-[10px] font-mono text-[#22D3EE] font-bold uppercase tracking-wider block">
                  Pick up where you left off
                </span>
                <p className="text-xs font-bold text-white font-heading truncate">
                  {resumeSession.goal_title || course?.title || "Python Mastery"} • {resumeSession.last_skill_name}
                </p>
              </div>
            </div>

            <Link
              href="/history"
              className="px-3.5 py-2 min-h-[44px] rounded-xl bg-[#22D3EE] hover:bg-[#06B6D4] text-black font-bold text-xs font-heading shrink-0 flex items-center gap-1 cursor-pointer transition-all"
            >
              <span>Resume</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Red Light, Green Light Survival Game World Banner */}
        <div className="bg-[#12122C] border border-[#FB7185]/40 rounded-2xl p-4 shadow-xl flex items-center justify-between gap-3 relative overflow-hidden group glow-box-red">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A1A] via-[#12122C]/90 to-transparent z-0 pointer-events-none" />
          <div className="flex items-center gap-3.5 relative z-10 truncate">
            <SquidAsset name="younghee" alt="Red Light Green Light Young-hee Doll" width={44} height={44} className="shrink-0 group-hover:scale-110 transition-transform" />
            <div className="truncate">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#FB7185] uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FB7185] animate-ping" />
                <span>Red Light, Green Light Inspection Active</span>
              </div>
              <p className="text-xs font-bold text-white font-heading truncate mt-0.5">
                Survival Quest Mode: Answer accurately to avoid doubt elimination!
              </p>
            </div>
          </div>
          <span className="relative z-10 px-2.5 py-1 rounded-full bg-[#FB7185]/20 border border-[#FB7185]/40 text-[#FB7185] text-[10px] font-mono font-bold shrink-0">
            SURVIVAL
          </span>
        </div>

        {/* 2. ONE Primary "Continue Your Quest" Hero Card (Sole Primary Focal Point) */}
        <section className="bg-[#1B1B3A] border border-[#7C3AED]/50 rounded-3xl p-5 shadow-2xl glow-box-violet relative overflow-hidden space-y-4">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/40 text-[#22D3EE] text-xs font-mono font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#FBBF24]" />
              CURRENT QUEST MODULE
            </span>
            <span className="text-xs text-[#94A3B8] font-mono">
              Module {activeSkillIndex + 1} of {course?.skills.length || 5}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="truncate">
              <h2 className="text-lg sm:text-xl font-bold text-white font-heading truncate">
                {currentSkill.name}
              </h2>
              <p className="text-xs text-[#94A3B8] mt-1 truncate">
                Goal: <span className="text-slate-300 font-semibold">{course?.title || "Python Mastery"}</span>
              </p>
            </div>
            <SquidAsset name="piggybank" alt="XP Pot Piggy Bank" width={48} height={48} className="shrink-0" />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono text-[#94A3B8]">
              <span>Course Progress</span>
              <span className="text-[#34D399] font-bold">
                {courseProgressPct > 0 ? `${courseProgressPct}% Complete` : "0% Complete"}
              </span>
            </div>
            <div className="w-full h-2.5 bg-[#0A0A1A] rounded-full overflow-hidden border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-[#22D3EE] via-[#7C3AED] to-[#34D399] rounded-full transition-all duration-500"
                style={{ width: `${courseProgressPct}%` }}
              />
            </div>
          </div>

          <Link
            href="/quest"
            className="w-full min-h-[44px] py-3 px-6 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#22D3EE] hover:opacity-95 text-white font-bold text-sm transition-all shadow-lg shadow-[#7C3AED]/30 flex items-center justify-center gap-2 group cursor-pointer font-heading tracking-wide"
          >
            <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
            <span>Continue Your Quest</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </section>

        {/* 3. Interactive RPG Skill Tree Graph */}
        <SkillTreeGraph
          skills={course?.skills || []}
          activeSkillIndex={activeSkillIndex}
          pKnow={pKnow}
          onSelectSkill={(idx) => setActiveSkillIndex(idx)}
        />



        {/* 4. Maximum 3 Quick Actions */}
        <section className="space-y-2.5">
          <h3 className="text-xs font-bold text-[#94A3B8] font-mono uppercase tracking-wider px-1">
            Quick Actions
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Quick Action 1: Memory Raid */}
            <Link
              href="/raid"
              className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between min-h-[44px] ${
                dueCount > 0
                  ? "bg-[#1B1B3A] border-red-500/60 text-white"
                  : "bg-[#1B1B3A] border-white/10 text-slate-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl shrink-0 ${dueCount > 0 ? "bg-red-500/20 text-red-400" : "bg-white/5 text-slate-400"}`}>
                  <Swords className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white font-heading">Memory Raid</h4>
                  <p className="text-[10px] text-[#94A3B8]">Spaced repetition</p>
                </div>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${dueCount > 0 ? "bg-red-500/20 text-red-400 border border-red-500/40" : "bg-white/5 text-slate-500"}`}>
                {dueCount > 0 ? `${dueCount} Due` : "0 Due"}
              </span>
            </Link>

            {/* Quick Action 2: Elimination Arena */}
            <Link
              href="/arena"
              className="bg-[#1B1B3A] border border-white/10 hover:border-[#FB7185]/60 p-3.5 rounded-2xl transition-all flex items-center justify-between min-h-[44px]"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#FB7185]/20 text-[#FB7185] shrink-0">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white font-heading">Elimination Arena</h4>
                  <p className="text-[10px] text-[#94A3B8]">Weekly tournament</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500" />
            </Link>

            {/* Quick Action 3: Voice AI Tutor */}
            <Link
              href="/tutor"
              className="bg-[#1B1B3A] border border-white/10 hover:border-[#22D3EE]/60 p-3.5 rounded-2xl transition-all flex items-center justify-between min-h-[44px]"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#22D3EE]/20 text-[#22D3EE] shrink-0">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white font-heading">Voice AI Tutor</h4>
                  <p className="text-[10px] text-[#94A3B8]">Real-time speech</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500" />
            </Link>
          </div>
        </section>
      </div>

      <BottomNav />
    </main>
  );
}
