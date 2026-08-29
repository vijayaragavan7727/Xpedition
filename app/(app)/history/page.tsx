'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getStoreData, UserStoreData, Attempt, ConceptMastery } from '@/lib/store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { History, Sparkles, Shield, CheckCircle2, XCircle, ArrowRight, BookOpen, Clock, TrendingUp } from 'lucide-react';

interface SessionGroup {
  sessionId: string;
  conceptId: string;
  conceptName: string;
  dateStr: string;
  timeStr: string;
  timestamp: number;
  totalAttempts: number;
  correctCount: number;
  isSolo: boolean;
  masteryPercentage?: number;
  attempts: Attempt[];
}

export default function HistoryPage() {
  const [storeData, setStoreData] = useState<UserStoreData | null>(null);
  const [sessionGroups, setSessionGroups] = useState<SessionGroup[]>([]);
  const [filter, setFilter] = useState<'all' | 'solo' | 'assisted'>('all');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      const store = getStoreData();
      setStoreData(store);

      let allAttempts: Attempt[] = [...(store.attempts || [])];

      // Query Supabase for cloud-persisted attempts
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: userData } = await supabase.auth.getUser();
          const userId = userData?.user?.id;

          if (userId) {
            const { data: dbAttempts, error } = await supabase
              .from('attempts')
              .select('*')
              .eq('user_id', userId)
              .order('created_at', { ascending: false });

            if (!error && dbAttempts && Array.isArray(dbAttempts)) {
              const mappedDbAttempts: Attempt[] = dbAttempts.map((row: any) => ({
                id: row.id,
                conceptId: row.concept_id,
                conceptName: row.concept_name,
                isCorrect: row.is_correct,
                timestamp: new Date(row.created_at).getTime(),
                confidence: row.confidence,
                isSolo: Boolean(row.is_solo),
                chosenIndex: row.chosen_index,
                chosenText: row.chosen_text,
                correctIndex: row.correct_index,
                itemHash: row.item_hash,
              }));

              // Merge and deduplicate by attempt ID
              const existingIds = new Set(allAttempts.map((a) => a.id));
              mappedDbAttempts.forEach((att) => {
                if (!existingIds.has(att.id)) {
                  allAttempts.push(att);
                }
              });
            }
          }
        } catch (err) {
          console.warn('Supabase history fetch fallback to local store:', err);
        }
      }

      // Sort attempts descending by timestamp
      allAttempts.sort((a, b) => b.timestamp - a.timestamp);

      // Group attempts within 15-minute windows into learning sessions
      const conceptMasteryMap = new Map<string, number>();
      store.concepts?.forEach((c: ConceptMastery) => {
        conceptMasteryMap.set(c.id, c.masteryPercentage || 0);
      });

      const groups: SessionGroup[] = [];
      const sessionWindowMs = 15 * 60 * 1000; // 15 mins

      allAttempts.forEach((attempt) => {
        const d = new Date(attempt.timestamp);
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

        // Find existing session group matching concept & time window
        const existing = groups.find(
          (g) =>
            g.conceptId === attempt.conceptId &&
            Math.abs(g.timestamp - attempt.timestamp) < sessionWindowMs &&
            g.isSolo === Boolean(attempt.isSolo)
        );

        if (existing) {
          existing.attempts.push(attempt);
          existing.totalAttempts += 1;
          if (attempt.isCorrect) existing.correctCount += 1;
        } else {
          groups.push({
            sessionId: `sess_${attempt.conceptId}_${attempt.timestamp}`,
            conceptId: attempt.conceptId,
            conceptName: attempt.conceptName || 'Core Concept',
            dateStr,
            timeStr,
            timestamp: attempt.timestamp,
            totalAttempts: 1,
            correctCount: attempt.isCorrect ? 1 : 0,
            isSolo: Boolean(attempt.isSolo),
            masteryPercentage: conceptMasteryMap.get(attempt.conceptId) ?? Math.round(attempt.isCorrect ? 75 : 30),
            attempts: [attempt],
          });
        }
      });

      setSessionGroups(groups);
      setLoading(false);
    };

    loadHistory();
  }, []);

  const filteredSessions = sessionGroups.filter((s) => {
    if (filter === 'solo') return s.isSolo;
    if (filter === 'assisted') return !s.isSolo;
    return true;
  });

  return (
    <div className="space-y-6 select-none pt-4 max-w-3xl mx-auto font-sans">
      
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-6 h-6 text-[#00F0FF]" />
            <h1 className="font-sans font-bold text-2xl text-white">Learning History</h1>
          </div>
          <p className="font-sans text-xs text-slate-400 mt-1">
            Review past learning sessions, quest accuracy, and concept progression over time.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#120E24] border border-white/10 font-mono text-xs">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-[#00F0FF] text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({sessionGroups.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('solo')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              filter === 'solo'
                ? 'bg-[#A855F7] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Solo Quests
          </button>
          <button
            type="button"
            onClick={() => setFilter('assisted')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              filter === 'assisted'
                ? 'bg-[#00FF87] text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            AI Assisted
          </button>
        </div>
      </div>

      {/* Main Content List / Empty State */}
      {loading ? (
        <div className="py-16 text-center text-[#00F0FF] font-mono text-sm animate-pulse space-y-2">
          <div>Loading learning logs & Supabase session telemetry...</div>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="p-8 sm:p-12 bg-[#120E24] rounded-[24px] border border-white/10 text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/30 flex items-center justify-center text-[#00F0FF] mx-auto shadow-[0_0_20px_rgba(0,240,255,0.25)]">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="font-sans font-bold text-lg text-white">
              No sessions yet — start learning!
            </h2>
            <p className="font-sans text-xs text-slate-400 leading-relaxed">
              Complete your first adaptive quest on Home or start a classroom session with XYRA to log items and track mastery over time.
            </p>
          </div>
          <Link
            href="/home"
            className="inline-flex h-11 px-6 rounded-xl bg-[#00F0FF] text-black font-mono font-bold text-xs items-center justify-center gap-2 hover:brightness-110 shadow-lg transition-all"
          >
            <span>Start Learning Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredSessions.map((session) => {
            const accuracy = Math.round((session.correctCount / session.totalAttempts) * 100);
            const isHighAccuracy = accuracy >= 70;

            return (
              <div
                key={session.sessionId}
                className="p-4 sm:p-5 bg-[#120E24] rounded-2xl border border-white/10 hover:border-white/20 transition-all space-y-3 shadow-lg"
              >
                {/* Session Top Line */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-sans font-bold text-sm sm:text-base text-white">
                      {session.conceptName}
                    </span>
                    {session.isSolo ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#A855F7]/20 border border-[#A855F7]/40 text-[#A855F7] text-[10px] font-mono font-bold">
                        <Shield className="w-3 h-3" />
                        Solo Quest
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] text-[10px] font-mono font-bold">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        AI Assisted
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-400 font-mono text-xs">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{session.dateStr} &middot; {session.timeStr}</span>
                  </div>
                </div>

                {/* Session Stats Grid */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/10 text-xs font-mono">
                  {/* Total Items */}
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase font-medium">Questions</span>
                    <span className="text-sm font-bold text-white mt-0.5">{session.totalAttempts} items</span>
                  </div>

                  {/* Accuracy Score */}
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase font-medium">Accuracy</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {isHighAccuracy ? (
                        <CheckCircle2 className="w-4 h-4 text-[#00FF87]" />
                      ) : (
                        <XCircle className="w-4 h-4 text-[#FF0055]" />
                      )}
                      <span className={`text-sm font-bold ${isHighAccuracy ? 'text-[#00FF87]' : 'text-[#FF7185]'}`}>
                        {session.correctCount}/{session.totalAttempts} ({accuracy}%)
                      </span>
                    </div>
                  </div>

                  {/* Mastery Percentage */}
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase font-medium">Mastery</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <TrendingUp className="w-3.5 h-3.5 text-[#00F0FF]" />
                      <span className="text-sm font-bold text-[#00F0FF]">
                        {session.masteryPercentage}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Action */}
                <div className="flex items-center justify-end pt-1">
                  <Link
                    href={`/quest?concept=${encodeURIComponent(session.conceptId)}`}
                    className="text-xs font-mono font-bold text-[#00F0FF] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Practice {session.conceptName} again</span>
                    <span>&rarr;</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
