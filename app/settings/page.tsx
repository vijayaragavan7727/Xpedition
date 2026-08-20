"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuest, VisualTheme } from "@/lib/QuestContext";
import { LearningStyle } from "@/lib/types";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import {
  Sliders,
  Sparkles,
  Zap,
  Eye,
  Type,
  Flame,
  Key,
  LogOut,
  Trash2,
  BookOpen,
  Info,
  Check,
  Shield,
  Loader2,
  ExternalLink,
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const {
    user,
    isAuthLoading,
    visualTheme,
    setVisualTheme,
    accessibilitySettings,
    updateAccessibilitySettings,
    setLearningStyle,
  } = useQuest();

  const [savingStyle, setSavingStyle] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A1A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#22D3EE] animate-spin" />
      </div>
    );
  }

  const learningStyleOptions: { id: LearningStyle; title: string; desc: string }[] = [
    { id: "story", title: "Story & Analogy", desc: "Use analogies and real-world narratives" },
    { id: "theory", title: "Theory & Concepts", desc: "Precise definitions and core underlying principles" },
    { id: "code", title: "Code & Examples", desc: "Lead with runnable code snippets and technical breakdowns" },
    { id: "stepwise", title: "Step-by-Step", desc: "Break concepts into clear, numbered logical steps" },
  ];

  const themeOptions: { id: VisualTheme; title: string }[] = [
    { id: "Classic", title: "Classic Cyberpunk" },
    { id: "Shadow Duel", title: "Shadow Duel (Red Rim Light)" },
    { id: "Arena", title: "Tournament Arena" },
  ];

  const handleStyleChange = async (style: LearningStyle) => {
    setSavingStyle(true);
    await setLearningStyle(style);
    setSavingStyle(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPasswordNotice("Password must be at least 6 characters.");
      return;
    }

    setChangingPassword(true);
    setPasswordNotice(null);

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        setPasswordNotice("Password updated successfully!");
        setNewPassword("");
      } catch (err: any) {
        setPasswordNotice(`Password update failed: ${err.message || err}`);
      } finally {
        setChangingPassword(false);
      }
    } else {
      setPasswordNotice("Password updated locally for demo session.");
      setNewPassword("");
      setChangingPassword(false);
    }
  };

  const handleSignOut = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("xpedition_email");
      localStorage.removeItem("xpedition_user_profile");
    }
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    router.push("/");
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? All XP, streaks, and BKT mastery data will be cleared.")) {
      return;
    }

    if (isSupabaseConfigured() && user.id) {
      try {
        await supabase.from("game_state").delete().eq("user_id", user.id);
        await supabase.from("mastery").delete().eq("user_id", user.id);
        await supabase.from("users").delete().eq("id", user.id);
      } catch (err) {
        console.warn("Delete account warning:", err);
      }
    }

    handleSignOut();
  };

  return (
    <main className="min-h-screen bg-[#0A0A1A] bg-grid-pattern relative flex flex-col justify-between pb-24 p-4 sm:p-6 overflow-x-hidden">
      {/* Background Orbs */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-[#7C3AED]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#22D3EE]/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-xl mx-auto space-y-4 z-10 my-auto">
        <TopBar
          title="App Settings"
          subtitle="Learning Style, Presets & Account Controls"
          fallbackUrl="/profile"
        />

        {/* 1. Learning Style Preference (4 Options) */}
        <section className="bg-[#1B1B3A] border border-white/10 rounded-3xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white font-heading flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#22D3EE]" />
              Learning Style Preference
            </h2>
            {savingStyle && <Loader2 className="w-4 h-4 text-[#22D3EE] animate-spin" />}
          </div>
          <p className="text-xs text-[#94A3B8]">
            Determines how AI shapes explanations, primers, and question framing across all quests.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {learningStyleOptions.map((opt) => {
              const isSelected = user.learningStyle === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => handleStyleChange(opt.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all min-h-[44px] cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "bg-[#7C3AED]/20 border-[#22D3EE] text-white"
                      : "bg-[#0A0A1A] border-white/10 text-slate-300 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold font-heading">{opt.title}</span>
                    {isSelected && <Check className="w-4 h-4 text-[#22D3EE] shrink-0" />}
                  </div>
                  <p className="text-[10px] text-[#94A3B8] leading-normal">{opt.desc}</p>
                </button>
              );
            })}
          </div>
        </section>



        {/* 3. Inclusive Presets (Focus mode, Dyslexia-friendly, Reduced motion) */}
        <section className="bg-[#1B1B3A] border border-white/10 rounded-3xl p-5 shadow-lg space-y-4">
          <h2 className="text-sm font-bold text-white font-heading flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#34D399]" />
            Inclusive Accessibility Presets
          </h2>

          <div className="space-y-3">
            {/* Focus Mode Toggle */}
            <div className="flex items-center justify-between p-3.5 bg-[#0A0A1A] border border-white/10 rounded-2xl min-h-[44px]">
              <div>
                <span className="text-xs font-bold text-white font-heading block">Focus Mode</span>
                <span className="text-[10px] text-[#94A3B8]">Hides background particle effects & distractions</span>
              </div>
              <button
                onClick={() => updateAccessibilitySettings({ focusMode: !accessibilitySettings.focusMode })}
                className={`w-12 h-6 rounded-full transition-all relative cursor-pointer ${
                  accessibilitySettings.focusMode ? "bg-[#34D399]" : "bg-white/20"
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${
                  accessibilitySettings.focusMode ? "left-6" : "left-0.5"
                }`} />
              </button>
            </div>

            {/* Dyslexia-Friendly Font Toggle */}
            <div className="flex items-center justify-between p-3.5 bg-[#0A0A1A] border border-white/10 rounded-2xl min-h-[44px]">
              <div>
                <span className="text-xs font-bold text-white font-heading block">Dyslexia-Friendly Font</span>
                <span className="text-[10px] text-[#94A3B8]">Applies high-contrast weighted letter spacing</span>
              </div>
              <button
                onClick={() => updateAccessibilitySettings({ dyslexiaFriendly: !accessibilitySettings.dyslexiaFriendly, dyslexiaFont: !accessibilitySettings.dyslexiaFriendly })}
                className={`w-12 h-6 rounded-full transition-all relative cursor-pointer ${
                  accessibilitySettings.dyslexiaFriendly ? "bg-[#34D399]" : "bg-white/20"
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${
                  accessibilitySettings.dyslexiaFriendly ? "left-6" : "left-0.5"
                }`} />
              </button>
            </div>

            {/* Reduced Motion Toggle */}
            <div className="flex items-center justify-between p-3.5 bg-[#0A0A1A] border border-white/10 rounded-2xl min-h-[44px]">
              <div>
                <span className="text-xs font-bold text-white font-heading block">Reduced Motion</span>
                <span className="text-[10px] text-[#94A3B8]">Disables heavy transition animations</span>
              </div>
              <button
                onClick={() => updateAccessibilitySettings({ reducedMotion: !accessibilitySettings.reducedMotion })}
                className={`w-12 h-6 rounded-full transition-all relative cursor-pointer ${
                  accessibilitySettings.reducedMotion ? "bg-[#34D399]" : "bg-white/20"
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${
                  accessibilitySettings.reducedMotion ? "left-6" : "left-0.5"
                }`} />
              </button>
            </div>

            {/* Shadow Escape Mode Toggle */}
            <div className="flex items-center justify-between p-3.5 bg-[#0A0A1A] border border-white/10 rounded-2xl min-h-[44px]">
              <div>
                <span className="text-xs font-bold text-white font-heading block">Shadow Escape Mode</span>
                <span className="text-[10px] text-[#94A3B8]">Enable original gamified Shadow chase track and memory mechanics</span>
              </div>
              <button
                onClick={() => updateAccessibilitySettings({ shadowEscapeMode: !accessibilitySettings.shadowEscapeMode })}
                className={`w-12 h-6 rounded-full transition-all relative cursor-pointer ${
                  accessibilitySettings.shadowEscapeMode !== false ? "bg-[#00F0FF]" : "bg-white/20"
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${
                  accessibilitySettings.shadowEscapeMode !== false ? "left-6" : "left-0.5"
                }`} />
              </button>
            </div>
          </div>
        </section>

        {/* 4. Theme Selector */}
        <section className="bg-[#1B1B3A] border border-white/10 rounded-3xl p-5 shadow-lg space-y-3">
          <h2 className="text-sm font-bold text-white font-heading flex items-center gap-2">
            <Type className="w-4 h-4 text-[#22D3EE]" />
            Visual Theme Mode
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {themeOptions.map((th) => {
              const isSelected = visualTheme === th.id;
              return (
                <button
                  key={th.id}
                  onClick={() => setVisualTheme(th.id)}
                  className={`p-3 rounded-2xl border text-center transition-all min-h-[44px] cursor-pointer flex items-center justify-center text-xs font-bold font-heading ${
                    isSelected
                      ? "bg-[#22D3EE]/20 border-[#22D3EE] text-[#22D3EE]"
                      : "bg-[#0A0A1A] border-white/10 text-slate-400 hover:text-white"
                  }`}
                >
                  {th.title}
                </button>
              );
            })}
          </div>
        </section>

        {/* 5. Account Actions */}
        <section className="bg-[#1B1B3A] border border-white/10 rounded-3xl p-5 shadow-lg space-y-4">
          <h2 className="text-sm font-bold text-white font-heading flex items-center gap-2">
            <Shield className="w-4 h-4 text-red-400" />
            Account & Security
          </h2>

          {/* Change Password Form */}
          <form onSubmit={handlePasswordChange} className="space-y-2 bg-[#0A0A1A] border border-white/10 p-3.5 rounded-2xl">
            <label className="text-xs font-mono text-slate-300 font-bold block">Update Security Password</label>
            <div className="flex gap-2">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 chars)"
                className="flex-1 bg-[#1B1B3A] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#22D3EE]"
              />
              <button
                type="submit"
                disabled={changingPassword}
                className="px-4 py-2 min-h-[44px] rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold cursor-pointer shrink-0 flex items-center gap-1.5"
              >
                {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                <span>Save</span>
              </button>
            </div>
            {passwordNotice && <p className="text-[11px] font-mono text-[#34D399] mt-1">{passwordNotice}</p>}
          </form>

          {/* Sign Out & Delete Account Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <button
              onClick={handleSignOut}
              className="flex-1 py-3 px-4 min-h-[44px] rounded-2xl bg-white/5 border border-white/15 hover:bg-white/10 text-slate-200 font-bold text-xs cursor-pointer flex items-center justify-center gap-2 transition-all"
            >
              <LogOut className="w-4 h-4 text-slate-400" />
              <span>Sign Out Session</span>
            </button>

            <button
              onClick={handleDeleteAccount}
              className="flex-1 py-3 px-4 min-h-[44px] rounded-2xl bg-red-500/15 border border-red-500/40 hover:bg-red-500/25 text-red-400 font-bold text-xs cursor-pointer flex items-center justify-center gap-2 transition-all"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
              <span>Delete Account & Data</span>
            </button>
          </div>
        </section>

        {/* 6. About Section */}
        <section className="bg-[#1B1B3A]/80 border border-white/10 rounded-3xl p-5 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-white font-bold font-heading">
              <Info className="w-4 h-4 text-[#22D3EE]" />
              <span>XPedition Learning Engine</span>
            </div>
            <span className="font-mono text-[11px] text-[#22D3EE] font-bold">v2.4.0</span>
          </div>

          <p className="text-xs text-[#94A3B8]">
            Adaptive learning platform powered by Bayesian Knowledge Tracing (BKT), Hysteresis Flow Control, and Groq LLM grounded web sources.
          </p>

          <div className="pt-1">
            <Link
              href="/sources"
              className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[#22D3EE] hover:underline"
            >
              <BookOpen className="w-4 h-4" />
              <span>View Grounded Open Web Sources →</span>
            </Link>
          </div>
        </section>
      </div>

      <BottomNav />
    </main>
  );
}
