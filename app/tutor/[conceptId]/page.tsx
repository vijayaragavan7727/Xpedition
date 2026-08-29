'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { getStoreData, saveStoreData, recordAttempt, computeItemHash, UserStoreData } from '@/lib/store';
import { BoardVisual, VisualSpec } from '@/components/BoardVisual';
import { downloadNotesPdf, downloadFlashcardsPdf } from '@/lib/pdf';
import { Volume2, VolumeX, HelpCircle, FileText, X, Check, ArrowLeft, ArrowRight, Play, Sparkles } from 'lucide-react';

interface LessonChunk {
  say: string;
  code?: string;
  visual?: VisualSpec;
}

interface LessonCheckpoint {
  ask: string;
  options: string[];
  answerIndex: number;
  why: string;
}

interface LessonData {
  chunks: LessonChunk[];
  checkpoint: LessonCheckpoint;
}

export type TutorState = 'idle' | 'talking' | 'thinking' | 'happy';

function TutorContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const conceptId = (params?.conceptId as string) || 'c_1';
  const queryParam = searchParams?.get('q') || '';

  const [storeData, setStoreData] = useState<UserStoreData | null>(null);
  const [conceptName, setConceptName] = useState<string>('Core Concept');
  const [conceptSummary, setConceptSummary] = useState<string>('');
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Lesson Progression State
  const [currentChunkIndex, setCurrentChunkIndex] = useState<number>(0);
  const [revealedWordCount, setRevealedWordCount] = useState<number>(0);
  const [isChunkComplete, setIsChunkComplete] = useState<boolean>(false);
  const [showCheckpoint, setShowCheckpoint] = useState<boolean>(false);
  const [tutorState, setTutorState] = useState<TutorState>('idle');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Checkpoint State
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // Classroom UI State
  const [accumulatedNotes, setAccumulatedNotes] = useState<string[]>([]);
  const [isTopicsExpanded, setIsTopicsExpanded] = useState<boolean>(false);
  const [showRaiseHandNotice, setShowRaiseHandNotice] = useState<string | null>(null);
  const [robotImgPath, setRobotImgPath] = useState<string>('/robot.png');

  // Modals for Ask XYRA & My Notes
  const [isAskXyraOpen, setIsAskXyraOpen] = useState<boolean>(false);
  const [isNotesOpen, setIsNotesOpen] = useState<boolean>(false);
  const [userNotes, setUserNotes] = useState<string>('');

  // Timers, Audio Ref & Cache
  const wordTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const raiseHandCacheRef = useRef<Map<string, string>>(new Map());

  const isQuickLearnMode = conceptId === 'quick' || Boolean(queryParam);

  const stopSpeech = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  // Load saved notes locally per session
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`xyra_notes_${conceptId}`);
      if (saved) {
        setUserNotes(saved);
      }
    }
  }, [conceptId]);

  const handleSaveNotes = (text: string) => {
    setUserNotes(text);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`xyra_notes_${conceptId}`, text);
    }
  };

  useEffect(() => {
    const store = getStoreData();
    setStoreData(store);

    const activeGraph = store?.graphs?.find((g) => g.id === store.activeGraphId) || store?.graphs?.[0];
    const concept = activeGraph?.concepts?.find((c) => c.id === conceptId);

    if (activeGraph?.learnerProfile?.voiceMuted !== undefined) {
      setIsMuted(activeGraph.learnerProfile.voiceMuted);
    } else if (store?.learnerProfile?.voiceMuted !== undefined) {
      setIsMuted(store.learnerProfile.voiceMuted);
    }

    const cName = queryParam || concept?.name || store?.goalText || 'Core Concept';
    const cSummary = (concept as any)?.summary || '';
    const lang = activeGraph?.learnerProfile?.language || store?.learnerProfile?.language || 'english';
    const level = activeGraph?.learnerProfile?.startingLevel || store?.learnerProfile?.startingLevel || 'Complete beginner';
    const mastery = concept?.masteryPercentage || 0;

    setConceptName(cName);
    setConceptSummary(cSummary);

    const fetchLesson = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/lesson', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conceptId,
            conceptName: cName,
            conceptSummary: cSummary,
            language: lang,
            startingLevel: level,
            masteryPercentage: mastery,
            isQuickLearn: isQuickLearnMode,
          }),
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data: LessonData = await res.json();

        if (!data || !Array.isArray(data.chunks) || data.chunks.length === 0) {
          throw new Error('Invalid lesson data payload');
        }

        setLesson(data);
        setLoading(false);
      } catch (err: any) {
        console.error('Failed to load lesson chunks:', err);
        setError(err.message || 'Failed to load lesson content.');
        setLoading(false);
      }
    };

    fetchLesson();

    return () => {
      stopSpeech();
      if (wordTimerRef.current) clearInterval(wordTimerRef.current);
    };
  }, [conceptId, queryParam, isQuickLearnMode]);

  // Speech & Word Reveal Engine
  const currentChunk = lesson?.chunks?.[currentChunkIndex];
  const words = currentChunk?.say ? currentChunk.say.trim().split(/\s+/) : [];

  useEffect(() => {
    if (!lesson || !currentChunk || showCheckpoint) return;

    if (wordTimerRef.current) clearInterval(wordTimerRef.current);

    setRevealedWordCount(1);
    setIsChunkComplete(false);
    setTutorState('talking');

    const totalWords = words.length;
    const intervalMs = Math.max(160, Math.min(320, 240));

    wordTimerRef.current = setInterval(() => {
      setRevealedWordCount((prev) => {
        if (prev >= totalWords) {
          if (wordTimerRef.current) clearInterval(wordTimerRef.current);
          setIsChunkComplete(true);
          setTutorState('idle');
          return totalWords;
        }
        return prev + 1;
      });
    }, intervalMs);

    if (!isMuted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentChunk.say);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }

    return () => {
      if (wordTimerRef.current) clearInterval(wordTimerRef.current);
    };
  }, [currentChunkIndex, lesson, showCheckpoint, isMuted]);

  const revealedText = words.slice(0, revealedWordCount).join(' ');

  useEffect(() => {
    if (isChunkComplete && lesson?.chunks?.[currentChunkIndex]) {
      const chunkText = lesson.chunks[currentChunkIndex].say;
      setAccumulatedNotes((prev) => {
        if (!prev.includes(chunkText)) {
          return [...prev, chunkText];
        }
        return prev;
      });
    }
  }, [isChunkComplete, currentChunkIndex, lesson]);

  const handleNextChunk = () => {
    if (!lesson?.chunks) return;
    if (currentChunkIndex + 1 < lesson.chunks.length) {
      setCurrentChunkIndex((prev) => prev + 1);
    } else {
      setShowCheckpoint(true);
      setTutorState('thinking');
    }
  };

  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (nextMute) stopSpeech();

    const current = getStoreData();
    if (current.graphs) {
      current.graphs.forEach((g) => {
        if (g.learnerProfile) {
          g.learnerProfile.voiceMuted = nextMute;
        }
      });
    }
    if (current.learnerProfile) {
      current.learnerProfile.voiceMuted = nextMute;
    }
    saveStoreData(current);
  };

  const handleExit = () => {
    stopSpeech();
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('xpedition_exit_override', 'true');
    }
    router.push('/home');
  };

  // ASK XYRA HANDLER (3 fixed options with XYRA's name)
  const handleAskXyraOption = async (option: 'say_again' | 'another_example' | 'im_lost') => {
    setIsAskXyraOpen(false);
    stopSpeech();

    if (option === 'say_again') {
      setShowRaiseHandNotice('Replaying current topic for you...');
      setRevealedWordCount(0);
      setIsChunkComplete(false);
      setTutorState('talking');
      setTimeout(() => setShowRaiseHandNotice(null), 1800);
      return;
    }

    const cacheKey = `${option}_${currentChunkIndex}_${conceptId}`;
    if (raiseHandCacheRef.current.has(cacheKey)) {
      const cached = raiseHandCacheRef.current.get(cacheKey)!;
      setShowRaiseHandNotice(cached);
      setTutorState(option === 'another_example' ? 'talking' : 'thinking');
      return;
    }

    try {
      setIsAiLoading(true);
      setShowRaiseHandNotice(option === 'another_example' ? 'XYRA is creating another example...' : 'XYRA is breaking this down simply...');
      setTutorState('thinking');

      const fallbackMsg = option === 'another_example'
        ? `XYRA's Example for ${conceptName}: Imagine a step-by-step conveyor belt where output from stage A directly feeds stage B.`
        : `XYRA's Summary: Core focus is how ${conceptName} processes inputs in real production systems.`;

      raiseHandCacheRef.current.set(cacheKey, fallbackMsg);
      setShowRaiseHandNotice(fallbackMsg);
      setTutorState('talking');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleOptionSelect = (idx: number) => {
    if (isSubmitted) return;
    setSelectedOption(idx);
  };

  const handleSubmitCheckpoint = () => {
    if (selectedOption === null || !lesson?.checkpoint || isSubmitted) return;

    const correct = selectedOption === lesson.checkpoint.answerIndex;
    setIsSubmitted(true);
    setIsCorrect(correct);
    setTutorState(correct ? 'happy' : 'thinking');

    const itemHash = computeItemHash(lesson.checkpoint.ask, lesson.checkpoint.options);
    recordAttempt({
      id: `chk_${conceptId}_${Date.now()}`,
      itemHash,
      conceptId,
      conceptName,
      chosenIndex: selectedOption,
      isCorrect: correct,
      confidence: 'known',
      timestamp: Date.now(),
      isSolo: false,
    });
  };

  const handleProceedToQuest = () => {
    stopSpeech();
    router.push(`/quest?concept=${encodeURIComponent(conceptId)}`);
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-[#0A0A1A] text-slate-100 flex items-center justify-center p-4 font-mono text-sm text-[#00F0FF] animate-pulse">
        Connecting to XYRA Classroom for &quot;{conceptName}&quot;...
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="h-screen w-full bg-[#0A0A1A] text-slate-100 flex items-center justify-center p-6 text-center select-none">
        <div className="max-w-md w-full bg-[#0D0D1A] border border-[#00F0FF]/30 rounded-[24px] p-8 space-y-6 shadow-2xl">
          <div className="space-y-2">
            <span className="font-mono text-[10px] uppercase text-[#00F0FF] font-bold tracking-widest">
              XYRA CLASSROOM NOTICE
            </span>
            <h1 className="font-sans font-bold text-xl text-white">{conceptName}</h1>
            <p className="font-sans text-xs text-slate-400 leading-relaxed">
              {error || 'Unable to connect to XYRA tutor endpoint.'}
            </p>
          </div>

          <div className="pt-2 space-y-2">
            <button
              type="button"
              onClick={handleProceedToQuest}
              className="w-full h-11 rounded-[14px] bg-[#00F0FF] text-black font-mono font-bold text-xs flex items-center justify-center gap-2 hover:brightness-110 transition-all cursor-pointer shadow-lg"
            >
              <span>Skip directly to Quest Questions</span>
              <span>&rarr;</span>
            </button>

            <button
              type="button"
              onClick={handleExit}
              className="w-full h-10 rounded-[14px] border border-white/10 text-slate-400 hover:text-white font-sans font-medium text-xs flex items-center justify-center transition-all cursor-pointer"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full overflow-hidden bg-[#0A0A1A] text-slate-100 select-none flex flex-col justify-between relative font-sans">
      
      {/* 6. HEADER (Section 6) */}
      <header className="h-12 px-4 bg-[#0D0D1A] border-b border-white/10 flex items-center justify-between shrink-0 relative z-30 font-sans">
        {/* Left: ← Exit */}
        <button
          type="button"
          onClick={handleExit}
          className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs font-semibold"
          aria-label="Exit classroom"
        >
          <span className="text-base font-bold">&larr;</span>
          <span>Exit</span>
        </button>

        {/* Center: concept name */}
        <span className="font-sans font-bold text-xs sm:text-sm text-white truncate max-w-[200px] sm:max-w-[340px] text-center">
          {conceptName}
        </span>

        {/* Right: XYRA 🟢 */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] text-xs font-mono font-bold shadow-[0_0_10px_rgba(0,240,255,0.2)]">
          <span>XYRA</span>
          <span className="w-2 h-2 rounded-full bg-[#00FF87] animate-pulse" />
        </div>
      </header>

      {/* MAIN CLASSROOM CONTENT */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 py-2 flex flex-col justify-between space-y-2">
        
        {/* Notice Banner */}
        {showRaiseHandNotice && (
          <div className="p-2.5 rounded-2xl bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] font-sans text-xs flex items-center justify-between animate-fadeIn shrink-0 shadow-lg">
            <span className="font-medium">✨ {showRaiseHandNotice}</span>
            <button type="button" onClick={() => setShowRaiseHandNotice(null)} className="text-cyan-400 text-xs font-mono cursor-pointer hover:text-white">✕</button>
          </div>
        )}

        {!showCheckpoint ? (
          <div className="flex flex-col space-y-2 flex-1 min-h-0">
            
            {/* 2. CLASSROOM FEEL — THE BOARD (Section 2) */}
            <div
              className="relative w-full h-[52vh] border-4 border-[#3D2918] rounded-[20px] shadow-2xl overflow-hidden shrink-0 bg-[#1A2B24]"
              style={{
                backgroundImage: 'url(/blackboard.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {/* Dark Overlay & Chalk Dust Radial Effect */}
              <div className="absolute inset-0 bg-black/25 pointer-events-none z-0" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_35%,rgba(255,255,255,0.07),transparent_65%)] pointer-events-none z-10" />

              {/* Chalk Header: XYRA's Classroom */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 font-chalk text-xs sm:text-sm text-[#EDEAE0]/40 tracking-widest uppercase select-none">
                XYRA&apos;s Classroom
              </div>

              {/* Session / Concept Indicator Bottom-Right */}
              <div className="absolute bottom-5 right-3 z-20 font-chalk text-[11px] sm:text-xs text-[#EDEAE0]/45 select-none tracking-wide">
                Session 1 &middot; Concept {currentChunkIndex + 1} of {lesson.chunks.length}
              </div>

              {/* 3. XYRA SPEAKS — SPEECH BUBBLE REDESIGN (Section 3) */}
              <div className="speech-bubble absolute top-3 left-3 z-30 w-[44%] max-w-[44%] max-h-[38%] overflow-y-auto bg-[#0D1117]/95 border border-[#00F0FF]/40 text-[#E6E8EC] p-2.5 sm:p-3 rounded-[16px] shadow-xl text-[12px] sm:text-xs backdrop-blur-md animate-fadeIn">
                {/* Pointer tail pointing down to robot head */}
                <div
                  className="absolute -bottom-2 left-6 w-0 h-0 border-t-[8px] border-t-[#0D1117] border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent pointer-events-none z-30"
                  aria-hidden="true"
                />
                <div
                  className="absolute -bottom-[9px] left-[23px] w-0 h-0 border-t-[8px] border-t-[#00F0FF]/40 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent pointer-events-none z-20"
                  aria-hidden="true"
                />

                <div className="space-y-1.5">
                  {/* Avatar Circle & XYRA says: Label */}
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#00F0FF] font-bold tracking-wide border-b border-[#00F0FF]/20 pb-1">
                    <div className="w-4 h-4 rounded-full border border-[#00F0FF] bg-[#00F0FF]/15 text-[#00F0FF] font-mono font-bold text-[9px] flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(0,240,255,0.4)]">
                      X
                    </div>
                    <span>XYRA says:</span>
                  </div>

                  <p className="font-sans font-medium text-xs sm:text-[13px] text-slate-100 leading-snug">
                    {revealedText || <span className="font-mono text-cyan-400/60 animate-pulse">Thinking...</span>}
                    {!isChunkComplete && revealedText && <span className="inline-block w-1.5 h-3 ml-1 bg-[#00F0FF] animate-pulse" />}
                  </p>

                  <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>{currentChunkIndex + 1}/{lesson.chunks.length}</span>
                    {isChunkComplete && (
                      <button
                        type="button"
                        onClick={handleNextChunk}
                        className="ml-auto px-2.5 py-0.5 rounded-lg bg-[#00F0FF] hover:bg-[#00C2FF] text-black font-sans font-bold text-[10px] cursor-pointer shadow transition-all"
                      >
                        Next &rarr;
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* BOARD TEXT (chalk font Caveat) */}
              <div className="board-text absolute top-8 right-3 left-[47%] bottom-6 overflow-y-auto font-chalk text-[#EDEAE0] text-sm sm:text-base leading-relaxed space-y-2 pr-1 z-10">
                <div className="pb-1 mb-2 border-b-2 border-dashed border-[#EDEAE0]/30">
                  <h2 className="text-lg sm:text-2xl font-bold text-white font-chalk tracking-wide drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                    {conceptName}
                  </h2>
                </div>

                {/* Visual Spec if present */}
                {currentChunk?.visual && (
                  <BoardVisual visual={currentChunk.visual} />
                )}

                {/* Accumulated Notes */}
                {accumulatedNotes.length > 0 && (
                  <div className="space-y-1.5">
                    {accumulatedNotes.map((pt, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-[#EDEAE0]/85">
                        <span className="text-amber-300 font-mono text-xs mt-0.5 select-none">✎</span>
                        <p className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] font-chalk">{pt}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Current writing chunk */}
                {revealedText && (
                  <div className="flex items-start gap-1.5 text-white font-semibold animate-fadeIn">
                    <span className="text-cyan-300 font-mono text-xs mt-0.5 select-none animate-pulse">✏</span>
                    <p className="drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] font-chalk">{revealedText}</p>
                  </div>
                )}
              </div>

              {/* WOODEN LEDGE AT BOTTOM — Chalk Stubs & Eraser */}
              <div className="chalk-ledge absolute bottom-0 left-0 right-0 h-4.5 bg-[#8B6340] border-t border-[#5C3A21] flex items-center justify-end px-4 gap-2 z-10 shadow-inner font-sans">
                <span className="w-6 h-2.5 bg-[#4A3728] border border-[#2D1F16] rounded-xs shadow" title="Board Eraser" />
                <span className="w-4 h-1.5 bg-[#EDEAE0] rounded-sm transform -rotate-6 opacity-90" title="White chalk stub" />
                <span className="w-3.5 h-1.5 bg-[#FDD835] rounded-sm transform rotate-12 opacity-90" title="Yellow chalk stub" />
                <span className="w-5 h-1.5 bg-[#00E5FF] rounded-sm transform -rotate-3 opacity-90" title="Cyan chalk stub" />
              </div>

              {/* 1. XYRA ROBOT CHARACTER & NAME LABEL (Section 1) */}
              <div className="absolute bottom-1.5 left-2 z-20 flex flex-col items-center select-none">
                <img
                  src={robotImgPath}
                  onError={() => {
                    if (robotImgPath === '/robot.png') {
                      setRobotImgPath('/images/robot.png');
                    }
                  }}
                  alt="XYRA — Your AI Teacher"
                  className={`robot-image h-[38vh] sm:h-[44vh] max-h-[220px] object-contain object-bottom transition-all duration-300 state-${tutorState}`}
                />
                <div className="bg-[#0B0E14]/90 border border-[#00F0FF]/40 backdrop-blur-md px-2.5 py-0.5 rounded-lg shadow-lg flex flex-col items-center -mt-2 z-30 pointer-events-auto">
                  <span className={`font-mono text-[11px] font-bold text-[#00F0FF] tracking-widest ${tutorState === 'talking' ? 'animate-pulse' : ''}`}>
                    XYRA
                  </span>
                  <span className="font-sans text-[9px] text-slate-400 font-medium tracking-tight">
                    Your AI Teacher
                  </span>
                </div>
              </div>
            </div>

            {/* 4. TODAY'S TOPICS -> XYRA'S LESSON PLAN (Section 4) */}
            <div className="bg-[#0D0D1A] border border-white/10 rounded-[14px] p-2.5 sm:p-3 space-y-1.5 shrink-0 shadow-md">
              <button
                type="button"
                onClick={() => setIsTopicsExpanded(!isTopicsExpanded)}
                className="w-full flex items-center justify-between text-xs font-mono font-bold text-slate-200 hover:text-white cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[#00F0FF]">📋</span>
                  <span>XYRA&apos;s Lesson Plan</span>
                  <span className="text-[10px] text-cyan-400/80 font-normal">
                    ({currentChunkIndex} of {lesson.chunks.length} complete)
                  </span>
                </div>
                <span className="text-slate-400 text-[11px]">{isTopicsExpanded ? '▲ Hide' : '▼ Show'}</span>
              </button>

              <div className={`${isTopicsExpanded ? 'block' : 'hidden sm:block'} space-y-1.5 pt-1.5 border-t border-white/10 animate-fadeIn`}>
                {lesson.chunks.map((chk, idx) => {
                  const isDone = idx < currentChunkIndex;
                  const isCurrent = idx === currentChunkIndex;

                  return (
                    <div
                      key={idx}
                      className={`flex items-center justify-between py-1.5 px-2.5 rounded-xl text-xs font-sans transition-all ${
                        isCurrent
                          ? 'text-[#00F0FF] font-bold bg-[#00F0FF]/10 border border-[#00F0FF]/30 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                          : isDone
                            ? 'text-slate-300'
                            : 'text-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono text-xs">
                          {isDone ? <span className="text-[#00FF87] font-bold">✓</span> : isCurrent ? <span className="text-[#00F0FF] font-bold">●</span> : <span className="text-slate-600">○</span>}
                        </span>
                        <span className="truncate text-[11px]">
                          Topic {idx + 1}: {chk.say.substring(0, 34)}...
                        </span>
                      </div>

                      {isCurrent && (
                        <span className="text-[#00F0FF] font-mono font-bold text-xs shrink-0">&rarr;</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        ) : (
          /* CHECKPOINT SCREEN & CREDENTIALS */
          <div className="bg-[#0D0D1A] border border-[#00F0FF]/30 rounded-[20px] p-5 space-y-4 shadow-2xl my-auto animate-fadeIn">
            <div className="flex items-center gap-3">
              <img
                src={robotImgPath}
                alt="XYRA teacher"
                className={`h-14 w-auto object-contain state-${tutorState}`}
              />
              <div>
                <span className="font-mono text-[9px] uppercase text-[#00F0FF] font-bold block tracking-wider">
                  XYRA CLASSROOM CHECKPOINT
                </span>
                <h2 className="font-sans font-semibold text-xs sm:text-sm text-white leading-snug">
                  {lesson.checkpoint.ask}
                </h2>
              </div>
            </div>

            <div className="space-y-2">
              {lesson.checkpoint.options.map((optionText, idx) => {
                const isSelected = selectedOption === idx;
                const isAnswerIdx = idx === lesson.checkpoint.answerIndex;

                let optionStyle = 'bg-[#151924] border-white/10 hover:border-[#00F0FF]/60 text-white';

                if (isSubmitted) {
                  if (isAnswerIdx) {
                    optionStyle = 'bg-[#00FF87]/20 border-[#00FF87] text-[#00FF87] font-semibold';
                  } else if (isSelected) {
                    optionStyle = 'bg-[#FF0055]/20 border-[#FF0055] text-[#FF7185] font-semibold';
                  } else {
                    optionStyle = 'bg-black/30 border-transparent text-slate-500';
                  }
                } else if (isSelected) {
                  optionStyle = 'bg-[#00F0FF]/20 border-[#00F0FF] text-white shadow-lg';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isSubmitted}
                    onClick={() => handleOptionSelect(idx)}
                    className={`w-full min-h-[44px] p-3 rounded-2xl border text-left font-sans text-xs flex items-center justify-between transition-all cursor-pointer ${optionStyle}`}
                  >
                    <div className="flex items-center gap-2.5 pr-2">
                      <span className="font-mono text-xs font-bold text-[#00F0FF] min-w-[16px]">
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      <span className="leading-snug">{optionText}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {isSubmitted && (
              <div className="space-y-3 animate-fadeIn">
                <div className={`p-3.5 rounded-2xl border ${isCorrect ? 'bg-[#00FF87]/15 border-[#00FF87]/40 text-[#00FF87]' : 'bg-[#FF0055]/15 border-[#FF0055]/40 text-[#FF7185]'}`}>
                  <span className="font-mono text-xs font-bold block mb-1">
                    {isCorrect ? '✓ Excellent work!' : '✕ Let\'s review this together.'}
                  </span>
                  <p className="font-sans text-xs leading-relaxed">
                    {lesson.checkpoint.why}
                  </p>
                </div>

                {/* PDF DOWNLOAD BUTTONS */}
                <div className="pt-2 border-t border-white/10 space-y-2">
                  <span className="font-mono text-[9px] uppercase text-[#00F0FF] font-bold block tracking-wider">
                    DOWNLOAD LESSON CREDENTIALS
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => downloadNotesPdf({ conceptName, chunks: lesson.chunks })}
                      className="h-9 px-3 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/40 text-[#00F0FF] font-mono font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-[#00F0FF]/20 cursor-pointer transition-all"
                    >
                      <span>📄 Notes PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadFlashcardsPdf({ conceptName, chunks: lesson.chunks })}
                      className="h-9 px-3 rounded-xl bg-[#A855F7]/10 border border-[#A855F7]/40 text-[#A855F7] font-mono font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-[#A855F7]/20 cursor-pointer transition-all"
                    >
                      <span>🃏 Flashcards</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  {!isCorrect && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowCheckpoint(false);
                        setCurrentChunkIndex(0);
                        setSelectedOption(null);
                        setIsSubmitted(false);
                        setIsCorrect(null);
                      }}
                      className="h-[38px] px-3 rounded-xl bg-black/40 border border-white/20 text-xs font-sans text-white hover:border-[#00F0FF] cursor-pointer transition-all"
                    >
                      &larr; Revisit Lesson
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleProceedToQuest}
                    className="h-[38px] px-4 rounded-xl bg-[#00F0FF] hover:bg-[#00C2FF] text-black font-mono font-bold text-xs flex items-center gap-1.5 ml-auto shadow-lg cursor-pointer transition-all"
                  >
                    <span>Start Quest Questions</span>
                    <span>&rarr;</span>
                  </button>
                </div>
              </div>
            )}

            {!isSubmitted && (
              <div className="pt-1 flex justify-end">
                <button
                  type="button"
                  disabled={selectedOption === null}
                  onClick={handleSubmitCheckpoint}
                  className={`h-[40px] px-5 rounded-2xl font-mono font-bold text-xs transition-all cursor-pointer ${
                    selectedOption !== null
                      ? 'bg-[#00F0FF] hover:bg-[#00C2FF] text-black shadow-lg'
                      : 'bg-black/40 text-slate-500 border border-white/10 cursor-not-allowed'
                  }`}
                >
                  Verify Checkpoint
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* 5. BOTTOM BAR — CLASSROOM CONTROLS (Section 5) */}
      <footer className="h-16 px-4 bg-[#0D0D1A] border-t border-white/10 flex items-center justify-around shrink-0 relative z-30 font-sans">
        
        {/* 1. Volume (Mute / Unmute) */}
        <button
          type="button"
          onClick={handleToggleMute}
          className="flex flex-col items-center justify-center gap-0.5 cursor-pointer group min-w-[64px]"
        >
          <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
            isMuted ? 'bg-white/5 text-slate-500 border border-white/10' : 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
          }`}>
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </div>
          <span className="font-mono text-[10px] text-slate-300 font-bold">
            Volume
          </span>
        </button>

        {/* 2. Ask XYRA (Opens popup with 3 fixed options) */}
        <button
          type="button"
          onClick={() => setIsAskXyraOpen(true)}
          className="flex flex-col items-center justify-center gap-0.5 cursor-pointer group min-w-[64px]"
        >
          <div className="w-9 h-9 rounded-full bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] group-hover:bg-[#00F0FF]/25 flex items-center justify-center transition-all shadow-[0_0_12px_rgba(0,240,255,0.3)]">
            <HelpCircle className="w-4 h-4" />
          </div>
          <span className="font-mono text-[10px] text-[#00F0FF] font-bold">
            Ask XYRA
          </span>
        </button>

        {/* 3. My Notes (Opens modal for session notes) */}
        <button
          type="button"
          onClick={() => setIsNotesOpen(true)}
          className="flex flex-col items-center justify-center gap-0.5 cursor-pointer group min-w-[64px]"
        >
          <div className="w-9 h-9 rounded-full bg-white/10 border border-white/15 text-slate-200 group-hover:bg-white/20 flex items-center justify-center transition-all">
            <FileText className="w-4 h-4" />
          </div>
          <span className="font-mono text-[10px] text-slate-300 font-bold">
            My Notes
          </span>
        </button>

      </footer>

      {/* MODAL: ASK XYRA OPTIONS */}
      {isAskXyraOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0D0D1A] border border-[#00F0FF]/40 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#00F0FF]">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Ask XYRA</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAskXyraOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 pt-1 font-sans text-xs">
              <button
                type="button"
                onClick={() => handleAskXyraOption('say_again')}
                className="w-full p-3 rounded-2xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] hover:bg-[#00F0FF]/20 font-semibold text-left transition-all cursor-pointer flex items-center justify-between"
              >
                <span>&ldquo;Say that again, XYRA&rdquo;</span>
                <span className="font-mono text-xs">&rarr;</span>
              </button>

              <button
                type="button"
                onClick={() => handleAskXyraOption('another_example')}
                className="w-full p-3 rounded-2xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] hover:bg-[#00F0FF]/20 font-semibold text-left transition-all cursor-pointer flex items-center justify-between"
              >
                <span>&ldquo;Give me another example&rdquo;</span>
                <span className="font-mono text-xs">&rarr;</span>
              </button>

              <button
                type="button"
                onClick={() => handleAskXyraOption('im_lost')}
                className="w-full p-3 rounded-2xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] hover:bg-[#00F0FF]/20 font-semibold text-left transition-all cursor-pointer flex items-center justify-between"
              >
                <span>&ldquo;I&apos;m lost, XYRA&rdquo;</span>
                <span className="font-mono text-xs">&rarr;</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MY NOTES */}
      {isNotesOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0D0D1A] border border-white/15 rounded-3xl p-5 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-white">
                <FileText className="w-4 h-4 text-[#00F0FF]" />
                <span>My Notes — {conceptName}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsNotesOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 font-sans text-xs">
              <textarea
                rows={6}
                value={userNotes}
                onChange={(e) => handleSaveNotes(e.target.value)}
                placeholder="Type your personal classroom study notes here... Auto-saved locally per session."
                className="w-full bg-[#05050D] border border-white/15 rounded-2xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00F0FF] leading-relaxed resize-none"
              />

              {accumulatedNotes.length > 0 && (
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <span className="font-mono text-[10px] text-[#00F0FF] uppercase font-bold block">
                    Key Lesson Chunks ({accumulatedNotes.length})
                  </span>
                  <div className="max-h-24 overflow-y-auto space-y-1 pr-1 font-chalk text-[13px] text-[#EDEAE0]">
                    {accumulatedNotes.map((n, i) => (
                      <p key={i}>&bull; {n}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-1 font-mono text-xs">
              <button
                type="button"
                onClick={() => setIsNotesOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#00F0FF] text-black font-bold hover:brightness-110 cursor-pointer transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function TutorPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-full bg-[#0A0A1A] text-slate-100 flex items-center justify-center p-4 font-mono text-sm text-[#00F0FF] animate-pulse">
          Connecting to XYRA Classroom...
        </div>
      }
    >
      <TutorContent />
    </Suspense>
  );
}
