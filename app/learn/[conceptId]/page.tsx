'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { getStoreData, saveStoreData, recordAttempt, computeItemHash, UserStoreData } from '@/lib/store';
import { downloadNotesPdf, downloadFlashcardsPdf } from '@/lib/pdf';

interface LessonChunk {
  say: string;
  code?: string;
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

export default function LearnPage() {
  const router = useRouter();
  const params = useParams();
  const conceptId = (params?.conceptId as string) || 'c_1';

  const [storeData, setStoreData] = useState<UserStoreData | null>(null);
  const [conceptName, setConceptName] = useState<string>('Core Concept');
  const [conceptSummary, setConceptSummary] = useState<string>('');
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Lesson Progression State
  const [currentChunkIndex, setCurrentChunkIndex] = useState<number>(0);
  const [showCheckpoint, setShowCheckpoint] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  useEffect(() => {
    const store = getStoreData();
    setStoreData(store);

    const activeGraph = store.graphs?.find((g) => g.id === store.activeGraphId) || store.graphs?.[0];
    const concept = activeGraph?.concepts?.find((c) => c.id === conceptId);

    const cName = concept?.name || store.goalText || 'Core Concept';
    const cSummary = (concept as any)?.summary || '';
    const lang = activeGraph?.learnerProfile?.language || store.learnerProfile?.language || 'english';
    const level = activeGraph?.learnerProfile?.startingLevel || store.learnerProfile?.startingLevel || 'Complete beginner';
    const mastery = concept?.masteryPercentage || 0;

    setConceptName(cName);
    setConceptSummary(cSummary);

    // Fetch interactive lesson content from API
    async function fetchLesson() {
      setLoading(true);
      try {
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
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.chunks) && data.chunks.length > 0) {
            setLesson(data);
          } else {
            setError('Could not format lesson structure.');
          }
        } else {
          setError('Lesson service unavailable.');
        }
      } catch (err) {
        setError('Network error fetching lesson.');
      } finally {
        setLoading(false);
      }
    }

    fetchLesson();
  }, [conceptId]);

  const handleExit = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('xpedition_exit_override', 'true');
    }
    router.push('/home');
  };

  const handleNextChunk = () => {
    if (!lesson) return;
    if (currentChunkIndex + 1 < lesson.chunks.length) {
      setCurrentChunkIndex((prev) => prev + 1);
    } else {
      setShowCheckpoint(true);
    }
  };

  const handleOptionSelect = (idx: number) => {
    if (isSubmitted) return;
    setSelectedOption(idx);
  };

  const handleSubmitCheckpoint = () => {
    if (selectedOption === null || !lesson || isSubmitted) return;

    const correct = selectedOption === lesson.checkpoint.answerIndex;
    setIsSubmitted(true);
    setIsCorrect(correct);
  };

  const handleGoBackThrough = () => {
    setCurrentChunkIndex(0);
    setShowCheckpoint(false);
    setSelectedOption(null);
    setIsSubmitted(false);
    setIsCorrect(null);
  };

  const handleProceedToQuest = () => {
    router.push(`/quest?concept=${encodeURIComponent(conceptId)}`);
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-ink text-text flex items-center justify-center p-4 font-mono text-sm text-muted animate-pulse">
        Generating lesson for &quot;{conceptName}&quot;...
      </div>
    );
  }

  // Fallback screen if AI call fails
  if (error || !lesson) {
    return (
      <div className="min-h-[100dvh] bg-ink text-text flex items-center justify-center p-6 text-center select-none">
        <div className="max-w-md w-full bg-[#120E22] border border-line rounded-[20px] p-8 space-y-6">
          <div className="space-y-2">
            <span className="font-mono text-[10px] uppercase text-cyan font-bold tracking-eyebrow">
              LESSON SUMMARY
            </span>
            <h1 className="font-sans font-bold text-xl text-text">{conceptName}</h1>
            <p className="font-sans text-xs text-muted leading-relaxed">
              {conceptSummary || `Key concept in ${storeData?.goalText || 'your active goal'}.`}
            </p>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleProceedToQuest}
              className="w-full h-[46px] rounded-[12px] bg-signature-gradient text-white font-sans font-semibold text-xs flex items-center justify-center gap-2 hover:brightness-108 transition-all cursor-pointer"
            >
              <span>Practice Questions Now</span>
              <span>→</span>
            </button>
            <button
              type="button"
              onClick={handleExit}
              className="block w-full font-mono text-xs text-muted hover:text-text pt-1"
            >
              ✕ Exit to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentChunk = lesson.chunks[currentChunkIndex];
  const totalChunks = lesson.chunks.length;

  return (
    <div className="min-h-[100dvh] bg-ink text-text select-none relative overflow-hidden flex flex-col justify-between p-4 sm:p-6">
      {/* Background Neon Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-violet/15 rounded-full blur-[120px] pointer-events-none" />

      {/* HEADER */}
      <header className="w-full max-w-xl mx-auto flex items-center justify-between border-b border-line/60 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <button type="button" onClick={handleExit} className="font-mono text-xs text-muted hover:text-text transition-colors cursor-pointer">
            ✕ Exit
          </button>
          <span className="h-3 w-[1px] bg-line" />
          <span className="font-mono text-xs text-cyan font-semibold truncate max-w-[180px] sm:max-w-[280px]">
            {conceptName}
          </span>
        </div>

        <button
          type="button"
          onClick={handleProceedToQuest}
          className="font-mono text-xs text-muted hover:text-cyan transition-colors cursor-pointer"
        >
          Skip to questions →
        </button>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="w-full max-w-xl mx-auto my-auto relative z-10 py-6">
        {!showCheckpoint ? (
          <div className="bg-[#120E22]/90 border border-line rounded-[20px] p-4 sm:p-8 backdrop-blur-xl space-y-4 flex flex-col max-h-[calc(100dvh-130px)] sm:max-h-[calc(100dvh-160px)] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            
            {/* Progress Dots (Fixed Top) */}
            <div className="flex items-center justify-between border-b border-line/40 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                {lesson.chunks.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      idx === currentChunkIndex
                        ? 'w-6 bg-cyan'
                        : idx < currentChunkIndex
                          ? 'w-2 bg-violet'
                          : 'w-2 bg-raised border border-line'
                    }`}
                  />
                ))}
              </div>
              <span className="font-mono text-[10px] text-muted uppercase font-bold">
                CHUNK {currentChunkIndex + 1} OF {totalChunks}
              </span>
            </div>

            {/* Chunk Speech Text & Code (Scrolls internally if long) */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-4">
              <p className="font-sans text-base sm:text-lg text-text leading-relaxed font-normal">
                {currentChunk.say}
              </p>

              {/* Code Snippet if present */}
              {currentChunk.code && (
                <div className="mt-3 p-3.5 rounded-[12px] bg-panel border border-line/60 overflow-x-auto">
                  <span className="block font-mono text-[9px] uppercase text-cyan font-bold mb-1.5">
                    CODE EXAMPLE
                  </span>
                  <pre className="font-mono text-xs sm:text-sm text-cyan leading-relaxed">
                    {currentChunk.code}
                  </pre>
                </div>
              )}
            </div>

            {/* Navigation Bar (Anchored at Bottom) */}
            <div className="pt-3 border-t border-line/40 flex justify-end shrink-0 bg-[#120E22]/90 sticky bottom-0">
              <button
                type="button"
                onClick={handleNextChunk}
                className="h-[46px] px-6 rounded-[12px] bg-signature-gradient text-white font-sans font-semibold text-xs flex items-center gap-2 hover:brightness-108 transition-all cursor-pointer shadow-lg"
              >
                <span>{currentChunkIndex + 1 === totalChunks ? 'Go to Checkpoint' : 'Next'}</span>
                <span>→</span>
              </button>
            </div>

          </div>
        ) : (
          /* CHECKPOINT CARD */
          <div className="bg-[#120E22]/90 border border-line rounded-[20px] p-6 sm:p-8 backdrop-blur-xl space-y-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="space-y-1">
              <span className="font-mono text-[10px] uppercase text-cyan font-bold tracking-eyebrow">
                LESSON CHECKPOINT
              </span>
              <h2 className="font-sans font-semibold text-base sm:text-lg text-text leading-snug">
                {lesson.checkpoint.ask}
              </h2>
            </div>

            {/* Checkpoint Options */}
            <div className="space-y-2.5">
              {lesson.checkpoint.options.map((optionText, idx) => {
                const isSelected = selectedOption === idx;
                const isAnswerIdx = idx === lesson.checkpoint.answerIndex;

                let optionStyle = 'bg-[#1A1430]/85 border-white/[0.09] hover:border-cyan text-text';

                if (isSubmitted) {
                  if (isAnswerIdx) {
                    optionStyle = 'bg-success/15 border-success text-success font-semibold';
                  } else if (isSelected) {
                    optionStyle = 'bg-danger/15 border-danger text-danger font-semibold';
                  } else {
                    optionStyle = 'bg-[#1A1430]/40 border-transparent text-muted/50';
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
                    className={`w-full min-h-[48px] p-3.5 rounded-[12px] border text-left font-sans text-xs sm:text-sm flex items-center justify-between transition-all cursor-pointer ${optionStyle}`}
                  >
                    <div className="flex items-center gap-3 pr-2">
                      <span className="font-mono text-xs font-bold text-muted min-w-[20px]">
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      <span className="leading-snug">{optionText}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Feedback & Why Explanation */}
            {isSubmitted && (
              <div className="space-y-4 animate-fadeIn">
                <div className={`p-4 rounded-[12px] border ${isCorrect ? 'bg-success/10 border-success/30 text-success' : 'bg-danger/10 border-danger/30 text-danger'}`}>
                  <span className="font-mono text-xs font-bold block mb-1">
                    {isCorrect ? '✓ Spot on!' : '✕ Not quite.'}
                  </span>
                  <p className="font-sans text-xs text-text/90 leading-relaxed">
                    {lesson.checkpoint.why}
                  </p>
                </div>

                {/* PDF DOWNLOAD BUTTONS FOR LESSON NOTES & FLASHCARDS */}
                <div className="pt-3 border-t border-line/40 space-y-2">
                  <span className="font-mono text-[10px] uppercase text-cyan font-bold tracking-eyebrow block">
                    DOWNLOAD LESSON CREDENTIALS & STUDY MATERIALS
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => downloadNotesPdf({ conceptName, chunks: lesson.chunks })}
                      className="h-10 px-3 rounded-[10px] bg-panel border border-cyan/40 text-cyan font-sans font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-cyan/15 transition-all cursor-pointer"
                    >
                      <span>📄 Notes PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadFlashcardsPdf({ conceptName, chunks: lesson.chunks })}
                      className="h-10 px-3 rounded-[10px] bg-panel border border-violet/40 text-violet-300 font-sans font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-violet-600/15 transition-all cursor-pointer"
                    >
                      <span>🃏 Flashcards</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  {!isCorrect && (
                    <button
                      type="button"
                      onClick={handleGoBackThrough}
                      className="h-[42px] px-4 rounded-[10px] bg-raised border border-line text-xs font-sans text-text font-medium hover:border-cyan transition-all cursor-pointer"
                    >
                      ← Go back through lesson
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleProceedToQuest}
                    className="h-[42px] px-6 rounded-[10px] bg-signature-gradient text-white font-sans font-semibold text-xs flex items-center gap-2 hover:brightness-108 transition-all cursor-pointer ml-auto"
                  >
                    <span>{isCorrect ? 'Start Quest Questions' : 'Continue anyway'}</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            )}

            {!isSubmitted && (
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  disabled={selectedOption === null}
                  onClick={handleSubmitCheckpoint}
                  className={`h-[46px] px-6 rounded-[12px] font-sans font-semibold text-xs transition-all cursor-pointer ${
                    selectedOption !== null
                      ? 'bg-signature-gradient text-white hover:brightness-108'
                      : 'bg-raised/60 text-muted border border-line/40 cursor-not-allowed'
                  }`}
                >
                  Verify Checkpoint
                </button>
              </div>
            )}

          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="w-full max-w-xl mx-auto text-center relative z-10 pt-2">
        <span className="font-mono text-[10px] text-muted uppercase">
          XPEDITION TUTOR INTERACTIVE LESSON
        </span>
      </footer>
    </div>
  );
}
