"use client";

import React, { useState } from "react";
import Link from "next/link";
import SquidAsset from "@/components/SquidAsset";
import { getModuleTheme } from "@/lib/moduleThemes";
import { Skill } from "@/lib/types";
import { Lock, Sparkles, Trophy, Play, CheckCircle2, ChevronRight, X, Compass, ShieldAlert } from "lucide-react";

export type SkillNodeStatus = "LOCKED" | "AVAILABLE" | "IN_PROGRESS" | "MASTERED";

interface SkillTreeGraphProps {
  skills: Skill[];
  activeSkillIndex: number;
  pKnow: number;
  onSelectSkill?: (index: number) => void;
}

export default function SkillTreeGraph({
  skills,
  activeSkillIndex,
  pKnow,
  onSelectSkill,
}: SkillTreeGraphProps) {
  const [selectedNodeIndex, setSelectedNodeIndex] = useState<number | null>(null);

  const getStatus = (idx: number): SkillNodeStatus => {
    if (idx < activeSkillIndex) return "MASTERED";
    if (idx === activeSkillIndex) return "IN_PROGRESS";
    if (idx === activeSkillIndex + 1) return "AVAILABLE";
    return "LOCKED";
  };

  const selectedSkill = selectedNodeIndex !== null ? skills[selectedNodeIndex] : null;
  const selectedTheme = selectedNodeIndex !== null ? getModuleTheme(selectedNodeIndex) : null;
  const selectedStatus = selectedNodeIndex !== null ? getStatus(selectedNodeIndex) : null;

  return (
    <div className="bg-[#1B1B3A]/90 border border-white/10 rounded-3xl p-5 sm:p-6 space-y-6 shadow-2xl relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h3 className="text-base font-bold text-white font-heading flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#22D3EE]" />
            Interactive RPG Skill Tree
          </h3>
          <p className="text-xs text-[#94A3B8] font-mono mt-0.5">
            Tap any skill node to view prerequisites, mastery, & start quest
          </p>
        </div>

        <span className="px-3 py-1 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/40 text-[#22D3EE] text-xs font-mono font-bold">
          {activeSkillIndex + 1} / {skills.length} Active
        </span>
      </div>

      {/* Connected Skill Node Graph */}
      <div className="relative py-4 space-y-6">
        {skills.map((skill, idx) => {
          const status = getStatus(idx);
          const theme = getModuleTheme(idx);
          const xpReward = 50 + skill.difficulty * 25;
          const nodePKnow = idx === activeSkillIndex ? pKnow : idx < activeSkillIndex ? 0.92 : 0.15;

          const statusStyles: Record<SkillNodeStatus, { bg: string; border: string; badge: string; text: string }> = {
            MASTERED: {
              bg: "bg-[#34D399]/15 hover:bg-[#34D399]/25",
              border: "border-[#34D399]/60",
              badge: "bg-[#34D399]/20 text-[#34D399] border-[#34D399]/40",
              text: "text-[#34D399]",
            },
            IN_PROGRESS: {
              bg: "bg-[#1B1B3A] hover:bg-[#1B1B3A]/90 glow-box-cyan",
              border: "border-[#22D3EE]",
              badge: "bg-[#22D3EE]/20 text-[#22D3EE] border-[#22D3EE]/40 animate-pulse",
              text: "text-[#22D3EE]",
            },
            AVAILABLE: {
              bg: "bg-[#1B1B3A]/60 hover:bg-[#1B1B3A]/80",
              border: "border-[#7C3AED]/50",
              badge: "bg-[#7C3AED]/20 text-[#7C3AED] border-[#7C3AED]/40",
              text: "text-[#7C3AED]",
            },
            LOCKED: {
              bg: "bg-[#0A0A1A]/50 opacity-60",
              border: "border-white/10",
              badge: "bg-white/5 text-slate-500 border-white/10",
              text: "text-slate-500",
            },
          };

          const s = statusStyles[status];

          return (
            <div key={skill.id || idx} className="relative">
              {/* Vertical Connecting SVG Path */}
              {idx < skills.length - 1 && (
                <div className="absolute left-6 top-14 bottom-[-24px] w-0.5 bg-gradient-to-b from-[#7C3AED]/60 to-[#22D3EE]/60 z-0" />
              )}

              {/* Skill Node Row */}
              <div
                onClick={() => setSelectedNodeIndex(idx)}
                className={`relative z-10 p-4 rounded-2xl border ${s.border} ${s.bg} transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 group`}
              >
                <div className="flex items-center gap-3.5 truncate">
                  {/* Node Status Badge Icon */}
                  <div
                    className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 shadow-lg ${s.border} ${s.bg}`}
                  >
                    {status === "MASTERED" && <CheckCircle2 className="w-6 h-6 text-[#34D399]" />}
                    {status === "IN_PROGRESS" && <SquidAsset name={theme.assetName} alt={theme.themeName} width={32} height={32} />}
                    {status === "AVAILABLE" && <Sparkles className="w-5 h-5 text-[#7C3AED]" />}
                    {status === "LOCKED" && <Lock className="w-5 h-5 text-slate-500" />}
                  </div>

                  <div className="truncate space-y-0.5">
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                        Module {idx + 1}
                      </span>
                      <span className={`text-[9px] font-mono font-bold px-2 py-0.2 rounded-full border ${s.badge}`}>
                        {status.replace("_", " ")}
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-white font-heading truncate">
                      {skill.name}
                    </h4>

                    <div className="flex items-center gap-3 text-[10px] font-mono text-[#94A3B8]">
                      <span>Mastery: {Math.round(nodePKnow * 100)}%</span>
                      <span>•</span>
                      <span>Reward: +{xpReward} XP</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-mono text-[#22D3EE] font-bold group-hover:translate-x-1 transition-transform">
                    Details →
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Skill Detail Drawer Modal */}
      {selectedSkill && selectedTheme && selectedStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#1B1B3A] border border-[#22D3EE]/50 rounded-3xl p-6 shadow-2xl space-y-5 glow-box-cyan overflow-hidden my-auto">
            {/* Close Button */}
            <button
              onClick={() => setSelectedNodeIndex(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-[#0A0A1A] border border-white/10 flex items-center justify-center p-2 shrink-0">
                <SquidAsset name={selectedTheme.assetName} alt={selectedTheme.themeName} width={40} height={40} />
              </div>
              <div>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${selectedTheme.badgeStyle}`}>
                  {selectedTheme.intensityLabel}
                </span>
                <h3 className="text-base font-bold text-white font-heading mt-1">
                  {selectedSkill.name}
                </h3>
              </div>
            </div>

            {/* Skill Attributes Card */}
            <div className="bg-[#0A0A1A] border border-white/10 rounded-2xl p-4 space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-slate-400">Current Status:</span>
                <span className="text-[#22D3EE] font-bold uppercase">{selectedStatus.replace("_", " ")}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-slate-400">Difficulty Rating:</span>
                <span className="text-[#FBBF24] font-bold">Level {selectedSkill.difficulty} / 5</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-slate-400">Completion Reward:</span>
                <span className="text-[#34D399] font-bold">+{50 + selectedSkill.difficulty * 25} XP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Prerequisite Skill:</span>
                <span className="text-slate-200">{selectedNodeIndex === 0 ? "None (Core Entry)" : `Module ${selectedNodeIndex}`}</span>
              </div>
            </div>

            {/* Dominant Start Quest Button */}
            <div className="space-y-2 pt-2">
              <Link
                href="/quest"
                onClick={() => {
                  if (onSelectSkill && selectedNodeIndex !== null) onSelectSkill(selectedNodeIndex);
                  setSelectedNodeIndex(null);
                }}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#7C3AED] via-[#22D3EE] to-[#34D399] hover:opacity-95 text-black font-black text-sm transition-all shadow-lg shadow-[#7C3AED]/30 flex items-center justify-center gap-2 cursor-pointer font-heading tracking-wide uppercase"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start Skill Quest Now →</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
