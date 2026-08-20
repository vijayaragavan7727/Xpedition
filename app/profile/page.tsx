"use client";

import React, { useState, useEffect } from "react";
import { useQuest } from "@/lib/QuestContext";
import BottomNav from "@/components/BottomNav";
import TopBar from "@/components/TopBar";
import { xpProgress } from "@/lib/progression";
import Link from "next/link";
import {
  User,
  Flame,
  Trophy,
  Zap,
  Compass,
  CheckCircle2,
  Settings,
  Edit2,
  Check,
  Loader2,
  BookOpen,
  Award,
  ArrowRight,
  Shield,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getTopArmInsight, RewardArm } from "@/lib/bandit";
import SquidAsset from "@/components/SquidAsset";
import XpAsset from "@/components/XpAsset";

export default function ProfilePage() {
  const { user, isAuthLoading, course, goalText, saveUserProfile } = useQuest();
  const progress = xpProgress(user.xp);

  // Editable display name
  const [displayName, setDisplayName] = useState(user.name);
  const [isEditingName, setIsEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);

  // Live DB queried real stats
  const [masteredCount, setMasteredCount] = useState<number>(0);
  const [totalQuestionsAnswered, setTotalQuestionsAnswered] = useState<number>(0);
  const [courseProgressPct, setCourseProgressPct] = useState<number>(0);
  const [banditArms, setBanditArms] = useState<RewardArm[]>([]);
  const [loadingRealStats, setLoadingRealStats] = useState(true);

  useEffect(() => {
    setDisplayName(user.name);
  }, [user.name]);

  useEffect(() => {
    async function loadRealStats() {
      if (isAuthLoading) return;
      setLoadingRealStats(true);

      let mastered = 0;
      let questions = 0;

      if (isSupabaseConfigured() && user?.id) {
        try {
          // 1. Query mastered count (p_know > 0.85)
          const { data: masteryRecords } = await supabase
            .from("mastery")
            .select("skill_id, p_know")
            .eq("user_id", user.id);

          if (masteryRecords) {
            mastered = masteryRecords.filter((m) => m.p_know > 0.85).length;
            questions = masteryRecords.length * 3;
          }

          // 2. Query total assessments
          const { count: assessmentCount } = await supabase
            .from("assessments")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id);

          if (assessmentCount) {
            questions += assessmentCount;
          }

          // 3. Query reward arms for bandit insights
          const { data: armsData } = await supabase
            .from("reward_arms")
            .select("*")
            .eq("user_id", user.id);

          if (armsData && armsData.length > 0) {
            setBanditArms(armsData as RewardArm[]);
          }
        } catch (err) {
          console.warn("Profile stats fetch notice:", err);
        }
      }

      setMasteredCount(mastered);
      setTotalQuestionsAnswered(questions);

      // Compute Course Progress %
      if (course?.skills && course.skills.length > 0) {
        const pct = Math.round((mastered / course.skills.length) * 100);
        setCourseProgressPct(pct);
      } else {
        setCourseProgressPct(0);
      }

      setLoadingRealStats(false);
    }

    loadRealStats();
  }, [user.id, isAuthLoading, course]);

  const handleSaveName = async () => {
    if (!displayName.trim()) return;
    setSavingName(true);

    const updatedUser = { ...user, name: displayName.trim() };
    await saveUserProfile(updatedUser);

    if (isSupabaseConfigured() && user.id) {
      try {
        await supabase
          .from("users")
          .update({ display_name: displayName.trim() })
          .eq("id", user.id);
      } catch (err) {
        console.warn("Failed to persist name to Supabase:", err);
      }
    }

    setSavingName(false);
    setIsEditingName(false);
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A1A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#22D3EE] animate-spin" />
      </div>
    );
  }

  const isBrandNew = user.xp === 0 && masteredCount === 0;
  const banditInsight = getTopArmInsight(banditArms);

  return (
    <main className="min-h-screen bg-[#0A0A1A] bg-grid-pattern relative flex flex-col justify-between pb-24 p-4 sm:p-6 overflow-x-hidden">
      {/* Background Orbs */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-[#7C3AED]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#22D3EE]/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-xl mx-auto space-y-4 z-10 my-auto">
        <TopBar
          title="Learner Profile"
          subtitle="Real-Time Mastery Vector & Performance Stats"
          rightAction={
            <Link
              href="/settings"
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-[#0A0A1A] border border-white/10 hover:border-[#22D3EE] text-slate-300 hover:text-[#22D3EE] flex items-center justify-center transition-all cursor-pointer shrink-0"
              aria-label="App Settings"
            >
              <Settings className="w-5 h-5 text-[#22D3EE]" />
            </Link>
          }
        />

        {/* User Card with Editable Name */}
        <header className="bg-[#0D0D1A] border border-white/10 rounded-3xl p-5 shadow-lg flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 truncate">
            <XpAsset name="award" alt="Player Badge Icon" width={48} height={48} className="shrink-0 text-[#FFB800]" />

            <div className="truncate">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="bg-[#0A0A1A] border border-[#22D3EE] rounded-xl px-3 py-1 text-sm font-bold text-white focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={savingName}
                    className="p-2 min-w-[36px] min-h-[36px] rounded-xl bg-[#34D399] text-black font-bold flex items-center justify-center cursor-pointer"
                  >
                    {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 truncate">
                  <h1 className="text-base sm:text-lg font-bold text-white font-heading truncate">{user.name}</h1>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="text-slate-400 hover:text-[#22D3EE] transition-colors p-1 cursor-pointer"
                    aria-label="Edit Name"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <p className="text-xs text-[#94A3B8] truncate">{user.email}</p>
              <div className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/40 text-[#22D3EE] text-[10px] font-mono font-bold">
                <Zap className="w-3 h-3 text-[#FBBF24]" />
                Level {progress.level} Adventurer
              </div>
            </div>
          </div>

          <Link
            href="/settings"
            className="px-3 py-1.5 min-h-[44px] rounded-xl bg-white/5 border border-white/10 hover:border-[#22D3EE] text-slate-300 hover:text-[#22D3EE] text-xs font-mono font-bold transition-all flex items-center gap-1.5 shrink-0"
          >
            <Settings className="w-4 h-4 text-[#22D3EE]" />
            <span className="hidden sm:inline">Settings</span>
          </Link>
        </header>

        {/* Real Live Stats Grid */}
        <section className="space-y-2.5">
          <h2 className="text-xs font-bold text-[#94A3B8] font-mono uppercase tracking-wider px-1">
            Verified Live Stats
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Stat 1: Total XP */}
            <div className="bg-[#1B1B3A] border border-white/10 rounded-2xl p-3.5 space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono text-[#FBBF24] font-bold">
                <span>TOTAL XP</span>
                <Trophy className="w-3.5 h-3.5" />
              </div>
              <p className="text-lg font-bold text-white font-heading">{user.xp}</p>
              <p className="text-[10px] text-[#94A3B8]">Level {progress.level}</p>
            </div>

            {/* Stat 2: Current & Longest Streak */}
            <div className="bg-[#1B1B3A] border border-white/10 rounded-2xl p-3.5 space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono text-[#FBBF24] font-bold">
                <span>STREAK</span>
                <Flame className="w-3.5 h-3.5" />
              </div>
              <p className="text-lg font-bold text-white font-heading">{user.streak} Days</p>
              <p className="text-[10px] text-[#94A3B8]">Best: {user.longestStreak || user.streak}d</p>
            </div>

            {/* Stat 3: Skills Mastered */}
            <div className="bg-[#1B1B3A] border border-white/10 rounded-2xl p-3.5 space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono text-[#34D399] font-bold">
                <span>MASTERED</span>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <p className="text-lg font-bold text-white font-heading">{masteredCount}</p>
              <p className="text-[10px] text-[#94A3B8]">P(know) &gt; 0.85</p>
            </div>

            {/* Stat 4: Questions Answered */}
            <div className="bg-[#1B1B3A] border border-white/10 rounded-2xl p-3.5 space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono text-[#22D3EE] font-bold">
                <span>ANSWERED</span>
                <HelpCircle className="w-3.5 h-3.5" />
              </div>
              <p className="text-lg font-bold text-white font-heading">{totalQuestionsAnswered}</p>
              <p className="text-[10px] text-[#94A3B8]">Quests & Raids</p>
            </div>
          </div>
        </section>

        {/* Thompson Sampling Bandit Read-Only Insight Card */}
        <section className="bg-[#1B1B3A] border border-white/10 rounded-3xl p-5 shadow-md space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-white font-bold font-heading">
              <Sparkles className="w-4 h-4 text-[#FBBF24]" />
              <span>Reward Drive Insight</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {banditInsight.totalOutcomes} Outcomes Tracked
            </span>
          </div>

          {banditInsight.isLearned ? (
            <div className="flex items-center justify-between bg-[#0A0A1A] border border-[#34D399]/40 rounded-2xl p-3.5">
              <div className="pr-2">
                <p className="text-xs text-white font-bold font-heading">
                  You respond best to: <span className="text-[#34D399]">{banditInsight.label}</span>
                </p>
                <p className="text-[10px] text-[#94A3B8] mt-0.5">
                  Thompson Sampling Bandit observed highest return rate from this reward arm
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#34D399]/20 text-[#34D399] text-[10px] font-mono font-bold border border-[#34D399]/30 shrink-0">
                {banditInsight.expectedValue}% EV
              </span>
            </div>
          ) : (
            <div className="bg-[#0A0A1A] border border-white/10 rounded-2xl p-3.5 text-center space-y-1">
              <p className="text-xs font-bold text-slate-200 font-heading">
                Still learning what motivates you...
              </p>
              <p className="text-[10px] text-[#94A3B8]">
                {banditInsight.totalOutcomes}/10 reward outcomes recorded ({10 - banditInsight.totalOutcomes} more needed for peak drive analysis)
              </p>
            </div>
          )}
        </section>

        {/* Current Active Goal & Real Computed Progress */}
        <section className="bg-[#1B1B3A] border border-white/10 rounded-3xl p-5 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-[#94A3B8] font-mono uppercase tracking-wider">
              Active Learning Goal
            </h2>
            <span className="text-xs text-[#34D399] font-bold font-mono">
              {courseProgressPct}% Complete
            </span>
          </div>

          <h3 className="text-sm sm:text-base font-bold text-white font-heading truncate">
            {course?.title || "Python Mastery"}
          </h3>
          <p className="text-xs text-[#94A3B8] truncate">Prompt: "{goalText}"</p>

          <div className="w-full h-2.5 bg-[#0A0A1A] rounded-full overflow-hidden border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-[#22D3EE] via-[#7C3AED] to-[#34D399] rounded-full transition-all duration-500"
              style={{ width: `${courseProgressPct}%` }}
            />
          </div>
        </section>

        {/* Brand New Honest Empty State Banner */}
        {isBrandNew && (
          <div className="bg-[#0A0A1A] border border-[#22D3EE]/30 rounded-2xl p-5 text-center space-y-2">
            <p className="text-xs text-white font-bold font-heading">No Verified Progress Recorded Yet</p>
            <p className="text-[11px] text-slate-400">
              Start your first quest to earn XP, maintain streaks, and verify your skill mastery vector!
            </p>
            <div className="pt-1">
              <Link
                href="/quest"
                className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold font-heading transition-all shadow-md"
              >
                <span>Start First Quest</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Quick Link to Settings */}
        <div className="pt-2 text-center">
          <Link
            href="/settings"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] w-full rounded-2xl bg-[#1B1B3A] border border-white/10 hover:border-[#22D3EE] text-slate-200 font-bold text-xs transition-all shadow-md font-heading"
          >
            <Settings className="w-4 h-4 text-[#22D3EE]" />
            <span>Open App Preferences & Settings</span>
          </Link>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
