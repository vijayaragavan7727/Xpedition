'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Quest } from '@/lib/types';
import { getActiveHero, HeroCharacter } from '@/lib/heroEngine';
import { addRewards } from '@/lib/economyEngine';
import { soundFx } from '@/lib/soundEngine';
import { QuestTimerGauge } from './QuestTimerGauge';
import { LivesShieldHUD } from './LivesShieldHUD';
import { SurvivorOutcomeModal } from './SurvivorOutcomeModal';
import { Sparkles, Zap, Shield, HelpCircle, Check, X, ArrowRight } from 'lucide-react';

interface LearnOrLoseArenaProps {
  questions: Quest[];
  conceptTitle?: string;
  onSessionComplete?: (isVictory: boolean, correctCount: number) => void;
  onExit?: () => void;
}

export const LearnOrLoseArena: React.FC<LearnOrLoseArenaProps> = ({
  questions,
  conceptTitle = 'Sector Defense',
  onSessionComplete,
  onExit,
}) => {
  const router = useRouter();
  const hero = getActiveHero();

  // Arena Parameters & State
  const baseTime = 20 + (hero.perk.bonusTimerSeconds || 0);
  const maxLives = 3 + (hero.perk.bonusExtraLife || 0);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentLives, setCurrentLives] = useState(maxLives);
  const [timeLeft, setTimeLeft] = useState(baseTime);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [combo, setCombo] = useState(0);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [goldEarned, setGoldEarned] = useState(0);
  const [crystalsEarned, setCrystalsEarned] = useState(0);

  // 50/50 Hero Power State
  const [hasFiftyFifty, setHasFiftyFifty] = useState(Boolean(hero.perk.hasFiftyFifty));
  const [disabledOptions, setDisabledOptions] = useState<number[]>([]);

  const currentQ = questions[currentIndex] || questions[0];
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer Tick
  useEffect(() => {
    if (isAnswered || isGameOver || !currentQ) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, isAnswered, isGameOver, currentQ]);

  // Handle Timeout (counts as wrong answer and deducts 1 shield)
  const handleTimeout = () => {
    setIsAnswered(true);
    setIsCorrect(false);
    setCombo(0);
    soundFx.playLifeLost();

    const remainingLives = currentLives - 1;
    setCurrentLives(remainingLives);

    if (remainingLives <= 0) {
      triggerGameOver(false);
    }
  };

  // 50/50 Skill Trigger
  const handleUseFiftyFifty = () => {
    if (!hasFiftyFifty || isAnswered || !currentQ) return;
    soundFx.playTick();
    setHasFiftyFifty(false);

    const correctIdx = currentQ.correctIndex !== undefined ? currentQ.correctIndex : 0;
    const wrongIndices = currentQ.options
      .map((_, idx) => idx)
      .filter((idx) => idx !== correctIdx);

    // Shuffle and pick 2 wrong options to disable
    const toDisable = wrongIndices.slice(0, 2);
    setDisabledOptions(toDisable);
  };

  // Handle Option Selection
  const handleSelectOption = (index: number) => {
    if (isAnswered || isGameOver || disabledOptions.includes(index)) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setSelectedOption(index);
    setIsAnswered(true);

    const correctIdx = currentQ.correctIndex !== undefined ? currentQ.correctIndex : 0;
    const isAnswerRight = index === correctIdx;
    setIsCorrect(isAnswerRight);

    if (isAnswerRight) {
      soundFx.playCorrect();
      const newCombo = combo + 1;
      setCombo(newCombo);
      const points = 100 * (1 + newCombo * 0.2);
      setScore((s) => s + Math.round(points));
    } else {
      soundFx.playLifeLost();
      setCombo(0);
      const remainingLives = currentLives - 1;
      setCurrentLives(remainingLives);

      if (remainingLives <= 0) {
        triggerGameOver(false);
      }
    }
  };

  // Progress to Next Wave
  const handleNextQuestion = () => {
    soundFx.playTick();
    const nextIdx = currentIndex + 1;

    if (nextIdx >= questions.length) {
      triggerGameOver(true);
      return;
    }

    setCurrentIndex(nextIdx);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsCorrect(null);
    setDisabledOptions([]);
    setTimeLeft(baseTime);
  };

  // End Game (Victory or Elimination)
  const triggerGameOver = (won: boolean) => {
    setIsGameOver(true);
    setIsVictory(won);

    let gGain = won ? 150 : 30 * currentIndex;
    let cGain = won ? 25 : 5 * currentIndex;

    // Apply Valkyrie Loot Perk
    if (hero.perk.bonusGoldPercent) {
      gGain = Math.round(gGain * (1 + hero.perk.bonusGoldPercent / 100));
      cGain = Math.round(cGain * (1 + hero.perk.bonusGoldPercent / 100));
    }

    setGoldEarned(gGain);
    setCrystalsEarned(cGain);
    addRewards(gGain, cGain, won ? 40 : 10);

    if (won) {
      soundFx.playVictory();
    }

    if (onSessionComplete) {
      onSessionComplete(won, currentIndex + (won ? 1 : 0));
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setCurrentLives(maxLives);
    setTimeLeft(baseTime);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsCorrect(null);
    setCombo(0);
    setScore(0);
    setIsGameOver(false);
    setIsVictory(false);
    setDisabledOptions([]);
    setHasFiftyFifty(Boolean(hero.perk.hasFiftyFifty));
  };

  const correctIndex = currentQ?.correctIndex !== undefined ? currentQ.correctIndex : 0;

  return (
    <div className="relative w-full max-w-2xl mx-auto flex flex-col gap-4 p-4 sm:p-6 select-none font-sans animate-fade-in">
      
      {/* Top Arena HUD Bar (Timer, Lives, Wave Counter, Combo) */}
      <div className="flex items-center justify-between gap-2">
        <LivesShieldHUD currentLives={currentLives} maxLives={maxLives} />

        {/* Wave Indicator Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#120E22]/90 backdrop-blur-md border border-white/15 text-xs font-mono font-bold text-white">
          <span className="text-[#00F0FF]">WAVE</span>
          <span>
            {currentIndex + 1}/{questions.length}
          </span>
        </div>

        <QuestTimerGauge timeLeft={timeLeft} totalTime={baseTime} isPaused={isAnswered || isGameOver} />
      </div>

      {/* Combo & Hero Ability Bar */}
      <div className="flex items-center justify-between px-2">
        {/* Combo Multiplier */}
        <div className="flex items-center gap-1.5">
          {combo >= 2 && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300 font-mono text-xs font-black animate-pulse">
              <Zap className="w-3.5 h-3.5 fill-amber-300" />
              <span>{combo}X STREAK FRENZY!</span>
            </div>
          )}
        </div>

        {/* 50/50 Hero Power Button */}
        {hero.perk.hasFiftyFifty && hasFiftyFifty && !isAnswered && (
          <button
            onClick={handleUseFiftyFifty}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#F472F6]/20 border border-[#F472F6]/40 text-[#F472F6] font-mono text-xs font-bold hover:bg-[#F472F6]/30 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Use 50/50 Purge</span>
          </button>
        )}
      </div>

      {/* Arena Question Card */}
      <div className="bg-[#120E24]/90 backdrop-blur-xl border border-white/15 rounded-3xl p-5 sm:p-7 shadow-[0_0_40px_rgba(0,0,0,0.6)] flex flex-col gap-5">
        
        {/* Sector / Topic Eyebrow */}
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span className="text-[#00F0FF] uppercase tracking-wider font-bold">
            ⚔️ DEFENDING: {conceptTitle}
          </span>
          <span>SCORE: {score}</span>
        </div>

        {/* Question Prompt */}
        <h2 className="text-base sm:text-lg font-bold text-white leading-snug">
          {currentQ?.prompt || 'Question loading...'}
        </h2>

        {/* Options List */}
        <div className="flex flex-col gap-2.5">
          {(currentQ?.options || []).map((opt, idx) => {
            const isSelected = selectedOption === idx;
            const isDisabled = disabledOptions.includes(idx);
            const isRight = idx === correctIndex;

            let btnStyle = 'bg-[#181232]/80 border-white/10 text-slate-200 hover:border-[#00F0FF]/50';

            if (isAnswered) {
              if (isRight) {
                btnStyle = 'bg-[#00FF87]/20 border-[#00FF87] text-[#00FF87] shadow-[0_0_15px_rgba(0,255,135,0.4)]';
              } else if (isSelected) {
                btnStyle = 'bg-red-500/20 border-red-500 text-red-300 shadow-[0_0_15px_rgba(255,46,99,0.4)]';
              } else {
                btnStyle = 'bg-[#181232]/40 border-white/5 text-slate-500 opacity-50';
              }
            } else if (isDisabled) {
              btnStyle = 'bg-[#181232]/20 border-white/5 text-slate-600 line-through opacity-30 cursor-not-allowed';
            }

            return (
              <button
                key={idx}
                disabled={isAnswered || isDisabled}
                onClick={() => handleSelectOption(idx)}
                className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 text-xs sm:text-sm font-medium ${btnStyle}`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-mono text-xs font-bold text-slate-400 shrink-0">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>{opt}</span>
                </div>

                {isAnswered && isRight && <Check className="w-5 h-5 text-[#00FF87] shrink-0" />}
                {isAnswered && isSelected && !isRight && <X className="w-5 h-5 text-red-400 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Next Question / Continue Action */}
        {isAnswered && !isGameOver && currentLives > 0 && (
          <button
            onClick={handleNextQuestion}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#00F0FF] via-[#A855F7] to-[#F472F6] text-black font-black text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(0,240,255,0.4)] hover:opacity-95 transition-all flex items-center justify-center gap-2 mt-2"
          >
            <span>Advance to Next Wave</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}

      </div>

      {/* Survivor Outcome Modal */}
      {isGameOver && (
        <SurvivorOutcomeModal
          isVictory={isVictory}
          waveReached={currentIndex + 1}
          totalWaves={questions.length}
          score={score}
          goldEarned={goldEarned}
          crystalsEarned={crystalsEarned}
          onRetry={handleRestart}
          onBackToBase={() => {
            if (onExit) onExit();
            else router.push('/world');
          }}
        />
      )}

    </div>
  );
};
