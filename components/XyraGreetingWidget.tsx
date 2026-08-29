'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserStoreData, ConceptMastery } from '@/lib/store';
import { Sparkles, BookOpen, RotateCcw, PlusCircle, HelpCircle, X, Volume2, ArrowRight } from 'lucide-react';

interface XyraGreetingWidgetProps {
  storeData: UserStoreData;
  continueHref: string;
  continueLabel: string;
  fadingConcepts: ConceptMastery[];
  streak: number;
}

export default function XyraGreetingWidget({
  storeData,
  continueHref,
  continueLabel,
  fadingConcepts,
  streak,
}: XyraGreetingWidgetProps) {
  const router = useRouter();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [robotImgPath, setRobotImgPath] = useState('/robot.png');
  const [selectedDoubt, setSelectedDoubt] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const userName = storeData?.handle || 'Learner';

  // Compute Time-based Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return `Good morning, ${userName}! Ready to learn?`;
    }
    if (hour >= 12 && hour < 17) {
      return `Good afternoon, ${userName}! Let's continue.`;
    }
    if (hour >= 17 && hour < 21) {
      return `Good evening, ${userName}! Quick session?`;
    }
    return `Late night study, ${userName}? XYRA is here.`;
  };

  // Compute Motivational Line
  const getMotivationalLine = () => {
    if (fadingConcepts && fadingConcepts.length > 0) {
      return `Your ${fadingConcepts[0].name} is fading — want a quick 2-min drill?`;
    }
    if (streak && streak >= 1) {
      return `🔥 ${streak} day streak! Keep it going.`;
    }
    return `You haven't started today yet. 5 minutes is enough.`;
  };

  const handleSpeak = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleDoubtSelect = (doubtKey: string) => {
    let answer = '';
    if (doubtKey === 'how_xyra_teaches') {
      answer = 'XYRA breaks concepts into bite-sized chunks on the blackboard, speaks in plain English or Tanglish, and verifies your understanding with checkpoints!';
    } else if (doubtKey === 'study_tip') {
      answer = 'Short 10-minute daily sessions lead to 3x higher retention than 2-hour weekend cramming. Keep that streak alive!';
    } else {
      answer = 'Streak increases by 1 each day you complete at least 1 quest or tutor lesson before midnight.';
    }

    setSelectedDoubt(answer);
    handleSpeak(answer);
  };

  return (
    <>
      {/* 1. COMPACT HOME GREETING WIDGET (Max ~80px, clickable) */}
      <div
        onClick={() => setIsPanelOpen(true)}
        className="w-full bg-[#120E22]/95 hover:bg-[#18132E] border border-[#00F0FF]/30 hover:border-[#00F0FF]/60 rounded-[18px] p-3 sm:p-3.5 transition-all duration-300 cursor-pointer shadow-[0_0_20px_rgba(0,240,255,0.12)] hover:shadow-[0_0_25px_rgba(0,240,255,0.22)] group backdrop-blur-xl select-none"
        role="button"
        tabIndex={0}
        aria-label="Open XYRA Quick Actions Menu"
      >
        <div className="flex items-center gap-3">
          
          {/* Robot Avatar Image on the Left */}
          <div className="relative shrink-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-[#00F0FF]/15 border border-[#00F0FF]/50 p-1 flex items-center justify-center shadow-[0_0_12px_rgba(0,240,255,0.35)] group-hover:scale-105 transition-transform">
              <img
                src={robotImgPath}
                onError={() => {
                  if (robotImgPath === '/robot.png') setRobotImgPath('/images/robot.png');
                }}
                alt="XYRA AI Teacher"
                className="w-10 h-10 object-contain object-bottom drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]"
              />
            </div>
            <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-[#00FF87] border-2 border-[#120E22] animate-pulse" />
          </div>

          {/* Greeting Text on the Right */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#00F0FF] font-bold">
                XYRA &middot; AI TEACHER
              </span>
              <span className="font-mono text-[9px] text-cyan-400/80 px-1.5 py-0.2 rounded bg-[#00F0FF]/10">
                Tap to Ask
              </span>
            </div>

            <h2 className="font-sans font-bold text-xs sm:text-sm text-white truncate group-hover:text-[#00F0FF] transition-colors leading-snug">
              {getGreeting()}
            </h2>

            <p className="font-sans text-[11px] text-slate-300/90 truncate mt-0.5 font-medium">
              {getMotivationalLine()}
            </p>
          </div>

          {/* Quick Arrow Indicator */}
          <div className="shrink-0 font-mono text-xs text-[#00F0FF] font-bold pr-1 group-hover:translate-x-1 transition-transform">
            &rarr;
          </div>

        </div>
      </div>

      {/* 2. ASK XYRA HOME PAGE MINI PANEL (Bottom Sheet / Modal) */}
      {isPanelOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-[#0D0D1A] border border-[#00F0FF]/40 rounded-[28px] p-5 max-w-md w-full space-y-4 shadow-2xl animate-scaleUp">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#00F0FF]/20 border border-[#00F0FF] flex items-center justify-center">
                  <img
                    src={robotImgPath}
                    alt="XYRA"
                    className="w-6 h-6 object-contain"
                  />
                </div>
                <div>
                  <span className="font-mono text-[10px] text-[#00F0FF] font-bold uppercase tracking-wider block">
                    XYRA Quick Actions
                  </span>
                  <h3 className="font-sans font-bold text-sm text-white">
                    What would you like to do?
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsPanelOpen(false);
                  setSelectedDoubt(null);
                }}
                className="text-slate-400 hover:text-white p-1 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* If doubt response is active */}
            {selectedDoubt ? (
              <div className="space-y-3 animate-fadeIn">
                <div className="p-4 rounded-2xl bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-slate-100 text-xs font-sans space-y-2">
                  <div className="flex items-center justify-between border-b border-[#00F0FF]/20 pb-1.5">
                    <span className="font-mono text-[10px] text-[#00F0FF] font-bold">
                      XYRA says:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSpeak(selectedDoubt)}
                      className="text-[10px] font-mono text-[#00F0FF] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{isSpeaking ? 'Speaking...' : 'Read Aloud'}</span>
                    </button>
                  </div>
                  <p className="leading-relaxed font-medium">{selectedDoubt}</p>
                </div>

                <div className="flex items-center justify-between pt-1 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedDoubt(null)}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer text-[11px]"
                  >
                    &larr; Back to options
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPanelOpen(false);
                      setSelectedDoubt(null);
                    }}
                    className="px-4 py-1.5 rounded-xl bg-[#00F0FF] text-black font-bold hover:brightness-110 cursor-pointer transition-all"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* 4 Quick Action Buttons */
              <div className="space-y-2.5 pt-1">
                
                {/* 1. Continue where I left off */}
                <button
                  type="button"
                  onClick={() => {
                    setIsPanelOpen(false);
                    router.push(continueHref);
                  }}
                  className="w-full p-3.5 rounded-2xl bg-[#00F0FF]/15 border border-[#00F0FF]/40 hover:bg-[#00F0FF]/25 text-left transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#00F0FF]/20 text-[#00F0FF] flex items-center justify-center font-bold">
                      📚
                    </div>
                    <div>
                      <span className="font-sans font-bold text-xs text-white block group-hover:text-[#00F0FF]">
                        Continue where I left off
                      </span>
                      <span className="font-mono text-[10px] text-cyan-300/80 truncate block max-w-[220px]">
                        {continueLabel}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-[#00F0FF] font-bold group-hover:translate-x-1 transition-transform">&rarr;</span>
                </button>

                {/* 2. Quick drill on fading topic */}
                <button
                  type="button"
                  onClick={() => {
                    setIsPanelOpen(false);
                    if (fadingConcepts && fadingConcepts.length > 0) {
                      router.push(`/quest?concept=${encodeURIComponent(fadingConcepts[0].id)}`);
                    } else {
                      router.push(continueHref);
                    }
                  }}
                  className="w-full p-3.5 rounded-2xl bg-[#FF0055]/10 border border-[#FF0055]/30 hover:bg-[#FF0055]/20 text-left transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#FF0055]/20 text-[#FF7185] flex items-center justify-center font-bold">
                      🔁
                    </div>
                    <div>
                      <span className="font-sans font-bold text-xs text-white block group-hover:text-[#FF7185]">
                        Quick drill on fading topic
                      </span>
                      <span className="font-mono text-[10px] text-slate-400 block truncate max-w-[220px]">
                        {fadingConcepts && fadingConcepts.length > 0
                          ? `Review ${fadingConcepts[0].name} (Retention Risk)`
                          : 'Target your highest retention risk concept'}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-[#FF7185] font-bold group-hover:translate-x-1 transition-transform">&rarr;</span>
                </button>

                {/* 3. Start something new */}
                <button
                  type="button"
                  onClick={() => {
                    setIsPanelOpen(false);
                    router.push('/onboarding');
                  }}
                  className="w-full p-3.5 rounded-2xl bg-[#A855F7]/10 border border-[#A855F7]/30 hover:bg-[#A855F7]/20 text-left transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#A855F7]/20 text-[#A855F7] flex items-center justify-center font-bold">
                      🆕
                    </div>
                    <div>
                      <span className="font-sans font-bold text-xs text-white block group-hover:text-[#A855F7]">
                        Start something new
                      </span>
                      <span className="font-mono text-[10px] text-slate-400 block">
                        Add a new skill goal or upload syllabus
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-[#A855F7] font-bold group-hover:translate-x-1 transition-transform">&rarr;</span>
                </button>

                {/* 4. I have a doubt */}
                <div className="p-3 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                  <span className="font-mono text-[10px] uppercase text-cyan font-bold tracking-wider flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-[#00F0FF]" />
                    <span>❓ I have a doubt</span>
                  </span>
                  <div className="grid grid-cols-1 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDoubtSelect('how_xyra_teaches')}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-left font-sans text-xs text-slate-200 hover:text-white transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <span>&ldquo;How does XYRA teach?&rdquo;</span>
                      <span className="font-mono text-[10px] text-[#00F0FF]">&rarr;</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDoubtSelect('study_tip')}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-left font-sans text-xs text-slate-200 hover:text-white transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <span>&ldquo;Give me a daily study tip&rdquo;</span>
                      <span className="font-mono text-[10px] text-[#00F0FF]">&rarr;</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDoubtSelect('streak_rules')}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-left font-sans text-xs text-slate-200 hover:text-white transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <span>&ldquo;How is streak calculated?&rdquo;</span>
                      <span className="font-mono text-[10px] text-[#00F0FF]">&rarr;</span>
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}
