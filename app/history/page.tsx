"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuest } from "@/lib/QuestContext";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import {
  getResumeSession,
  getHistoryTimeline,
  getSevenDayActivity,
  getWeakSpots,
  StudySession,
  DayTimelineGroup,
  SevenDayBar,
  WeakSpotSkill,
} from "@/lib/studySessions";
import {
  History as HistoryIcon,
  Play,
  RotateCcw,
  Clock,
  CheckCircle2,
  Trophy,
  Zap,
  Flame,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Calendar,
  Sparkles,
  Award,
  BookOpen,
} from "lucide-react";

export default function HistoryPage() {
  const router = useRouter();
  const { user, isAuthLoading, course, setActiveSkillIndex } = useQuest();

  const [resumeSession, setResumeSession] = useState<StudySession | null>(null);
  const [timeline, setTimeline] = useState<DayTimelineGroup[]>([]);
  const [sevenDayBars, setSevenDayBars] = useState<SevenDayBar[]>([]);
  const [weakSpots, setWeakSpots] = useState<WeakSpotSkill[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      if (isAuthLoading) return;
      setLoadingData(true);

      const userId = user?.id || "demo-user-1";

      const [resume, timeGroups, bars, weak] = await Promise.all([
        getResumeSession(userId),
        getHistoryTimeline(userId),
        getSevenDayActivity(userId),
        getWeakSpots(userId),
      ]);

      setResumeSession(resume);
      setTimeline(timeGroups);
      setSevenDayBars(bars);
      setWeakSpots(weak);
      setLoadingData(false);
    }

    loadHistory();
  }, [user?.id, isAuthLoading]);

  const handleResumeQuest = (skillId?: string) => {
    if (course?.skills && skillId) {
      const idx = course.skills.findIndex((s) => s.id === skillId);
      if (idx >= 0) {
        setActiveSkillIndex(idx);
      }
    }
    router.push("/quest");
  };

  const handlePracticeSkill = (skillId: string) => {
    if (course?.skills) {
      const idx = course.skills.findIndex((s) => s.id === skillId);
      if (idx >= 0) {
        setActiveSkillIndex(idx);
      }
    }
    router.push("/quest");
  };

  if (isAuthLoading || loadingData) {
    return (
      <div className="min-h-screen bg-[#0A0A1A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#22D3EE] animate-spin" />
      </div>
    );
  }

  const maxQuestionsInWeek = Math.max(1, ...(sevenDayBars || []).map((b) => b.questionsCount));
  const userStreak = user?.streak || 0;

  return (
    <main className="min-h-screen bg-[#0A0A1A] bg-grid-pattern relative flex flex-col justify-between pb-24 p-4 sm:p-6 overflow-x-hidden">
      {/* Background Orbs */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-[#7C3AED]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#22D3EE]/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-xl mx-auto space-y-4 z-10 my-auto">
        <TopBar
          title="Learning History"
          subtitle="Study Sessions, 7-Day Activity & Resume Controls"
        />

        {/* 1. RESUME HERO CARD (Top Section - Single Most Important Element) */}
        <section className="bg-[#1B1B3A] border border-[#22D3EE]/50 rounded-3xl p-5 shadow-xl space-y-3 glow-box-cyan">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#22D3EE]/20 border border-[#22D3EE]/40 text-[#22D3EE] text-xs font-mono font-bold">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RESUME PROGRESS</span>
            </div>
            {resumeSession && (
              <span className="text-[10px] font-mono text-[#FBBF24] font-bold">
                Incomplete Session
              </span>
            )}
          </div>

          {resumeSession ? (
            <div className="space-y-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white font-heading">
                  {resumeSession.goal_title || course?.title || "Python Mastery"}
                </h2>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  Stopped on skill:{" "}
                  <span className="text-[#22D3EE] font-bold">
                    {resumeSession.last_skill_name || "Foundational Syntax"}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-4 bg-[#0A0A1A] border border-white/10 rounded-2xl p-3 text-xs">
                <div className="flex items-center gap-1.5 text-slate-300 font-mono">
                  <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
                  <span>{resumeSession.questions_answered} Questions</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#FBBF24] font-mono">
                  <Trophy className="w-4 h-4 text-[#FBBF24]" />
                  <span>+{resumeSession.xp_earned} XP Earned</span>
                </div>
              </div>

              <button
                onClick={() => handleResumeQuest(resumeSession.last_skill_id)}
                className="w-full py-3.5 px-5 min-h-[44px] rounded-2xl bg-gradient-to-r from-[#22D3EE] via-[#7C3AED] to-[#34D399] hover:opacity-95 text-black font-bold text-xs sm:text-sm font-heading shadow-xl shadow-[#22D3EE]/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>Continue where you left off</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="bg-[#0A0A1A] border border-white/10 rounded-2xl p-4 text-center space-y-2">
              <p className="text-xs font-bold text-white font-heading">All Caught Up!</p>
              <p className="text-[11px] text-[#94A3B8]">
                No incomplete sessions pending — start a fresh quest anytime to advance your skill path.
              </p>
              <button
                onClick={() => router.push("/quest")}
                className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold font-heading transition-all shadow-md mt-1 cursor-pointer"
              >
                <span>Start Quest</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </section>

        {/* 2. 7-DAY ACTIVITY STRIP */}
        <section className="bg-[#1B1B3A] border border-white/10 rounded-3xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-white font-heading flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#FBBF24]" />
              7-Day Activity & Streaks
            </h2>
            <span className="text-[10px] font-mono text-[#22D3EE] font-bold">
              {userStreak} Day Active Streak
            </span>
          </div>

          {/* Activity Bar Chart */}
          <div className="grid grid-cols-7 gap-2 pt-2 items-end h-28">
            {sevenDayBars.map((bar, idx) => {
              const heightPct = Math.max(12, Math.round((bar.questionsCount / maxQuestionsInWeek) * 100));
              return (
                <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-[9px] font-mono text-slate-400 font-bold">
                    {bar.questionsCount > 0 ? bar.questionsCount : ""}
                  </span>
                  <div className="w-full bg-[#0A0A1A] rounded-xl h-20 flex items-end p-1 border border-white/5">
                    <div
                      className={`w-full rounded-lg transition-all duration-500 ${
                        bar.isToday
                          ? "bg-gradient-to-t from-[#22D3EE] to-[#34D399]"
                          : bar.questionsCount > 0
                          ? "bg-[#7C3AED]"
                          : "bg-white/5"
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className={`text-[10px] font-mono font-bold ${bar.isToday ? "text-[#22D3EE]" : "text-slate-400"}`}>
                    {bar.dayLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. WEAK SPOTS SECTION */}
        {weakSpots.length > 0 && (
          <section className="bg-[#1B1B3A] border border-amber-500/30 rounded-3xl p-5 shadow-md space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 font-heading">
              <AlertTriangle className="w-4 h-4" />
              <span>Targeted Practice: Weak Spots</span>
            </div>

            <div className="space-y-2">
              {weakSpots.map((spot) => (
                <div
                  key={spot.skillId}
                  className="bg-[#0A0A1A] border border-white/10 rounded-2xl p-3 flex items-center justify-between gap-3 min-h-[44px]"
                >
                  <div className="truncate">
                    <span className="text-xs font-bold text-white font-heading block truncate">
                      {spot.skillName}
                    </span>
                    <span className="text-[10px] font-mono text-[#94A3B8]">
                      Mastery Vector: P(know) = {spot.pKnow} • {spot.attempts} attempts
                    </span>
                  </div>

                  <button
                    onClick={() => handlePracticeSkill(spot.skillId)}
                    className="px-3 py-1.5 min-h-[44px] rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 text-xs font-mono font-bold transition-all shrink-0 cursor-pointer"
                  >
                    Practice this
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4. REVERSE-CHRONOLOGICAL TIMELINE */}
        <section className="space-y-3 pt-1">
          <h2 className="text-xs font-bold text-[#94A3B8] font-mono uppercase tracking-wider px-1">
            Session History Timeline
          </h2>

          {timeline.length > 0 ? (
            <div className="space-y-4">
              {timeline.map((group, idx) => (
                <div
                  key={idx}
                  className="bg-[#1B1B3A] border border-white/10 rounded-3xl p-5 shadow-md space-y-3"
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#22D3EE]" />
                      <span className="text-sm font-bold text-white font-heading">
                        {group.displayDay}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono text-slate-300">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#22D3EE]" />
                        {group.totalMinutesStudied}m
                      </span>
                      <span className="flex items-center gap-1 text-[#FBBF24] font-bold">
                        <Trophy className="w-3.5 h-3.5" />
                        +{group.totalXp} XP
                      </span>
                    </div>
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-3 gap-2 bg-[#0A0A1A] p-2.5 rounded-2xl text-center text-xs">
                    <div>
                      <span className="text-[10px] font-mono text-[#94A3B8] block">Questions</span>
                      <span className="font-bold text-white font-mono">{group.totalQuestions}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-[#94A3B8] block">Accuracy</span>
                      <span className="font-bold text-[#34D399] font-mono">{group.accuracyPct}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-[#94A3B8] block">Correct</span>
                      <span className="font-bold text-white font-mono">{group.totalCorrect}</span>
                    </div>
                  </div>

                  {/* Touched Skills List */}
                  {group.skillsTouched.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                        Skills Studied:
                      </span>
                      <div className="space-y-1.5">
                        {group.skillsTouched.map((sk) => (
                          <div
                            key={sk.skillId}
                            className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                              sk.isMasteredToday
                                ? "bg-[#34D399]/15 border-[#34D399]/40 text-white"
                                : "bg-[#0A0A1A] border-white/10 text-slate-300"
                            }`}
                          >
                            <span className="font-bold font-heading truncate">{sk.skillName}</span>
                            <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                              <span>
                                {Math.round(sk.initialPKnow * 100)}% → {Math.round(sk.finalPKnow * 100)}%
                              </span>
                              {sk.isMasteredToday && (
                                <span className="px-2 py-0.5 rounded-full bg-[#34D399] text-black font-bold text-[9px]">
                                  MASTERED!
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#1B1B3A] border border-white/10 rounded-3xl p-6 text-center space-y-2">
              <BookOpen className="w-8 h-8 text-[#22D3EE] mx-auto opacity-80" />
              <p className="text-xs font-bold text-white font-heading">No Study Sessions Recorded Yet</p>
              <p className="text-[11px] text-[#94A3B8] max-w-xs mx-auto">
                Complete your first quest to begin recording session duration, accuracy metrics, and skill progress timelines.
              </p>
            </div>
          )}
        </section>
      </div>

      <BottomNav />
    </main>
  );
}
