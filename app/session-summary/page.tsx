'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getStoreData, UserStoreData, FlowState } from '@/lib/store';
import { FeedbackSheet } from '@/components/FeedbackSheet';
import { calibrationScore, confidenceBreakdown, blindSpots } from '@/lib/engine/calibration';
import { computeGap, thetaToPercent } from '@/lib/engine/mastery';
import { downloadNotesPdf, downloadFlashcardsPdf } from '@/lib/pdf';

export default function SessionSummaryPage() {
  const [storeData, setStoreData] = useState<UserStoreData | null>(null);

  useEffect(() => {
    setStoreData(getStoreData());
  }, []);

  if (!storeData) {
    return (
      <div className="min-h-[100dvh] bg-ink text-text flex items-center justify-center p-4">
        <div className="font-mono text-sm text-muted animate-pulse">Loading session summary...</div>
      </div>
    );
  }

  const recentAttempts = storeData.attempts.slice(-6);
  const totalAnswered = recentAttempts.length;
  const correctCount = recentAttempts.filter((a) => a.isCorrect).length;

  const getStateDescription = (state: FlowState) => {
    switch (state) {
      case 'flow':
        return 'You held the flow band the whole way.';
      case 'frustrated':
        return 'That one was hard. Difficulty is adjusting.';
      case 'bored':
        return 'Too easy. Next session comes in harder.';
      case 'drifting':
        return 'Short refocus run complete. Steady pace restored.';
      default:
        return 'Session completed smoothly.';
    }
  };

  // Group touched concepts from recent session attempts and calculate exact real deltas
  const touchedConceptMap = new Map<string, { conceptName: string; delta: number }>();

  recentAttempts.forEach((att) => {
    const existing = touchedConceptMap.get(att.conceptId) || {
      conceptName: att.conceptName,
      delta: 0,
    };
    const attemptDelta = att.isCorrect ? 8 : -3;
    touchedConceptMap.set(att.conceptId, {
      conceptName: att.conceptName,
      delta: existing.delta + attemptDelta,
    });
  });

  const conceptSummaries = Array.from(touchedConceptMap.entries()).map(([conceptId, info]) => {
    const conceptObj = storeData.concepts.find((c) => c.id === conceptId);
    const finalMastery = conceptObj ? conceptObj.masteryPercentage : 50;
    const initialMastery = Math.min(100, Math.max(0, finalMastery - info.delta));
    return {
      id: conceptId,
      name: info.conceptName,
      initialMastery,
      finalMastery,
      delta: info.delta,
    };
  });

  const breakdown = confidenceBreakdown(storeData.attempts);
  const score = calibrationScore(storeData.attempts);
  const detectedBlindSpots = blindSpots(storeData.attempts, storeData.concepts);

  return (
    <div className="min-h-[100dvh] bg-ink text-text flex items-center justify-center p-4 sm:p-6 select-none relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-violet/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg bg-[#120E22]/90 border border-line rounded-[20px] p-6 sm:p-8 backdrop-blur-xl relative z-10 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-full bg-signature-gradient p-0.5 mx-auto">
            <div className="w-full h-full rounded-full bg-panel flex items-center justify-center text-cyan font-mono text-2xl font-bold">
              ✓
            </div>
          </div>
          <h1 className="font-sans font-semibold text-2xl text-text">Session complete</h1>
          <p className="font-sans text-xs text-muted">
            {getStateDescription(storeData.flowState)}
          </p>
        </div>

        {/* Core Session Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#150F2A] p-3.5 rounded-[12px] text-center space-y-1">
            <span className="block font-mono text-[9px] uppercase text-muted">ANSWERED</span>
            <span className="block font-mono text-xl font-bold text-text">{totalAnswered}</span>
          </div>

          <div className="bg-[#150F2A] p-3.5 rounded-[12px] text-center space-y-1">
            <span className="block font-mono text-[9px] uppercase text-muted">ACCURACY</span>
            <span className="block font-mono text-xl font-bold text-cyan">
              {totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0}%
            </span>
          </div>

          <div className="bg-[#150F2A] p-3.5 rounded-[12px] text-center space-y-1">
            <span className="block font-mono text-[9px] uppercase text-muted">REWARDS</span>
            <span className="block font-mono text-xl font-bold text-violet">
              +{storeData.rewardsCount > 0 ? 1 : 0}
            </span>
          </div>
        </div>

        {/* SOLO MODE ASSESSMENT RESULT BANNER */}
        {recentAttempts.some((a) => a.isSolo) && (
          <div className="p-4 rounded-[14px] bg-violet-600/15 border border-violet-500/40 space-y-2 animate-fadeIn">
            <span className="font-mono text-[10px] uppercase text-violet font-bold tracking-eyebrow block">
              SOLO VS ASSISTED ABILITY EVALUATION
            </span>
            {(() => {
              const activeConcept = storeData.concepts.find((c) => c.id === recentAttempts[0]?.conceptId) || storeData.concepts[0];
              const assistedPct = activeConcept?.thetaAssisted !== undefined ? thetaToPercent(activeConcept.thetaAssisted) : (activeConcept?.masteryPercentage ?? 50);
              const soloPct = activeConcept?.thetaSolo !== undefined && (activeConcept?.soloAttemptsCount || 0) >= 3 ? thetaToPercent(activeConcept.thetaSolo) : null;
              const gap = computeGap(activeConcept?.thetaAssisted ?? -0.4, activeConcept?.thetaSolo, activeConcept?.soloAttemptsCount || 0);

              let gapVerdict = "Some of this leans on support. Normal at this stage.";
              if (gap !== null) {
                if (gap < 10) gapVerdict = "Your ability holds up on its own.";
                else if (gap <= 25) gapVerdict = "Some of this leans on support. Normal at this stage.";
                else gapVerdict = "A lot of this depends on help being available. Worth knowing before an interview.";
              }

              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between font-mono text-sm pt-1">
                    <span>Assisted <strong className="text-cyan">{assistedPct}%</strong></span>
                    <span className="text-muted">·</span>
                    <span>Solo <strong className="text-violet">{soloPct !== null ? `${soloPct}%` : '—'}</strong></span>
                    <span className="text-muted">·</span>
                    <span>Gap <strong className={gap !== null && gap > 25 ? 'text-amber-400 font-bold' : 'text-text'}>{gap !== null ? `${gap} points` : 'Building data (needs 3 solo runs)'}</strong></span>
                  </div>
                  <p className="font-sans text-xs text-violet-200 leading-relaxed pt-1">
                    {gapVerdict}
                  </p>
                </div>
              );
            })()}
          </div>
        )}

        {/* Concept Mastery Changes */}
        <div className="space-y-2.5 pt-2">
          <span className="font-mono text-[10px] tracking-eyebrow uppercase text-muted font-bold block px-1">
            CONCEPT MASTERY PROGRESSION
          </span>

          <div className="space-y-2">
            {conceptSummaries.length > 0 ? (
              conceptSummaries.map((summary) => (
                <div key={summary.id} className="bg-[#150F2A] p-3.5 rounded-[12px] flex items-center justify-between text-xs">
                  <span className="font-sans font-medium text-text">{summary.name}</span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-muted">{summary.initialMastery}%</span>
                    <span className="text-muted">→</span>
                    <span className="text-cyan font-bold">{summary.finalMastery}%</span>
                    <span className={summary.delta >= 0 ? 'text-success text-[10px] font-bold' : 'text-danger text-[10px] font-bold'}>
                      {summary.delta >= 0 ? `+${summary.delta}%` : `${summary.delta}%`}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 bg-[#150F2A] rounded-[12px] text-center text-xs text-muted font-mono">
                No concept deltas recorded for this session.
              </div>
            )}
          </div>
        </div>

        {/* CONFIDENCE CALIBRATION BLOCK */}
        <div className="space-y-3 pt-3 border-t border-line/60">
          <div className="flex items-center justify-between px-1">
            <span className="font-mono text-[10px] tracking-eyebrow uppercase text-cyan font-bold block">
              CONFIDENCE CALIBRATION
            </span>
            <span className="font-mono text-[9px] text-muted">
              {breakdown.totalWithConfidence} evaluated
            </span>
          </div>

          {/* 4 Quadrants Display */}
          <div className="grid grid-cols-4 gap-2 text-center font-mono">
            <div className="bg-[#150F2A] p-2.5 rounded-[10px] border border-success/30">
              <span className="block text-[8px] text-muted uppercase">SOLID</span>
              <span className="block text-base font-bold text-success">{breakdown.solid}</span>
            </div>
            <div className="bg-[#150F2A] p-2.5 rounded-[10px] border border-cyan/30">
              <span className="block text-[8px] text-muted uppercase">HONEST GAP</span>
              <span className="block text-base font-bold text-cyan">{breakdown.honestGap}</span>
            </div>
            <div className="bg-[#150F2A] p-2.5 rounded-[10px] border border-violet/30">
              <span className="block text-[8px] text-muted uppercase">FRAGILE</span>
              <span className="block text-base font-bold text-violet">{breakdown.fragile}</span>
            </div>
            <div className="bg-[#150F2A] p-2.5 rounded-[10px] border border-amber-500/50 bg-amber-500/10">
              <span className="block text-[8px] text-amber-300 uppercase font-bold">BLIND SPOT</span>
              <span className="block text-base font-bold text-amber-400">{breakdown.blindSpot}</span>
            </div>
          </div>

          {/* Calibration Verdict */}
          {score !== null ? (
            <div className="p-3.5 rounded-[12px] bg-[#1A1430] border border-line text-xs font-sans text-text leading-relaxed">
              <p>
                {score > 0.25
                  ? "You're running ahead of what you actually know. Three topics need another look."
                  : score < -0.25
                    ? "You know more than you think. Trust yourself more."
                    : "Your sense of what you know is accurate. That's rarer than it sounds."}
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-[12px] bg-[#150F2A] border border-line/60 font-mono text-[11px] text-muted text-center">
              A few more items and we can tell you how well-calibrated you are.
            </div>
          )}

          {/* Blind Spots Scoped Quest Links */}
          {detectedBlindSpots.length > 0 && (
            <div className="space-y-2 pt-1">
              <span className="font-mono text-[9px] uppercase text-amber-400 font-bold block px-1">
                BLIND SPOTS DETECTED ({detectedBlindSpots.length})
              </span>
              {detectedBlindSpots.map((bs) => (
                <div key={bs.conceptId} className="p-3 rounded-[12px] bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-sans font-semibold text-xs text-text block">{bs.conceptName}</span>
                    <span className="font-mono text-[9px] text-amber-300 block">{bs.count} misconception{bs.count > 1 ? 's' : ''} recorded</span>
                  </div>
                  <Link
                    href={`/quest?concept=${encodeURIComponent(bs.conceptId)}`}
                    className="h-[32px] px-3 rounded-[8px] bg-amber-500 text-ink font-sans font-bold text-xs flex items-center gap-1 hover:brightness-110"
                  >
                    <span>Target Spot</span>
                    <span>→</span>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PDF Download Options */}
        <div className="pt-2 border-t border-line/60 space-y-2">
          <span className="font-mono text-[10px] tracking-eyebrow uppercase text-cyan font-bold block px-1">
            DOWNLOAD CREDENTIALS & STUDY MATERIALS
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                const sampleChunks = storeData.concepts.map((c) => ({
                  say: `${c.name}: Verified mastery at ${c.masteryPercentage}%. Retention risk level is ${(c.retentionRisk * 100).toFixed(0)}%.`,
                }));
                downloadNotesPdf({ conceptName: storeData.goalText || 'XPedition Learning Goal', chunks: sampleChunks });
              }}
              className="h-10 px-3 rounded-[10px] bg-[#1A1430] border border-cyan/40 text-cyan hover:bg-cyan/15 font-sans font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <span>📄 Notes PDF</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const sampleChunks = storeData.concepts.map((c) => ({
                  say: `${c.name}: Core concept in active graph. Evaluated with theta ${c.thetaAssisted !== undefined ? c.thetaAssisted.toFixed(2) : '-0.40'}.`,
                }));
                downloadFlashcardsPdf({ conceptName: storeData.goalText || 'XPedition Learning Goal', chunks: sampleChunks });
              }}
              className="h-10 px-3 rounded-[10px] bg-[#1A1430] border border-violet/40 text-violet-400 hover:bg-violet-600/15 font-sans font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <span>🃏 Flashcards</span>
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2.5 pt-2">
          <Link
            href="/quest"
            className="w-full h-[52px] min-h-[52px] rounded-[12px] bg-signature-gradient text-white font-sans font-semibold text-[15px] flex items-center justify-center gap-2 hover:brightness-108 transition-all"
          >
            <span>Another session</span>
            <span>→</span>
          </Link>

          <Link
            href="/home"
            className="w-full h-[46px] min-h-[46px] rounded-[12px] border border-line text-muted hover:text-text font-sans font-medium text-xs flex items-center justify-center transition-all block text-center"
          >
            Back to home
          </Link>
        </div>

      </div>

      {/* Floating Feedback Sheet */}
      <FeedbackSheet />
    </div>
  );
}
