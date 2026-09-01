'use client';

import React from 'react';
import Link from 'next/link';
import { GameBuildingState } from '@/lib/engine/gameWorldAdapter';
import { X, Sparkles, Zap, ChevronRight, Trophy, ShieldCheck, Hammer, Lock } from 'lucide-react';

interface BuildingDetailModalProps {
  building: GameBuildingState | null;
  onClose: () => void;
  onUpgrade?: (buildingId: string) => void;
}

export default function BuildingDetailModal({
  building,
  onClose,
  onUpgrade,
}: BuildingDetailModalProps) {
  if (!building) return null;

  const isLocked = building.status === 'locked';

  const getBuildingEmoji = (type: string) => {
    switch (type) {
      case 'knowledge_core':
        return '🏰';
      case 'course_academy':
        return '📚';
      case 'skill_lab':
        return '🔮';
      case 'challenge_arena':
        return '⚔️';
      case 'reward_vault':
        return '🪙';
      case 'practice_grounds':
        return '⚒️';
      case 'career_hub':
        return '🚀';
      default:
        return '🏛️';
    }
  };

  const getThemeColor = (type: string) => {
    switch (type) {
      case 'knowledge_core':
        return '#38BDF8';
      case 'course_academy':
        return '#C084FC';
      case 'skill_lab':
        return '#A855F7';
      case 'challenge_arena':
        return '#EF4444';
      case 'reward_vault':
        return '#F59E0B';
      case 'practice_grounds':
        return '#F97316';
      case 'career_hub':
        return '#06B6D4';
      default:
        return '#38BDF8';
    }
  };

  const themeColor = getThemeColor(building.type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none font-sans">
      <div className="w-full max-w-md bg-[#0F172A] border-2 border-white/20 rounded-[28px] p-5 sm:p-6 space-y-4 shadow-[0_25px_70px_rgba(0,0,0,0.95)] relative overflow-hidden">
        {/* Top Header Light Glow Accent */}
        <div
          className="absolute -top-16 -right-16 w-44 h-44 rounded-full blur-[60px] pointer-events-none opacity-40"
          style={{ backgroundColor: themeColor }}
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center text-base font-bold transition-all cursor-pointer shadow-md"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 1. Building Header (Icon, Name, Level badge) */}
        <div className="flex items-center gap-3.5">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-xl border-2 border-white/20"
            style={{
              background: `radial-gradient(circle, ${themeColor}55 0%, #020617 100%)`,
            }}
          >
            {getBuildingEmoji(building.type)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-sans font-black text-lg sm:text-xl text-white truncate">
                {building.name}
              </h2>
              <span
                className="font-mono text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border"
                style={{
                  backgroundColor: `${themeColor}22`,
                  borderColor: `${themeColor}88`,
                  color: themeColor,
                }}
              >
                Lv.{building.level}
              </span>
            </div>

            <p className="font-mono text-xs text-slate-400 font-medium truncate">
              {building.conceptName}
            </p>
          </div>
        </div>

        {/* 2. Progress / Mastery Stats Card */}
        <div className="p-4 rounded-2xl bg-[#020617]/70 border border-white/10 space-y-2.5">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="text-slate-400 font-semibold">Mastery Progression</span>
            <span className="font-black text-[#00FF87]">{building.masteryPercent}% Mastered</span>
          </div>

          <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-[#38BDF8] via-[#00FF87] to-[#FACC15] rounded-full transition-all duration-500"
              style={{ width: `${building.masteryPercent}%` }}
            />
          </div>

          <p className="font-mono text-[11px] text-slate-300">
            {building.statsLabel}
          </p>
        </div>

        {/* 3. Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 text-center font-mono">
          <div className="p-3 rounded-xl bg-white/5 border border-white/5">
            <span className="text-[10px] text-slate-400 block uppercase font-semibold">Structure Tier</span>
            <span className="font-black text-sm text-cyan-300">Tier {building.level} Citadel</span>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/5">
            <span className="text-[10px] text-slate-400 block uppercase font-semibold">Quests Conquered</span>
            <span className="font-black text-sm text-amber-300">{building.questsCompleted} Solved</span>
          </div>
        </div>

        {/* 4. Action Buttons */}
        {isLocked ? (
          <div className="w-full h-12 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-400 font-mono font-bold text-xs flex items-center justify-center gap-2">
            <Lock className="w-4 h-4 text-slate-500" />
            <span>Unlocks with World Evolution Tier 3</span>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            {/* Direct 1-Tap Quest / Action Link */}
            <Link
              href={building.actionUrl}
              onClick={onClose}
              className="flex-1 h-12 rounded-xl text-white font-mono font-bold text-xs flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer shadow-lg border border-white/20"
              style={{
                background: `linear-gradient(135deg, ${themeColor} 0%, #1E1B4B 100%)`,
              }}
            >
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span>{building.actionText}</span>
              <ChevronRight className="w-4 h-4" />
            </Link>

            {/* Upgrade Citadel / Building Button */}
            <button
              type="button"
              onClick={() => {
                onUpgrade?.(building.id);
                onClose();
              }}
              className="h-12 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 font-mono font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              <Hammer className="w-4 h-4 text-amber-400" />
              <span>Upgrade</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
