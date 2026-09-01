'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getStoreData, completeCalibration } from '@/lib/store';

export interface CalibrationItem {
  id: string;
  conceptId: string;
  conceptName: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: number;
}

export default function CalibratePage() {
  const router = useRouter();

  const [calibrationItems, setCalibrationItems] = useState<CalibrationItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [theta, setTheta] = useState<number>(-0.4);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  useEffect(() => {
    const store = getStoreData();
    const activeQuests = store.quests || [];
    const conceptsMap = new Map((store.concepts || []).map((c) => [c.id, c.name]));

    let pool: CalibrationItem[] = activeQuests.map((q: any) => ({
      id: q.id,
      conceptId: q.conceptId,
      conceptName: conceptsMap.get(q.conceptId) || store.goalText || 'Core Concept',
      prompt: q.prompt,
      options: q.options,
      correctIndex: q.answerIndex ?? q.correctIndex ?? 0,
      explanation: q.explanation || '',
      difficulty: Number(q.difficulty) || 0,
    }));

    if (pool.length === 0) {
      // Fallback if graph has no items
      pool = (store.concepts || []).map((c, idx) => ({
        id: `calib_${c.id}`,
        conceptId: c.id,
        conceptName: c.name,
        prompt: `Core assessment question for ${c.name}`,
        options: ['Correct application', 'Incorrect approach A', 'Incorrect approach B', 'Incorrect approach C'],
        correctIndex: 0,
        explanation: `Evaluates fundamental understanding of ${c.name}.`,
        difficulty: -1.5 + (idx * 0.8),
      }));
    }

    // Sort items by difficulty
    const sorted = [...pool].sort((a, b) => a.difficulty - b.difficulty);

    // Select 5 items evenly spread across the difficulty range
    let selected: CalibrationItem[] = [];
    if (sorted.length >= 5) {
      const step = (sorted.length - 1) / 4;
      selected = [
        sorted[0],
        sorted[Math.round(step * 1)],
        sorted[Math.round(step * 2)],
        sorted[Math.round(step * 3)],
        sorted[sorted.length - 1],
      ];
    } else {
      selected = sorted;
    }

    setCalibrationItems(selected);
  }, []);

  if (calibrationItems.length === 0) {
    return (
      <div className="min-h-[100dvh] bg-ink text-text flex items-center justify-center p-4 font-mono text-sm text-muted animate-pulse">
        Initializing Calibration for Active Goal...
      </div>
    );
  }

  const currentItem = calibrationItems[currentIndex];
  const totalItems = calibrationItems.length;

  const handleOptionSelect = (idx: number) => {
    if (isAnswered) return;

    setSelectedOption(idx);
    setIsAnswered(true);

    const isCorrect = idx === currentItem.correctIndex;
    const itemDiff = currentItem.difficulty ?? 0;

    // Coarse Elo update equation:
    // p = 1 / (1 + exp(-(theta - itemDifficulty)))
    // theta = theta + 0.9 * ((correct ? 1 : 0) - p)
    const p = 1 / (1 + Math.exp(-(theta - itemDiff)));
    const newTheta = theta + 0.9 * ((isCorrect ? 1 : 0) - p);
    setTheta(newTheta);

    // Auto-advance after brief feedback delay
    setTimeout(() => {
      if (currentIndex + 1 < totalItems) {
        setCurrentIndex((prev) => prev + 1);
        setSelectedOption(null);
        setIsAnswered(false);
      } else {
        setIsFinished(true);
        completeCalibration(Number(newTheta.toFixed(2)));
        setTimeout(() => {
          router.push('/home');
        }, 1000);
      }
    }, 1200);
  };

  const handleExit = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('xpedition_exit_override', 'true');
    }
    router.push('/home');
  };

  return (
    <div className="h-[100dvh] w-full bg-ink text-text flex items-center justify-center p-3 sm:p-6 select-none relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-violet/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-xl h-full max-h-[96dvh] bg-[#120E22]/90 border border-line rounded-[20px] p-4 sm:p-8 backdrop-blur-xl relative z-10 flex flex-col justify-between">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line/60 pb-3 sm:pb-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] tracking-eyebrow text-cyan uppercase font-bold">
              SKILL GRAPH CALIBRATION
            </span>
            <span className="font-mono text-xs font-semibold text-muted">
              {currentIndex + 1} / {totalItems}
            </span>
          </div>

          <button type="button" onClick={handleExit} className="font-mono text-xs text-muted hover:text-text transition-colors cursor-pointer">
            ✕ Exit
          </button>
        </div>

        {/* Informational Guidance Banner */}
        <div className="bg-raised/70 p-3 rounded-[12px] border border-line/40 text-[11px] sm:text-xs font-sans text-muted leading-relaxed">
          Five questions, spread from easy to hard. Guessing is fine — this only sets the starting line your progress gets measured against.
        </div>

        {!isFinished ? (
          <div className="space-y-3.5 sm:space-y-5">
            {/* Concept Tag & Difficulty Metric */}
            <div className="flex items-center justify-between font-mono text-[10px]">
              <span className="text-muted uppercase tracking-eyebrow font-bold">
                {currentItem.conceptName}
              </span>
              <span className="text-cyan">
                Item Diff (b): {currentItem.difficulty > 0 ? `+${currentItem.difficulty}` : currentItem.difficulty}
              </span>
            </div>

            {/* Prompt */}
            <h1 className="font-sans font-semibold text-base sm:text-lg text-text leading-snug">
              {currentItem.prompt}
            </h1>

            {/* Options List */}
            <div className="space-y-2">
              {currentItem.options.map((optionText, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === currentItem.correctIndex;

                let optionStyle = 'bg-[#1A1430]/85 border-white/[0.09] hover:border-cyan text-text';

                if (isAnswered) {
                  if (isCorrect) {
                    optionStyle = 'bg-success/15 border-success text-success font-semibold';
                  } else if (isSelected) {
                    optionStyle = 'bg-danger/15 border-danger text-danger font-semibold';
                  } else {
                    optionStyle = 'bg-[#1A1430]/40 border-transparent text-muted/50';
                  }
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isAnswered}
                    onClick={() => handleOptionSelect(idx)}
                    className={`w-full min-h-[46px] p-3 rounded-[12px] border text-left font-sans text-xs sm:text-[14px] flex items-center justify-between transition-all cursor-pointer ${optionStyle}`}
                  >
                    <div className="flex items-center gap-3 pr-2">
                      <span className="font-mono text-xs font-bold text-muted min-w-[20px]">
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      <span className="leading-snug">{optionText}</span>
                    </div>

                    {isAnswered && isCorrect && (
                      <span className="w-5 h-5 rounded-full bg-success text-ink flex items-center justify-center font-bold text-xs shrink-0">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-signature-gradient p-0.5 mx-auto">
              <div className="w-full h-full rounded-full bg-panel flex items-center justify-center text-cyan font-mono text-xl font-bold">
                ✓
              </div>
            </div>
            <h2 className="font-sans font-semibold text-lg text-text">Baseline Calibrated</h2>
            <p className="font-mono text-xs text-cyan font-bold">
              Baseline Ability (θ): {theta >= 0 ? `+${theta.toFixed(2)}` : theta.toFixed(2)}
            </p>
            <p className="font-sans text-xs text-muted">Routing to your home dashboard...</p>
          </div>
        )}

      </div>
    </div>
  );
}
