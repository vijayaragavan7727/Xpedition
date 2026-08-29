"use client";

import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import TopBar from "@/components/TopBar";
import { useQuest } from "@/lib/QuestContext";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  Trophy,
  Flame,
  Zap,
  Users,
  Timer,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ShieldAlert,
  Loader2,
} from "lucide-react";

import { getOrRefreshActiveRound, ArenaRound } from "@/lib/arenaEngine";
import SquidAsset from "@/components/SquidAsset";
import XpAsset from "@/components/XpAsset";

interface StandingPlayer {
  rank: number;
  name: string;
  avatarColor: string;
  status: "ADVANCING" | "ON THE LINE" | "ELIMINATED";
  isUser?: boolean;
}

export default function EliminationArenaPage() {
  const { user, isAuthLoading } = useQuest();

  const [timer, setTimer] = useState(108); // 01:48
  const [activeRound, setActiveRound] = useState<ArenaRound | null>(null);
  const [standings, setStandings] = useState<StandingPlayer[]>([]);

  useEffect(() => {
    async function loadArenaRound() {
      const userId = user?.id || "guest-user";
      const userName = user?.name || "Learner";
      const { activeRound: round, entries } = await getOrRefreshActiveRound(userId, userName);
      setActiveRound(round);

      if (round?.endsAt) {
        const remainingSecs = Math.max(0, Math.floor((new Date(round.endsAt).getTime() - Date.now()) / 1000));
        setTimer(remainingSecs);
      }

      if (entries && entries.length > 0) {
        const mapped: StandingPlayer[] = entries.map((e) => ({
          rank: e.rank,
          name: e.userName,
          avatarColor: e.userId === userId ? "from-[#7C3AED] to-[#22D3EE]" : "from-[#FBBF24] to-[#F472B6]",
          status: e.status === "advancing" ? "ADVANCING" : e.status === "on_the_line" ? "ON THE LINE" : "ELIMINATED",
          isUser: e.userId === userId,
        }));
        setStandings(mapped);
      }
    }

    loadArenaRound();

    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A1A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#22D3EE] animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0A0F] bg-grid-pattern text-white relative flex flex-col justify-between pb-24 p-4 sm:p-6 overflow-x-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#7C3AED]/20 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#FB7185]/15 rounded-full blur-[150px] pointer-events-none" />

      <div className="w-full max-w-xl mx-auto space-y-4 z-10 my-auto">
        <TopBar
          title="Elimination Arena"
          subtitle="Weekly Competitive Tournament"
        />
        {/* Eyebrow & Hero Header */}
        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 border border-[#7C3AED]/50 bg-[#7C3AED]/15 text-[#22D3EE] text-xs font-mono font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider">
            <span className="w-1.5 h-1.5 bg-[#22D3EE] rounded-sm" />
            <span>ELIMINATION ARENA</span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <XpAsset name="crown" alt="Golden Tournament Crown" width={40} height={40} className="shrink-0 text-[#FFB800]" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white font-heading">
                  Weekly Tournament
                </h1>
                <p className="text-xs text-[#A9A9C4] mt-0.5">
                  {standings.length > 0
                    ? `${standings.length} learners entered • top ${Math.ceil(standings.length / 2)} advance each round`
                    : "Round Registration Open • Enter to compete"}
                </p>
              </div>
            </div>

            {/* Timer Chip */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C1C24] border border-white/10 text-[#FBBF24] font-mono text-xs font-bold shrink-0">
              <Timer className="w-4 h-4 text-[#FBBF24] animate-pulse" />
              <span>{formatTimer(timer)}</span>
            </div>
          </div>
        </header>

        {/* Difficulty Shape Tiers */}
        <div className="bg-[#111116] border border-white/10 rounded-3xl p-5 shadow-2xl space-y-3">
          <span className="text-[10px] font-mono font-bold text-[#6E6E85] uppercase tracking-wider block">
            Geometric Difficulty Tiers
          </span>

          {/* Circle Tier */}
          <div className="flex items-center gap-3 bg-[#1C1C24] border border-white/10 rounded-2xl p-3.5">
            <div className="w-6 h-6 rounded-full border-2 border-[#34D399] shrink-0" />
            <div className="flex-1">
              <span className="text-xs font-bold text-white block">Foundational Tier</span>
              <span className="text-[10px] text-[#6E6E85]">Warm-up difficulty</span>
            </div>
            <span className="text-xs font-mono font-bold text-[#34D399]">EASY</span>
          </div>

          {/* Triangle Tier */}
          <div className="flex items-center gap-3 bg-[#1C1C24] border border-white/10 rounded-2xl p-3.5">
            <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[18px] border-b-[#FBBF24] shrink-0" />
            <div className="flex-1">
              <span className="text-xs font-bold text-white block">Applied Tier</span>
              <span className="text-[10px] text-[#6E6E85]">Flow-band matched</span>
            </div>
            <span className="text-xs font-mono font-bold text-[#FBBF24]">MEDIUM</span>
          </div>

          {/* Square Tier */}
          <div className="flex items-center gap-3 bg-[#1C1C24] border border-white/10 rounded-2xl p-3.5">
            <div className="w-5 h-5 border-2 border-[#FB7185] rounded-sm shrink-0" />
            <div className="flex-1">
              <span className="text-xs font-bold text-white block">Mastery Tier</span>
              <span className="text-[10px] text-[#6E6E85]">High risk, high XP</span>
            </div>
            <span className="text-xs font-mono font-bold text-[#FB7185]">HARD</span>
          </div>
        </div>

        {/* Live Standings Section */}
        <div className="bg-[#111116] border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white font-heading">Live Standings</h3>
              <span className="text-[10px] font-mono text-[#6E6E85]">
                {standings.length > 0
                  ? `${Math.ceil(standings.length / 2)} of ${standings.length} advancing (50% cut-off)`
                  : "0 of 0 advancing (50% cut-off)"}
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-[#FB7185]/15 border border-[#FB7185]/30 text-[#FB7185] text-[10px] font-mono font-bold">
              ROUND {activeRound?.id || "1"}
            </span>
          </div>

          {/* Progress Cutoff Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-[#6E6E85]">
              <span>Surviving Zone</span>
              <span>50%</span>
            </div>
            <div className="w-full h-2 bg-[#1C1C24] rounded-full overflow-hidden border border-white/10">
              <div className="h-full bg-gradient-to-r from-[#FB7185] to-[#FBBF24] rounded-full w-1/2" />
            </div>
          </div>

          {/* Standings List */}
          {standings.length === 0 ? (
            <div className="bg-[#1C1C24] border border-white/10 rounded-2xl p-6 text-center space-y-2">
              <p className="text-xs text-slate-300 font-bold font-heading">
                No tournament entries recorded for Round {activeRound?.id || "1"} yet
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                Answer your first quest question to automatically log your live standing on the leaderboard!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
            {standings.map((player) => {
              let rowStyle = "bg-[#1C1C24] border-white/10";
              let badgeStyle = "bg-white/5 text-slate-400";

              if (player.status === "ADVANCING") {
                rowStyle = "bg-[#34D399]/10 border-[#34D399]/40";
                badgeStyle = "bg-[#34D399]/20 text-[#34D399]";
              } else if (player.status === "ELIMINATED") {
                rowStyle = "bg-[#1C1C24]/40 border-white/5 opacity-50";
                badgeStyle = "bg-[#FB7185]/20 text-[#FB7185]";
              }

              if (player.isUser) {
                rowStyle = "bg-[#22D3EE]/15 border-[#22D3EE] ring-1 ring-[#22D3EE]";
              }

              return (
                <div
                  key={player.rank}
                  className={`p-3 rounded-2xl border flex items-center justify-between text-xs transition-all ${rowStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-400 text-[11px] w-5">
                      {player.rank.toString().padStart(2, "0")}
                    </span>
                    <div
                      className={`w-7 h-7 rounded-full bg-gradient-to-br ${player.avatarColor} flex items-center justify-center font-bold text-black text-xs font-heading shadow-md`}
                    >
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <span
                      className={`font-bold font-heading ${
                        player.status === "ELIMINATED" ? "line-through text-slate-500" : "text-white"
                      }`}
                    >
                      {player.name} {player.isUser && "(You)"}
                    </span>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold ${badgeStyle}`}>
                    {player.status}
                  </span>
                </div>
              );
            })}
          </div>
          )}
        </div>

        {/* Enter Arena CTA (Primary Focal Point with Glow) */}
        <button className="w-full py-3.5 min-h-[44px] rounded-2xl bg-gradient-to-r from-[#FB7185] to-[#D6425A] hover:opacity-95 text-white font-bold text-sm transition-all shadow-xl shadow-[#FB7185]/30 cursor-pointer font-heading tracking-wide flex items-center justify-center">
          Enter Elimination Arena
        </button>
      </div>

      <BottomNav />
    </main>
  );
}
