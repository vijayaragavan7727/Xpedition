'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { StateHud } from '@/components/StateHud';
import { getStoreData, recordAttempt, saveActiveSession, clearActiveSession, selectNextTarget, setGraphContent, computeItemHash, Attempt, FlowState } from '@/lib/store';
import { selectQuest, TARGET_SUCCESS, idealDifficulty } from '@/lib/engine/difficulty';
import { MotivationState, Quest as SeededItem } from '@/lib/types';
import { HelpCircle, Sparkles, X, Volume2, Play, ArrowRight, Zap, Layers } from 'lucide-react';
import { LearnOrLoseArena } from '@/components/game/LearnOrLoseArena';

const SESSION_STORAGE_KEY = 'xpedition_active_quest_session';

interface SessionState {
  items: SeededItem[];
  currentIndex: number;
  attempts: Attempt[];
  initialFlowState: FlowState;
  conceptId?: string;
  totalLength: number;
  isSolo?: boolean;
}

function QuestContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const conceptParam = searchParams.get('concept');
  const lenParam = searchParams.get('len');
  const modeParam = searchParams.get('mode');
  const isSoloRequested = modeParam === 'solo';
  const isArenaRequested = modeParam === 'arena';

  const [session, setSession] = useState<SessionState | null>(null);
  const [isArenaMode, setIsArenaMode] = useState<boolean>(isArenaRequested);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [userConfidence, setUserConfidence] = useState<'known' | 'unsure' | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isExhausted, setIsExhausted] = useState<boolean>(false);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [showSoloPreScreen, setShowSoloPreScreen] = useState<boolean>(isSoloRequested);

  const isSoloMode = Boolean(session?.isSolo || (isSoloRequested && showSoloPreScreen));

  // Telemetry metrics
  const [hesitationSeconds, setHesitationSeconds] = useState<number>(0);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [hintCount, setHintCount] = useState<number>(0);
  const [tabSwitchCount, setTabSwitchCount] = useState<number>(0);
  const [showHint, setShowHint] = useState<boolean>(false);

  // Dynamic Learner State Metrics
  const [currentFlowState, setCurrentFlowState] = useState<FlowState>('flow');
  const [targetSuccessRate, setTargetSuccessRate] = useState<number>(78);
  const [abilityTheta, setAbilityTheta] = useState<number>(0.45);
  const [nextDifficultyB, setNextDifficultyB] = useState<number>(0.50);
  const [whySignals, setWhySignals] = useState<string[]>([
    'Balanced response latency',
    'Accuracy on recent items',
    'Adaptive challenge alignment',
  ]);

  // Ask XYRA Modal State in Quest
  const [isAskXyraOpen, setIsAskXyraOpen] = useState<boolean>(false);
  const [xyraResponse, setXyraResponse] = useState<string | null>(null);
  const [xyraLoading, setXyraLoading] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Track tab switches for behavioral telemetry
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => prev + 1);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Initialize or resume quest session with adaptive unseen item selection
  useEffect(() => {
    const store = getStoreData();
    const target = selectNextTarget(store);

    const targetConceptId = conceptParam || (target.inProgress ? target.conceptId : undefined);

    if (typeof window !== 'undefined' && !isSoloRequested) {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        try {
          const parsed: SessionState = JSON.parse(stored);
          if (parsed && parsed.items && parsed.items.length > 0 && parsed.currentIndex < parsed.totalLength) {
            if (!targetConceptId || parsed.conceptId === targetConceptId || parsed.items[0]?.conceptId === targetConceptId) {
              setSession(parsed);
              setCurrentFlowState(parsed.initialFlowState || 'flow');
              return;
            }
          }
        } catch (e) {
          localStorage.removeItem(SESSION_STORAGE_KEY);
        }
      }
    }

    let totalLen = isSoloRequested ? 6 : (target.totalLength || 6);
    if (lenParam && !isSoloRequested) {
      totalLen = parseInt(lenParam, 10) || 3;
    }

    const seenIds = new Set<string>();
    store.attempts?.forEach((att) => {
      if (att.itemHash) seenIds.add(att.itemHash);
    });

    const activeGraph = store.graphs?.find((g) => g.id === store.activeGraphId) || store.graphs?.[0];
    let pool: SeededItem[] = (activeGraph?.quests as SeededItem[]) || [];

    if (targetConceptId) {
      const filtered = pool.filter((q) => q.conceptId === targetConceptId);
      if (filtered.length > 0) pool = filtered;
    }

    const selectedItems: SeededItem[] = [];
    const poolCopy = [...pool];
    let currentTheta = activeGraph?.calibratedTheta ?? -0.4;
    let simMotivation: MotivationState = (store.flowState as MotivationState) || 'flow';

    for (let i = 0; i < totalLen; i++) {
      const { quest, ideal } = selectQuest(poolCopy, currentTheta, simMotivation, seenIds);
      if (quest) {
        selectedItems.push(quest);
        seenIds.add(quest.id);
        const idx = poolCopy.findIndex((q) => q.id === quest.id);
        if (idx >= 0) poolCopy.splice(idx, 1);
        currentTheta = ideal;
      } else {
        break;
      }
    }

    if (selectedItems.length === 0) {
      setIsExhausted(true);
      return;
    }

    const initialSession: SessionState = {
      items: selectedItems,
      currentIndex: 0,
      attempts: [],
      initialFlowState: store.flowState || 'flow',
      conceptId: targetConceptId || selectedItems[0]?.conceptId,
      totalLength: selectedItems.length,
      isSolo: isSoloRequested,
    };

    setSession(initialSession);
    setCurrentFlowState(initialSession.initialFlowState);

    if (!isSoloRequested) {
      saveActiveSession({
        conceptId: initialSession.conceptId || selectedItems[0]?.conceptId || 'c_1',
        conceptName: selectedItems[0]?.conceptName || 'Core Concept',
        currentIndex: 0,
        totalLength: selectedItems.length,
        completedItemIds: [],
        updatedAt: Date.now(),
      });
    }
  }, [conceptParam, lenParam, isSoloRequested]);

  // Live item hesitation timer
  useEffect(() => {
    if (isSubmitted || !session) return;
    timerRef.current = setInterval(() => {
      setHesitationSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSubmitted, session]);

  const handleRegeneratePool = async () => {
    setIsRegenerating(true);
    const store = getStoreData();
    const goal = store.goalText || 'Python Core';

    try {
      const res = await fetch('/api/goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, bypassCache: true }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.concepts) && Array.isArray(data.quests)) {
          const formattedConcepts = data.concepts.map((c: any) => ({
            id: c.id,
            name: c.name,
            masteryPercentage: 0,
            itemsNext: 3,
            retentionRisk: 0,
            ptsSinceCalibration: 0,
            baselineTheta: -0.4,
          }));

          setGraphContent(goal, formattedConcepts, data.quests, false);
          clearActiveSession();
          window.location.reload();
          return;
        }
      }
    } catch (err) {
      console.error('Failed to regenerate item bank:', err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleOptionSelect = (index: number) => {
    if (isSubmitted) return;
    if (selectedOption !== null && selectedOption !== index) {
      setRetryCount((prev) => prev + 1);
    }
    setSelectedOption(index);
  };

  const handleToggleHint = () => {
    if (session?.isSolo) return;
    if (!showHint) {
      setHintCount((prev) => prev + 1);
    }
    setShowHint(!showHint);
  };

  // ASK XYRA HANDLER IN QUEST
  const handleAskXyra = async (type: 'explain' | 'hint' | 'lost') => {
    const currentItem = session?.items[session.currentIndex];
    if (!currentItem) return;
    setXyraLoading(true);
    setXyraResponse(null);

    if (type === 'hint') {
      const hintMsg = currentItem.explanation
        ? `Hint: ${currentItem.explanation.split('.')[0]}. Consider what the question is asking step-by-step.`
        : `Focus on the core principle of ${currentItem.conceptName || 'this concept'} and eliminate contradictory options.`;
      setXyraResponse(hintMsg);
      setXyraLoading(false);
      setHintCount((prev) => prev + 1);
      return;
    }

    if (type === 'lost') {
      const lostMsg = `Don't worry! For "${currentItem.conceptName || 'this concept'}", think of the simplest everyday example. Look at the key terms in the prompt and match them with fundamentals.`;
      setXyraResponse(lostMsg);
      setXyraLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept: currentItem.conceptName || 'Core Concept',
          prompt: currentItem.prompt,
          chosen: selectedOption !== null ? currentItem.options[selectedOption] : '',
          correct: currentItem.options[currentItem.correctIndex ?? currentItem.answerIndex ?? 0],
          questId: currentItem.id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setXyraResponse(data.advice || currentItem.explanation || 'Focus on how the core mechanism operates under standard conditions.');
      } else {
        setXyraResponse(currentItem.explanation || 'Focus on the main principle being tested here.');
      }
    } catch (e) {
      setXyraResponse(currentItem.explanation || 'Review the core rules of this topic.');
    } finally {
      setXyraLoading(false);
    }
  };

  const handleSpeakXyra = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || isSubmitted || !session) return;

    const currentItem = session.items[session.currentIndex];
    const correctIdx = currentItem.correctIndex ?? currentItem.answerIndex ?? 0;
    const isCorrect = selectedOption === correctIdx;

    setIsSubmitted(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const itemHash = computeItemHash(currentItem.prompt, currentItem.options);
    const attempt: Attempt = {
      id: `att_${Date.now()}_${session.currentIndex}`,
      conceptId: currentItem.conceptId,
      conceptName: currentItem.conceptName || 'Core Concept',
      isCorrect,
      confidence: userConfidence || 'known',
      timestamp: Date.now(),
      isSolo: Boolean(session.isSolo),
      chosenIndex: selectedOption,
      chosenText: currentItem.options[selectedOption],
      correctIndex: correctIdx,
      itemHash,
    };

    const nextMotivation: MotivationState =
      !isCorrect && (hesitationSeconds > 10 || hintCount > 0 || retryCount > 0)
        ? 'frustrated'
        : isCorrect && hesitationSeconds < 4 && hintCount === 0 && retryCount === 0
          ? 'bored'
          : 'flow';

    const currentStoreData = getStoreData();
    const currentTheta = currentStoreData.calibratedTheta ?? -0.4;
    const target = TARGET_SUCCESS[nextMotivation] ?? 0.8;
    const idealDiff = idealDifficulty(currentTheta, target);

    setCurrentFlowState(nextMotivation);
    setTargetSuccessRate(Math.round(target * 100));
    setAbilityTheta(parseFloat(currentTheta.toFixed(2)));
    setNextDifficultyB(parseFloat(idealDiff.toFixed(2)));

    const newSignals = [];
    if (hesitationSeconds > 8) newSignals.push(`Hesitation noted (${hesitationSeconds}s)`);
    if (retryCount > 0) newSignals.push(`Option shifts detected (${retryCount}x)`);
    if (hintCount > 0) newSignals.push(`Scaffolding hints utilized`);
    if (newSignals.length === 0) newSignals.push('Optimal response pace & immediate recall');
    setWhySignals(newSignals);

    recordAttempt(attempt);

    const nextAttempts = [...session.attempts, attempt];
    const updatedSession = { ...session, attempts: nextAttempts };
    setSession(updatedSession);

    if (!session.isSolo && typeof window !== 'undefined') {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedSession));
    }
  };

  const handleNextItem = () => {
    if (!session) return;

    if (session.currentIndex + 1 >= session.totalLength) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
      const currentConceptName = session.items[session.currentIndex]?.conceptName || 'Core Concept';
      clearActiveSession(currentConceptName);

      const targetConcept = conceptParam || session.conceptId || session.items[0]?.conceptId;
      router.push(`/session-summary?concept=${encodeURIComponent(targetConcept || '')}&mode=${session.isSolo ? 'solo' : 'assisted'}`);
      return;
    }

    const nextIndex = session.currentIndex + 1;
    const nextItem = session.items[nextIndex];
    const nextSession: SessionState = {
      ...session,
      currentIndex: nextIndex,
    };

    setSession(nextSession);
    setSelectedOption(null);
    setUserConfidence(null);
    setIsSubmitted(false);
    setShowHint(false);
    setHesitationSeconds(0);

    if (!session.isSolo && nextItem) {
      saveActiveSession({
        conceptId: session.conceptId || nextItem.conceptId,
        conceptName: nextItem.conceptName || 'Core Concept',
        currentIndex: nextIndex,
        totalLength: session.totalLength,
        completedItemIds: nextSession.attempts.map((a) => a.id),
        updatedAt: Date.now(),
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession));
      }
    }
  };

  if (isExhausted) {
    return (
      <div className="min-h-[100dvh] bg-ink text-text flex items-center justify-center p-6 select-none font-sans">
        <div className="max-w-md w-full bg-panel border border-line rounded-[20px] p-8 text-center space-y-6 shadow-2xl">
          <div className="space-y-2">
            <span className="font-mono text-[10px] uppercase text-cyan font-bold tracking-eyebrow">
              CONCEPT POOL COMPLETED
            </span>
            <h1 className="font-sans font-bold text-xl text-text">Item Bank Exhausted</h1>
            <p className="font-sans text-xs text-muted leading-relaxed">
              You have completed all generated questions for this concept!
            </p>
          </div>
          <div className="space-y-3 pt-2">
            <button
              type="button"
              disabled={isRegenerating}
              onClick={handleRegeneratePool}
              className="w-full h-11 rounded-[12px] bg-signature-gradient text-white font-sans font-semibold text-xs flex items-center justify-center gap-2 hover:brightness-108 transition-all cursor-pointer disabled:opacity-50"
            >
              <span>{isRegenerating ? 'Generating fresh questions...' : 'Generate New Item Bank'}</span>
              <span>&rarr;</span>
            </button>
            <Link
              href="/home"
              className="w-full h-10 rounded-[12px] border border-line text-muted hover:text-text font-sans font-medium text-xs flex items-center justify-center transition-colors block text-center"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (showSoloPreScreen && isSoloRequested) {
    return (
      <div className="min-h-[100dvh] bg-ink text-text flex items-center justify-center p-6 select-none font-sans">
        <div className="max-w-md w-full bg-[#1A1430] border border-violet/40 rounded-[20px] p-8 text-center space-y-6 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-violet/20 border border-violet flex items-center justify-center text-violet-400 font-mono text-xl mx-auto">
            🛡️
          </div>
          <div className="space-y-2">
            <span className="font-mono text-[10px] uppercase text-violet font-bold tracking-eyebrow">
              OFFICIAL ASSESSMENT MODE
            </span>
            <h1 className="font-sans font-bold text-xl text-text">Solo Mode</h1>
            <p className="font-sans text-xs text-muted leading-relaxed">
              6 items without hints, mid-session feedback, or AI assistance.
            </p>
          </div>
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => setShowSoloPreScreen(false)}
              className="w-full h-11 rounded-[12px] bg-violet hover:bg-violet-hot text-white font-sans font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Begin Assessment</span>
              <span>&rarr;</span>
            </button>
            <Link
              href="/home"
              className="w-full h-10 rounded-[12px] border border-line text-muted hover:text-text font-sans font-medium text-xs flex items-center justify-center transition-colors block text-center"
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!session || !session.items[session.currentIndex]) {
    return (
      <div className="min-h-[100dvh] bg-ink text-text flex items-center justify-center p-4 font-mono text-sm text-cyan animate-pulse">
        Initializing adaptive quest...
      </div>
    );
  }

  const currentItem = session.items[session.currentIndex];
  const isLastItem = session.currentIndex + 1 >= session.totalLength;

  if (isArenaMode) {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-b from-[#0A071B] via-[#0F0B24] to-[#0A071B] text-text flex flex-col justify-between select-none relative font-sans">
        {/* Arena Top Navigation Header */}
        <header className="h-14 px-4 sm:px-6 bg-[#120E22]/90 backdrop-blur-xl border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Link href="/world" className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white">
              <span>&larr;</span>
              <span>Learning Base</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono font-bold">
              🔥 LEARN OR LOSE SURVIVOR
            </span>
            <button
              onClick={() => setIsArenaMode(false)}
              className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-mono"
            >
              Standard Mode
            </button>
          </div>
        </header>

        {/* Main Arena View */}
        <div className="flex-1 flex items-center justify-center p-3 sm:p-6">
          <LearnOrLoseArena
            questions={session.items}
            conceptTitle={currentItem?.conceptName || 'Sector Defense'}
            onExit={() => router.push('/world')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-ink text-text flex flex-col justify-between select-none relative font-sans">
      
      {/* Top Header Strip */}
      <header className="h-12 px-4 bg-ink border-b border-line flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/home" className="text-muted hover:text-text font-mono text-sm">
            &larr;
          </Link>
          <span className="font-mono text-xs text-muted">
            Question {session.currentIndex + 1} of {session.totalLength}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsArenaMode(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] text-[11px] font-mono font-bold hover:bg-[#00F0FF]/20 transition-all"
          >
            <Zap className="w-3 h-3" />
            <span>Arena Mode</span>
          </button>
          <span className="font-sans font-semibold text-xs text-text truncate max-w-[140px] sm:max-w-[200px]">
            {currentItem.conceptName}
          </span>
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-raised border border-line text-text">
            Diff (b): {currentItem.difficulty > 0 ? `+${currentItem.difficulty}` : currentItem.difficulty}
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 min-h-0 max-w-2xl w-full mx-auto px-3.5 sm:px-6 py-2.5 sm:py-4 flex flex-col justify-between overflow-hidden">
        
        {/* Dynamic Learner State HUD Strip */}
        {!session.isSolo && (
          <StateHud
            flowState={currentFlowState}
            hesitationSeconds={hesitationSeconds}
            retryCount={retryCount}
            hintCount={hintCount}
            tabSwitchCount={tabSwitchCount}
            abilityTheta={abilityTheta}
            nextDifficultyB={nextDifficultyB}
            targetSuccessRate={targetSuccessRate}
            whySignals={whySignals}
          />
        )}

        {/* Question Card */}
        <div className="bg-panel border border-line/60 rounded-[18px] p-4 sm:p-5 space-y-4 shadow-2xl my-auto">
          
          <div className="space-y-1.5">
            <span className="font-mono text-[10px] uppercase text-cyan font-bold tracking-eyebrow">
              {session.isSolo ? 'SOLO EVALUATION ITEM' : 'ADAPTIVE ITEM'}
            </span>
            <h1 className="font-sans font-bold text-sm sm:text-base text-text leading-snug">
              {currentItem.prompt}
            </h1>
          </div>

          {/* CONFIDENCE CHECK PRE-STEP (Only in Assisted Mode) */}
          {!session.isSolo && userConfidence === null ? (
            <div className="py-6 px-4 rounded-[14px] bg-raised/50 border border-line/80 text-center space-y-4 animate-fadeIn">
              <div className="text-center space-y-1">
                <span className="font-mono text-[10px] uppercase text-cyan font-bold tracking-eyebrow">
                  CONFIDENCE CHECK
                </span>
                <h2 className="font-sans font-semibold text-base sm:text-lg text-text">
                  Do you know this?
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto pt-0.5">
                <button
                  type="button"
                  onClick={() => setUserConfidence('known')}
                  className="h-[44px] px-3 rounded-[12px] bg-cyan/15 border border-cyan/50 hover:border-cyan text-cyan font-sans font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:bg-cyan/25 active:scale-98 shadow-[0_0_15px_rgba(0,229,255,0.2)]"
                >
                  <span>✓</span>
                  <span>I know this</span>
                </button>

                <button
                  type="button"
                  onClick={() => setUserConfidence('unsure')}
                  className="h-[44px] px-3 rounded-[12px] bg-raised border border-line hover:border-muted text-text font-sans font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:bg-raised/80 active:scale-98"
                >
                  <span>?</span>
                  <span>Not sure</span>
                </button>
              </div>
            </div>
          ) : (
            /* OPTIONS */
            <div className="space-y-2 sm:space-y-3 animate-fadeIn">
              {currentItem.options.map((optionText, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === (currentItem.correctIndex ?? currentItem.answerIndex ?? 0);

                let optionStyle = 'bg-[#1A1430]/85 border-white/[0.09] hover:border-cyan text-text';

                if (isSubmitted) {
                  if (session.isSolo) {
                    optionStyle = isSelected
                      ? 'bg-violet-600/30 border-violet text-text font-semibold'
                      : 'bg-[#1A1430]/40 border-transparent text-muted/50';
                  } else {
                    if (isCorrect) {
                      optionStyle = 'bg-success/15 border-success text-success font-semibold';
                    } else if (isSelected) {
                      optionStyle = 'bg-danger/15 border-danger text-danger font-semibold';
                    } else {
                      optionStyle = 'bg-[#1A1430]/40 border-transparent text-muted/50';
                    }
                  }
                } else if (isSelected) {
                  optionStyle = 'bg-raised border-cyan text-text shadow-[0_0_15px_rgba(0,229,255,0.2)]';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isSubmitted}
                    onClick={() => handleOptionSelect(idx)}
                    className={`w-full min-h-[46px] p-3 rounded-[12px] border text-left font-sans text-xs sm:text-sm flex items-center justify-between transition-all cursor-pointer ${optionStyle}`}
                  >
                    <div className="flex items-center gap-3 pr-2">
                      <span className="font-mono text-xs font-bold text-muted min-w-[20px]">
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      <span className="leading-snug">{optionText}</span>
                    </div>

                    {!session.isSolo && isSubmitted && isCorrect && (
                      <span className="w-5 h-5 rounded-full bg-success text-ink flex items-center justify-center font-bold text-xs shrink-0">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Explanation Banner */}
          {!session.isSolo && isSubmitted && (
            <div className="p-4 rounded-[12px] bg-panel border border-line space-y-1 animate-fadeIn">
              <span className="font-mono text-[10px] uppercase text-cyan font-bold tracking-eyebrow">
                EXPLANATION
              </span>
              <p className="font-sans text-xs text-muted leading-relaxed">
                {currentItem.explanation}
              </p>
            </div>
          )}

          {/* Scaffolding Hint */}
          {!session.isSolo && showHint && (
            <div className="p-3.5 rounded-[12px] bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-sans animate-fadeIn">
              💡 <strong>Hint:</strong> Focus on the primary metabolic output or key mechanism involved.
            </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-line/50">
            {!session.isSolo ? (
              <button
                type="button"
                onClick={handleToggleHint}
                className="font-mono text-xs text-muted hover:text-cyan transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>{showHint ? 'Hide Hint' : '💡 Hint'}</span>
              </button>
            ) : (
              <span className="font-mono text-[10px] uppercase text-violet-400 font-bold tracking-wider">
                🛡️ Solo (No Assistance)
              </span>
            )}

            {!isSubmitted ? (
              <button
                type="button"
                disabled={selectedOption === null}
                onClick={handleSubmitAnswer}
                className={`h-[46px] px-6 rounded-[12px] font-sans font-semibold text-xs transition-all cursor-pointer ${
                  selectedOption !== null
                    ? 'bg-signature-gradient text-white hover:brightness-108'
                    : 'bg-raised/60 text-muted border border-line/40 cursor-not-allowed'
                }`}
              >
                Submit Answer
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNextItem}
                className="h-[46px] px-6 rounded-[12px] bg-signature-gradient text-white font-sans font-semibold text-xs flex items-center gap-2 hover:brightness-108 transition-all cursor-pointer"
              >
                <span>{isLastItem ? 'Complete Quest' : 'Next Question'}</span>
                <span>&rarr;</span>
              </button>
            )}
          </div>

        </div>

      </main>

      {/* 3. ASK XYRA FLOATING BUTTON (Visible in Assisted Quest Mode) */}
      {!session.isSolo && (
        <div className="fixed bottom-5 right-5 z-40">
          <button
            type="button"
            onClick={() => setIsAskXyraOpen(true)}
            className="h-11 px-4 rounded-full bg-[#0D0D1A] border border-[#00F0FF]/50 hover:border-[#00F0FF] text-[#00F0FF] font-mono font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.35)] hover:scale-105 transition-all cursor-pointer group backdrop-blur-md"
          >
            <div className="w-6 h-6 rounded-full bg-[#00F0FF]/20 border border-[#00F0FF] flex items-center justify-center text-[10px] font-bold text-[#00F0FF] shadow-[0_0_8px_rgba(0,240,255,0.5)]">
              X
            </div>
            <span>Ask XYRA</span>
            <span className="w-2 h-2 rounded-full bg-[#00FF87] animate-pulse" />
          </button>
        </div>
      )}

      {/* ASK XYRA MODAL */}
      {isAskXyraOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0D0D1A] border border-[#00F0FF]/40 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#00F0FF]">
                <div className="w-5 h-5 rounded-full border border-[#00F0FF] bg-[#00F0FF]/20 text-[#00F0FF] font-mono font-bold text-[9px] flex items-center justify-center shrink-0">
                  X
                </div>
                <span>Ask XYRA</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAskXyraOpen(false);
                  setXyraResponse(null);
                }}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!xyraResponse ? (
              <div className="space-y-2 pt-1 font-sans text-xs">
                <button
                  type="button"
                  disabled={xyraLoading}
                  onClick={() => handleAskXyra('explain')}
                  className="w-full p-3 rounded-2xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] hover:bg-[#00F0FF]/20 font-semibold text-left transition-all cursor-pointer flex items-center justify-between"
                >
                  <span>&ldquo;Explain this&rdquo;</span>
                  <span className="font-mono text-xs">&rarr;</span>
                </button>

                <button
                  type="button"
                  disabled={xyraLoading}
                  onClick={() => handleAskXyra('hint')}
                  className="w-full p-3 rounded-2xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] hover:bg-[#00F0FF]/20 font-semibold text-left transition-all cursor-pointer flex items-center justify-between"
                >
                  <span>&ldquo;Give a hint&rdquo;</span>
                  <span className="font-mono text-xs">&rarr;</span>
                </button>

                <button
                  type="button"
                  disabled={xyraLoading}
                  onClick={() => handleAskXyra('lost')}
                  className="w-full p-3 rounded-2xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] hover:bg-[#00F0FF]/20 font-semibold text-left transition-all cursor-pointer flex items-center justify-between"
                >
                  <span>&ldquo;I&apos;m lost&rdquo;</span>
                  <span className="font-mono text-xs">&rarr;</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3 animate-fadeIn">
                <div className="p-3.5 rounded-2xl bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-slate-100 text-xs font-sans space-y-2">
                  <div className="flex items-center justify-between border-b border-[#00F0FF]/20 pb-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#00F0FF] font-bold">
                      <span>XYRA says:</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSpeakXyra(xyraResponse)}
                      className="text-[10px] font-mono text-[#00F0FF] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{isSpeaking ? 'Speaking...' : 'Read Aloud'}</span>
                    </button>
                  </div>
                  <p className="leading-relaxed font-medium">{xyraResponse}</p>
                </div>

                <div className="flex items-center justify-between pt-1 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => setXyraResponse(null)}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer text-[11px]"
                  >
                    &larr; Ask another question
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAskXyraOpen(false);
                      setXyraResponse(null);
                    }}
                    className="px-4 py-1.5 rounded-xl bg-[#00F0FF] text-black font-bold hover:brightness-110 cursor-pointer transition-all"
                  >
                    Got it
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default function QuestPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-ink text-text flex items-center justify-center p-4 font-mono text-sm text-muted animate-pulse">Loading quest environment...</div>}>
      <QuestContent />
    </Suspense>
  );
}
