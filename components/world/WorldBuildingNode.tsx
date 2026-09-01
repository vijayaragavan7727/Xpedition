'use client';

import React from 'react';
import { GameBuildingState } from '@/lib/engine/gameWorldAdapter';
import { Lock, Sparkles, CheckCircle2 } from 'lucide-react';

interface WorldBuildingNodeProps {
  building: GameBuildingState;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function WorldBuildingNode({
  building,
  isSelected = false,
  onClick,
}: WorldBuildingNodeProps) {
  const isLocked = building.status === 'locked';
  const isCompleted = building.status === 'completed';

  return (
    <div
      onClick={onClick}
      style={{
        left: `${building.gridX}%`,
        top: `${building.gridY}%`,
      }}
      className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer select-none transition-all duration-300 group z-20 ${
        isLocked ? 'opacity-70 grayscale-[35%]' : 'hover:scale-105 active:scale-95'
      }`}
    >
      {/* 1. Ground Drop Shadow */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-28 sm:w-36 h-10 sm:h-12 bg-black/50 rounded-full blur-md -z-10" />

      {/* 2. Selection Ring Indicator */}
      {isSelected && (
        <div className="absolute -inset-3 rounded-3xl border-2 border-[#38BDF8] shadow-[0_0_20px_rgba(56,189,248,0.8)] animate-pulse pointer-events-none -z-10" />
      )}

      {/* 3. Original Stylized Game Building Art Architecture */}
      <div className="relative flex flex-col items-center">
        {/* ========================================================= */}
        {/* TYPE 1: KNOWLEDGE CORE (Town Hall Citadel) */}
        {/* ========================================================= */}
        {building.type === 'knowledge_core' && (
          <div className="relative w-28 sm:w-36 h-28 sm:h-36 flex flex-col items-center justify-end">
            {/* Top Castle Battlements & Royal Banner */}
            <div className="absolute top-1 flex items-center gap-1.5 z-10">
              <div className="w-2.5 h-6 bg-slate-700 rounded-t-sm border border-slate-600 shadow-sm" />
              <div className="w-10 h-7 bg-gradient-to-b from-[#0284C7] to-[#0369A1] rounded-t-lg border border-cyan-400 shadow-md flex items-center justify-center">
                <span className="text-xs">👑</span>
              </div>
              <div className="w-2.5 h-6 bg-slate-700 rounded-t-sm border border-slate-600 shadow-sm" />
            </div>

            {/* Main Keep Citadel Tier */}
            <div className="w-24 sm:w-32 h-20 sm:h-24 bg-gradient-to-b from-[#334155] via-[#1E293B] to-[#0F172A] rounded-2xl border-2 border-slate-500/80 shadow-2xl flex flex-col items-center justify-between p-2 relative overflow-hidden">
              {/* Slate Roof Trim */}
              <div className="w-full h-3 bg-gradient-to-r from-[#0284C7] via-[#38BDF8] to-[#0284C7] rounded-md shadow-sm" />

              {/* Glowing Heart Crystal Portal */}
              <div className="w-7 sm:w-9 h-8 sm:h-10 rounded-t-full bg-gradient-to-t from-[#0284C7] to-[#38BDF8] border-2 border-cyan-300 shadow-[0_0_15px_rgba(56,189,248,0.9)] flex items-center justify-center">
                <div className="w-3.5 h-4 bg-white/90 rounded-full animate-pulse blur-[1px]" />
              </div>

              {/* Arched Stone Foundation Steps */}
              <div className="w-20 sm:w-26 h-2.5 bg-slate-700 rounded-sm border-t border-slate-500" />
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TYPE 2: COURSE ACADEMY (Observatory Dome & Library) */}
        {/* ========================================================= */}
        {building.type === 'course_academy' && (
          <div className="relative w-24 sm:w-32 h-24 sm:h-32 flex flex-col items-center justify-end">
            {/* Rotating Celestial Astrolabe Rings & Copper Dome */}
            <div className="relative w-14 sm:w-18 h-14 sm:h-18 rounded-full bg-gradient-to-tr from-[#9333EA] via-[#C084FC] to-[#E9D5FF] border-2 border-purple-300 shadow-[0_0_18px_rgba(192,132,252,0.8)] flex items-center justify-center -mb-4 z-10">
              <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full border border-dashed border-white/60 animate-spin" />
              <span className="absolute text-base sm:text-lg">📚</span>
            </div>

            {/* Observatory Base Walls */}
            <div className="w-22 sm:w-28 h-16 sm:h-20 bg-gradient-to-b from-[#475569] to-[#1E293B] rounded-2xl border-2 border-purple-400/60 shadow-xl flex flex-col items-center justify-end p-1.5">
              <div className="w-6 h-7 bg-purple-950 border border-purple-400 rounded-t-md flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-purple-300 animate-ping" />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TYPE 3: SKILL LAB (Alchemical Mana Condenser Vat) */}
        {/* ========================================================= */}
        {building.type === 'skill_lab' && (
          <div className="relative w-24 sm:w-30 h-24 sm:h-30 flex flex-col items-center justify-end">
            {/* Bubbling Glass Mana Vat */}
            <div className="relative w-16 sm:w-20 h-16 sm:h-20 rounded-2xl bg-gradient-to-b from-purple-900/60 via-purple-600/40 to-purple-950 border-2 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.8)] flex flex-col items-center justify-end p-1 z-10 backdrop-blur-sm">
              {/* Bubbling Liquid Level */}
              <div className="w-full h-10 sm:h-12 bg-gradient-to-t from-[#9333EA] to-[#C084FC] rounded-xl flex items-center justify-center overflow-hidden">
                <span className="text-sm sm:text-base animate-bounce">🔮</span>
              </div>
            </div>

            {/* Brass Foundation & Pipes */}
            <div className="w-22 sm:w-26 h-8 sm:h-10 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800 rounded-xl border border-amber-400/60 shadow-lg -mt-2" />
          </div>
        )}

        {/* ========================================================= */}
        {/* TYPE 4: CHALLENGE ARENA (Battle Colosseum) */}
        {/* ========================================================= */}
        {building.type === 'challenge_arena' && (
          <div className="relative w-26 sm:w-32 h-24 sm:h-30 flex flex-col items-center justify-end">
            {/* Arena Ring with Dual Swords */}
            <div className="w-24 sm:w-28 h-20 sm:h-24 rounded-full bg-gradient-to-b from-[#7F1D1D] via-[#991B1B] to-[#450A0A] border-3 border-amber-400 shadow-[0_0_20px_rgba(239,68,68,0.7)] flex flex-col items-center justify-center p-2 relative">
              <div className="w-16 sm:w-18 h-12 sm:h-14 rounded-full bg-[#B45309]/80 border border-amber-300 flex items-center justify-center shadow-inner">
                <span className="text-xl sm:text-2xl drop-shadow-md">⚔️</span>
              </div>
              {/* Torch Braziers */}
              <div className="absolute -left-1 top-2 w-3 h-3 rounded-full bg-orange-500 animate-ping" />
              <div className="absolute -right-1 top-2 w-3 h-3 rounded-full bg-orange-500 animate-ping" />
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TYPE 5: REWARD VAULT (Gold Treasury & Mine) */}
        {/* ========================================================= */}
        {building.type === 'reward_vault' && (
          <div className="relative w-24 sm:w-30 h-24 sm:h-30 flex flex-col items-center justify-end">
            {/* Reinforced Iron & Gold Door */}
            <div className="w-22 sm:w-26 h-18 sm:h-22 bg-gradient-to-b from-[#B45309] via-[#D97706] to-[#78350F] rounded-2xl border-2 border-amber-300 shadow-[0_0_18px_rgba(245,158,11,0.8)] flex flex-col items-center justify-between p-2">
              <div className="w-full flex justify-between px-1">
                <span className="w-2 h-2 rounded-full bg-amber-200" />
                <span className="w-2 h-2 rounded-full bg-amber-200" />
              </div>

              {/* Vault Dial & Overflowing Gold Sacks */}
              <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 border-2 border-amber-600 flex items-center justify-center shadow-md">
                <span className="text-lg">🪙</span>
              </div>

              <div className="w-16 h-2 bg-slate-900 rounded-full" />
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TYPE 6: PRACTICE GROUNDS (Builder & Shader Forge) */}
        {/* ========================================================= */}
        {building.type === 'practice_grounds' && (
          <div className="relative w-24 sm:w-30 h-24 sm:h-30 flex flex-col items-center justify-end">
            {/* Chimney with Puffing Smoke */}
            <div className="absolute top-0 right-4 w-3.5 h-8 bg-slate-700 rounded-t-sm border border-slate-600 flex flex-col items-center">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-400/80 -mt-3 animate-ping" />
            </div>

            {/* Timber Roof & Workshop Walls */}
            <div className="w-22 sm:w-28 h-16 sm:h-20 bg-gradient-to-b from-[#92400E] to-[#451A03] rounded-2xl border-2 border-amber-500/80 shadow-xl flex flex-col items-center justify-end p-2 relative">
              {/* Sloped Roof */}
              <div className="w-full h-3 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 rounded-md -mt-4 shadow-sm" />

              {/* Glowing Anvil */}
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-base sm:text-lg">⚒️</span>
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse shadow-[0_0_8px_#FB923C]" />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TYPE 7: CAREER HUB (Industry Learning Relay) */}
        {/* ========================================================= */}
        {building.type === 'career_hub' && (
          <div className="relative w-24 sm:w-30 h-24 sm:h-30 flex flex-col items-center justify-end">
            {/* Satellite Beacon Spire */}
            <div className="relative w-16 sm:w-20 h-20 sm:h-24 bg-gradient-to-b from-[#0E7490] via-[#155E75] to-[#082F49] rounded-2xl border-2 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.8)] flex flex-col items-center justify-between p-2">
              <div className="w-4 h-4 rounded-full bg-cyan-300 shadow-[0_0_12px_#22D3EE] animate-pulse flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
              <span className="text-xl">🚀</span>
              <div className="w-12 h-1.5 bg-cyan-400/40 rounded-full" />
            </div>
          </div>
        )}

        {/* 4. Floating Name Badge & Level Tag */}
        <div className="mt-1 flex flex-col items-center gap-0.5">
          <div className="px-2.5 py-0.5 rounded-lg bg-[#0F172A]/90 border border-white/20 text-white font-mono text-[10px] sm:text-[11px] font-bold shadow-xl flex items-center gap-1 backdrop-blur-md">
            {isLocked ? (
              <>
                <Lock className="w-3 h-3 text-slate-400" />
                <span className="text-slate-400">{building.name}</span>
              </>
            ) : isCompleted ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-[#00FF87]" />
                <span>{building.name}</span>
                <span className="text-amber-300">★</span>
              </>
            ) : (
              <>
                <span>{building.name}</span>
                <span className="text-cyan-400">Lv.{building.level}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
