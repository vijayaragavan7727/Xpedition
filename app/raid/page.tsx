"use client";

import { useState, useEffect } from "react";
import { useQuest, RewardDrop } from "@/lib/QuestContext";
import BottomNav from "@/components/BottomNav";
import TopBar from "@/components/TopBar";
import RewardModal from "@/components/RewardModal";
import { getDueSkills, DueSkill } from "@/lib/forgetting";
import { Question } from "@/lib/types";
import Link from "next/link";
import {
  Swords,
  Flame,
  ShieldAlert,
  Play,
  ArrowRight,
  Trophy,
  Zap,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Award,
} from "lucide-react";

export default function RaidPage() {
  const { user, isAuthLoading, claimReward, goalText } = useQuest();
  const [dueSkills, setDueSkills] = useState<DueSkill[]>([]);
  const [currentDueIndex, setCurrentDueIndex] = useState(0);
  const [bossHealth, setBossHealth] = useState(100);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [raidCompleted, setRaidCompleted] = useState(false);
  const [activeRewardDrop, setActiveRewardDrop] = useState<RewardDrop | null>(null);

  useEffect(() => {
    fetchDueSkills();
  }, [user]);

  const fetchDueSkills = async () => {
    setLoadingQuestion(true);
    const skills = await getDueSkills(user?.id);
    setDueSkills(skills);
    setCurrentDueIndex(0);
    setBossHealth(100);
    setRaidCompleted(false);

    if (skills.length > 0) {
      await loadQuestionForSkill(skills[0]);
    } else {
      setLoadingQuestion(false);
    }
  };

  const loadQuestionForSkill = async (skill: DueSkill) => {
    setLoadingQuestion(true);
    setIsAnswered(false);
    setSelectedIndex(null);

    try {
      const res = await fetch("/api/next-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillId: skill.id,
          skillName: skill.name,
          difficulty: skill.difficulty || 2,
          wasCorrect: true,
          goal: goalText,
        }),
      });

      if (res.ok) {
        const q: Question = await res.json();
        setCurrentQuestion(q);
      }
    } catch (err) {
      console.warn("Failed to load raid question:", err);
      // Fallback question
      setCurrentQuestion({
        prompt: `[Memory Raid Concept: ${skill.name}] Which statement best describes this concept?`,
        options: [
          "It represents a core foundational principle of the skill",
          "It is obsolete and no longer used in modern practice",
          "It has no practical application in real-world scenarios",
          "It only applies to low-level hardware design"
        ],
        correctIndex: 0,
        explanation: "Reviewing this concept extends your memory half-life decay!"
      });
    } finally {
      setLoadingQuestion(false);
    }
  };

  const handleSelectOption = (idx: number) => {
    if (isAnswered || loadingQuestion || raidCompleted) return;

    setSelectedIndex(idx);
    setIsAnswered(true);

    const isCorrect = idx === (currentQuestion?.correctIndex ?? 0);

    setTimeout(async () => {
      if (isCorrect) {
        // Decrease boss health proportionally
        const healthDamage = Math.ceil(100 / dueSkills.length);
        const newHealth = Math.max(0, bossHealth - healthDamage);
        setBossHealth(newHealth);

        if (currentDueIndex < dueSkills.length - 1) {
          const nextIdx = currentDueIndex + 1;
          setCurrentDueIndex(nextIdx);
          await loadQuestionForSkill(dueSkills[nextIdx]);
        } else {
          // All due concepts completed -> Defeated Boss!
          setBossHealth(0);
          setRaidCompleted(true);
          const victoryReward: RewardDrop = {
            type: "+20 XP",
            arm: "guild_invite",
            title: "Memory Raid Boss Defeated!",
            xpBonus: 100,
            description: "Cleared all overdue review concepts & extended memory half-life decay!",
          };
          setActiveRewardDrop(victoryReward);
        }
      } else {
        // Reload question for same due skill
        await loadQuestionForSkill(dueSkills[currentDueIndex]);
      }
    }, 1200);
  };

  const handleClaimReward = () => {
    if (activeRewardDrop) {
      claimReward(activeRewardDrop);
      setActiveRewardDrop(null);
    }
  };

  const activeSkill = dueSkills[currentDueIndex];

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A1A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#22D3EE] animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0A1A] bg-grid-pattern relative flex flex-col justify-between pb-24 p-4 sm:p-6">
      {/* Background Glows */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-red-500/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#FBBF24]/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-xl mx-auto space-y-4 z-10 my-auto">
        <TopBar
          title="Memory Raid"
          subtitle="Spaced Repetition Boss Battle"
        />
        {/* Header */}
        <header className="bg-[#1B1B3A] border border-red-500/30 rounded-3xl p-5 shadow-lg text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-mono font-bold">
            <Swords className="w-3.5 h-3.5" />
            SPACED REPETITION BOSS BATTLE
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-heading">
            {dueSkills.length > 0 ? `${dueSkills.length} Concepts Due for Review` : "No Concepts Currently Overdue!"}
          </h1>
          <p className="text-xs text-[#94A3B8]">
            Answer overdue concept questions to drain the boss health bar and extend your memory half-life.
          </p>

          <div className="pt-2">
            <Link
              href="/raid-coop"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-gradient-to-r from-[#7C3AED] via-[#22D3EE] to-[#34D399] text-black font-bold text-xs shadow-md cursor-pointer font-heading hover:opacity-95 transition-all"
            >
              <Swords className="w-4 h-4" />
              <span>Launch Matchmade Co-op Raid</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        {/* Boss Health Bar Card (Single Primary Focal Point) */}
        <div className="bg-[#1B1B3A] border border-red-500/50 rounded-3xl p-5 shadow-2xl space-y-3 glow-box-violet">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-white font-heading">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>MEMORY RAID BOSS HEALTH</span>
            </div>
            <span className="text-xs font-mono font-bold text-red-400">{bossHealth}% HP</span>
          </div>

          <div className="w-full h-4 bg-[#0A0A1A] rounded-full overflow-hidden border border-white/10 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-red-500 via-[#FBBF24] to-[#34D399] rounded-full transition-all duration-500 shadow-md shadow-red-500/30"
              style={{ width: `${bossHealth}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-[#94A3B8] font-mono pt-1">
            <span>Concept {currentDueIndex + 1} of {dueSkills.length || 1}</span>
            <span className="text-[#22D3EE]">{activeSkill?.name || "Active Concept"}</span>
          </div>
        </div>

        {/* Question & Raid Gameplay Card */}
        {!raidCompleted && dueSkills.length > 0 && currentQuestion && (
          <div className="bg-[#1B1B3A] border border-[#7C3AED]/40 rounded-3xl p-6 sm:p-8 shadow-2xl glow-box-violet space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-[#94A3B8]">
                <span className="text-[#22D3EE] font-bold">Review Target: {activeSkill?.name}</span>
                <span>Diff {activeSkill?.difficulty || 2}/5</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white font-heading leading-snug">
                {currentQuestion.prompt}
              </h2>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((opt, idx) => {
                let optionStyles =
                  "bg-[#0A0A1A] border-white/10 text-slate-200 hover:border-[#22D3EE]/60";

                if (selectedIndex === idx) {
                  if (idx === currentQuestion.correctIndex) {
                    optionStyles = "bg-[#34D399]/20 border-[#34D399] text-[#34D399] glow-box-green font-semibold";
                  } else {
                    optionStyles = "bg-red-500/20 border-red-500 text-red-400 font-semibold";
                  }
                } else if (isAnswered && idx === currentQuestion.correctIndex) {
                  optionStyles = "bg-[#34D399]/20 border-[#34D399] text-[#34D399] font-semibold";
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    disabled={isAnswered || loadingQuestion}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between text-sm cursor-pointer ${optionStyles}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-mono text-xs font-bold text-slate-300">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{opt}</span>
                    </div>

                    {isAnswered && idx === currentQuestion.correctIndex && (
                      <CheckCircle2 className="w-5 h-5 text-[#34D399]" />
                    )}
                    {isAnswered && selectedIndex === idx && idx !== currentQuestion.correctIndex && (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Victory Screen when Boss is defeated or 0 concepts due */}
        {(raidCompleted || dueSkills.length === 0) && (
          <div className="bg-[#1B1B3A] border border-[#34D399]/50 rounded-3xl p-8 text-center space-y-5 shadow-2xl glow-box-green animate-fadeIn">
            <div className="w-20 h-20 mx-auto rounded-full bg-[#34D399]/20 border-2 border-[#34D399] flex items-center justify-center text-[#34D399] shadow-xl glow-box-green animate-bounce">
              <Trophy className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-white font-heading">
                {raidCompleted ? "Raid Boss Defeated!" : "Memory All Fresh!"}
              </h2>
              <p className="text-xs text-[#94A3B8] max-w-sm mx-auto mt-1">
                {raidCompleted
                  ? "You reviewed all overdue concepts! Memory half-life extended to 30 days."
                  : "No concepts are currently overdue for review. Keep up the awesome quest streak!"}
              </p>
            </div>

            <Link
              href="/home"
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#22D3EE] text-white font-bold text-sm shadow-lg shadow-[#7C3AED]/30 flex items-center justify-center gap-2 font-heading"
            >
              <span>Return to Home Arena</span>
            </Link>
          </div>
        )}
      </div>

      {/* Reward Drop Modal */}
      {activeRewardDrop && (
        <RewardModal reward={activeRewardDrop} onClaim={handleClaimReward} />
      )}

      <BottomNav />
    </main>
  );
}
