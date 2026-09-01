'use client';

import React from 'react';
import {
  AlertTriangle,
  ShieldCheck,
  Lock,
  Swords,
  Trophy,
  FlaskConical,
  Briefcase,
  BookOpen,
  Sparkles,
  Zap,
  Flame,
} from 'lucide-react';

export type BuildingCategory =
  | 'core'
  | 'spire'
  | 'arena'
  | 'rewards'
  | 'lab'
  | 'career'
  | 'locked';

export interface WorldBuildingData {
  id: string;
  name: string;
  type: BuildingCategory;
  conceptId?: string;
  level: number;
  maxLevel?: number;
  masteryPercent: number;
  retentionRisk?: number; // >0.35 means under siege / fading
  x: number; // Top-down map pixel coordinate X
  y: number; // Top-down map pixel coordinate Y
  width?: number;
  height?: number;
  isLocked?: boolean;
  unlockRequirement?: string;
  zoneName?: string;
  subtitle?: string;
  buildingTheme?: string;
}

interface TopDownBuildingProps {
  building: WorldBuildingData;
  isSelected?: boolean;
  onClick: (building: WorldBuildingData) => void;
}

export const TopDownBuilding: React.FC<TopDownBuildingProps> = ({
  building,
  isSelected = false,
  onClick,
}) => {
  const isDecaying = (building.retentionRisk || 0) > 0.35;
  const isFullyMastered = building.masteryPercent >= 85;
  const isLocked = Boolean(building.isLocked);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick(building);
      }}
      className={`absolute cursor-pointer select-none transition-transform duration-200 group ${
        isLocked ? 'opacity-75 hover:opacity-90' : 'hover:scale-105 active:scale-95'
      }`}
      style={{
        left: `${building.x}px`,
        top: `${building.y}px`,
        transform: 'translate(-50%, -50%)',
        zIndex: 20 + Math.floor(building.y / 10),
      }}
    >
      {/* Selection Halo */}
      {isSelected && (
        <div className="absolute inset-0 -m-4 rounded-full bg-[#00F0FF]/30 blur-xl animate-pulse pointer-events-none" />
      )}

      {/* Floating Status Alerts */}
      {/* Under Siege Alert */}
      {!isLocked && isDecaying && (
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-gradient-to-r from-red-600 to-amber-600 text-white text-[9px] font-mono font-black flex items-center gap-1 shadow-[0_0_12px_#FF2E63] animate-bounce z-40 border border-white/60 whitespace-nowrap">
          <Flame className="w-3 h-3 fill-amber-300 text-amber-200" />
          <span>UNDER SIEGE</span>
        </div>
      )}

      {/* Fortified Crown Alert */}
      {!isLocked && !isDecaying && isFullyMastered && (
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-emerald-900/90 border border-emerald-400 text-emerald-300 text-[9px] font-mono font-bold flex items-center gap-1 shadow-lg z-40 whitespace-nowrap">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>FORTIFIED</span>
        </div>
      )}

      {/* Locked Padlock */}
      {isLocked && (
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-slate-900/95 border border-slate-600 text-slate-300 text-[9px] font-mono font-bold flex items-center gap-1 z-40 whitespace-nowrap">
          <Lock className="w-3 h-3 text-slate-400" />
          <span>LOCKED</span>
        </div>
      )}

      {/* Ground Cast Shadow */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-[85%] h-7 bg-black/45 rounded-full blur-[3px] pointer-events-none z-0" />

      {/* ========================================================================= */}
      {/* 2.5D TOP-DOWN ARTWORK FOR EACH LOCATION TYPE                             */}
      {/* ========================================================================= */}
      <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
        {/* 1. KNOWLEDGE CITADEL (Grand Castle Headquarters) */}
        {building.type === 'core' && (
          <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-xl overflow-visible">
            {/* Stone Cobblestone Base Apron */}
            <ellipse cx="60" cy="92" rx="48" ry="18" fill="#4B5563" stroke="#374151" strokeWidth="2" />
            <ellipse cx="60" cy="90" rx="44" ry="15" fill="#6B7280" />

            {/* Castle Lower Fort Walls */}
            <rect x="25" y="45" width="70" height="42" rx="4" fill="#374151" stroke="#1F2937" strokeWidth="2" />
            {/* Wall Textures / Quoins */}
            <rect x="28" y="50" width="12" height="6" fill="#4B5563" />
            <rect x="80" y="50" width="12" height="6" fill="#4B5563" />
            <rect x="28" y="65" width="12" height="6" fill="#4B5563" />
            <rect x="80" y="65" width="12" height="6" fill="#4B5563" />

            {/* Corner Turrets */}
            <rect x="20" y="32" width="18" height="40" rx="2" fill="#4B5563" stroke="#1F2937" strokeWidth="1.5" />
            <polygon points="20,32 29,14 38,32" fill="#2563EB" stroke="#1E40AF" strokeWidth="1.5" />
            
            <rect x="82" y="32" width="18" height="40" rx="2" fill="#4B5563" stroke="#1F2937" strokeWidth="1.5" />
            <polygon points="82,32 91,14 100,32" fill="#2563EB" stroke="#1E40AF" strokeWidth="1.5" />

            {/* Grand Arched Gate / Entrance */}
            <path d="M 50 87 L 50 64 A 10 10 0 0 1 70 64 L 70 87 Z" fill="#111827" stroke="#F59E0B" strokeWidth="2" />
            <path d="M 52 87 L 52 66 A 8 8 0 0 1 68 66 L 68 87 Z" fill="#7C2D12" />
            {/* Glowing Rune in Gate */}
            <circle cx="60" cy="74" r="3" fill="#00F0FF" className="animate-pulse" />

            {/* Central Keep Tower & Grand Blue/Gold Pyramid Roof */}
            <rect x="40" y="24" width="40" height="30" fill="#4B5563" stroke="#1F2937" strokeWidth="1.5" />
            <polygon points="35,26 60,2 85,26" fill="#1D4ED8" stroke="#F59E0B" strokeWidth="2" />
            <polygon points="42,24 60,6 78,24" fill="#3B82F6" />

            {/* Golden Apex Spire & Flag */}
            <line x1="60" y1="2" x2="60" y2="-8" stroke="#F59E0B" strokeWidth="2" />
            <polygon points="60,-8 74,-4 60,0" fill="#F59E0B" stroke="#B45309" strokeWidth="0.5" />

            {/* Knowledge Glow Reactor Gem */}
            <circle cx="60" cy="38" r="5" fill="#00F0FF" stroke="#FFFFFF" strokeWidth="1.5" className="animate-pulse" />
          </svg>
        )}

        {/* 2. SURVIVOR ARENA (Battle Colosseum) */}
        {building.type === 'arena' && (
          <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-xl overflow-visible">
            {/* Red Dirt / Sand Colosseum Platform */}
            <ellipse cx="60" cy="90" rx="46" ry="18" fill="#7F1D1D" stroke="#991B1B" strokeWidth="2" />
            <ellipse cx="60" cy="88" rx="42" ry="15" fill="#9A3412" />

            {/* Arena Fortified Circular Walls */}
            <ellipse cx="60" cy="62" rx="38" ry="20" fill="#450A0A" stroke="#7F1D1D" strokeWidth="2" />
            <ellipse cx="60" cy="60" rx="34" ry="17" fill="#18181B" />

            {/* Inner Battle Sand Pit */}
            <ellipse cx="60" cy="62" rx="26" ry="12" fill="#D97706" opacity="0.85" />

            {/* Colosseum Pillar Posts & Flaming Braziers */}
            <circle cx="28" cy="56" r="4" fill="#B45309" stroke="#78350F" strokeWidth="1.5" />
            <circle cx="28" cy="53" r="2.5" fill="#EF4444" className="animate-ping" />

            <circle cx="92" cy="56" r="4" fill="#B45309" stroke="#78350F" strokeWidth="1.5" />
            <circle cx="92" cy="53" r="2.5" fill="#EF4444" className="animate-ping" />

            {/* Crossed Battle Swords Crest */}
            <g transform="translate(44, 22)">
              <line x1="4" y1="4" x2="28" y2="28" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
              <line x1="28" y1="4" x2="4" y2="28" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
              <line x1="4" y1="4" x2="28" y2="28" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="28" y1="4" x2="4" y2="28" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="16" cy="16" r="5" fill="#DC2626" stroke="#FFFFFF" strokeWidth="1" />
            </g>
          </svg>
        )}

        {/* 3. REWARD VAULT (Golden Treasury Stronghold) */}
        {building.type === 'rewards' && (
          <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-xl overflow-visible">
            {/* Paved Gold-Tinted Foundation */}
            <ellipse cx="60" cy="90" rx="44" ry="16" fill="#78350F" stroke="#92400E" strokeWidth="2" />
            <ellipse cx="60" cy="88" rx="40" ry="14" fill="#92400E" />

            {/* Stronghold Body */}
            <rect x="30" y="48" width="60" height="38" rx="4" fill="#451A03" stroke="#B45309" strokeWidth="2" />

            {/* Golden Vault Gilded Dome */}
            <ellipse cx="60" cy="46" rx="28" ry="16" fill="#F59E0B" stroke="#D97706" strokeWidth="2" />
            <ellipse cx="60" cy="43" rx="24" ry="12" fill="#FDE047" />

            {/* Heavy Iron/Gold Vault Safe Door */}
            <circle cx="60" cy="68" r="13" fill="#1C1917" stroke="#F59E0B" strokeWidth="2" />
            <circle cx="60" cy="68" r="9" fill="#78350F" />
            <circle cx="60" cy="68" r="4" fill="#FDE047" className="animate-pulse" />

            {/* Treasure Chest on Apex */}
            <g transform="translate(50, 10)">
              <rect x="2" y="8" width="16" height="10" rx="2" fill="#B45309" stroke="#78350F" strokeWidth="1" />
              <ellipse cx="10" cy="8" rx="8" ry="3" fill="#F59E0B" stroke="#B45309" strokeWidth="1" />
              <circle cx="10" cy="12" r="1.5" fill="#FDE047" />
            </g>
          </svg>
        )}

        {/* 4. NEURAL SKILL LAB (Alchemist & Science Observatory) */}
        {building.type === 'lab' && (
          <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-xl overflow-visible">
            {/* Emerald Moss / Stone Apron */}
            <ellipse cx="60" cy="90" rx="44" ry="16" fill="#064E3B" stroke="#047857" strokeWidth="2" />
            <ellipse cx="60" cy="88" rx="40" ry="14" fill="#047857" />

            {/* Lab Tower Structure */}
            <rect x="32" y="46" width="56" height="40" rx="4" fill="#065F46" stroke="#064E3B" strokeWidth="2" />

            {/* Emerald Glass Dome */}
            <ellipse cx="60" cy="44" rx="26" ry="16" fill="#10B981" stroke="#059669" strokeWidth="2" />
            <ellipse cx="60" cy="41" rx="21" ry="12" fill="#34D399" opacity="0.8" />

            {/* Arched Lab Door with Glowing Flask */}
            <path d="M 52 86 L 52 66 A 8 8 0 0 1 68 66 L 68 86 Z" fill="#022C22" stroke="#34D399" strokeWidth="1.5" />
            <circle cx="60" cy="74" r="3" fill="#10B981" className="animate-pulse" />

            {/* Observatory Telescope / Spire */}
            <polygon points="56,26 64,26 62,8 58,8" fill="#1E293B" stroke="#059669" strokeWidth="1" />
            <circle cx="60" cy="6" r="4" fill="#00F0FF" stroke="#FFFFFF" strokeWidth="1.2" className="animate-ping" opacity="0.75" />
          </svg>
        )}

        {/* 5. CAREER HUB (Grand Industry Guildhall) */}
        {building.type === 'career' && (
          <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-xl overflow-visible">
            {/* Paved Platform */}
            <ellipse cx="60" cy="90" rx="46" ry="17" fill="#4C1D95" stroke="#6D28D9" strokeWidth="2" />
            <ellipse cx="60" cy="88" rx="42" ry="14" fill="#5B21B6" />

            {/* Guildhall Main Building */}
            <rect x="28" y="48" width="64" height="38" rx="4" fill="#3B0764" stroke="#6D28D9" strokeWidth="2" />

            {/* Purple Gabled Roof */}
            <polygon points="22,50 60,18 98,50" fill="#7C3AED" stroke="#C084FC" strokeWidth="2" />
            <polygon points="30,48 60,24 90,48" fill="#8B5CF6" />

            {/* Entrance Pillars & Portal */}
            <rect x="42" y="60" width="4" height="26" fill="#DDD6FE" />
            <rect x="74" y="60" width="4" height="26" fill="#DDD6FE" />
            <path d="M 50 86 L 50 66 A 10 10 0 0 1 70 66 L 70 86 Z" fill="#1E1B4B" stroke="#C084FC" strokeWidth="1.5" />

            {/* Guild Compass / Airship Beacon Crest */}
            <circle cx="60" cy="36" r="6" fill="#F472F6" stroke="#FFFFFF" strokeWidth="1.5" className="animate-pulse" />
            <line x1="60" y1="18" x2="60" y2="4" stroke="#C084FC" strokeWidth="2" />
            <polygon points="60,4 72,9 60,14" fill="#F472F6" />
          </svg>
        )}

        {/* 6. COURSE ACADEMY / SPIRE BUILDING (Learning Module) */}
        {building.type === 'spire' && (
          <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-xl overflow-visible">
            {/* Grass & Stone Foundation */}
            <ellipse cx="60" cy="90" rx="42" ry="15" fill="#374151" stroke="#4B5563" strokeWidth="1.5" />
            <ellipse cx="60" cy="88" rx="38" ry="13" fill="#4B5563" />

            {/* Academy Tower Body */}
            <rect x="34" y="46" width="52" height="40" rx="3" fill="#1F2937" stroke="#374151" strokeWidth="1.5" />

            {/* Tiered Gabled / Conical Roof based on Level */}
            <polygon points="28,48 60,18 92,48" fill="#0D9488" stroke="#14B8A6" strokeWidth="2" />
            <polygon points="34,46 60,24 86,46" fill="#14B8A6" />

            {/* Doorway with Lamp */}
            <path d="M 52 86 L 52 66 A 8 8 0 0 1 68 66 L 68 86 Z" fill="#111827" stroke="#2DD4BF" strokeWidth="1.5" />
            <circle cx="60" cy="74" r="2.5" fill="#FDE047" className="animate-pulse" />

            {/* Level Tier Ring Indicator */}
            {building.level >= 2 && (
              <rect x="42" y="52" width="36" height="4" rx="2" fill="#F59E0B" />
            )}
            {building.level >= 3 && (
              <circle cx="60" cy="34" r="5" fill="#00F0FF" stroke="#FFFFFF" strokeWidth="1" className="animate-pulse" />
            )}
          </svg>
        )}

        {/* 7. LOCKED FRONTIER ZONE */}
        {building.type === 'locked' && (
          <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-lg opacity-85 overflow-visible">
            {/* Dark Stone Foundation */}
            <ellipse cx="60" cy="90" rx="40" ry="14" fill="#18181B" stroke="#27272A" strokeWidth="1.5" />
            {/* Ancient Ruin Columns */}
            <rect x="36" y="48" width="10" height="38" rx="2" fill="#27272A" stroke="#3F3F46" strokeWidth="1" />
            <rect x="74" y="48" width="10" height="38" rx="2" fill="#27272A" stroke="#3F3F46" strokeWidth="1" />
            <polygon points="30,50 60,32 90,50" fill="#18181B" stroke="#3F3F46" strokeWidth="1.5" />

            {/* Laser Lock Shroud */}
            <circle cx="60" cy="62" r="14" fill="#09090B" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="4 2" />
            <text x="60" y="67" textAnchor="middle" fill="#EF4444" fontSize="14" fontWeight="bold">🔒</text>
          </svg>
        )}
      </div>

      {/* Building Label, Level Badge & Mastery Bar */}
      <div className="flex flex-col items-center -mt-2.5 z-30">
        {/* Name Pill with Wooden/Metal Game Border */}
        <div
          className={`px-3 py-1 rounded-full border text-white text-[11px] font-black tracking-tight shadow-xl backdrop-blur-md flex items-center gap-1.5 max-w-[150px] truncate transition-all ${
            isSelected
              ? 'bg-[#1E1B4B] border-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.7)] scale-105'
              : 'bg-[#18181B]/95 border-amber-400/40 hover:border-amber-400 text-slate-100'
          }`}
        >
          {building.type === 'core' && <span className="text-blue-400">🏰</span>}
          {building.type === 'arena' && <Swords className="w-3.5 h-3.5 text-red-400 shrink-0" />}
          {building.type === 'rewards' && <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
          {building.type === 'lab' && <FlaskConical className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
          {building.type === 'career' && <Briefcase className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
          {building.type === 'spire' && <BookOpen className="w-3.5 h-3.5 text-teal-400 shrink-0" />}
          {isLocked && <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />}

          <span className="truncate">{building.name}</span>
        </div>

        {/* Level & Mastery Badge */}
        {!isLocked && (
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[9px] font-mono font-black px-1.5 py-0.2 rounded-md bg-amber-500 text-black shadow">
              Lv.{building.level}
            </span>
            <span
              className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-md bg-black/80 border ${
                isDecaying
                  ? 'text-red-400 border-red-500/50'
                  : isFullyMastered
                  ? 'text-emerald-300 border-emerald-500/50'
                  : 'text-slate-300 border-white/10'
              }`}
            >
              {building.masteryPercent}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
