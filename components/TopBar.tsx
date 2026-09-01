'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getStoreData, switchActiveGraph, calculateStreak, UserStoreData, SkillGraph } from '@/lib/store';

export const TopBar: React.FC = () => {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showGoalSwitcher, setShowGoalSwitcher] = useState<boolean>(false);
  const [storeData, setStoreData] = useState<UserStoreData | null>(null);

  useEffect(() => {
    // Load store data
    const data = getStoreData();
    setStoreData(data);

    // Scroll listener past 40px
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSwitchGoal = (graphId: string) => {
    const updated = switchActiveGraph(graphId);
    setStoreData(updated);
    setShowGoalSwitcher(false);
    // Refresh active route data
    window.location.reload();
  };

  const activeGraph: SkillGraph | undefined = storeData?.graphs?.find(
    (g) => g.id === storeData.activeGraphId
  ) || storeData?.graphs?.[0];

  const streak = storeData ? calculateStreak(storeData.attempts) : 0;
  const fadingConcepts = storeData
    ? storeData.concepts.filter((c) => c.retentionRisk > 0.35)
    : [];
  const hasUnreadDecay = fadingConcepts.length > 0;

  return (
    <header
      className={`sticky top-0 left-0 right-0 h-[60px] z-30 flex items-center justify-between px-4 sm:px-6 transition-all duration-200 ${
        isScrolled
          ? 'bg-[#120E22]/85 backdrop-blur-[20px] border-b border-white/[0.07]'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      {/* Left: XPEDITION Wordmark + Goal Switcher Dropdown */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Link href="/home" className="flex items-center gap-2 group cursor-pointer select-none">
          <span className="font-orbitron font-bold text-[16px] sm:text-[17px] tracking-[0.16em] uppercase text-gradient leading-none">
            XPEDITION
          </span>
        </Link>

        {/* Separator Slash & Goal Switcher Button */}
        <span className="text-muted/40 font-mono text-xs select-none">/</span>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowGoalSwitcher(!showGoalSwitcher)}
            aria-label="Switch active goal"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-[10px] bg-raised/70 border border-line/50 hover:border-cyan text-xs font-sans text-text font-medium transition-all max-w-[140px] sm:max-w-[200px] truncate cursor-pointer"
          >
            <span className="truncate">{activeGraph?.goalText || 'Python Core'}</span>
            <span className="font-mono text-[10px] text-muted shrink-0">▾</span>
          </button>

          {/* Persistent Seed Fallback Badge */}
          {storeData?.isSeededFallback && (
            <div className="mt-1 bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1" title="AI course generation was offline; active goal is using the starter fallback path">
              <span>⚠️ Starter Fallback</span>
            </div>
          )}

          {/* Goal Switcher Dropdown Menu */}
          {showGoalSwitcher && (
            <div className="absolute left-0 mt-2 w-64 bg-[#120E22] border border-line rounded-[14px] p-3 shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-xl z-50 animate-fadeIn space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-line/60">
                <span className="font-mono text-[10px] tracking-eyebrow uppercase text-muted font-bold">
                  YOUR SKILL GRAPHS
                </span>
                <span className="font-mono text-[10px] text-cyan font-bold">
                  {storeData?.graphs?.length || 1} ACTIVE
                </span>
              </div>

              <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                {storeData?.graphs?.map((graph) => {
                  const isActive = graph.id === storeData.activeGraphId;
                  return (
                    <button
                      key={graph.id}
                      type="button"
                      onClick={() => handleSwitchGoal(graph.id)}
                      className={`w-full p-2.5 rounded-[10px] border text-left font-sans text-xs flex items-center justify-between transition-all cursor-pointer ${
                        isActive
                          ? 'bg-cyan/15 border-cyan text-cyan font-semibold'
                          : 'bg-raised/50 border-transparent text-text hover:bg-raised hover:border-line'
                      }`}
                    >
                      <span className="truncate pr-2">{graph.goalText}</span>
                      {isActive && <span className="font-bold text-xs shrink-0">✓</span>}
                    </button>
                  );
                })}
              </div>

              {/* Start New Goal Button inside Dropdown */}
              <Link
                href="/onboarding"
                onClick={() => setShowGoalSwitcher(false)}
                className="w-full h-9 rounded-[10px] bg-signature-gradient text-white font-sans font-semibold text-xs flex items-center justify-center gap-1.5 hover:brightness-108 transition-all pt-0.5 mt-2"
              >
                <span>＋ Create New Goal</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* "+" Button to Start New Goal (Right side before Streak Pill) */}
        <Link
          href="/onboarding"
          className="w-8 h-8 rounded-full bg-raised/80 border border-line/60 hover:border-cyan text-cyan flex items-center justify-center font-mono font-bold text-base transition-all hover:scale-105 shadow-sm"
          title="New goal"
          aria-label="New goal"
        >
          ＋
        </Link>

        {/* 1. Streak Pill */}
        <div
          className={`h-[30px] px-2.5 sm:px-3 rounded-full flex items-center gap-1.5 sm:gap-2 transition-all ${
            streak > 0
              ? 'bg-[#22D3EE]/10 border border-[#22D3EE]/30 text-cyan shadow-[0_0_12px_rgba(34,211,238,0.15)]'
              : 'bg-muted/10 border border-muted/20 text-muted'
          }`}
          title={`${streak} consecutive days with at least 1 attempt`}
        >
          <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
            <path d="M12 23a9.5 9.5 0 0 1-9.5-9.5c0-4.32 3.03-8.08 6.47-11.45.38-.37 1.03-.1 1.03.44 0 2.22 1.33 4.01 2.8 5.25 1.54-1.63 2.92-3.66 3.07-5.91.03-.43.56-.63.85-.32C19.78 4.67 21.5 8.5 21.5 13.5A9.5 9.5 0 0 1 12 23z" />
          </svg>
          <div className="flex flex-col justify-center leading-none">
            <span className="font-mono text-xs font-bold leading-none">{streak}</span>
            <span className="font-sans text-[9px] font-medium tracking-tight text-muted leading-none mt-0.5 hidden sm:inline">
              {streak === 1 ? 'day streak' : 'days streak'}
            </span>
          </div>
        </div>

        {/* 2. Notification Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="View notifications"
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-text transition-colors relative cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>

            {hasUnreadDecay && (
              <span className="absolute top-1 right-1 w-[7px] h-[7px] bg-danger rounded-full ring-2 ring-ink animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-[#120E22] border border-line rounded-[14px] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-xl z-50 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-line/60 mb-3">
                <span className="font-mono text-[10px] tracking-eyebrow uppercase text-muted font-bold">
                  RETENTION ALERTS
                </span>
                <span className="font-mono text-[10px] text-cyan">
                  {fadingConcepts.length} FADING
                </span>
              </div>

              {fadingConcepts.length > 0 ? (
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {fadingConcepts.map((concept) => (
                    <div
                      key={concept.id}
                      className="p-2.5 bg-raised/80 border-l-2 border-l-amber-400 rounded-r-[6px] flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between text-xs font-medium text-text">
                        <span className="truncate max-w-[170px]">{concept.name}</span>
                        <span className="font-mono text-[10px] text-amber-400 shrink-0">
                          {Math.round(concept.retentionRisk * 100)}% risk
                        </span>
                      </div>
                      <p className="text-[11px] text-muted leading-tight">
                        Memory is fading. Re-check recommended to lock in mastery.
                      </p>
                      <div className="flex justify-end pt-1">
                        <Link
                          href={`/tutor/${concept.id}`}
                          onClick={() => setShowNotifications(false)}
                          className="font-mono text-[10px] text-cyan hover:underline font-bold flex items-center gap-1"
                        >
                          <span>Review Concept</span>
                          <span>→</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-5 text-center space-y-2">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto font-mono text-sm shadow-[0_0_12px_rgba(16,185,129,0.15)]">
                    ✓
                  </div>
                  <p className="text-xs font-sans text-text font-semibold">No alerts right now</p>
                  <p className="text-[11px] font-sans text-muted max-w-[200px] mx-auto leading-normal">
                    All concept memories are locked in and stable.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. Avatar */}
        <Link
          href="/profile"
          className="w-8 h-8 rounded-full p-[1.5px] bg-signature-gradient flex items-center justify-center hover:opacity-90 transition-opacity"
          aria-label="Profile"
        >
          <div className="w-full h-full rounded-full bg-panel flex items-center justify-center font-mono text-[11px] font-bold text-text uppercase">
            {storeData?.handle ? storeData.handle.slice(0, 2).toUpperCase() : 'OP'}
          </div>
        </Link>
      </div>
    </header>
  );
};

export default TopBar;
