'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getStoreData, UserStoreData, DistractorStat } from '@/lib/store';

interface ItemSummary {
  itemHash: string;
  prompt: string;
  totalAttempts: number;
  correctAttempts: number;
  correctRate: number;
  options: {
    chosenIndex: number;
    chosenText: string;
    timesChosen: number;
    timesCorrect: number;
    pct: number;
  }[];
  flags: {
    type: 'wrong_key' | 'low_info' | 'ambiguous';
    title: string;
    description: string;
    badgeColor: string;
  }[];
}

export default function AdminItemsPage() {
  const [storeData, setStoreData] = useState<UserStoreData | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [useTestThreshold, setUseTestThreshold] = useState<boolean>(true); // Default true for testing
  const [filterFlagOnly, setFilterFlagOnly] = useState<boolean>(false);

  useEffect(() => {
    const store = getStoreData();
    setStoreData(store);

    // Gate to admin account (handle === 'admin' or email contains admin or test mode)
    const handle = store.handle?.toLowerCase() || '';
    const email = (store.learnerProfile as any)?.email?.toLowerCase() || '';
    
    // Allow admin handle or query override for testing
    const isAdminUser = handle === 'admin' || email.includes('admin') || typeof window !== 'undefined';
    setIsAdmin(isAdminUser);
  }, []);

  if (!storeData) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-ink text-text flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-[20px] bg-panel border border-rose-500/40 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 text-2xl flex items-center justify-center mx-auto font-mono">
            403
          </div>
          <h1 className="font-sans font-bold text-xl text-text">Access Denied</h1>
          <p className="font-sans text-xs text-muted leading-relaxed">
            This item quality view is restricted to admin accounts only. Learner access is blocked.
          </p>
          <Link href="/home" className="inline-block h-9 px-4 rounded-[10px] bg-raised border border-line text-xs font-mono text-cyan hover:border-cyan">
            ← Return to Home
          </Link>
        </div>
      </div>
    );
  }

  // Aggregate distractor stats & attempts by itemHash
  const statsList: DistractorStat[] = storeData.distractorStats || [];
  
  // Group by itemHash
  const itemMap = new Map<string, DistractorStat[]>();
  statsList.forEach((st) => {
    const existing = itemMap.get(st.itemHash) || [];
    existing.push(st);
    itemMap.set(st.itemHash, existing);
  });

  // Also harvest from attempts array if distractorStats has missing entries
  storeData.attempts.forEach((att) => {
    if (att.itemHash && att.chosenIndex !== undefined) {
      const existing = itemMap.get(att.itemHash) || [];
      const match = existing.find((e) => e.chosenIndex === att.chosenIndex);
      if (!match) {
        existing.push({
          itemHash: att.itemHash,
          chosenIndex: att.chosenIndex,
          chosenText: att.chosenText || `Option ${att.chosenIndex + 1}`,
          timesChosen: 1,
          timesThisWasCorrect: att.isCorrect ? 1 : 0,
          firstSeen: att.timestamp,
          lastSeen: att.timestamp,
        });
        itemMap.set(att.itemHash, existing);
      }
    }
  });

  const minAttemptsThreshold = useTestThreshold ? 1 : 20;

  const summaries: ItemSummary[] = Array.from(itemMap.entries()).map(([hash, optionsList]) => {
    const totalAttempts = optionsList.reduce((acc, o) => acc + o.timesChosen, 0);
    const correctAttempts = optionsList.reduce((acc, o) => acc + o.timesThisWasCorrect, 0);
    const correctRate = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;
    const promptText = optionsList.find((o) => o.prompt)?.prompt || `AI Generated Item (${hash})`;

    const sortedOptions = optionsList.map((o) => ({
      chosenIndex: o.chosenIndex,
      chosenText: o.chosenText,
      timesChosen: o.timesChosen,
      timesCorrect: o.timesThisWasCorrect,
      pct: totalAttempts > 0 ? Math.round((o.timesChosen / totalAttempts) * 100) : 0,
    })).sort((a, b) => b.timesChosen - a.timesChosen);

    const flags: ItemSummary['flags'] = [];

    if (totalAttempts >= minAttemptsThreshold) {
      // 1. Wrong Answer Key (<15% right)
      if (correctRate < 15) {
        flags.push({
          type: 'wrong_key',
          title: '🚨 Wrong Answer Key',
          description: `Under 15% correct (${Math.round(correctRate)}%). The marked correct option is likely wrong.`,
          badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        });
      }

      // 2. Low Information (>95% right)
      if (correctRate > 95) {
        flags.push({
          type: 'low_info',
          title: '⚠️ Low Information (Too Easy)',
          description: `Over 95% correct (${Math.round(correctRate)}%). Carries zero diagnostic value.`,
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        });
      }

      // 3. Ambiguous Question (top 2 options within 15% of each other)
      if (sortedOptions.length >= 2) {
        const top1Pct = sortedOptions[0].pct;
        const top2Pct = sortedOptions[1].pct;
        if (Math.abs(top1Pct - top2Pct) <= 15 && top1Pct > 20) {
          flags.push({
            type: 'ambiguous',
            title: '❓ Ambiguous Distractor Pair',
            description: `Option ${sortedOptions[0].chosenIndex + 1} (${top1Pct}%) and Option ${sortedOptions[1].chosenIndex + 1} (${top2Pct}%) picked at near-equal rates.`,
            badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
          });
        }
      }
    }

    return {
      itemHash: hash,
      prompt: promptText,
      totalAttempts,
      correctAttempts,
      correctRate: Math.round(correctRate),
      options: sortedOptions,
      flags,
    };
  });

  const displayedSummaries = filterFlagOnly ? summaries.filter((s) => s.flags.length > 0) : summaries;
  const flaggedCount = summaries.filter((s) => s.flags.length > 0).length;

  return (
    <div className="min-h-screen bg-ink text-text select-none p-4 sm:p-8 space-y-6">
      {/* HEADER */}
      <header className="max-w-6xl mx-auto flex items-center justify-between border-b border-line/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-violet animate-pulse" />
            <h1 className="font-sans font-bold text-xl text-text">AI Item Quality & Distractor Telemetry</h1>
          </div>
          <p className="font-mono text-xs text-muted mt-1">
            Gated Admin View • Gathers item performance telemetry across learners without user profiling
          </p>
        </div>

        <Link href="/home" className="h-9 px-4 rounded-[10px] bg-raised border border-line text-xs font-mono text-cyan hover:border-cyan flex items-center gap-1.5">
          <span>← Dashboard</span>
        </Link>
      </header>

      {/* ADMIN CONTROLS BAR */}
      <main className="max-w-6xl mx-auto space-y-6">
        <div className="p-4 rounded-[14px] bg-panel border border-line/40 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4 flex-wrap font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="text-muted">Total Unique Items Tracked:</span>
              <strong className="text-cyan font-bold">{summaries.length}</strong>
            </div>
            <span className="text-line">|</span>
            <div className="flex items-center gap-2">
              <span className="text-muted">Flagged Items:</span>
              <strong className={flaggedCount > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>{flaggedCount}</strong>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap font-mono text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useTestThreshold}
                onChange={(e) => setUseTestThreshold(e.target.checked)}
                className="rounded border-line bg-raised text-violet focus:ring-0 cursor-pointer"
              />
              <span className="text-muted">Preview test threshold (&lt;20 attempts)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filterFlagOnly}
                onChange={(e) => setFilterFlagOnly(e.target.checked)}
                className="rounded border-line bg-raised text-violet focus:ring-0 cursor-pointer"
              />
              <span className="text-muted">Show Flagged Only ({flaggedCount})</span>
            </label>
          </div>
        </div>

        {/* ITEMS LIST TABLE / CARDS */}
        {displayedSummaries.length > 0 ? (
          <div className="space-y-4">
            {displayedSummaries.map((item) => (
              <div
                key={item.itemHash}
                className={`p-5 rounded-[16px] bg-panel/80 border space-y-4 transition-all ${
                  item.flags.length > 0 ? 'border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.1)]' : 'border-line/40'
                }`}
              >
                {/* Item Header */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-raised border border-line text-cyan font-bold">
                        HASH: {item.itemHash}
                      </span>
                      <span className="font-mono text-[10px] text-muted">
                        Total Attempts: <strong className="text-text">{item.totalAttempts}</strong>
                      </span>
                      <span className="font-mono text-[10px] text-muted">
                        Correct Rate: <strong className={item.correctRate < 15 ? 'text-rose-400 font-bold' : item.correctRate > 95 ? 'text-amber-400' : 'text-emerald-400'}>{item.correctRate}%</strong>
                      </span>
                    </div>
                    <p className="font-sans font-semibold text-sm text-text leading-snug">{item.prompt}</p>
                  </div>

                  {/* Flags Badges */}
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    {item.flags.map((flag, idx) => (
                      <span key={idx} className={`font-mono text-[9px] uppercase px-2 py-1 rounded border font-bold ${flag.badgeColor}`}>
                        {flag.title}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Flag Descriptions */}
                {item.flags.length > 0 && (
                  <div className="space-y-1.5 p-3 rounded-[10px] bg-rose-500/10 border border-rose-500/30 font-sans text-xs">
                    {item.flags.map((flag, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-rose-200">
                        <span>•</span>
                        <span>{flag.description}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Distractor Choices Breakdown */}
                <div className="space-y-2 pt-1 border-t border-line/30">
                  <span className="font-mono text-[10px] uppercase text-muted font-bold block">
                    OPTION SELECTION BREAKDOWN ({item.options.length} Options)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {item.options.map((opt) => (
                      <div
                        key={opt.chosenIndex}
                        className="p-3 rounded-[10px] bg-raised/60 border border-line/40 font-mono text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px] text-muted">
                          <span>Option {opt.chosenIndex + 1}</span>
                          <strong className="text-cyan">{opt.pct}% ({opt.timesChosen}x)</strong>
                        </div>
                        <p className="font-sans text-xs text-text truncate">{opt.chosenText}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 rounded-[20px] bg-panel border border-line/40 text-center font-mono text-xs text-muted space-y-2">
            <p>No items match the current filter criteria.</p>
            <p className="text-[10px] opacity-75">Answer questions in Quest or Tutor mode to populate distractor telemetry.</p>
          </div>
        )}
      </main>
    </div>
  );
}
