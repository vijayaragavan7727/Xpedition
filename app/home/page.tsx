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
} from "lucide-react";

export default function HomePage() {
  const { user, course, activeSkillIndex } = useQuest();
  const [dueCount, setDueCount] = useState<number>(0);
  const router = useRouter();

  useEffect(() => {
    if (!user || !user.email) {
      const storedEmail = localStorage.getItem("xpedition_email");
      if (!storedEmail) {
        router.push("/");
      }
    }

    async function checkDueSkills() {
      const skills = await getDueSkills(user?.id);
      setDueCount(skills.length);
    }

    checkDueSkills();
  }, [user, router]);

  const currentSkill = course?.skills[activeSkillIndex] || {
    id: "s1",
    name: "Python Core Syntax & Data Structures",
    difficulty: 1,
  };

  // Real Level Growth Curve Progress
  const progress = xpProgress(user.xp);

  return (
    <main className="min-h-screen bg-[#0A0A1A] bg-grid-pattern relative flex flex-col justify-between pb-24 p-4 sm:p-6">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#7C3AED]/15 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-[#22D3EE]/15 rounded-full blur-[130px] pointer-events-none" />

      <div className="w-full max-w-2xl mx-auto space-y-6 z-10">
        {/* Top Bar */}
        <header className="bg-[#1B1B3A] border border-white/10 rounded-3xl p-4 shadow-xl flex items-center justify-between gap-3 glow-box-violet">
          {/* Avatar & User Details */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#22D3EE] flex items-center justify-center text-white font-black text-lg font-heading shadow-md ring-2 ring-[#22D3EE]/40">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#34D399] border-2 border-[#0A0A1A] flex items-center justify-center text-[10px] font-bold text-black">
                ✓
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white font-heading">{user.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-[#7C3AED]/30 text-[#22D3EE] text-xs font-mono font-bold border border-[#7C3AED]/40">
                  Level {progress.level}
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] truncate max-w-[150px]">{user.email}</p>
            </div>
          </div>

          {/* XP Bar & Streak Counter & Freezes & Live Raid Due Badge */}
          <div className="flex items-center gap-3">
            {/* XP Progress Bar */}
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1.5 text-xs text-[#FBBF24] font-mono font-bold">
                <Trophy className="w-3.5 h-3.5" />
                <span>{user.xp} XP</span>
              </div>
              <div className="w-24 sm:w-32 h-2.5 bg-[#0A0A1A] rounded-full overflow-hidden border border-white/10 p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-[#7C3AED] via-[#22D3EE] to-[#34D399] rounded-full transition-all duration-500 shadow-md shadow-[#22D3EE]/30"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </div>

            {/* Streak & Banked Freezes Counter */}
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#0A0A1A] border border-[#FBBF24]/30 text-[#FBBF24] font-mono text-xs font-bold">
              <Flame className="w-4 h-4 text-[#FBBF24] animate-pulse" />
              <span>{user.streak}d</span>
              {user.streakFreezes > 0 && (
                <span className="text-[10px] text-[#22D3EE] bg-[#22D3EE]/20 px-1.5 py-0.5 rounded-full border border-[#22D3EE]/40">
                  🛡️ {user.streakFreezes}
                </span>
              )}
            </div>

            {/* Live Raid Due Badge */}
            <Link
              href="/raid"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl border transition-all cursor-pointer ${
                dueCount > 0
                  ? "bg-red-500/20 border-red-500/60 text-red-400 font-bold glow-box-violet animate-pulse"
                  : "bg-[#0A0A1A] border-white/10 text-slate-500 opacity-60"
              }`}
            >
              <Swords className="w-5 h-5" />
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold font-mono leading-none">
                  {dueCount > 0 ? `${dueCount} Due` : "0 Due"}
                </span>
                <span className="text-[9px] font-mono uppercase tracking-tight leading-none mt-0.5">
                  {dueCount > 0 ? "Raid Due" : "Memory Fresh"}
                </span>
              </div>
            </Link>
          </div>
        </header>

        {/* Continue Your Quest Card */}
        <section className="bg-[#1B1B3A] border border-[#7C3AED]/40 rounded-3xl p-6 shadow-2xl glow-box-violet relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-[#7C3AED]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between mb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/40 text-[#22D3EE] text-xs font-mono font-bold">
              <Sparkles className="w-3.5 h-3.5 text-[#FBBF24]" />
              CURRENT QUEST MODULE
            </div>

            <span className="text-xs text-[#94A3B8] font-mono">
              Module {activeSkillIndex + 1} of {course?.skills.length || 5}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white font-heading mb-2">
            {currentSkill.name}
          </h2>
          <p className="text-xs text-[#94A3B8] mb-5">
            Course: <span className="text-slate-300 font-semibold">{course?.title || "Python Mastery"}</span>
          </p>

          {/* Module Progress Bar */}
          <div className="space-y-2 mb-6">
            <div className="flex items-center justify-between text-xs font-mono text-[#94A3B8]">
              <span>Quest Progression</span>
              <span className="text-[#34D399] font-bold">40% Complete</span>
            </div>
            <div className="w-full h-3 bg-[#0A0A1A] rounded-full overflow-hidden border border-white/10 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-[#22D3EE] via-[#7C3AED] to-[#34D399] rounded-full transition-all duration-500 shadow-md shadow-[#22D3EE]/30"
                style={{ width: "40%" }}
              />
            </div>
          </div>

          {/* CTA Action */}
          <Link
            href="/quest"
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#22D3EE] hover:from-[#6D28D9] hover:to-[#06B6D4] text-white font-bold text-sm transition-all shadow-lg shadow-[#7C3AED]/30 flex items-center justify-center gap-2 group cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
            <span>Continue Your Quest</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </section>

        {/* Quick Arena Modes Grid */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold text-[#94A3B8] font-mono uppercase tracking-wider px-2">
            Quick Arena Modes
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              href="/raid"
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between group ${
                dueCount > 0
                  ? "bg-[#1B1B3A] border-red-500/60 text-white shadow-lg shadow-red-500/10"
                  : "bg-[#1B1B3A] border-white/10 text-slate-400"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-xl ${dueCount > 0 ? "bg-red-500/20 text-red-400" : "bg-white/5 text-slate-400"}`}>
                  <Swords className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-mono font-bold ${dueCount > 0 ? "text-red-400" : "text-slate-500"}`}>
                  {dueCount > 0 ? `${dueCount} DUE` : "0 DUE"}
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white font-heading">Memory Raid</h4>
                <p className="text-[11px] text-[#94A3B8] mt-0.5">Spaced repetition boss battle</p>
              </div>
            </Link>

            <Link
              href="/tutor"
              className="bg-[#1B1B3A] border border-white/10 hover:border-[#22D3EE]/60 p-4 rounded-2xl transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-xl bg-[#22D3EE]/20 text-[#22D3EE] group-hover:scale-110 transition-transform">
                  <Mic className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono text-[#22D3EE]">VOICE AI</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white font-heading">Voice AI Tutor</h4>
                <p className="text-[11px] text-[#94A3B8] mt-0.5">Ask questions out loud in real time</p>
              </div>
            </Link>

            <Link
              href="/passport"
              className="bg-[#1B1B3A] border border-white/10 hover:border-[#34D399]/60 p-4 rounded-2xl transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-xl bg-[#34D399]/20 text-[#34D399] group-hover:scale-110 transition-transform">
                  <Compass className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono text-[#34D399]">PASSPORT</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white font-heading">Skill Passport</h4>
                <p className="text-[11px] text-[#94A3B8] mt-0.5">View verified credentials & share</p>
              </div>
            </Link>
          </div>
        </section>

        {/* Skill Node Dots Row */}
        <section className="bg-[#1B1B3A]/80 border border-white/10 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white font-heading flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#22D3EE]" />
              SKILL TREE MAP
            </h3>
            <span className="text-xs text-[#94A3B8] font-mono">Node Status</span>
          </div>

          <div className="flex items-center justify-between px-4 sm:px-8 py-4 bg-[#0A0A1A] rounded-2xl border border-white/5 relative">
            <div className="absolute top-1/2 left-12 right-12 h-1 bg-white/10 -translate-y-1/2 z-0" />
            <div className="absolute top-1/2 left-12 w-1/2 h-1 bg-gradient-to-r from-[#34D399] to-[#22D3EE] -translate-y-1/2 z-0" />

            <div className="flex flex-col items-center gap-2 z-10">
              <div className="w-12 h-12 rounded-full bg-[#34D399]/20 border-2 border-[#34D399] flex items-center justify-center text-[#34D399] shadow-lg shadow-[#34D399]/30 glow-box-green animate-pulse">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold text-[#34D399] font-mono">Mastered</span>
            </div>

            <div className="flex flex-col items-center gap-2 z-10">
              <div className="w-12 h-12 rounded-full bg-[#22D3EE]/20 border-2 border-[#22D3EE] flex items-center justify-center text-[#22D3EE] shadow-lg shadow-[#22D3EE]/30 glow-box-cyan ring-4 ring-[#22D3EE]/20">
                <Zap className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold text-[#22D3EE] font-mono">Current</span>
            </div>

            <div className="flex flex-col items-center gap-2 z-10">
              <div className="w-12 h-12 rounded-full bg-[#1B1B3A] border-2 border-slate-700 flex items-center justify-center text-slate-500 opacity-70">
                <Lock className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-slate-500 font-mono">Locked</span>
            </div>
          </div>
        </section>

        {/* Skill Modules List */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold text-[#94A3B8] font-mono uppercase tracking-wider px-2">
            Curriculum Skill Tree ({course?.skills.length || 5} Modules)
          </h3>

          <div className="space-y-2.5">
            {course?.skills.map((skill, idx) => {
              const isCurrent = idx === activeSkillIndex;
              const isMastered = idx < activeSkillIndex;

              return (
                <div
                  key={skill.id || idx}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isCurrent
                      ? "bg-[#1B1B3A] border-[#22D3EE]/60 shadow-lg shadow-[#22D3EE]/10"
                      : isMastered
                      ? "bg-[#1B1B3A]/60 border-[#34D399]/40 opacity-90"
                      : "bg-[#1B1B3A]/40 border-white/5 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-xs ${
                        isCurrent
                          ? "bg-[#22D3EE]/20 border border-[#22D3EE] text-[#22D3EE]"
                          : isMastered
                          ? "bg-[#34D399]/20 border border-[#34D399] text-[#34D399]"
                          : "bg-white/5 border border-white/10 text-slate-500"
                      }`}
                    >
                      {idx + 1}
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white font-heading">{skill.name}</h4>
                      <span className="text-[10px] text-[#94A3B8] font-mono">
                        Difficulty: Level {skill.difficulty}
                      </span>
                    </div>
                  </div>

                  {isCurrent && (
                    <Link
                      href="/quest"
                      className="px-3 py-1.5 rounded-xl bg-[#22D3EE]/20 border border-[#22D3EE]/40 text-[#22D3EE] text-xs font-bold hover:bg-[#22D3EE] hover:text-black transition-colors"
                    >
                      Play
                    </Link>
                  )}
                  {isMastered && (
                    <span className="text-xs text-[#34D399] font-bold font-mono">✓ Mastered</span>
                  )}
                  {!isCurrent && !isMastered && (
                    <Lock className="w-4 h-4 text-slate-600" />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <BottomNav />
    </main>
  );
}
