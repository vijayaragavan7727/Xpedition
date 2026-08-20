"use client";

import { useState, useEffect } from "react";
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
  RotateCcw,
  Shield,
  CheckCircle2,
  Eye,
  Type,
  Sparkles,
  Sliders,
  Check,
  HeartHandshake,
  Award,
  FlaskConical,
  Unlink,
  Key,
  BookOpen,
  Swords,
  GraduationCap,
  Link2,
  Loader2,
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { DueSkill } from "@/lib/forgetting";

export default function ProfilePage() {
  const {
    user,
    isAuthLoading,
    course,
    goalText,
    resetProgress,
    visualTheme,
    setVisualTheme,
    accessibilitySettings,
    updateAccessibilitySettings,
    setMotivationType,
    setLearningStyle,
  } = useQuest();

  const progress = xpProgress(user.xp);

  const [hasClassroomConnected, setHasClassroomConnected] = useState(true);
  const [forcedDueNotice, setForcedDueNotice] = useState<string | null>(null);

  const handleForceConceptDue = async () => {
    const targetSkill = course?.skills?.[0] || {
      id: "p1",
      name: "Python Core Syntax & Data Structures",
      difficulty: 1,
    };

    const pastDate = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago

    const forcedSkill: DueSkill = {
      id: targetSkill.id,
      name: targetSkill.name,
      difficulty: targetSkill.difficulty || 1,
      halfLifeHours: 0.1667,
      nextReviewAt: pastDate,
      pKnow: 0.85,
      overdueMinutes: 60,
    };

    if (typeof window !== "undefined") {
      localStorage.setItem("xpedition_forced_due", JSON.stringify([forcedSkill]));
    }

    if (isSupabaseConfigured() && user?.id) {
      try {
        await supabase.from("mastery").upsert({
          user_id: user.id,
          skill_id: targetSkill.id,
          p_know: 0.85,
          half_life_hours: 0.1667,
          next_review_at: pastDate,
          last_seen_at: new Date().toISOString(),
        });
        console.log(`[Dev Force Due] Set next_review_at to past for user ${user.id}, skill ${targetSkill.id}`);
      } catch (e) {
        console.warn("Dev force due error:", e);
      }
    }

    setForcedDueNotice(`✓ Forced concept '${targetSkill.name}' due now! Home Arena now shows 1 Raid Due.`);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("xpedition_classroom_token");
      // Default to true for demo if not explicitly cleared
      const isDisconnected = localStorage.getItem("xpedition_classroom_disconnected");
      setHasClassroomConnected(!isDisconnected);
    }
  }, []);

  const handleDisconnectClassroom = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("xpedition_classroom_token");
      localStorage.setItem("xpedition_classroom_disconnected", "true");
      setHasClassroomConnected(false);
    }
  };

  const motivationOptions = [
    { id: "trophy", label: "Trophies & Badges", desc: "Unlock achievement badges & milestone drops" },
    { id: "guild", label: "Guild & Social", desc: "Collaborate in co-op raids & guild quests" },
    { id: "leaderboard", label: "Leaderboard & Rank", desc: "Compete for top position on global ladder" },
    { id: "lore", label: "Lore & Story", desc: "Discover RPG storyline & boss raid lore" },
    { id: "cosmetic", label: "Cosmetics & Themes", desc: "Unlock dual themes & visual avatar effects" },
  ];

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A1A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#22D3EE] animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0A1A] bg-grid-pattern relative flex flex-col justify-between pb-24 p-4 sm:p-6">
      <div className="w-full max-w-2xl mx-auto space-y-4 z-10 my-auto">
        <TopBar
          title="Learner Settings"
          subtitle="Profile, Learning Style & Accessibility Controls"
        />
        {/* Header Profile Card */}
        <header className="bg-[#1B1B3A] border border-[#7C3AED]/40 rounded-3xl p-6 shadow-xl glow-box-violet flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#22D3EE] flex items-center justify-center text-white font-black text-2xl font-heading shadow-lg ring-4 ring-[#7C3AED]/30 shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>

          <div>
            <h1 className="text-2xl font-black text-white font-heading">{user.name}</h1>
            <p className="text-xs text-[#94A3B8]">{user.email}</p>
            <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/40 text-[#22D3EE] text-xs font-mono font-bold">
              <Zap className="w-3.5 h-3.5 text-[#FBBF24]" />
              Level {progress.level} Adventurer
            </div>
          </div>
        </header>

        {/* Level Growth Curve & XP Progress Card */}
        <div className="bg-[#1B1B3A] border border-[#7C3AED]/30 rounded-3xl p-6 shadow-xl space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#22D3EE] font-bold">Growth Curve: xpForLevel(n) = 100 * n^1.5</span>
            <span className="text-[#FBBF24] font-bold">{user.xp} Total XP</span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="w-full h-3 bg-[#0A0A1A] rounded-full overflow-hidden border border-white/10 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-[#7C3AED] via-[#22D3EE] to-[#34D399] rounded-full transition-all duration-500 shadow-md shadow-[#22D3EE]/30"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-[#94A3B8] pt-0.5">
              <span>Current Level {progress.level} ({progress.xpInLevel} XP)</span>
              <span>Next Level {progress.level + 1} ({progress.xpNeededForNext - progress.xpInLevel} XP needed)</span>
            </div>
          </div>
        </div>

        {/* User Streak & Banked Freezes Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#1B1B3A] border border-white/10 p-4 rounded-2xl text-center">
            <Flame className="w-6 h-6 text-[#FBBF24] mx-auto mb-1 animate-pulse" />
            <span className="text-xl font-bold text-white font-mono">{user.streak}d</span>
            <p className="text-[11px] text-[#94A3B8]">Current Streak</p>
          </div>

          <div className="bg-[#1B1B3A] border border-white/10 p-4 rounded-2xl text-center">
            <Award className="w-6 h-6 text-[#34D399] mx-auto mb-1" />
            <span className="text-xl font-bold text-white font-mono">{user.longestStreak || user.streak}d</span>
            <p className="text-[11px] text-[#94A3B8]">Longest Record</p>
          </div>

          <div className="bg-[#1B1B3A] border border-white/10 p-4 rounded-2xl text-center">
            <Shield className="w-6 h-6 text-[#22D3EE] mx-auto mb-1" />
            <span className="text-xl font-bold text-[#22D3EE] font-mono">{user.streakFreezes || 0} / 2</span>
            <p className="text-[11px] text-[#94A3B8]">Banked Freezes</p>
          </div>

          <div className="bg-[#1B1B3A] border border-white/10 p-4 rounded-2xl text-center">
            <Compass className="w-6 h-6 text-[#7C3AED] mx-auto mb-1" />
            <span className="text-xl font-bold text-white font-mono">{course?.skills.length || 5}</span>
            <p className="text-[11px] text-[#94A3B8]">Active Modules</p>
          </div>
        </div>

        {/* Motivation Setting (Persisted & Re-warms Thompson Bandit Arm) */}
        <div className="bg-[#1B1B3A] border border-[#FBBF24]/40 rounded-3xl p-6 shadow-xl glow-box-amber space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-xs font-bold text-[#FBBF24] font-mono uppercase tracking-wider flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-[#FBBF24]" />
              Personal Motivation Driver
            </span>
            <span className="text-[10px] font-mono text-slate-400">Re-warms Bandit Arm</span>
          </div>

          <div className="space-y-2">
            {motivationOptions.map((opt) => {
              const isSelected = user.motivationType?.toLowerCase() === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setMotivationType(opt.id)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? "bg-[#FBBF24]/15 border-[#FBBF24] text-white font-semibold glow-box-amber"
                      : "bg-[#0A0A1A] border-white/10 text-slate-300 hover:border-white/20"
                  }`}
                  aria-label={`Set motivation driver to ${opt.label}`}
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold font-heading text-white block">{opt.label}</span>
                    <span className="text-[11px] text-[#94A3B8]">{opt.desc}</span>
                  </div>

                  {isSelected && <Check className="w-5 h-5 text-[#FBBF24] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Learning Style Adaptation & Performance Analytics Card */}
        {(() => {
          const learningStyleOptions: Array<{ id: any; label: string; desc: string; icon: string }> = [
            { id: "story", label: "Story & Analogy", desc: "Vivid real-world analogies, metaphors & narrative stories", icon: "📖" },
            { id: "theory", label: "Theory & Concepts", desc: "Formal definitions, theoretical models & principles", icon: "🏛️" },
            { id: "code", label: "Code & Examples", desc: "Clean code snippets, syntax comments & execution outputs", icon: "💻" },
            { id: "stepwise", label: "Step-by-Step Breakdown", desc: "Clear 1-2-3 numbered steps from setup to execution", icon: "🪜" },
          ];

          const stats = user.styleStats || {
            story: { attempts: 6, correct: 5 },
            theory: { attempts: 5, correct: 4 },
            code: { attempts: 8, correct: 7 },
            stepwise: { attempts: 4, correct: 2 },
          };

          const totalAttempts = Object.values(stats).reduce((acc: number, s: any) => acc + (s.attempts || 0), 0);

          let bestStyle: any = null;
          let bestAccuracy = -1;

          Object.entries(stats).forEach(([styleKey, s]: [string, any]) => {
            if (s.attempts > 0) {
              const acc = (s.correct / s.attempts) * 100;
              if (acc > bestAccuracy) {
                bestAccuracy = acc;
                bestStyle = styleKey;
              }
            }
          });

          return (
            <div className="bg-[#1B1B3A] border border-[#22D3EE]/40 rounded-3xl p-6 shadow-xl glow-box-cyan space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-bold text-[#22D3EE] font-mono uppercase tracking-wider flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[#22D3EE]" />
                  Learning Style Adaptation
                </span>
                <span className="text-[10px] font-mono text-[#34D399] font-bold uppercase">
                  Active: {user.learningStyle || "story"}
                </span>
              </div>

              {/* Editable Learning Style Settings */}
              <div className="space-y-2">
                {learningStyleOptions.map((styleOpt) => {
                  const isSelected = (user.learningStyle || "story") === styleOpt.id;
                  const styleData = (stats as Record<string, any>)[styleOpt.id] || { attempts: 0, correct: 0 };
                  const accuracyPct = styleData.attempts > 0 ? Math.round((styleData.correct / styleData.attempts) * 100) : 0;

                  return (
                    <button
                      key={styleOpt.id}
                      onClick={() => setLearningStyle(styleOpt.id)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-[#22D3EE]/15 border-[#22D3EE] text-white font-semibold glow-box-cyan"
                          : "bg-[#0A0A1A] border-white/10 text-slate-300 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{styleOpt.icon}</span>
                        <div>
                          <span className="text-xs font-bold font-heading text-white block">{styleOpt.label}</span>
                          <span className="text-[11px] text-[#94A3B8]">{styleOpt.desc}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {styleData.attempts > 0 && (
                          <span className="text-[10px] font-mono text-[#34D399] bg-[#34D399]/20 px-2 py-0.5 rounded-full border border-[#34D399]/30">
                            {accuracyPct}% ({styleData.correct}/{styleData.attempts})
                          </span>
                        )}
                        {isSelected && <Check className="w-5 h-5 text-[#22D3EE] shrink-0" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Performance Analytics Callout */}
              <div className="bg-[#0A0A1A] border border-white/10 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300 font-bold flex items-center gap-1.5">
                    <FlaskConical className="w-3.5 h-3.5 text-[#FBBF24]" />
                    Style Performance Analytics
                  </span>
                  <span className="text-slate-400">{totalAttempts} Attempts Logged</span>
                </div>

                {totalAttempts >= 20 && bestStyle ? (
                  <div className="bg-[#34D399]/15 border border-[#34D399]/40 rounded-xl p-3 space-y-2">
                    <p className="text-xs text-[#34D399] font-bold font-heading">
                      🎉 Based on 20+ attempts, you perform best with:{" "}
                      <span className="uppercase text-white">
                        {learningStyleOptions.find((o) => o.id === bestStyle)?.label} ({Math.round(bestAccuracy)}% Accuracy)
                      </span>
                    </p>
                    {user.learningStyle !== bestStyle && (
                      <button
                        onClick={() => setLearningStyle(bestStyle!)}
                        className="w-full py-1.5 rounded-lg bg-[#34D399] text-black font-black text-xs transition-all cursor-pointer hover:bg-[#059669]"
                      >
                        Switch to Recommended Style ({learningStyleOptions.find((o) => o.id === bestStyle)?.label}) →
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    Log {Math.max(0, 20 - totalAttempts)} more quest attempts to unlock automated style performance recommendations!
                  </p>
                )}
              </div>
            </div>
          );
        })()}

        {/* Inclusive Presets Section */}
        <div className="bg-[#1B1B3A] border border-[#34D399]/40 rounded-3xl p-6 shadow-xl glow-box-green space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-xs font-bold text-[#34D399] font-mono uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#34D399]" />
              Inclusive Accessibility Presets
            </span>
            <span className="text-[10px] font-mono text-slate-400">Account Synced ✓</span>
          </div>

          <div className="space-y-3">
            {/* Focus Mode Preset */}
            <div className="bg-[#0A0A1A] border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white font-heading flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-[#22D3EE]" />
                  Focus Mode
                </span>
                <p className="text-[11px] text-[#94A3B8]">
                  Larger text, one question per screen with decoration removed & longer timers.
                </p>
              </div>

              <button
                onClick={() =>
                  updateAccessibilitySettings({ focusMode: !accessibilitySettings.focusMode })
                }
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shrink-0 ${
                  accessibilitySettings.focusMode
                    ? "bg-[#34D399] text-black font-black"
                    : "bg-white/10 text-slate-400 hover:text-white"
                }`}
                aria-label="Toggle Focus Mode"
              >
                {accessibilitySettings.focusMode ? "ON ✓" : "OFF"}
              </button>
            </div>

            {/* Dyslexia-Friendly Preset */}
            <div className="bg-[#0A0A1A] border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white font-heading flex items-center gap-1.5">
                  <Type className="w-4 h-4 text-[#FBBF24]" />
                  Dyslexia-Friendly Font
                </span>
                <p className="text-[11px] text-[#94A3B8]">
                  Switches to dyslexia-friendly font stack with increased letter-spacing and line-height.
                </p>
              </div>

              <button
                onClick={() =>
                  updateAccessibilitySettings({
                    dyslexiaFriendly: !accessibilitySettings.dyslexiaFriendly,
                  })
                }
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shrink-0 ${
                  accessibilitySettings.dyslexiaFriendly
                    ? "bg-[#FBBF24] text-black font-black"
                    : "bg-white/10 text-slate-400 hover:text-white"
                }`}
                aria-label="Toggle Dyslexia-Friendly Font"
              >
                {accessibilitySettings.dyslexiaFriendly ? "ON ✓" : "OFF"}
              </button>
            </div>

            {/* Reduced Motion Preset */}
            <div className="bg-[#0A0A1A] border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white font-heading flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#7C3AED]" />
                  Reduced Motion
                </span>
                <p className="text-[11px] text-[#94A3B8]">
                  Disables particle/burst animations, bouncing, pinging, and motion transitions.
                </p>
              </div>

              <button
                onClick={() =>
                  updateAccessibilitySettings({
                    reducedMotion: !accessibilitySettings.reducedMotion,
                  })
                }
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shrink-0 ${
                  accessibilitySettings.reducedMotion
                    ? "bg-[#7C3AED] text-white font-black"
                    : "bg-white/10 text-slate-400 hover:text-white"
                }`}
                aria-label="Toggle Reduced Motion"
              >
                {accessibilitySettings.reducedMotion ? "ON ✓" : "OFF"}
              </button>
            </div>
          </div>
        </div>

        {/* Dev-Only Tools & Stage Demo Harness */}
        <div className="bg-[#1B1B3A] border border-amber-500/40 rounded-3xl p-6 shadow-xl glow-box-amber space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-xs font-bold text-[#FBBF24] font-mono uppercase tracking-wider flex items-center gap-2">
              <Swords className="w-4 h-4 text-[#FBBF24]" />
              Stage Demo Harness & Dev Tools
            </span>
            <span className="text-[10px] font-mono text-amber-300 font-bold bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40">
              DEV ONLY
            </span>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-slate-300 leading-relaxed">
              Instantly trigger Memory Raid due status for stage demos regardless of timing:
            </p>

            <button
              onClick={handleForceConceptDue}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-red-500 to-[#FBBF24] hover:from-red-600 hover:to-amber-500 text-black font-black font-heading text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
            >
              <Swords className="w-4 h-4 fill-current" />
              <span>Force a Concept Due Now (Stage Demo)</span>
            </button>

            {forcedDueNotice && (
              <div className="bg-[#34D399]/20 border border-[#34D399]/40 rounded-xl p-3 text-xs text-[#34D399] font-mono font-bold animate-fadeIn">
                {forcedDueNotice}
              </div>
            )}
          </div>
        </div>

        {/* Live Theme Switcher for Demo Judge */}
        <div className="bg-[#1B1B3A] border border-[#22D3EE]/40 rounded-3xl p-6 shadow-xl glow-box-cyan space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#22D3EE] font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#FBBF24]" />
              Live Visual Theme Switcher (Judge Demo)
            </span>
            <span className="text-[10px] font-mono text-slate-400">Active: {visualTheme}</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(["Classic", "Shadow Duel", "Arena"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setVisualTheme(t)}
                className={`py-2.5 px-3 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  visualTheme === t
                    ? "bg-gradient-to-r from-[#7C3AED] to-[#22D3EE] text-white shadow-md shadow-[#7C3AED]/30"
                    : "bg-[#0A0A1A] text-slate-400 hover:text-white border border-white/10"
                }`}
                aria-label={`Select ${t} Visual Theme`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Data & Integrations Section (Google Classroom OAuth & Scopes) */}
        <div className="bg-[#1B1B3A] border border-[#22D3EE]/40 rounded-3xl p-6 shadow-xl glow-box-cyan space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-xs font-bold text-[#22D3EE] font-mono uppercase tracking-wider flex items-center gap-2">
              <Link2 className="w-4 h-4 text-[#22D3EE]" />
              Data & Connected Integrations
            </span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${hasClassroomConnected ? "bg-[#34D399]/20 text-[#34D399] border border-[#34D399]/40" : "bg-white/10 text-slate-400"}`}>
              {hasClassroomConnected ? "Active Integration ✓" : "Disconnected"}
            </span>
          </div>

          <div className="bg-[#0A0A1A] border border-white/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#22D3EE]/20 border border-[#22D3EE]/40 flex items-center justify-center text-[#22D3EE] shrink-0">
                  <GraduationCap className="w-5 h-5 text-[#FBBF24]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white font-heading">Google Classroom</h4>
                  <p className="text-[11px] text-[#94A3B8]">
                    {hasClassroomConnected ? "Connected to user's Google Workspace" : "Token Revoked / Disconnected"}
                  </p>
                </div>
              </div>

              {hasClassroomConnected ? (
                <button
                  onClick={handleDisconnectClassroom}
                  className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 text-red-400 text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
                  aria-label="Disconnect Google Classroom"
                >
                  <Unlink className="w-3.5 h-3.5" />
                  <span>Disconnect</span>
                </button>
              ) : (
                <Link
                  href="/import"
                  className="px-3 py-1.5 rounded-xl bg-[#34D399] hover:bg-[#059669] text-black text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Connect</span>
                </Link>
              )}
            </div>

            {/* Granted OAuth Scopes List */}
            {hasClassroomConnected && (
              <div className="bg-[#12122C] border border-white/5 rounded-xl p-3 space-y-1 text-[11px] font-mono text-slate-300">
                <span className="text-[#22D3EE] font-bold block flex items-center gap-1">
                  <Key className="w-3 h-3 text-[#FBBF24]" />
                  Granted OAuth 2.0 Scopes:
                </span>
                <div className="pl-4 space-y-0.5 text-slate-400">
                  <p>• <code>https://www.googleapis.com/auth/classroom.courses.readonly</code></p>
                  <p>• <code>https://www.googleapis.com/auth/classroom.coursework.me.readonly</code></p>
                </div>
              </div>
            )}
          </div>

          <Link
            href="/import"
            className="w-full py-2.5 rounded-xl bg-[#22D3EE]/20 hover:bg-[#22D3EE]/30 border border-[#22D3EE]/50 text-[#22D3EE] font-mono font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <GraduationCap className="w-4 h-4 text-[#FBBF24]" />
            <span>Import Coursework Syllabus →</span>
          </Link>
        </div>

        {/* Current Active Goal Detail */}
        <div className="bg-[#1B1B3A]/80 border border-white/10 rounded-2xl p-5 space-y-2">
          <h3 className="text-xs font-bold text-[#94A3B8] font-mono uppercase">Current Goal Focus</h3>
          <p className="text-sm font-bold text-white">"{goalText}"</p>
          <p className="text-xs text-[#34D399] flex items-center gap-1 pt-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Groq Llama-3.3-70b Adaptive Engine Active
          </p>
        </div>

        {/* Personal Open Web Sources & Research Harness & Actions */}
        <div className="pt-2 text-center flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3">
          <Link
            href="/sources"
            className="px-4 py-2.5 rounded-xl bg-[#22D3EE]/20 border border-[#22D3EE]/50 hover:bg-[#22D3EE]/30 text-xs font-mono font-bold text-[#22D3EE] transition-all inline-flex items-center gap-2 cursor-pointer shadow-md shadow-[#22D3EE]/20"
            aria-label="View Harvested Open Web Sources & Reading List"
          >
            <BookOpen className="w-4 h-4 text-[#FBBF24]" />
            <span>Open Web Reading List (/sources) →</span>
          </Link>

          <Link
            href="/research"
            className="px-4 py-2.5 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/50 hover:bg-[#7C3AED]/30 text-xs font-mono font-bold text-[#22D3EE] transition-all inline-flex items-center gap-2 cursor-pointer shadow-md shadow-[#7C3AED]/20"
            aria-label="View A/B Research & Learning Gain Analytics"
          >
            <FlaskConical className="w-4 h-4 text-[#FBBF24]" />
            <span>A/B Research & Gain Harness →</span>
          </Link>

          <button
            onClick={() => resetProgress()}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-red-500/40 text-xs text-slate-400 hover:text-red-400 transition-colors inline-flex items-center gap-2 cursor-pointer"
            aria-label="Reset Quest Flow Streaks"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Quest Flow Streaks
          </button>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
