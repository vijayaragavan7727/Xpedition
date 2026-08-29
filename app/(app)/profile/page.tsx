'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getStoreData, clearStoreData, switchActiveGraph, saveLearnerProfile, saveStoreData, UserStoreData, SkillGraph } from '@/lib/store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { User, Globe, Clock, Sparkles, Check, CheckCircle2, Shield, AlertCircle, Save, LogOut, RefreshCw, HelpCircle, X, Trash2 } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [storeData, setStoreData] = useState<UserStoreData | null>(null);
  const [showRecalibrateConfirm, setShowRecalibrateConfirm] = useState<boolean>(false);

  // Editable Form Fields
  const [handle, setHandle] = useState<string>('Learner');
  const [language, setLanguage] = useState<'english' | 'tanglish' | 'tamil'>('english');
  const [dailyMinutes, setDailyMinutes] = useState<number>(60);
  const [learningMode, setLearningMode] = useState<'tutor' | 'read' | 'quest'>('tutor');
  const [startingLevel, setStartingLevel] = useState<string>('Complete beginner');

  // UI state
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfileData = async () => {
      const store = getStoreData();
      setStoreData(store);

      if (store.handle) setHandle(store.handle);
      if (store.learnerProfile?.language) setLanguage(store.learnerProfile.language as any);
      if (store.learnerProfile?.dailyMinutes) setDailyMinutes(store.learnerProfile.dailyMinutes);
      if (store.learnerProfile?.learningMode) setLearningMode(store.learnerProfile.learningMode as any);
      if (store.learnerProfile?.startingLevel) setStartingLevel(store.learnerProfile.startingLevel);

      // Check if logged in with Supabase and fetch latest cloud profile
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: userData } = await supabase.auth.getUser();
          const userId = userData?.user?.id;

          if (userId) {
            const { data: profileRow } = await supabase
              .from('profiles')
              .select('handle')
              .eq('id', userId)
              .single();

            if (profileRow?.handle) {
              setHandle(profileRow.handle);
            }

            const { data: learnerRow } = await supabase
              .from('learner_profile')
              .select('language, daily_minutes, learning_mode, starting_level')
              .eq('user_id', userId)
              .maybeSingle();

            if (learnerRow) {
              if (learnerRow.language) setLanguage(learnerRow.language as any);
              if (learnerRow.daily_minutes) setDailyMinutes(learnerRow.daily_minutes);
              if (learnerRow.learning_mode) setLearningMode(learnerRow.learning_mode as any);
              if (learnerRow.starting_level) setStartingLevel(learnerRow.starting_level);
            }
          }
        } catch (err) {
          console.warn('Supabase profile load notice:', err);
        }
      }
    };

    loadProfileData();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // 1. Save to local store
      const trimmedHandle = handle.trim() || 'Learner';
      const current = getStoreData();
      current.handle = trimmedHandle;

      const updatedProfile = {
        name: trimmedHandle,
        language,
        dailyMinutes,
        learningMode,
        startingLevel,
      };

      const updatedStore = saveLearnerProfile(updatedProfile);
      updatedStore.handle = trimmedHandle;
      saveStoreData(updatedStore);
      setStoreData(updatedStore);

      // 2. Save to Supabase (if connected)
      if (isSupabaseConfigured && supabase) {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;

        if (userId) {
          // Upsert to profiles table
          await supabase.from('profiles').upsert({
            id: userId,
            handle: trimmedHandle,
            updated_at: new Date().toISOString(),
          });

          // Upsert to learner_profile table
          await supabase.from('learner_profile').upsert(
            {
              user_id: userId,
              topic: updatedStore.goalText || 'Skill Goal',
              language,
              daily_minutes: dailyMinutes,
              learning_mode: learningMode,
              starting_level: startingLevel,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          );
        }
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      console.error('Failed to save profile:', err);
      setSaveError(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSwitchGoal = (graphId: string) => {
    const updated = switchActiveGraph(graphId);
    setStoreData(updated);
    window.location.reload();
  };

  const handleDeleteGoal = (graphId: string) => {
    if (!storeData) return;
    if (confirm('Delete this goal from your profile?')) {
      const updatedGraphs = (storeData.graphs || []).filter((g) => g.id !== graphId);
      let newActiveId = storeData.activeGraphId;
      if (newActiveId === graphId) {
        newActiveId = updatedGraphs[0]?.id || '';
      }
      const activeTargetGraph = updatedGraphs.find((g) => g.id === newActiveId);
      const updatedStore: UserStoreData = {
        ...storeData,
        graphs: updatedGraphs,
        activeGraphId: newActiveId,
        concepts: activeTargetGraph?.concepts || [],
        attempts: activeTargetGraph?.attempts || [],
        goalText: activeTargetGraph?.goalText || storeData.goalText,
      };
      saveStoreData(updatedStore);
      setStoreData(updatedStore);
    }
  };

  const handleResetData = () => {
    if (confirm('Reset local store to fresh zero-state? This is useful for testing fresh account states.')) {
      clearStoreData();
      window.location.reload();
    }
  };

  const handleSignOut = async () => {
    if (typeof window !== 'undefined') {
      sessionStorage.clear();
    }
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
    window.location.href = '/';
  };

  return (
    <div className="space-y-6 select-none pt-4 max-w-2xl mx-auto font-sans pb-12">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <User className="w-6 h-6 text-[#00F0FF]" />
          <h1 className="font-sans font-bold text-2xl text-white">Profile & Learning Settings</h1>
        </div>
        <p className="font-sans text-xs text-slate-400 mt-1">
          Customize your learner handle, teaching mode, daily pace, and language preferences.
        </p>
      </div>

      {/* Success Notification Toast */}
      {saveSuccess && (
        <div className="p-3.5 rounded-2xl bg-[#00FF87]/15 border border-[#00FF87]/40 text-[#00FF87] text-xs font-sans flex items-center justify-between animate-fadeIn shadow-lg">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-[#00FF87]" />
            <span>Profile settings saved successfully!</span>
          </div>
          <span className="font-mono text-[10px] uppercase font-bold text-[#00FF87]/80">Saved to Cloud & Device</span>
        </div>
      )}

      {/* Error Notification */}
      {saveError && (
        <div className="p-3.5 rounded-2xl bg-[#FF0055]/15 border border-[#FF0055]/40 text-[#FF7185] text-xs font-sans flex items-center gap-2 animate-fadeIn shadow-lg">
          <AlertCircle className="w-4 h-4 text-[#FF0055]" />
          <span>{saveError}</span>
        </div>
      )}

      {/* EDIT PROFILE FORM */}
      <form onSubmit={handleSaveProfile} className="bg-[#120E24] rounded-[24px] border border-white/10 p-5 sm:p-7 space-y-6 shadow-2xl">
        
        {/* User Identity Section */}
        <div className="flex items-center justify-between pb-5 border-b border-white/10 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#00F0FF] via-[#A855F7] to-[#FF0055] p-0.5 shadow-[0_0_15px_rgba(0,240,255,0.3)]">
              <div className="w-full h-full rounded-full bg-[#0D0D1A] flex items-center justify-center font-mono font-bold text-base text-white">
                {handle ? handle.slice(0, 2).toUpperCase() : 'LE'}
              </div>
            </div>
            <div>
              <h2 className="font-sans font-bold text-lg text-white">
                {handle || 'Learner'}
              </h2>
              <span className="font-mono text-[10px] text-[#00F0FF] uppercase tracking-wider font-bold">
                AUTHENTICATED LEARNER
              </span>
            </div>
          </div>

          <div className="bg-[#1A1430] border border-[#A855F7]/40 px-4 py-2 rounded-xl text-center font-mono shrink-0 shadow-inner">
            <span className="text-[9px] text-slate-400 block uppercase font-medium">REWARDS</span>
            <span className="text-sm font-bold text-[#A855F7]">+{storeData?.rewardsCount || 0} ✨</span>
          </div>
        </div>

        {/* 1. Name / Handle Input */}
        <div className="space-y-2">
          <label className="font-mono text-[11px] uppercase text-[#00F0FF] font-bold tracking-wider block">
            Learner Display Name
          </label>
          <input
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="Enter your name or handle"
            className="w-full h-11 px-4 rounded-xl bg-black/40 border border-white/15 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00F0FF] font-sans transition-all"
            required
          />
        </div>

        {/* 2. Teaching Mode Selection */}
        <div className="space-y-2.5">
          <label className="font-mono text-[11px] uppercase text-[#00F0FF] font-bold tracking-wider block">
            Lesson Teaching Mode
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => setLearningMode('tutor')}
              className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                learningMode === 'tutor'
                  ? 'bg-[#00F0FF]/15 border-[#00F0FF] text-white font-semibold shadow-[0_0_15px_rgba(0,240,255,0.25)]'
                  : 'bg-black/30 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-sans text-xs font-bold text-white flex items-center gap-1.5">
                  <span>🤖</span>
                  <span>Tutor Mode</span>
                </span>
                {learningMode === 'tutor' && <Check className="w-4 h-4 text-[#00F0FF]" />}
              </div>
              <span className="font-sans text-[11px] text-slate-400 leading-tight">
                XYRA voice teacher, blackboard notes & checkpoints.
              </span>
            </button>

            <button
              type="button"
              onClick={() => setLearningMode('read')}
              className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                learningMode === 'read'
                  ? 'bg-[#00F0FF]/15 border-[#00F0FF] text-white font-semibold shadow-[0_0_15px_rgba(0,240,255,0.25)]'
                  : 'bg-black/30 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-sans text-xs font-bold text-white flex items-center gap-1.5">
                  <span>📖</span>
                  <span>Read Mode</span>
                </span>
                {learningMode === 'read' && <Check className="w-4 h-4 text-[#00F0FF]" />}
              </div>
              <span className="font-sans text-[11px] text-slate-400 leading-tight">
                Self-paced text chunks with shadow escape mechanics.
              </span>
            </button>

            <button
              type="button"
              onClick={() => setLearningMode('quest')}
              className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                learningMode === 'quest'
                  ? 'bg-[#00F0FF]/15 border-[#00F0FF] text-white font-semibold shadow-[0_0_15px_rgba(0,240,255,0.25)]'
                  : 'bg-black/30 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-sans text-xs font-bold text-white flex items-center gap-1.5">
                  <span>⚡</span>
                  <span>Quest Only</span>
                </span>
                {learningMode === 'quest' && <Check className="w-4 h-4 text-[#00F0FF]" />}
              </div>
              <span className="font-sans text-[11px] text-slate-400 leading-tight">
                Skip lessons and jump straight to adaptive quest questions.
              </span>
            </button>
          </div>
        </div>

        {/* 3. Language & Daily Time Settings Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Language Selection */}
          <div className="space-y-2">
            <label className="font-mono text-[11px] uppercase text-[#00F0FF] font-bold tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              <span>Teaching Language</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['english', 'tanglish', 'tamil'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={`h-10 rounded-xl border font-mono text-xs capitalize transition-all cursor-pointer ${
                    language === lang
                      ? 'bg-[#00F0FF] text-black font-bold shadow-md'
                      : 'bg-black/30 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          {/* Daily Minutes Selection */}
          <div className="space-y-2">
            <label className="font-mono text-[11px] uppercase text-[#00F0FF] font-bold tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Daily Practice Goal</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[15, 30, 60, 120].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDailyMinutes(mins)}
                  className={`h-10 rounded-xl border font-mono text-xs transition-all cursor-pointer ${
                    dailyMinutes === mins
                      ? 'bg-[#A855F7] text-white font-bold shadow-md'
                      : 'bg-black/30 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* 4. Starting Level Selection */}
        <div className="space-y-2">
          <label className="font-mono text-[11px] uppercase text-[#00F0FF] font-bold tracking-wider block">
            Initial Difficulty Baseline
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['Complete beginner', 'Know basics', 'Advanced'].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setStartingLevel(lvl)}
                className={`h-10 rounded-xl border font-sans text-xs transition-all cursor-pointer ${
                  startingLevel === lvl
                    ? 'bg-[#00FF87] text-black font-bold shadow-md'
                    : 'bg-black/30 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Save Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full h-11 rounded-2xl bg-[#00F0FF] text-black font-mono font-bold text-xs flex items-center justify-center gap-2 hover:brightness-110 shadow-lg cursor-pointer transition-all disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? 'Saving Profile...' : 'Save Profile Changes'}</span>
          </button>
        </div>

      </form>

      {/* SOLO MODE ASSESSMENT SECTION */}
      <div className="bg-[#120E24] rounded-[24px] border border-[#A855F7]/40 p-5 sm:p-7 space-y-3.5 shadow-2xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#A855F7]/20 border border-[#A855F7]/50 flex items-center justify-center text-lg">
              🎯
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-sans font-bold text-sm sm:text-base text-white">
                  Solo Mode Assessment
                </h3>
                <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-[#A855F7]/20 text-[#A855F7] uppercase font-bold border border-[#A855F7]/40">
                  Zero Assistance
                </span>
              </div>
              <p className="font-sans text-xs text-slate-400 mt-0.5">
                Take a weekly solo test — 6 items with no hints, mid-session feedback, or AI coaching.
              </p>
            </div>
          </div>

          <Link
            href="/quest?mode=solo"
            className="h-10 px-5 rounded-xl bg-[#A855F7] hover:bg-[#9333EA] text-white font-mono font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.4)] shrink-0"
          >
            <span>Start Now</span>
            <span>&rarr;</span>
          </Link>
        </div>
      </div>

      {/* SKILL GRAPHS LIST & GOAL SWITCHER */}
      {(() => {
        const validGraphs = (storeData?.graphs || []).filter((g: SkillGraph) => (g.concepts?.length || 0) > 0);
        const displayedGraphs = validGraphs.slice(-5);

        return (
          <div className="bg-[#120E24] rounded-[24px] border border-white/10 p-5 sm:p-7 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase text-[#00F0FF] font-bold tracking-wider">
                YOUR SKILL GRAPHS ({displayedGraphs.length})
              </span>
              <Link
                href="/onboarding"
                className="h-8 px-3 rounded-lg bg-[#00F0FF] text-black font-mono font-bold text-xs flex items-center gap-1.5 hover:brightness-110 transition-all"
              >
                <span>+ New Goal</span>
              </Link>
            </div>

            <div className="space-y-2.5">
              {displayedGraphs.map((graph: SkillGraph) => {
                const isActive = graph.id === storeData?.activeGraphId;
                const conceptCount = graph.concepts?.length || 0;
                const attemptCount = graph.attempts?.length || 0;

                return (
                  <div
                    key={graph.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isActive
                        ? 'bg-[#00F0FF]/10 border-[#00F0FF] text-white shadow-md'
                        : 'bg-black/30 border-white/10 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h3 className="font-sans font-bold text-sm text-white flex items-center gap-2">
                          <span>{graph.goalText}</span>
                          {isActive && (
                            <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-[#00F0FF]/20 text-[#00F0FF] uppercase font-bold border border-[#00F0FF]/40">
                              ACTIVE
                            </span>
                          )}
                        </h3>
                        <p className="font-mono text-[11px] text-slate-400 mt-1">
                          {conceptCount} Concepts &middot; {attemptCount} Attempts
                        </p>
                      </div>

                      {!isActive && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSwitchGoal(graph.id)}
                            className="h-8 px-3 rounded-xl bg-white/10 border border-white/15 text-xs font-sans text-white font-semibold hover:bg-white/20 transition-colors cursor-pointer"
                          >
                            Switch
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteGoal(graph.id)}
                            className="h-8 px-2.5 rounded-xl bg-[#FF0055]/10 border border-[#FF0055]/30 text-[#FF7185] hover:bg-[#FF0055]/20 text-xs font-sans font-semibold transition-colors cursor-pointer flex items-center gap-1"
                            title="Delete goal"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* ACCOUNT & PREFERENCES SETTINGS */}
      <div className="bg-[#120E24] rounded-[24px] border border-white/10 p-5 sm:p-7 space-y-4 shadow-2xl">
        <span className="font-mono text-[11px] uppercase text-[#00F0FF] font-bold tracking-wider block">
          ACCOUNT & ASSESSMENT SETTINGS
        </span>

        <div className="space-y-3 font-sans text-xs">
          {/* 1. Recalibrate Starting Level */}
          <div className="p-4 rounded-2xl bg-black/30 border border-white/10 flex items-center justify-between flex-wrap gap-3">
            <div className="space-y-0.5">
              <span className="font-bold text-white text-xs block">
                Recalibrate Starting Ability Baseline
              </span>
              <p className="text-[11px] text-slate-400">
                Resets question difficulty starting point without deleting your mastery scores.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowRecalibrateConfirm(true)}
              className="h-9 px-4 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] hover:bg-[#00F0FF]/25 font-mono font-bold text-xs transition-all cursor-pointer shadow-sm"
            >
              Recalibrate
            </button>
          </div>

          {/* 2. Terms & Privacy Link */}
          <Link
            href="/terms"
            className="p-4 rounded-2xl bg-black/30 border border-white/10 hover:border-[#00F0FF]/50 flex items-center justify-between transition-all group"
          >
            <div className="space-y-0.5">
              <span className="font-bold text-white text-xs block group-hover:text-[#00F0FF] transition-colors">
                Terms & Privacy Policy
              </span>
              <p className="text-[11px] text-slate-400">
                View data handling, privacy guarantees, and usage policy.
              </p>
            </div>
            <span className="font-mono text-xs text-[#00F0FF] group-hover:translate-x-1 transition-transform">
              &rarr;
            </span>
          </Link>
        </div>
      </div>

      {/* Reset & Sign Out Controls */}
      <div className="space-y-2.5 pt-2">
        <button
          type="button"
          onClick={handleResetData}
          className="w-full h-11 rounded-2xl bg-[#FF0055]/10 border border-[#FF0055]/30 text-[#FF7185] hover:bg-[#FF0055]/20 font-sans font-semibold text-xs flex items-center justify-center transition-colors cursor-pointer"
        >
          Reset Store to Fresh Zero-State (Testing)
        </button>

        <button
          type="button"
          onClick={handleSignOut}
          className="w-full h-11 rounded-2xl border border-white/10 text-slate-400 hover:text-white font-sans font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign out</span>
        </button>
      </div>

      {/* RECALIBRATE CONFIRMATION MODAL */}
      {showRecalibrateConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn select-none font-sans">
          <div className="bg-[#0D0D1A] border border-[#00F0FF]/40 rounded-[28px] p-6 max-w-md w-full space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#00F0FF]">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Recalibrate Starting Point</span>
              </div>
              <button
                type="button"
                onClick={() => setShowRecalibrateConfirm(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              This resets your starting point. Your mastery progress is kept. Continue?
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2 font-mono text-xs">
              <button
                type="button"
                onClick={() => setShowRecalibrateConfirm(false)}
                className="h-10 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowRecalibrateConfirm(false);
                  router.push('/calibrate');
                }}
                className="h-10 rounded-xl bg-[#00F0FF] hover:bg-[#00C2FF] text-black font-bold cursor-pointer shadow transition-all"
              >
                Yes, Recalibrate &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
