'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getStoreData, calculateStreak, selectNextTarget, UserStoreData, Attempt } from '@/lib/store';
import { FeedbackSheet } from '@/components/FeedbackSheet';
import { calibrationScore, blindSpots } from '@/lib/engine/calibration';
import { computeGap, thetaToPercent } from '@/lib/engine/mastery';
import XyraGreetingWidget from '@/components/XyraGreetingWidget';
import AskXYRASheet from '@/components/AskXYRASheet';

export default function HomePage() {
  const router = useRouter();
  const [storeData, setStoreData] = useState<UserStoreData | null>(null);
  const [quickQuery, setQuickQuery] = useState<string>('');
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [robotImgPath, setRobotImgPath] = useState<string>('/robot.png');

  useEffect(() => {
    setStoreData(getStoreData());
  }, []);

  const streak = storeData ? calculateStreak(storeData.attempts) : 0;
  const fadingConcepts = storeData ? storeData.concepts.filter((c) => c.retentionRisk > 0.35) : [];
  const hasSkillGraph = storeData ? storeData.concepts.length > 0 : false;
  const target = storeData ? selectNextTarget(storeData) : null;

  // PRE-FETCH TOP TARGET LESSON IN BACKGROUND ON HOME MOUNT
  useEffect(() => {
    if (storeData && target?.conceptId) {
      const cacheKey = `xyra_lesson_${target.conceptId}`;
      if (typeof window !== 'undefined' && !sessionStorage.getItem(cacheKey)) {
        console.time(`home-prefetch-${target.conceptId}`);
        fetch('/api/lesson', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conceptId: target.conceptId,
            conceptName: target.conceptName,
            conceptSummary: '',
            language: storeData?.learnerProfile?.language || 'english',
            startingLevel: storeData?.learnerProfile?.startingLevel || 'Complete beginner',
            masteryPercentage: target.masteryPercentage || 0,
            isQuickLearn: false,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            console.timeEnd(`home-prefetch-${target.conceptId}`);
            if (data?.chunks && typeof window !== 'undefined') {
              sessionStorage.setItem(cacheKey, JSON.stringify(data));
              console.log(`[Home Prefetch] Pre-cached lesson for "${target.conceptName}" in sessionStorage`);
            }
          })
          .catch(() => {});
      }
    }
  }, [storeData?.activeGraphId, target?.conceptId]);

  if (!storeData || !target) {
    return <div className="py-12 text-center text-muted font-mono text-sm animate-pulse">Loading dashboard...</div>;
  }

  const handleQuickLearnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickQuery.trim()) return;
    router.push(`/tutor/quick?q=${encodeURIComponent(quickQuery.trim())}`);
  };

  const formatRelativeTime = (timestamp: number) => {
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const recentAttempts: Attempt[] = storeData.attempts.slice(-3).reverse();
  const attemptConceptIds = new Set((storeData.attempts || []).map((a) => a.conceptId));

  // Determine Continue Card Link & Label based on Learning Mode
  const learningMode = storeData.learnerProfile?.learningMode || 'tutor';
  const showLessonFirst = !target.hasAttempts && !target.inProgress && learningMode !== 'quest';
  const lessonPath = learningMode === 'read' ? '/learn' : '/tutor';

  const continueHref = showLessonFirst
    ? `${lessonPath}/${encodeURIComponent(target.conceptId)}`
    : `/quest?concept=${encodeURIComponent(target.conceptId)}`;
  
  const continueLabel = showLessonFirst
    ? `Learn: ${target.conceptName}`
    : target.inProgress
      ? `Resume quest: ${target.conceptName} (${target.currentIndex} of ${target.totalLength} done)`
      : `Continue quest: ${target.conceptName}`;

  const calScore = calibrationScore(storeData.attempts);
  const calLabel =
    calScore === null
      ? 'Calibrating...'
      : calScore > 0.25
        ? 'Overconfident'
        : calScore < -0.25
          ? 'Cautious'
          : 'Accurate';

  const detectedBlindSpots = blindSpots(storeData.attempts, storeData.concepts);
  const blindSpotConceptIds = new Set(detectedBlindSpots.map((bs) => bs.conceptId));

  return (
    <div className="space-y-5 select-none relative pb-16">
      
      {/* 1. XYRA GREETING WIDGET (Top of Home Page, max ~80px height) */}
      <section className="pt-1">
        <XyraGreetingWidget
          storeData={storeData}
          continueHref={continueHref}
          continueLabel={continueLabel}
          fadingConcepts={fadingConcepts}
          streak={streak}
        />
      </section>

      {/* STAT STRIP (CALIBRATION SLOTS REWARDS) */}
      <section className="grid grid-cols-3 gap-3">
        <div className="bg-[#120E22]/90 border border-line/60 rounded-[14px] p-3.5 text-center space-y-1">
          <span className="block font-mono text-[9px] uppercase text-muted font-bold">DAILY STREAK</span>
          <span className="block font-mono text-base sm:text-lg font-bold text-cyan">{streak} Days 🔥</span>
        </div>

        <div className="bg-[#120E22]/90 border border-line/60 rounded-[14px] p-3.5 text-center space-y-1">
          <span className="block font-mono text-[9px] uppercase text-muted font-bold">CALIBRATION</span>
          <span className="block font-mono text-xs sm:text-sm font-bold text-violet truncate">{calLabel}</span>
        </div>

        <div className="bg-[#120E22]/90 border border-line/60 rounded-[14px] p-3.5 text-center space-y-1">
          <span className="block font-mono text-[9px] uppercase text-muted font-bold">BLIND SPOTS</span>
          <span className={`block font-mono text-base sm:text-lg font-bold ${detectedBlindSpots.length > 0 ? 'text-amber-400' : 'text-text'}`}>
            {detectedBlindSpots.length}
          </span>
        </div>
      </section>

      {/* QUICK LEARN ENTRY (1-TEXTBOX NO INTAKE PATH) */}
      <section className="bg-[#120E22]/90 border border-line rounded-[16px] p-4 sm:p-5 backdrop-blur-xl">
        <form onSubmit={handleQuickLearnSubmit} className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] tracking-eyebrow uppercase text-cyan font-bold flex items-center gap-1.5">
              <span>⚡</span> QUICK LEARN — ASK A SINGLE QUESTION
            </span>
            <span className="font-mono text-[9px] text-muted">2-Min Lesson & Passport Credit</span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={quickQuery}
              onChange={(e) => setQuickQuery(e.target.value)}
              placeholder="e.g. what is recursion, or how does gradient descent work"
              className="flex-1 h-[42px] px-3.5 rounded-[10px] bg-panel border border-line/60 font-sans text-xs text-text placeholder:text-muted/60 focus:outline-none focus:border-cyan transition-all"
            />
            <button
              type="submit"
              disabled={!quickQuery.trim()}
              className="h-[42px] px-5 rounded-[10px] bg-signature-gradient text-white font-sans font-semibold text-xs flex items-center gap-1 hover:brightness-108 transition-all disabled:opacity-50 cursor-pointer shrink-0"
            >
              <span>Get Answer</span>
              <span>&rarr;</span>
            </button>
          </div>
        </form>
      </section>

      {/* STICKY CONTINUE CARD */}
      <section className="sticky top-0 z-20 pt-1 -mt-1 bg-ink/95 backdrop-blur-md rounded-[18px]">
        <div className="card-glass-neon p-5 sm:p-6 rounded-[16px]">
        {hasSkillGraph ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-mono text-[11px] tracking-eyebrow uppercase text-muted font-bold">
                {target.inProgress ? 'RESUME QUEST SESSION' : showLessonFirst ? 'FIRST TIME LESSON' : 'NEXT RECOMMENDED TARGET'}
              </span>
              <span className="font-mono text-[11px] text-cyan font-medium">
                {target.inProgress
                  ? `${target.currentIndex} of ${target.totalLength} done (${target.itemsRemaining} remaining)`
                  : `${target.masteryPercentage}% mastery / ${target.itemsRemaining} items next`}
              </span>
            </div>

            {/* Last completed banner if present */}
            {!target.inProgress && target.lastCompletedConceptName && (
              <div className="bg-success/15 border border-success/30 px-3 py-1.5 rounded-[8px] font-mono text-xs text-success flex items-center gap-2">
                <span>✓</span>
                <span>{target.lastCompletedConceptName} completed! Next topic below:</span>
              </div>
            )}

            <div>
              <h2 className="font-sans font-semibold text-[17px] text-text mb-2 flex items-center gap-2 flex-wrap">
                <span>{target.conceptName}</span>
                {target.inProgress && (
                  <span className="font-mono text-[9px] uppercase px-2 py-0.5 rounded bg-cyan/15 text-cyan font-bold border border-cyan/30">
                    {target.currentIndex} of {target.totalLength} done
                  </span>
                )}
                {showLessonFirst && (
                  <span className="font-mono text-[9px] uppercase px-2 py-0.5 rounded bg-violet/20 text-violet font-bold border border-violet/30">
                    Interactive Lesson Required
                  </span>
                )}
              </h2>

              <div className="h-2.5 w-full bg-raised/80 rounded-full overflow-hidden p-0.5 border border-line/40">
                <div
                  className="h-full bg-signature-gradient rounded-full transition-all duration-500"
                  style={{
                    width: target.inProgress
                      ? `${(target.currentIndex / target.totalLength) * 100}%`
                      : `${target.masteryPercentage}%`,
                  }}
                />
              </div>
              <p className="font-mono text-[11px] text-muted mt-1.5">{target.reason}</p>
            </div>

            <div className="space-y-2.5 pt-1">
              <Link
                href={continueHref}
                className="w-full h-[46px] rounded-[10px] bg-signature-gradient text-white font-sans font-semibold text-[15px] flex items-center justify-center gap-2 hover:brightness-108 hover:shadow-[0_8px_30px_-6px_rgba(168,85,247,0.55)] active:translate-y-[1px] transition-all cursor-pointer"
              >
                <span>{continueLabel}</span>
                <span>&rarr;</span>
              </Link>

              {/* 🎯 SOLO CHALLENGE — EASY TO REACH BUTTON */}
              <Link
                href={`/quest?mode=solo&concept=${encodeURIComponent(target.conceptId)}`}
                className="w-full h-10 px-4 rounded-[10px] bg-[#A855F7]/15 hover:bg-[#A855F7]/25 border border-[#A855F7]/40 text-[#A855F7] hover:text-white font-sans font-semibold text-xs flex items-center justify-between transition-all cursor-pointer group shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">🎯</span>
                  <span>Solo Challenge — test yourself without help</span>
                </div>
                <span className="font-mono text-xs text-[#A855F7] group-hover:translate-x-1 transition-transform">&rarr;</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center space-y-3">
            <h2 className="font-sans font-semibold text-lg text-text">No active course graph</h2>
            <p className="font-sans text-xs text-muted">Set up your learning goal or syllabus to start.</p>
            <Link
              href="/onboarding"
              className="inline-flex h-[42px] px-6 rounded-[10px] bg-signature-gradient text-white font-sans font-semibold text-xs items-center gap-2"
            >
              Start Onboarding &rarr;
            </Link>
          </div>
        )}
        </div>
      </section>

      {/* SKILL GRAPH CONCEPTS BREAKDOWN */}
      <section className="bg-[#120E22]/90 border border-line/60 rounded-[16px] p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-line/40 pb-3">
          <span className="font-mono text-[10px] tracking-eyebrow uppercase text-muted font-bold">
            SKILL GRAPH CONCEPTS ({storeData.concepts.length})
          </span>
          <span className="font-mono text-xs text-cyan">
            Active Goal: {storeData.goalText}
          </span>
        </div>

        <div className="space-y-2.5">
          {storeData.concepts.map((concept) => {
            const hasAtt = attemptConceptIds.has(concept.id);
            const isBlindSpot = blindSpotConceptIds.has(concept.id);
            const isFading = concept.retentionRisk > 0.35;

            const hasSoloData = (concept.soloAttemptsCount || 0) >= 3 && concept.thetaSolo !== undefined;
            const assistedPct = concept.thetaAssisted !== undefined ? thetaToPercent(concept.thetaAssisted) : concept.masteryPercentage;
            const soloPct = hasSoloData ? thetaToPercent(concept.thetaSolo!) : null;
            const gap = computeGap(concept.thetaAssisted ?? -0.4, concept.thetaSolo, concept.soloAttemptsCount || 0);
            const isLeansOnAi = gap !== null && gap > 30;

            const conceptHref = hasAtt
              ? `/quest?concept=${encodeURIComponent(concept.id)}`
              : `${lessonPath}/${encodeURIComponent(concept.id)}`;

            return (
              <div
                key={concept.id}
                className="p-3.5 rounded-[12px] bg-panel/70 border border-line/40 flex items-center justify-between gap-3 hover:border-cyan/50 transition-all"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {isBlindSpot && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />}
                    <Link href={conceptHref} className="font-sans text-sm text-text font-semibold hover:text-cyan truncate">
                      {concept.name}
                    </Link>
                    {!hasAtt && (
                      <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded bg-violet/20 text-violet font-bold shrink-0">
                        New
                      </span>
                    )}
                    {isLeansOnAi ? (
                      <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/40 font-bold shrink-0">
                        leans on AI
                      </span>
                    ) : isBlindSpot ? (
                      <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shrink-0">
                        Blind Spot
                      </span>
                    ) : isFading ? (
                      <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold shrink-0">
                        Fading
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-28 bg-raised rounded-full overflow-hidden">
                      <div className="h-full bg-cyan rounded-full" style={{ width: `${assistedPct}%` }} />
                    </div>
                    <span className="font-mono text-[10px] text-muted">
                      Assisted <span className="text-muted/70">{assistedPct}%</span> · Solo <span className={hasSoloData ? 'text-violet-400 font-bold' : 'text-muted/50'}>{soloPct !== null ? `${soloPct}%` : '—'}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
                  <Link href={`/quest?mode=solo&concept=${encodeURIComponent(concept.id)}`} className="px-2.5 py-1.5 rounded-[8px] bg-violet-600/20 border border-violet-500/40 text-violet-300 hover:bg-violet-600/30 text-[11px] font-semibold flex items-center gap-1">
                    <span>Solo</span>
                    <span>🛡️</span>
                  </Link>
                  {hasAtt ? (
                    <Link href={`/quest?concept=${encodeURIComponent(concept.id)}`} className="px-3 py-1.5 rounded-[8px] bg-raised border border-line text-text hover:border-cyan">
                      Practice &rarr;
                    </Link>
                  ) : (
                    <Link href={`${lessonPath}/${encodeURIComponent(concept.id)}`} className="px-3 py-1.5 rounded-[8px] bg-cyan/15 border border-cyan/40 text-cyan hover:bg-cyan/25 font-semibold">
                      Learn &rarr;
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* RECENT ATTEMPTS */}
      {recentAttempts.length > 0 && (
        <section className="bg-[#120E22]/90 border border-line/60 rounded-[16px] p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-line/40 pb-2.5">
            <span className="font-mono text-[10px] tracking-eyebrow uppercase text-muted font-bold">
              RECENT LOGS
            </span>
            <Link href="/history" className="font-mono text-xs text-cyan hover:underline">
              View Full History &rarr;
            </Link>
          </div>
          <div className="space-y-2">
            {recentAttempts.map((att) => (
              <div key={att.id} className="flex items-center justify-between text-xs py-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${att.isCorrect ? 'bg-[#00FF87]' : 'bg-[#FF0055]'}`} />
                  <span className="font-sans text-text font-medium">{att.conceptName}</span>
                  {att.isSolo && (
                    <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-violet-500/20 text-violet-300">
                      Solo
                    </span>
                  )}
                </div>
                <span className="font-mono text-[11px] text-muted">{formatRelativeTime(att.timestamp)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 1. FLOATING ASK XYRA BUTTON (Bottom-Right of Home Page) */}
      <div className="fixed bottom-5 right-5 z-40 sm:bottom-6 sm:right-6">
        <button
          type="button"
          onClick={() => setIsChatOpen(true)}
          className="h-12 px-4 rounded-full bg-[#0D0D1A] border border-[#00F0FF]/60 hover:border-[#00F0FF] text-[#00F0FF] font-mono font-bold text-xs flex items-center gap-2.5 shadow-[0_0_25px_rgba(0,240,255,0.38)] hover:scale-105 transition-all cursor-pointer group backdrop-blur-xl select-none"
        >
          <div className="w-7 h-7 rounded-full bg-[#00F0FF]/20 border border-[#00F0FF] flex items-center justify-center overflow-hidden shadow-[0_0_10px_rgba(0,240,255,0.5)]">
            <img
              src={robotImgPath}
              onError={() => {
                if (robotImgPath === '/robot.png') setRobotImgPath('/images/robot.png');
              }}
              alt="XYRA"
              className="w-5 h-5 object-contain"
            />
          </div>
          <span>Ask XYRA</span>
          <span className="w-2 h-2 rounded-full bg-[#00FF87] animate-pulse" />
        </button>
      </div>

      {/* ASK XYRA BOTTOM SHEET (HOME SCOPE) */}
      <AskXYRASheet
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        context={{
          scope: 'home',
          name: storeData.handle,
          goal: storeData.goalText,
          concepts: storeData.concepts,
          fadingConcepts: fadingConcepts,
          language: storeData.learnerProfile?.language,
        }}
      />

    </div>
  );
}
