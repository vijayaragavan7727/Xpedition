'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getStoreData, calculateStreak, selectNextTarget, UserStoreData } from '@/lib/store';
import { thetaToPercent } from '@/lib/engine/mastery';
import { computeWorldState, syncWorldState, WorldState, WorldBuilding, detectBuildingStateTransitions } from '@/lib/worldEngine';
import { WorldThemeId } from '@/lib/themes';
import XyraGreetingWidget from '@/components/XyraGreetingWidget';
import WorldRenderer from '@/components/WorldRenderer';
import WorldUnlockCelebration from '@/components/WorldUnlockCelebration';
import { Send, Volume2, VolumeX, Sparkles, RefreshCw, Globe, ChevronRight } from 'lucide-react';

interface ChatExchange {
  id: string;
  query: string;
  reply: string;
  timestamp: number;
}

export default function HomePage() {
  const router = useRouter();
  const [storeData, setStoreData] = useState<UserStoreData | null>(null);
  const [worldState, setWorldState] = useState<WorldState | null>(null);
  const [unlockedBuilding, setUnlockedBuilding] = useState<WorldBuilding | null>(null);
  const [robotImgPath, setRobotImgPath] = useState<string>('/robot.png');

  // Inline Ask XYRA State
  const [inlineInput, setInlineInput] = useState<string>('');
  const [chatExchanges, setChatExchanges] = useState<ChatExchange[]>([]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [homeChatCount, setHomeChatCount] = useState<number>(0);
  const [speakingExchangeId, setSpeakingExchangeId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const store = getStoreData();
    setStoreData(store);

    // Compute & Sync World State
    const currentWorld = computeWorldState(store);
    setWorldState(currentWorld);
    syncWorldState(store);

    // Check for new building unlock moments
    if (typeof window !== 'undefined') {
      try {
        const savedBuildingsStr = localStorage.getItem(`xpedition_prev_buildings_${currentWorld.skillGraphId}`);
        if (savedBuildingsStr) {
          const prevBuildings: WorldBuilding[] = JSON.parse(savedBuildingsStr);
          const newUnlocks = detectBuildingStateTransitions(prevBuildings, currentWorld.buildings);
          if (newUnlocks.length > 0) {
            setUnlockedBuilding(newUnlocks[0]);
          }
        }
        localStorage.setItem(
          `xpedition_prev_buildings_${currentWorld.skillGraphId}`,
          JSON.stringify(currentWorld.buildings)
        );
      } catch (e) {}
    }

    // Load daily home chat count from localStorage
    if (typeof window !== 'undefined') {
      const todayStr = new Date().toISOString().slice(0, 10);
      const savedDate = localStorage.getItem('xyra_home_chat_date');
      const savedCount = parseInt(localStorage.getItem('xyra_home_chat_count') || '0', 10);

      if (savedDate === todayStr) {
        setHomeChatCount(savedCount);
      } else {
        localStorage.setItem('xyra_home_chat_date', todayStr);
        localStorage.setItem('xyra_home_chat_count', '0');
        setHomeChatCount(0);
      }
    }
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

    // PRE-FETCH WORLD BUILDING ASSETS IN BACKGROUND ON HOME MOUNT
    if (worldState?.buildings && typeof window !== 'undefined') {
      worldState.buildings.forEach((b) => {
        if (b.imageUrl) {
          const img = new Image();
          img.src = b.imageUrl;
        }
      });
    }
  }, [storeData?.activeGraphId, target?.conceptId, worldState?.buildings]);

  if (!storeData || !target) {
    return <div className="py-12 text-center text-muted font-mono text-sm animate-pulse">Loading dashboard...</div>;
  }

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeakingExchangeId(null);
  };

  const handleSpeakInlineText = async (exchangeId: string, text: string) => {
    if (speakingExchangeId === exchangeId) {
      stopAudio();
      return;
    }

    stopAudio();
    setSpeakingExchangeId(exchangeId);

    try {
      const res = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          language: storeData?.learnerProfile?.language || 'english',
          speaker: 'ratan',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.audioBase64) {
          const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
          audioRef.current = audio;
          audio.onended = () => setSpeakingExchangeId(null);
          audio.onerror = () => playBrowserFallback(text);
          audio.play().catch(() => playBrowserFallback(text));
          return;
        }
      }
    } catch (e) {}

    playBrowserFallback(text);
  };

  const playBrowserFallback = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onend = () => setSpeakingExchangeId(null);
      utterance.onerror = () => setSpeakingExchangeId(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setSpeakingExchangeId(null);
    }
  };

  const handleSendHomeChat = async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed || isChatLoading || homeChatCount >= 5) return;

    setIsChatLoading(true);
    setInlineInput('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          context: {
            scope: 'home',
            name: storeData.handle,
            goal: storeData.goalText,
            concepts: storeData.concepts,
            fadingConcepts: fadingConcepts,
            language: storeData?.learnerProfile?.language || 'english',
          },
        }),
      });

      let reply = `Keep moving forward on ${storeData.goalText}! Would you like to practice your next topic?`;
      if (res.ok) {
        const data = await res.json();
        if (data?.reply) reply = data.reply;
      }

      const newExchange: ChatExchange = {
        id: `exch_${Date.now()}`,
        query: trimmed,
        reply,
        timestamp: Date.now(),
      };

      setChatExchanges((prev) => [...prev, newExchange]);

      const nextCount = homeChatCount + 1;
      setHomeChatCount(nextCount);
      if (typeof window !== 'undefined') {
        localStorage.setItem('xyra_home_chat_count', String(nextCount));
      }

      handleSpeakInlineText(newExchange.id, reply);
    } catch (err) {
      const fallbackExchange: ChatExchange = {
        id: `exch_${Date.now()}`,
        query: trimmed,
        reply: `You are making steady progress toward ${storeData.goalText}. Let's continue with ${target.conceptName}!`,
        timestamp: Date.now(),
      };
      setChatExchanges((prev) => [...prev, fallbackExchange]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const attemptConceptIds = new Set((storeData.attempts || []).map((a) => a.conceptId));

  // Determine Continue Card Link automatically:
  // Never attempted -> /tutor (or /learn). Attempted or fading -> /quest
  const learningMode = storeData.learnerProfile?.learningMode || 'tutor';
  const showLessonFirst = !target.hasAttempts && !target.inProgress;
  const lessonPath = learningMode === 'read' ? '/learn' : '/tutor';

  const continueHref = showLessonFirst
    ? `${lessonPath}/${encodeURIComponent(target.conceptId)}`
    : `/quest?concept=${encodeURIComponent(target.conceptId)}`;

  // Ensure real concept name is resolved (never placeholder "Core Concept")
  const realConceptName = (target.conceptName && target.conceptName !== 'Core Concept')
    ? target.conceptName
    : storeData.concepts?.[0]?.name || storeData.goalText || 'Active Topic';

  const activeThemeId = (storeData.learnerProfile?.worldTheme as WorldThemeId) || 'cosmos';

  return (
    <div className="space-y-5 select-none relative pb-16 font-sans">
      
      {/* 1. XYRA GREETING WIDGET (Top of Home Page) */}
      <section className="pt-1">
        <XyraGreetingWidget
          storeData={storeData}
          continueHref={continueHref}
          continueLabel={`Continue: ${realConceptName}`}
          fadingConcepts={fadingConcepts}
          streak={streak}
        />
      </section>

      {/* 2. INLINE ASK XYRA CHAT BOX */}
      <section className="bg-[#0D0D1A] border border-[#00F0FF]/40 rounded-[20px] p-4 sm:p-5 space-y-3 shadow-xl relative overflow-hidden backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#00F0FF]/20 border border-[#00F0FF] flex items-center justify-center p-0.5 shadow-[0_0_8px_rgba(0,240,255,0.4)]">
              <img
                src={robotImgPath}
                onError={() => {
                  if (robotImgPath === '/robot.png') setRobotImgPath('/images/robot.png');
                }}
                alt="XYRA"
                className="w-5 h-5 object-contain"
              />
            </div>
            <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-[#00F0FF]">
              <span>XYRA</span>
              <span className="w-2 h-2 rounded-full bg-[#00FF87] animate-pulse" />
              <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-[#00F0FF]/10 text-cyan-300 font-medium">active</span>
            </div>
          </div>
          <span className="font-mono text-[10px] text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
            {homeChatCount} / 5 today
          </span>
        </div>

        {/* Subtitle */}
        <p className="font-sans text-xs text-slate-300 font-medium">
          &ldquo;What would you like to know?&rdquo;
        </p>

        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
          {[
            { label: 'My weakest?', query: 'Which concept am I weakest at?' },
            { label: 'What next?', query: 'What should I study next?' },
            { label: 'How am I doing?', query: 'How is my overall learning progress?' },
          ].map((item, idx) => (
            <button
              key={idx}
              type="button"
              disabled={homeChatCount >= 5 || isChatLoading}
              onClick={() => handleSendHomeChat(item.query)}
              className="px-2.5 py-1 rounded-full bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 border border-[#00F0FF]/30 text-[#00F0FF] text-[11px] font-sans font-medium whitespace-nowrap transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              ✨ {item.label}
            </button>
          ))}
        </div>

        {/* Chat exchanges */}
        {chatExchanges.length > 0 && (
          <div className="space-y-2.5 pt-1 border-t border-white/5">
            {chatExchanges.slice(-2).map((item) => (
              <div key={item.id} className="space-y-1.5 animate-fadeIn">
                <div className="flex justify-end">
                  <div className="max-w-[85%] px-3 py-1.5 rounded-xl bg-[#00F0FF] text-black font-semibold text-xs leading-snug rounded-tr-none shadow">
                    {item.query}
                  </div>
                </div>

                <div className="flex justify-start items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#00F0FF]/20 border border-[#00F0FF]/50 flex items-center justify-center text-[8px] font-bold text-[#00F0FF] shrink-0 mt-0.5">
                    X
                  </div>
                  <div className="max-w-[85%] p-2.5 rounded-xl bg-[#151226] border border-[#00F0FF]/30 text-slate-100 text-xs leading-relaxed rounded-tl-none space-y-1.5 shadow-md">
                    <p>{item.reply}</p>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-white/5">
                      <button
                        type="button"
                        onClick={() => handleSpeakInlineText(item.id, item.reply)}
                        className="text-[#00F0FF] hover:underline flex items-center gap-1 font-bold cursor-pointer"
                      >
                        {speakingExchangeId === item.id ? (
                          <VolumeX className="w-3 h-3 text-[#FF0055]" />
                        ) : (
                          <Volume2 className="w-3 h-3" />
                        )}
                        <span>{speakingExchangeId === item.id ? 'Stop' : 'Read Aloud'}</span>
                      </button>
                      <span>XYRA</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {isChatLoading && (
          <div className="flex items-center gap-2 text-cyan-300 text-xs font-mono py-1">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#00F0FF]" />
            <span>XYRA is thinking...</span>
          </div>
        )}

        {/* Free text input form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendHomeChat(inlineInput);
          }}
          className="flex items-center gap-2 pt-1"
        >
          <input
            type="text"
            disabled={homeChatCount >= 5 || isChatLoading}
            value={inlineInput}
            onChange={(e) => setInlineInput(e.target.value)}
            placeholder={
              homeChatCount >= 5
                ? 'Daily limit reached (5/5 messages).'
                : 'Type anything about your goal or concepts...'
            }
            className="flex-1 h-10 px-3.5 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00F0FF] transition-all disabled:opacity-40"
          />
          <button
            type="submit"
            disabled={!inlineInput.trim() || homeChatCount >= 5 || isChatLoading}
            className="h-10 px-4 rounded-xl bg-[#00F0FF] hover:bg-[#00C2FF] text-black font-mono font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md shrink-0"
          >
            <span>Send</span>
            <Send className="w-3 h-3" />
          </button>
        </form>
      </section>

      {/* 3. CLEAN CONTINUE CARD */}
      <section className="sticky top-0 z-20 pt-1 -mt-1 bg-ink/95 backdrop-blur-md rounded-[18px]">
        <div className="card-glass-neon p-5 sm:p-6 rounded-[16px]">
        {hasSkillGraph ? (
          <div className="space-y-3.5">
            <div>
              <h2 className="font-sans font-bold text-xl text-text mb-1 tracking-tight">
                {realConceptName}
              </h2>
              <span className="font-mono text-xs text-cyan font-medium block mb-2.5">
                {target.masteryPercentage}% mastery
              </span>

              {/* 6px Thicker Progress Bar */}
              <div className="h-[6px] w-full bg-raised/90 rounded-full overflow-hidden border border-line/40">
                <div
                  className="h-full bg-signature-gradient rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(0,240,255,0.4)]"
                  style={{
                    width: target.inProgress
                      ? `${(target.currentIndex / target.totalLength) * 100}%`
                      : `${target.masteryPercentage}%`,
                  }}
                />
              </div>
            </div>

            <div className="pt-1">
              <Link
                href={continueHref}
                className="w-full h-[46px] rounded-[10px] bg-signature-gradient text-white font-sans font-semibold text-[15px] flex items-center justify-center gap-2 hover:brightness-108 hover:shadow-[0_8px_30px_-6px_rgba(168,85,247,0.55)] active:translate-y-[1px] transition-all cursor-pointer"
              >
                <span>Continue &rarr;</span>
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

      {/* 4. MINI WORLD PREVIEW (120px — DAILY REMINDER OF LIVING WORLD) */}
      {worldState && (
        <section className="pt-0.5">
          <Link
            href="/world"
            className="block relative rounded-[20px] overflow-hidden border border-white/15 hover:border-[#00F0FF]/50 transition-all cursor-pointer group shadow-xl"
          >
            <WorldRenderer
              theme={activeThemeId}
              buildings={worldState.buildings}
              height={120}
              isMiniPreview
            />

            {/* Floating Info Overlay on Mini Preview */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 p-3.5 flex items-end justify-between pointer-events-none">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#00FF87] animate-ping" />
                <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                  Your World &middot; Tier {worldState.tier}
                </span>
                <span className="font-mono text-[10px] text-slate-300 bg-black/50 px-2 py-0.5 rounded-full border border-white/10">
                  {worldState.totalMasteryPercent}% Terraformed
                </span>
              </div>

              <span className="font-mono text-xs text-[#00F0FF] group-hover:translate-x-1 transition-transform flex items-center gap-0.5 font-bold">
                <span>View Full World</span>
                <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </Link>
        </section>
      )}

      {/* 5. SKILL GRAPH CONCEPTS BREAKDOWN — 1-TAP DIRECT ROUTING */}
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
            const isFading = concept.retentionRisk > 0.35;

            // System decides automatically:
            // Never attempted -> /tutor (or /learn). Attempted or fading -> /quest
            const conceptHref = !hasAtt
              ? `${lessonPath}/${encodeURIComponent(concept.id)}`
              : `/quest?concept=${encodeURIComponent(concept.id)}`;

            const assistedPct = concept.thetaAssisted !== undefined ? thetaToPercent(concept.thetaAssisted) : concept.masteryPercentage;

            return (
              <Link
                key={concept.id}
                href={conceptHref}
                className="p-3.5 rounded-[12px] bg-panel/70 border border-line/40 flex items-center justify-between gap-3 hover:border-cyan hover:bg-panel/90 transition-all cursor-pointer group"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-sans text-sm text-text font-semibold group-hover:text-cyan transition-colors truncate">
                      {concept.name}
                    </span>
                    {!hasAtt && (
                      <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded bg-violet/20 text-violet font-bold shrink-0">
                        New
                      </span>
                    )}
                    {isFading && (
                      <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold shrink-0">
                        Fading
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-28 bg-raised rounded-full overflow-hidden">
                      <div className="h-full bg-cyan rounded-full" style={{ width: `${assistedPct}%` }} />
                    </div>
                    <span className="font-mono text-[10px] text-muted">
                      {assistedPct}% Mastery
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 font-mono text-xs text-muted group-hover:text-cyan transition-colors">
                  <span className="text-[11px] font-semibold hidden sm:inline">
                    {!hasAtt ? 'Learn' : isFading ? 'Drill' : 'Practice'}
                  </span>
                  <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* World Unlock Celebration Modal (Emotional payoff moment) */}
      <WorldUnlockCelebration
        unlockedBuilding={unlockedBuilding}
        allBuildings={worldState?.buildings || []}
        theme={activeThemeId}
        onDismiss={() => setUnlockedBuilding(null)}
      />

    </div>
  );
}
