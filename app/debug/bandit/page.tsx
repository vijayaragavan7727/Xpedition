"use client";

import { useState, useEffect } from "react";
import { useQuest } from "@/lib/QuestContext";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  sampleBeta,
  selectArm,
  recordOutcome,
  BANDIT_ARMS,
  ArmType,
  RewardArm,
} from "@/lib/bandit";
import {
  Sparkles,
  Zap,
  RefreshCw,
  Trophy,
  BookOpen,
  Swords,
  Shield,
  Play,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";

export default function BanditDebugPage() {
  const { user } = useQuest();
  const [arms, setArms] = useState<RewardArm[]>([]);
  const [selectedArm, setSelectedArm] = useState<RewardArm | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchArms();
  }, [user]);

  const fetchArms = async () => {
    setLoading(true);
    let loadedArms: RewardArm[] = [];

    if (isSupabaseConfigured() && user?.id) {
      try {
        const { data } = await supabase
          .from("reward_arms")
          .select("*")
          .eq("user_id", user.id);

        if (data && data.length > 0) {
          loadedArms = data.map((d) => ({
            arm: d.arm as ArmType,
            alpha: d.alpha,
            beta: d.beta,
            pulls: d.pulls,
            returns: d.returns,
          }));
        }
      } catch (err) {
        console.warn("Supabase fetch arms notice:", err);
      }
    }

    if (loadedArms.length === 0) {
      // Fallback default arms
      loadedArms = BANDIT_ARMS.map((arm) => ({
        arm,
        alpha: arm === "badge" ? 3 : 1,
        beta: 1,
        pulls: arm === "badge" ? 2 : 0,
        returns: arm === "badge" ? 2 : 0,
      }));
    }

    // Draw Beta samples for display
    const sampledArms = loadedArms.map((a) => ({
      ...a,
      lastSampledValue: sampleBeta(a.alpha, a.beta),
    }));

    setArms(sampledArms);
    setSelectedArm(selectArm(sampledArms));
    setLoading(false);
  };

  const handleSimulatePull = async () => {
    const chosen = selectArm(arms);
    setSelectedArm(chosen);

    // Re-sample all arms to demonstrate Thompson Sampling in action
    const updated = arms.map((a) => ({
      ...a,
      lastSampledValue: sampleBeta(a.alpha, a.beta),
    }));
    setArms(updated);
  };

  const handleOutcomeSimulation = async (armType: ArmType, success: boolean) => {
    if (user?.id) {
      await recordOutcome(user.id, armType, success, arms);
    } else {
      // Local state update
      setArms((prev) =>
        prev.map((a) => {
          if (a.arm === armType) {
            const alpha = success ? a.alpha + 1 : a.alpha;
            const beta = success ? a.beta : a.beta + 1;
            return {
              ...a,
              alpha,
              beta,
              pulls: a.pulls + 1,
              returns: success ? a.returns + 1 : a.returns,
            };
          }
          return a;
        })
      );
    }

    await fetchArms();
  };

  return (
    <main className="min-h-screen bg-[#0A0A1A] bg-grid-pattern relative p-4 sm:p-8">
      {/* Background Glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#7C3AED]/20 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-4xl mx-auto space-y-6 z-10 relative">
        {/* Header */}
        <header className="bg-[#1B1B3A] border border-[#7C3AED]/40 rounded-3xl p-6 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glow-box-violet">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/40 text-[#22D3EE] text-xs font-mono font-bold mb-2">
              <Zap className="w-3.5 h-3.5 text-[#FBBF24]" />
              THOMPSON SAMPLING BANDIT DEBUG DASHBOARD
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white font-heading">
              Reward Bandit Live Analytics
            </h1>
            <p className="text-xs text-[#94A3B8] mt-1">
              Watch Thompson Sampling sample Beta(&alpha;, &beta;) distributions and select optimal reward arms in real time.
            </p>
          </div>

          <button
            onClick={handleSimulatePull}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#22D3EE] hover:from-[#6D28D9] hover:to-[#06B6D4] text-white font-bold text-xs transition-all shadow-lg flex items-center gap-2 cursor-pointer shrink-0 font-heading"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sample Beta Distributions</span>
          </button>
        </header>

        {/* Selected Arm Winner Banner */}
        {selectedArm && (
          <div className="bg-gradient-to-r from-[#1B1B3A] to-[#0A0A1A] border border-[#34D399]/50 rounded-2xl p-5 shadow-xl flex items-center justify-between glow-box-green">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#34D399]/20 border border-[#34D399] flex items-center justify-center text-[#34D399]">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-[#34D399] font-bold uppercase">
                  Current Selected Winner (Max Beta Sample)
                </span>
                <h3 className="text-base font-bold text-white font-heading capitalize">
                  Arm: {selectedArm.arm.replace("_", " ")}
                </h3>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-mono text-[#94A3B8] block">Sampled Value</span>
              <span className="text-lg font-black text-[#22D3EE] font-mono">
                {selectedArm.lastSampledValue?.toFixed(4)}
              </span>
            </div>
          </div>
        )}

        {/* Live Reward Arms Table */}
        <div className="bg-[#1B1B3A] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white font-heading uppercase tracking-wider">
              Arm Parameter State Table (Supabase Public.Reward_Arms)
            </h2>
            <span className="text-xs text-[#94A3B8] font-mono">
              User ID: {user.id ? `${user.id.slice(0, 8)}...` : "Local Session"}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/10 text-[#94A3B8] uppercase">
                  <th className="py-3 px-3">Reward Arm</th>
                  <th className="py-3 px-3 text-center">&alpha; (Alpha)</th>
                  <th className="py-3 px-3 text-center">&beta; (Beta)</th>
                  <th className="py-3 px-3 text-center">Pulls</th>
                  <th className="py-3 px-3 text-center">Returns</th>
                  <th className="py-3 px-3 text-center">Expected Mean</th>
                  <th className="py-3 px-3 text-center">Beta Sample</th>
                  <th className="py-3 px-3 text-right">Simulate Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {arms.map((armItem) => {
                  const expectedMean = (armItem.alpha / (armItem.alpha + armItem.beta)).toFixed(3);
                  const isWinner = selectedArm?.arm === armItem.arm;

                  return (
                    <tr
                      key={armItem.arm}
                      className={`hover:bg-white/5 transition-colors ${
                        isWinner ? "bg-[#7C3AED]/10 text-white font-bold" : ""
                      }`}
                    >
                      <td className="py-4 px-3 capitalize flex items-center gap-2">
                        {isWinner && <CheckCircle2 className="w-4 h-4 text-[#34D399]" />}
                        <span>{armItem.arm.replace("_", " ")}</span>
                      </td>

                      <td className="py-4 px-3 text-center font-bold text-[#34D399]">
                        {armItem.alpha}
                      </td>

                      <td className="py-4 px-3 text-center font-bold text-red-400">
                        {armItem.beta}
                      </td>

                      <td className="py-4 px-3 text-center text-slate-300">
                        {armItem.pulls}
                      </td>

                      <td className="py-4 px-3 text-center text-[#FBBF24]">
                        {armItem.returns}
                      </td>

                      <td className="py-4 px-3 text-center text-[#22D3EE] font-bold">
                        {expectedMean}
                      </td>

                      <td className="py-4 px-3 text-center text-[#22D3EE] font-bold">
                        {armItem.lastSampledValue?.toFixed(4)}
                      </td>

                      <td className="py-4 px-3 text-right">
                        <div className="inline-flex gap-1">
                          <button
                            onClick={() => handleOutcomeSimulation(armItem.arm, true)}
                            className="px-2 py-1 rounded bg-[#34D399]/20 border border-[#34D399]/40 text-[#34D399] hover:bg-[#34D399] hover:text-black transition-colors cursor-pointer text-[10px]"
                          >
                            +&alpha; (Return)
                          </button>
                          <button
                            onClick={() => handleOutcomeSimulation(armItem.arm, false)}
                            className="px-2 py-1 rounded bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500 hover:text-white transition-colors cursor-pointer text-[10px]"
                          >
                            +&beta; (No Return)
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Informational Panel */}
        <div className="bg-[#1B1B3A]/60 border border-white/10 rounded-2xl p-4 text-xs text-[#94A3B8] space-y-1">
          <p className="font-bold text-white">How Thompson Sampling Works in XPedition:</p>
          <p>
            1. On reward drop, the agent samples $Beta(\alpha, \beta)$ for each arm. The arm with the highest random sample wins.
          </p>
          <p>
            2. If the user completes another quest in the same session, $+\alpha$ is rewarded (increasing that arm's future selection probability).
          </p>
        </div>
      </div>
    </main>
  );
}
