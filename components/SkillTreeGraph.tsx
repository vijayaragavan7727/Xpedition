"use client";

import React, { useState } from "react";
import Link from "next/link";
import XpAsset from "@/components/XpAsset";
import { getModuleTheme } from "@/lib/moduleThemes";
import { Skill } from "@/lib/types";
import { Lock, Sparkles, Trophy, Play, CheckCircle2, ChevronRight, X, Compass, Terminal, Cpu, Target, Zap, Crown } from "lucide-react";

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
    <div className="bg-[#0D0D1A] border border-[#00F0FF]/30 rounded-3xl p-5 sm:p-6 space-y-6 shadow-2xl relative overflow-hidden glow-cyan">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h3 className="text-base font-bold text-white font-heading flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#00F0FF]" />
            Interactive RPG Skill Tree
          </h3>
          <p className="text-xs text-[#94A3B8] font-mono mt-0.5">
            Tap any skill node to view prerequisites, mastery, & start quest
          </p>
        </div>

        <span className="px-3 py-1 rounded-full bg-[#A855F7]/20 border border-[#A855F7]/40 text-[#00F0FF] text-xs font-mono font-bold">
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
              bg: "bg-[#00FF87]/15 hover:bg-[#00FF87]/25",
              border: "border-[#00FF87]",
              badge: "bg-[#00FF87]/20 text-[#00FF87] border-[#00FF87]/40",
              text: "text-[#00FF87]",
            },
            IN_PROGRESS: {
              bg: "bg-[#000000] hover:bg-[#0D0D1A] glow-purple ring-2 ring-[#00F0FF]/50",
              border: "border-[#A855F7]",
              badge: "bg-[#A855F7]/20 text-[#00F0FF] border-[#A855F7]/40 animate-pulse",
              text: "text-[#00F0FF]",
            },
            AVAILABLE: {
              bg: "bg-[#000000]/60 hover:bg-[#000000]",
              border: "border-[#00F0FF]/60",
              badge: "bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/40",
              text: "text-[#00F0FF]",
            },
            LOCKED: {
              bg: "bg-[#000000]/40 opacity-60",
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
                <div className="absolute left-6 top-14 bottom-[-24px] w-0.5 bg-gradient-to-b from-[#00F0FF]/60 to-[#A855F7]/60 z-0" />
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
                    {status === "MASTERED" && <CheckCircle2 className="w-6 h-6 text-[#00FF87]" />}
                    {status === "IN_PROGRESS" && <XpAsset name={theme.iconName} alt={theme.themeName} width={28} height={28} className="text-[#00F0FF]" />}
                    {status === "AVAILABLE" && <Sparkles className="w-5 h-5 text-[#00F0FF]" />}
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

                    {/* 3 Sub-Levels (Basics, Intermediate, Advanced) */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                          nodePKnow >= 0.35
                            ? "bg-[#00FF87]/20 border-[#00FF87]/50 text-[#00FF87]"
                            : "bg-[#00F0FF]/10 border-[#00F0FF]/30 text-[#00F0FF]"
                        }`}
                      >
                        L1 Basics: {nodePKnow >= 0.35 ? "TEST PASSED" : "MODULE READ"}
                      </span>

                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                          nodePKnow >= 0.65
                            ? "bg-[#00FF87]/20 border-[#00FF87]/50 text-[#00FF87]"
                            : nodePKnow >= 0.35
                            ? "bg-[#A855F7]/20 border-[#A855F7]/40 text-[#00F0FF]"
                            : "bg-white/5 border-white/10 text-slate-500"
                        }`}
                      >
                        L2 Inter: {nodePKnow >= 0.65 ? "TEST PASSED" : nodePKnow >= 0.35 ? "AVAILABLE" : "LOCKED"}
                      </span>

                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                          nodePKnow >= 0.85
                            ? "bg-[#00FF87]/20 border-[#00FF87]/50 text-[#00FF87]"
                            : "bg-white/5 border-white/10 text-slate-500"
                        }`}
                      >
                        L3 Adv: {nodePKnow >= 0.85 ? "TEST PASSED" : "LOCKED"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-mono text-[#00F0FF] font-bold group-hover:translate-x-1 transition-transform">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#0D0D1A] border border-[#00F0FF]/50 rounded-3xl p-6 shadow-2xl space-y-5 glow-cyan overflow-hidden my-auto">
            {/* Close Button */}
            <button
              onClick={() => setSelectedNodeIndex(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-[#000000] border border-white/10 flex items-center justify-center p-2 shrink-0 text-[#00F0FF]">
                <XpAsset name={selectedTheme.iconName} alt={selectedTheme.themeName} width={36} height={36} />
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
            <div className="bg-[#000000] border border-white/10 rounded-2xl p-4 space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-slate-400">Current Status:</span>
                <span className="text-[#00F0FF] font-bold uppercase">{selectedStatus.replace("_", " ")}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-slate-400">Difficulty Rating:</span>
                <span className="text-[#FFB800] font-bold">Level {selectedSkill.difficulty} / 5</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-slate-400">Completion Reward:</span>
                <span className="text-[#00FF87] font-bold">+{50 + selectedSkill.difficulty * 25} XP</span>
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
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#00F0FF] via-[#A855F7] to-[#00FF87] hover:opacity-95 text-black font-black text-sm transition-all shadow-xl shadow-[#00F0FF]/30 flex items-center justify-center gap-2 cursor-pointer font-heading tracking-wide uppercase"
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
