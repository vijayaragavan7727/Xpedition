"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useQuest } from "@/lib/QuestContext";
import BottomNav from "@/components/BottomNav";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Question } from "@/lib/types";
import {
  Swords,
  Users,
  Shield,
  Zap,
  CheckCircle2,
  XCircle,
  Loader2,
  Trophy,
  Bot,
  Flame,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

type MatchState = "idle" | "queued" | "matched" | "victory";

export default function CoOpRaidPage() {
  const { user, course, activeSkillIndex, flowDifficulty, pKnow, claimReward } = useQuest();

  const currentSkill = course?.skills[activeSkillIndex] || {
    id: "s1",
    name: "Python Core Syntax & Data Structures",
    difficulty: 2,
  };

  const [matchState, setMatchState] = useState<MatchState>("idle");
  const [queueTimer, setQueueTimer] = useState(0);
  const [showAiOffer, setShowAiOffer] = useState(false);
  const [queueId, setQueueId] = useState<string | null>(null);

  // Session State
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [partnerName, setPartnerName] = useState<string>("AI Partner: CyberBot-9000 (AI Assistant)");
  const [isAiPartner, setIsAiPartner] = useState(true);
  const [bossHp, setBossHp] = useState(100);
  const [userDamage, setUserDamage] = useState(0);
  const [aiDamage, setAiDamage] = useState(0);

  // Question State
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    prompt: "In Python, which keyword is used to create a generator function that yields values lazily?",
    options: ["return", "yield", "async", "def"],
    correctIndex: 1,
    explanation: "The 'yield' keyword pauses function execution and returns a generator object.",
  });
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [loadingQuestion, setLoadingQuestion] = useState(false);

  // 1. Queue timer & Matchmaker Polling
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (matchState === "queued") {
      interval = setInterval(() => {
        setQueueTimer((prev) => {
          const next = prev + 1;
          if (next >= 20 && !showAiOffer) {
            setShowAiOffer(true);
          }
          return next;
        });

        checkForMatch();
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [matchState, showAiOffer, queueId]);

  // 2. Poll / Realtime Boss HP sync during active match
  useEffect(() => {
    let sessionInterval: NodeJS.Timeout;
    if (matchState === "matched" && sessionId && isSupabaseConfigured()) {
      sessionInterval = setInterval(async () => {
        try {
          const { data } = await supabase
            .from("raid_sessions")
            .select("boss_hp, status")
            .eq("id", sessionId)
            .single();

          if (data) {
            setBossHp(data.boss_hp);
            if (data.boss_hp <= 0) {
              setMatchState("victory");
            }
          }
        } catch (err) {
          console.warn("Raid session poll notice:", err);
        }
      }, 1500);
    }
    return () => clearInterval(sessionInterval);
  }, [matchState, sessionId]);

  const handleStartQueue = async () => {
    setMatchState("queued");
    setQueueTimer(0);
    setShowAiOffer(false);
    setUserDamage(0);
    setAiDamage(0);

    if (isSupabaseConfigured() && user?.id) {
      try {
        const { data } = await supabase
          .from("matchmaking_queue")
          .insert({
            user_id: user.id,
            user_name: user.name,
            skill_name: currentSkill.name,
            difficulty: flowDifficulty,
            status: "queued",
          })
          .select("id")
          .single();

        if (data?.id) {
          setQueueId(data.id);
        }
      } catch (err) {
        console.warn("Matchmaking queue insert error:", err);
      }
    }
  };

  const checkForMatch = async () => {
    if (!isSupabaseConfigured()) return;

    try {
      const { data: queueItems } = await supabase
        .from("matchmaking_queue")
        .select("*")
        .eq("status", "queued")
        .neq("user_id", user.id || "dummy")
        .limit(1);

      if (queueItems && queueItems.length > 0) {
        const opponent = queueItems[0];

        const { data: sessionData } = await supabase
          .from("raid_sessions")
          .insert({
            player1_id: user.id || "p1",
            player1_name: user.name,
            player2_id: opponent.user_id,
            player2_name: opponent.user_name,
            is_ai_partner: false,
            boss_hp: 100,
            status: "active",
          })
          .select("id")
          .single();

        if (sessionData?.id) {
          await supabase
            .from("matchmaking_queue")
            .update({ status: "matched", matched_session_id: sessionData.id })
            .in("id", [queueId, opponent.id].filter(Boolean));

          setSessionId(sessionData.id);
          setPartnerName(opponent.user_name);
          setIsAiPartner(false);
          setMatchState("matched");
        }
      }
    } catch (err) {
      console.warn("Matchmaker check error:", err);
    }
  };

  const handleStartAiMatch = async () => {
    const aiName = "AI Partner: CyberBot-9000 (AI Assistant)";
    let sId = `session-ai-${Date.now()}`;

    if (isSupabaseConfigured() && user?.id) {
      try {
        const { data } = await supabase
          .from("raid_sessions")
          .insert({
            player1_id: user.id,
            player1_name: user.name,
            player2_id: "ai-bot-id",
            player2_name: aiName,
            is_ai_partner: true,
            boss_hp: 100,
            status: "active",
          })
          .select("id")
          .single();

        if (data?.id) sId = data.id;
      } catch (err) {
        console.warn("AI session create notice:", err);
      }
    }

    setSessionId(sId);
    setPartnerName(aiName);
    setIsAiPartner(true);
    setBossHp(100);
    setUserDamage(0);
    setAiDamage(0);
    setMatchState("matched");
  };

  const handleAnswerSubmit = async (idx: number) => {
    if (isAnswered || matchState !== "matched") return;

    setSelectedIndex(idx);
    setIsAnswered(true);

    const isCorrect = idx === currentQuestion.correctIndex;

    if (isCorrect) {
      const uDmg = 25;
      setUserDamage((prev) => prev + uDmg);
      const newHp = Math.max(0, bossHp - uDmg);
      setBossHp(newHp);

      if (isSupabaseConfigured() && sessionId) {
        await supabase
          .from("raid_sessions")
          .update({ boss_hp: newHp })
          .eq("id", sessionId);
      }

      // AI Partner assists on a timer with accuracy tuned to user's pKnow
      if (isAiPartner && newHp > 0) {
        setTimeout(async () => {
          const aiAccuracyProb = Math.min(0.90, Math.max(0.40, pKnow));
          const aiIsCorrect = Math.random() < aiAccuracyProb;
          const aDmg = aiIsCorrect ? 25 : 10;

          setAiDamage((prev) => prev + aDmg);
          const aiDamagedHp = Math.max(0, newHp - aDmg);
          setBossHp(aiDamagedHp);

          if (aiDamagedHp <= 0) {
            setMatchState("victory");
          }
        }, 1200);
      }

      if (newHp <= 0) {
        setMatchState("victory");
      } else {
        setTimeout(() => fetchNextRaidQuestion(), 1500);
      }
    } else {
      setTimeout(() => fetchNextRaidQuestion(), 1500);
    }
  };

  const fetchNextRaidQuestion = async () => {
    setLoadingQuestion(true);
    try {
      const res = await fetch("/api/next-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillId: currentSkill.id,
          skillName: currentSkill.name,
          difficulty: flowDifficulty,
          wasCorrect: true,
          goal: course?.title,
        }),
      });

      if (res.ok) {
        const nextQ = await res.json();
        if (nextQ?.prompt) setCurrentQuestion(nextQ);
      }
    } catch (e) {
      console.warn("Raid question fetch notice:", e);
    } finally {
      setSelectedIndex(null);
      setIsAnswered(false);
      setLoadingQuestion(false);
    }
  };

  const handleClaimVictory = () => {
    claimReward({
      type: "+20 XP",
      title: "Co-op Boss Raid Victory!",
      xpBonus: 100,
      description: "Defeated the Raid Boss with your partner!",
    });
    setMatchState("idle");
    setBossHp(100);
  };

  return (
    <main className="min-h-screen bg-[#0A0A1A] bg-grid-pattern relative flex flex-col justify-between pb-24 p-4 sm:p-6">
      {/* Background Orbs */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#7C3AED]/20 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-xl mx-auto space-y-6 z-10 my-auto">
        {/* Top Header */}
        <header className="bg-[#1B1B3A] border border-[#7C3AED]/40 rounded-3xl p-6 shadow-xl text-center space-y-2 glow-box-violet">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/40 text-[#22D3EE] text-xs font-mono font-bold">
            <Swords className="w-3.5 h-3.5 text-[#FBBF24]" />
            MATCHMADE CO-OP BOSS RAID
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-heading">
            Synchronized Co-op Raid
          </h1>
          <p className="text-xs text-[#94A3B8]">
            Team up in real time — deal damage together to defeat the Quantum Colossus!
          </p>
        </header>

        {/* State 1: IDLE - Find Partner */}
        {matchState === "idle" && (
          <div className="bg-[#1B1B3A] border border-white/10 rounded-3xl p-8 shadow-2xl text-center space-y-6">
            <div className="flex items-center justify-center gap-6">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#22D3EE] flex items-center justify-center text-white font-black text-2xl font-heading shadow-xl ring-2 ring-[#22D3EE]/40">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-bold text-white mt-2 font-heading">{user.name}</span>
                <span className="text-[10px] font-mono text-[#22D3EE]">Lvl {user.level}</span>
              </div>

              <div className="w-12 h-12 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/40 flex items-center justify-center text-[#FBBF24] font-black text-sm font-mono animate-pulse">
                VS
              </div>

              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-[#0A0A1A] border-2 border-dashed border-white/20 flex items-center justify-center text-slate-500">
                  <Users className="w-8 h-8" />
                </div>
                <span className="text-xs font-bold text-slate-400 mt-2 font-heading">
                  Waiting Partner
                </span>
                <span className="text-[10px] font-mono text-slate-500">Queueing...</span>
              </div>
            </div>

            <button
              onClick={handleStartQueue}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#7C3AED] via-[#22D3EE] to-[#34D399] hover:opacity-95 text-black font-black text-base shadow-xl shadow-[#7C3AED]/30 transition-all cursor-pointer font-heading tracking-wide"
            >
              Find a Partner & Start Raid
            </button>
          </div>
        )}

        {/* State 2: QUEUED - Searching */}
        {matchState === "queued" && (
          <div className="bg-[#1B1B3A] border border-[#22D3EE]/40 rounded-3xl p-8 shadow-2xl text-center space-y-6 glow-box-cyan">
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <Loader2 className="w-24 h-24 text-[#22D3EE] animate-spin" />
              <span className="absolute font-mono font-bold text-white text-lg">{queueTimer}s</span>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white font-heading">
                Searching for Live Co-op Partner...
              </h2>
              <p className="text-xs text-[#94A3B8]">
                Skill focus: <span className="text-[#22D3EE] font-mono">{currentSkill.name}</span>
              </p>
            </div>

            {showAiOffer && (
              <div className="bg-[#0A0A1A] border border-[#FBBF24]/40 p-5 rounded-2xl space-y-3 animate-fadeIn text-left">
                <div className="flex items-center gap-2 text-xs font-mono text-[#FBBF24] font-bold">
                  <Bot className="w-5 h-5 shrink-0" />
                  <span>Honest AI Partner Fallback Available</span>
                </div>
                <p className="text-xs text-slate-300">
                  No live human matched within 20s. You can raid with an explicitly labeled AI Assistant tuned to your mastery level.
                </p>
                <button
                  onClick={handleStartAiMatch}
                  className="w-full py-3 rounded-xl bg-[#FBBF24] hover:bg-[#F59E0B] text-black font-black text-xs transition-all shadow-md cursor-pointer font-heading flex items-center justify-center gap-2"
                >
                  <Bot className="w-4 h-4" />
                  <span>Raid with AI Partner: CyberBot-9000 (AI Assistant)</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* State 3: MATCHED - Live Raid Battle */}
        {matchState === "matched" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Shared Boss Health Bar with Segmented Damage Contribution */}
            <div className="bg-[#1B1B3A] border border-red-500/40 rounded-3xl p-6 shadow-2xl space-y-4 glow-box-red">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Swords className="w-5 h-5 text-red-400 animate-pulse" />
                  <span className="text-sm font-bold text-white font-heading">
                    CO-OP BOSS: QUANTUM COLOSSUS
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-red-400">{bossHp} / 100 HP</span>
              </div>

              {/* Segmented Boss HP Bar (Cyan User Damage, Violet AI Damage) */}
              <div className="w-full h-5 bg-[#0A0A1A] rounded-full overflow-hidden border border-white/10 p-0.5 flex">
                <div
                  className="h-full bg-[#22D3EE] rounded-l-full transition-all duration-500 shadow-md shadow-[#22D3EE]/30"
                  style={{ width: `${Math.min(100, userDamage)}%` }}
                  title={`Your Damage: ${userDamage} HP`}
                />
                <div
                  className="h-full bg-[#7C3AED] transition-all duration-500 shadow-md shadow-[#7C3AED]/30"
                  style={{ width: `${Math.min(100 - userDamage, aiDamage)}%` }}
                  title={`AI Partner Damage: ${aiDamage} HP`}
                />
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-500"
                  style={{ width: `${bossHp}%` }}
                />
              </div>

              {/* Player Damage Breakdown Legend */}
              <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-white/10">
                <div className="flex items-center gap-1.5 text-[#22D3EE] font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#22D3EE]" />
                  <span>You ({userDamage} HP)</span>
                </div>

                {isAiPartner ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/40 text-[#7C3AED] font-bold text-[11px]">
                    <Bot className="w-3.5 h-3.5 text-[#FBBF24]" />
                    <span>AI Partner: CyberBot-9000 ({aiDamage} HP)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[#34D399] font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#34D399]" />
                    <span>{partnerName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Raid Question Card */}
            <div className="bg-[#1B1B3A] border border-[#7C3AED]/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative space-y-5 glow-box-violet">
              <h2 className="text-lg sm:text-xl font-bold text-white font-heading">
                {currentQuestion.prompt}
              </h2>

              <div className="space-y-2.5">
                {currentQuestion.options.map((opt, idx) => {
                  let btnClass = "bg-[#0A0A1A] border-white/10 text-slate-200 hover:border-[#22D3EE]";
                  if (selectedIndex === idx) {
                    if (idx === currentQuestion.correctIndex) {
                      btnClass = "bg-[#34D399]/20 border-[#34D399] text-[#34D399] font-bold";
                    } else {
                      btnClass = "bg-red-500/20 border-red-500 text-red-400 font-bold";
                    }
                  } else if (isAnswered && idx === currentQuestion.correctIndex) {
                    btnClass = "bg-[#34D399]/20 border-[#34D399] text-[#34D399] font-bold";
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswerSubmit(idx)}
                      disabled={isAnswered || loadingQuestion}
                      className={`w-full text-left p-4 rounded-2xl border transition-all text-xs sm:text-sm cursor-pointer flex items-center justify-between ${btnClass}`}
                    >
                      <span>
                        {String.fromCharCode(65 + idx)}. {opt}
                      </span>
                      {isAnswered && idx === currentQuestion.correctIndex && (
                        <CheckCircle2 className="w-5 h-5 text-[#34D399]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* State 4: VICTORY */}
        {matchState === "victory" && (
          <div className="bg-[#1B1B3A] border border-[#34D399]/50 rounded-3xl p-8 shadow-2xl text-center space-y-6 glow-box-green animate-fadeIn">
            <div className="w-20 h-20 rounded-full bg-[#34D399]/20 border border-[#34D399] mx-auto flex items-center justify-center text-[#34D399]">
              <Trophy className="w-10 h-10 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white font-heading">
                Raid Boss Defeated!
              </h2>
              <p className="text-xs text-[#94A3B8]">
                You and {partnerName} successfully defeated Quantum Colossus!
              </p>
            </div>

            <div className="bg-[#0A0A1A] p-4 rounded-2xl border border-[#34D399]/30 text-center">
              <span className="text-xs font-mono text-slate-400 block">Reward Claim</span>
              <span className="text-2xl font-black text-[#34D399] font-mono">+100 Guild XP</span>
            </div>

            <button
              onClick={handleClaimVictory}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#22D3EE] to-[#34D399] text-black font-black text-sm transition-all cursor-pointer font-heading"
            >
              Claim Reward & Return
            </button>
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
