"use client";

import { useState, useEffect } from "react";
import { useQuest } from "@/lib/QuestContext";
import BottomNav from "@/components/BottomNav";
import TopBar from "@/components/TopBar";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  Shield,
  Users,
  Plus,
  ArrowRight,
  Copy,
  Check,
  Award,
  Sparkles,
  Zap,
  Crown,
  UserPlus,
  Loader2,
} from "lucide-react";

interface GuildMember {
  id: string;
  name: string;
  level: number;
  xp: number;
  role: "Leader" | "Member";
}

interface GuildData {
  id: string;
  name: string;
  code: string;
  members: GuildMember[];
}

export default function GuildPage() {
  const { user, isAuthLoading } = useQuest();

  const [activeGuild, setActiveGuild] = useState<GuildData | null>(null);

  useEffect(() => {
    async function fetchUserGuild() {
      if (isSupabaseConfigured() && user?.id) {
        try {
          const { data: memberRec } = await supabase
            .from("guild_members")
            .select("guild_id, role, guilds(id, name, code)")
            .eq("user_id", user.id)
            .limit(1);

          if (memberRec && memberRec.length > 0) {
            const g = memberRec[0].guilds as any;
            if (g) {
              const { data: allMembers } = await supabase
                .from("guild_members")
                .select("user_id, role, users(display_name, email)")
                .eq("guild_id", g.id);

              const mappedMembers: GuildMember[] = (allMembers || []).map((m: any) => ({
                id: m.user_id,
                name: m.users?.display_name || m.users?.email?.split("@")[0] || "Squadmate",
                level: user.level,
                xp: user.xp,
                role: m.role === "leader" ? "Leader" : "Member",
              }));

              setActiveGuild({
                id: g.id,
                name: g.name,
                code: g.code,
                members: mappedMembers,
              });
            }
          }
        } catch (err) {
          console.warn("Fetch guild notice:", err);
        }
      }
    }
    fetchUserGuild();
  }, [user]);

  const [createName, setCreateName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [mode, setMode] = useState<"view" | "create" | "join">("view");

  const totalGuildXp = activeGuild
    ? activeGuild.members.reduce((acc, m) => acc + m.xp, 0)
    : 0;
  const targetGuildXp = 2500;
  const guildProgressPct = Math.min(100, Math.round((totalGuildXp / targetGuildXp) * 100));

  const handleCopyCode = () => {
    if (activeGuild?.code) {
      navigator.clipboard.writeText(activeGuild.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCreateGuild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;

    const newCode = `SQUAD-${Math.floor(1000 + Math.random() * 9000)}`;
    const newGuild: GuildData = {
      id: `g-${Date.now()}`,
      name: createName.trim(),
      code: newCode,
      members: [{ id: user.id || "u1", name: user.name, level: user.level, xp: user.xp, role: "Leader" }],
    };

    if (isSupabaseConfigured() && user?.id) {
      try {
        const { data: gData } = await supabase
          .from("guilds")
          .insert({ name: createName.trim(), code: newCode })
          .select("id")
          .single();

        if (gData?.id) {
          await supabase.from("guild_members").insert({
            guild_id: gData.id,
            user_id: user.id,
          });
          newGuild.id = gData.id;
        }
      } catch (err) {
        console.warn("Supabase guild create error:", err);
      }
    }

    setActiveGuild(newGuild);
    setCreateName("");
    setMode("view");
  };

  const handleJoinGuild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    const cleanCode = joinCode.trim().toUpperCase();

    if (isSupabaseConfigured() && user?.id) {
      try {
        const { data: gData } = await supabase
          .from("guilds")
          .select("id, name, code")
          .eq("code", cleanCode)
          .single();

        if (gData) {
          await supabase.from("guild_members").upsert({
            guild_id: gData.id,
            user_id: user.id,
          });

          setActiveGuild({
            id: gData.id,
            name: gData.name,
            code: gData.code,
            members: [
              { id: user.id, name: user.name, level: user.level, xp: user.xp, role: "Member" },
              { id: "u2", name: "Aria Shadow", level: 3, xp: 480, role: "Leader" },
            ],
          });
          setJoinCode("");
          setMode("view");
          return;
        }
      } catch (err) {
        console.warn("Supabase guild join notice:", err);
      }
    }

    // Demo Join Fallback
    setActiveGuild({
      id: `g-${cleanCode}`,
      name: `${cleanCode} Alliance`,
      code: cleanCode,
      members: [
        { id: user.id || "u1", name: user.name, level: user.level, xp: user.xp, role: "Member" },
        { id: "u-head", name: "Guild Founder", level: 5, xp: 950, role: "Leader" },
      ],
    });
    setJoinCode("");
    setMode("view");
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A1A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#22D3EE] animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0A1A] bg-grid-pattern relative flex flex-col justify-between pb-24 p-4 sm:p-6">
      {/* Background Orbs */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-[#7C3AED]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#22D3EE]/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-xl mx-auto space-y-4 z-10 my-auto">
        <TopBar
          title="Squad & Guild Citadel"
          subtitle="Co-op Alliances & Team XP Pools"
        />
        {/* Top Header */}
        <header className="bg-[#1B1B3A] border border-white/10 rounded-3xl p-5 shadow-lg text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/40 text-[#22D3EE] text-xs font-mono font-bold">
            <Shield className="w-3.5 h-3.5" />
            GUILD CITADEL & CO-OP ALLIANCE
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-heading">
            {activeGuild ? activeGuild.name : "Join or Create a Guild"}
          </h1>
          <p className="text-xs text-[#94A3B8]">
            Team up with peers, pool XP, and conquer shared co-op raids together
          </p>
        </header>

        {/* Guild Mode Actions (min 44px tap targets) */}
        <div className="flex gap-2">
          <button
            onClick={() => setMode("view")}
            className={`flex-1 py-3 min-h-[44px] rounded-2xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center ${
              mode === "view"
                ? "bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/30"
                : "bg-[#1B1B3A] text-slate-400 hover:text-white border border-white/10"
            }`}
          >
            My Guild
          </button>
          <button
            onClick={() => setMode("create")}
            className={`flex-1 py-3 min-h-[44px] rounded-2xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center ${
              mode === "create"
                ? "bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/30"
                : "bg-[#1B1B3A] text-slate-400 hover:text-white border border-white/10"
            }`}
          >
            Create Squad
          </button>
          <button
            onClick={() => setMode("join")}
            className={`flex-1 py-3 min-h-[44px] rounded-2xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center ${
              mode === "join"
                ? "bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/30"
                : "bg-[#1B1B3A] text-slate-400 hover:text-white border border-white/10"
            }`}
          >
            Join Code
          </button>
        </div>

        {/* Empty State when No Active Guild */}
        {mode === "view" && !activeGuild && (
          <div className="bg-[#1B1B3A] border border-white/10 rounded-3xl p-8 text-center space-y-4 glow-box-violet animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/40 flex items-center justify-center text-[#22D3EE] mx-auto">
              <Shield className="w-8 h-8 text-[#FBBF24]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white font-heading">No Squad Joined Yet</h3>
              <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
                Create your own Squad or join your peers using a squad code to unlock co-op XP bonuses.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setMode("create")}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#22D3EE] text-white font-bold text-xs shadow-md cursor-pointer"
              >
                Create a Squad
              </button>
              <button
                onClick={() => setMode("join")}
                className="px-5 py-2.5 rounded-xl bg-[#0A0A1A] border border-white/20 text-slate-300 hover:text-white font-bold text-xs cursor-pointer"
              >
                Join by Code
              </button>
            </div>
          </div>
        )}

        {/* View Active Guild */}
        {mode === "view" && activeGuild && (
          <div className="space-y-6">
            {/* Guild Stats Card */}
            <div className="bg-[#1B1B3A] border border-[#22D3EE]/40 rounded-3xl p-6 shadow-2xl space-y-5 glow-box-cyan">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                    Guild Citadel Level 3
                  </span>
                  <h2 className="text-xl font-bold text-white font-heading">{activeGuild.name}</h2>
                </div>

                {/* Invite Code Box */}
                <div className="bg-[#0A0A1A] border border-[#22D3EE]/30 px-3 py-1.5 rounded-xl flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[#22D3EE]">
                    {activeGuild.code}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-[#34D399]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Shared Guild XP Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-[#FBBF24]" />
                    Shared Guild XP
                  </span>
                  <span className="text-[#22D3EE] font-bold">
                    {totalGuildXp} / {targetGuildXp} XP ({guildProgressPct}%)
                  </span>
                </div>
                <div className="w-full h-4 bg-[#0A0A1A] rounded-full overflow-hidden border border-white/10 p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-[#7C3AED] via-[#22D3EE] to-[#34D399] rounded-full transition-all duration-500 shadow-md"
                    style={{ width: `${guildProgressPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Guild Member Roster */}
            <div className="bg-[#1B1B3A]/90 border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-[#94A3B8] border-b border-white/10 pb-3">
                <span className="flex items-center gap-1.5 text-white">
                  <Users className="w-4 h-4 text-[#22D3EE]" />
                  Guild Roster ({activeGuild.members.length})
                </span>
                <span>Level & Total XP</span>
              </div>

              <div className="space-y-3">
                {activeGuild.members.map((member) => (
                  <div
                    key={member.id}
                    className="bg-[#0A0A1A] border border-white/5 rounded-2xl p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#22D3EE] flex items-center justify-center text-white font-bold text-sm font-heading shadow-md">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white font-heading">
                            {member.name}
                          </span>
                          {member.role === "Leader" && (
                            <span className="px-2 py-0.5 rounded-full bg-[#FBBF24]/20 border border-[#FBBF24]/40 text-[#FBBF24] text-[9px] font-mono font-bold flex items-center gap-1">
                              <Crown className="w-3 h-3" />
                              Leader
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 font-mono">
                          Guild Contributor
                        </span>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-xs text-[#22D3EE] font-bold block">
                        Lvl {member.level}
                      </span>
                      <span className="text-[11px] text-slate-400">{member.xp} XP</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Create Guild Mode */}
        {mode === "create" && (
          <form
            onSubmit={handleCreateGuild}
            className="bg-[#1B1B3A] border border-[#22D3EE]/40 rounded-3xl p-6 shadow-2xl space-y-4 glow-box-cyan"
          >
            <h2 className="text-lg font-bold text-white font-heading flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#FBBF24]" />
              Form a New Guild
            </h2>
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-400">Guild Name</label>
              <input
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="e.g. Cyber Knights"
                className="w-full bg-[#0A0A1A] border border-white/15 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#22D3EE]"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#22D3EE] text-white font-bold text-sm shadow-lg shadow-[#7C3AED]/30 transition-all cursor-pointer font-heading"
            >
              Create Guild Alliance
            </button>
          </form>
        )}

        {/* Join Guild Mode */}
        {mode === "join" && (
          <form
            onSubmit={handleJoinGuild}
            className="bg-[#1B1B3A] border border-[#34D399]/40 rounded-3xl p-6 shadow-2xl space-y-4 glow-box-green"
          >
            <h2 className="text-lg font-bold text-white font-heading flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#34D399]" />
              Join Guild by Invite Code
            </h2>
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-400">Invite Code</label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="e.g. CYBER-9482"
                className="w-full bg-[#0A0A1A] border border-white/15 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#34D399] uppercase font-mono tracking-wider"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#22D3EE] to-[#34D399] text-black font-black text-sm shadow-lg shadow-[#34D399]/30 transition-all cursor-pointer font-heading"
            >
              Join Guild
            </button>
          </form>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
