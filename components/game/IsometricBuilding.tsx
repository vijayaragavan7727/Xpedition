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
  Layers,
  Sparkles,
  Zap,
  Star,
} from 'lucide-react';

export type BuildingCategory =
  | 'core'
  | 'spire'
  | 'arena'
  | 'rewards'
  | 'lab'
  | 'career'
  | 'locked';

export interface IsometricBuildingData {
  id: string;
  name: string;
  type: BuildingCategory;
  conceptId?: string;
  level: number;
  maxLevel?: number;
  masteryPercent: number;
  retentionRisk?: number; // >0.35 means under siege / fading
  gridX: number; // isometric grid coordinate X
  gridY: number; // isometric grid coordinate Y
  isLocked?: boolean;
  unlockRequirement?: string;
  zoneName?: string;
  subtitle?: string;
}

interface IsometricBuildingProps {
  building: IsometricBuildingData;
  isSelected?: boolean;
  onClick: (building: IsometricBuildingData) => void;
  tileWidth?: number;
  tileHeight?: number;
}

export const IsometricBuilding: React.FC<IsometricBuildingProps> = ({
  building,
  isSelected = false,
  onClick,
  tileWidth = 160,
  tileHeight = 80,
}) => {
  const isDecaying = (building.retentionRisk || 0) > 0.35;
  const isFullyMastered = building.masteryPercent >= 85;
  const isLocked = Boolean(building.isLocked);

  // Dynamic Theme Colors based on building type
  let primaryColor = '#00F0FF';
  let accentColor = '#7928CA';
  let glowColor = 'rgba(0, 240, 255, 0.5)';
  let bgGradient = 'from-cyan-500/20 to-blue-600/20';

  if (isLocked) {
    primaryColor = '#64748B';
    accentColor = '#334155';
    glowColor = 'rgba(100, 116, 139, 0.2)';
    bgGradient = 'from-slate-700/20 to-slate-900/20';
  } else if (building.type === 'core') {
    primaryColor = '#00F0FF';
    accentColor = '#A855F7';
    glowColor = 'rgba(168, 85, 247, 0.7)';
    bgGradient = 'from-[#A855F7]/30 to-[#00F0FF]/30';
  } else if (building.type === 'arena') {
    primaryColor = '#FF2E63';
    accentColor = '#FFB800';
    glowColor = 'rgba(255, 46, 99, 0.7)';
    bgGradient = 'from-red-600/30 to-rose-900/30';
  } else if (building.type === 'rewards') {
    primaryColor = '#FFB800';
    accentColor = '#F59E0B';
    glowColor = 'rgba(255, 184, 0, 0.6)';
    bgGradient = 'from-amber-500/30 to-yellow-700/30';
  } else if (building.type === 'lab') {
    primaryColor = '#00FF87';
    accentColor = '#059669';
    glowColor = 'rgba(0, 255, 135, 0.6)';
    bgGradient = 'from-emerald-500/30 to-teal-800/30';
  } else if (building.type === 'career') {
    primaryColor = '#F472F6';
    accentColor = '#8B5CF6';
    glowColor = 'rgba(244, 114, 246, 0.6)';
    bgGradient = 'from-fuchsia-500/30 to-purple-800/30';
  } else if (isDecaying) {
    primaryColor = '#FF2E63';
    accentColor = '#991B1B';
    glowColor = 'rgba(255, 46, 99, 0.8)';
    bgGradient = 'from-red-600/30 to-rose-950/30';
  }

  // Calculate Isometric screen coordinates relative to base center
  const posX = (building.gridX - building.gridY) * (tileWidth / 2);
  const posY = (building.gridX + building.gridY) * (tileHeight / 2);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick(building);
      }}
      className={`absolute cursor-pointer select-none transition-all duration-300 group ${
        isLocked ? 'opacity-70 hover:opacity-90' : 'hover:scale-105 active:scale-95'
      }`}
      style={{
        left: `calc(50% + ${posX}px)`,
        top: `calc(48% + ${posY}px)`,
        transform: 'translate(-50%, -82%)',
        zIndex: 25 + Math.round((building.gridX + building.gridY) * 2),
      }}
    >
      {/* 1. Selection Spotlight Aura */}
      {isSelected && (
        <div className="absolute inset-0 -m-6 rounded-full blur-2xl animate-pulse pointer-events-none z-0"
             style={{ backgroundColor: glowColor, transform: 'scale(1.5)' }} />
      )}

      {/* 2. Floating Status Indicators */}
      {/* Decaying / Under Siege Alert */}
      {!isLocked && isDecaying && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-red-600 text-white text-[10px] font-mono font-black flex items-center gap-1.5 shadow-[0_0_16px_#FF2E63] animate-bounce z-40 whitespace-nowrap border border-white/40">
          <AlertTriangle className="w-3.5 h-3.5 fill-amber-300 text-black" />
          <span>UNDER SIEGE</span>
        </div>
      )}

      {/* Fortified Crown Alert */}
      {!isLocked && !isDecaying && isFullyMastered && (
        <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-[#00FF87]/20 border border-[#00FF87]/80 text-[#00FF87] text-[9px] font-mono font-bold flex items-center gap-1 shadow-[0_0_12px_rgba(0,255,135,0.4)] z-40 backdrop-blur-md">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>FORTIFIED</span>
        </div>
      )}

      {/* Locked Padlock Alert */}
      {isLocked && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-black/90 border border-slate-600 text-slate-400 text-[9px] font-mono font-bold flex items-center gap-1 z-40">
          <Lock className="w-3 h-3 text-slate-400" />
          <span>LOCKED</span>
        </div>
      )}

      {/* 3. Rich 2.5D Isometric SVG Structure */}
      <div className="relative w-36 h-36 flex items-center justify-center filter drop-shadow-[0_18px_24px_rgba(0,0,0,0.85)]">
        <svg viewBox="0 0 140 140" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id={`gradTop_${building.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2A1B4E" />
              <stop offset="60%" stopColor={accentColor} />
              <stop offset="100%" stopColor={primaryColor} />
            </linearGradient>
            <linearGradient id={`gradLeft_${building.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0B061A" />
              <stop offset="100%" stopColor="#1E1238" />
            </linearGradient>
            <linearGradient id={`gradRight_${building.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#060310" />
              <stop offset="100%" stopColor="#150B28" />
            </linearGradient>
            <filter id={`glow_${building.id}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Isometric Foundation Base Diamond */}
          <polygon
            points="70,95 120,120 70,145 20,120"
            fill="#090515"
            stroke={primaryColor}
            strokeWidth="1.5"
            opacity="0.9"
          />
          {/* Secondary glowing floor ring */}
          <polygon
            points="70,102 110,122 70,140 30,122"
            fill="none"
            stroke={accentColor}
            strokeWidth="1"
            strokeDasharray="4 2"
            opacity="0.8"
          />

          {/* ========================================================= */}
          {/* 1. CENTRAL KNOWLEDGE CITADEL (Main HQ / Town Hall)        */}
          {/* ========================================================= */}
          {building.type === 'core' && (
            <g>
              {/* Lower Tier Walls */}
              <polygon points="35,82 70,100 70,62 35,46" fill={`url(#gradLeft_${building.id})`} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
              <polygon points="70,100 105,82 105,46 70,62" fill={`url(#gradRight_${building.id})`} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
              <polygon points="70,62 105,46 70,30 35,46" fill="#1C1138" stroke={primaryColor} strokeWidth="1.2" />

              {/* Glowing window slits */}
              <line x1="45" y1="70" x2="60" y2="78" stroke="#00F0FF" strokeWidth="2" strokeLinecap="round" />
              <line x1="80" y1="78" x2="95" y2="70" stroke="#00F0FF" strokeWidth="2" strokeLinecap="round" />

              {/* Upper Spire Fortress */}
              <polygon points="46,50 70,62 70,26 46,15" fill={`url(#gradLeft_${building.id})`} stroke="#A855F7" strokeWidth="1" />
              <polygon points="70,62 94,50 94,15 70,26" fill={`url(#gradRight_${building.id})`} stroke="#A855F7" strokeWidth="1" />
              <polygon points="70,26 94,15 70,4 46,15" fill={`url(#gradTop_${building.id})`} stroke="#00F0FF" strokeWidth="1.8" />

              {/* Floating Knowledge Reactor Crystal */}
              <polygon points="70,-8 78,5 70,18 62,5" fill="#00F0FF" stroke="#FFFFFF" strokeWidth="1.2" className="animate-pulse" filter={`url(#glow_${building.id})`} />
              <polygon points="70,-2 74,5 70,12 66,5" fill="#FFFFFF" />

              {/* Energy Orbital Rings */}
              <ellipse cx="70" cy="5" rx="16" ry="6" fill="none" stroke="#A855F7" strokeWidth="1.2" opacity="0.8" strokeDasharray="6 3" />
            </g>
          )}

          {/* ========================================================= */}
          {/* 2. SURVIVOR ARENA / BATTLE WARZONE                        */}
          {/* ========================================================= */}
          {building.type === 'arena' && (
            <g>
              {/* Outer Arena Colosseum Ramparts */}
              <polygon points="32,88 70,106 70,66 32,50" fill={`url(#gradLeft_${building.id})`} stroke="#FF2E63" strokeWidth="1" />
              <polygon points="70,106 108,88 108,50 70,66" fill={`url(#gradRight_${building.id})`} stroke="#FF2E63" strokeWidth="1" />
              <polygon points="70,66 108,50 70,34 32,50" fill="#1A0512" stroke="#FF2E63" strokeWidth="1.5" />

              {/* Inner Battle Arena Pit */}
              <polygon points="70,62 98,48 70,36 42,48" fill="#3B081A" stroke="#FFB800" strokeWidth="1.5" />

              {/* Arena Battle Banner / Crossed Plasma Blades */}
              <line x1="58" y1="20" x2="82" y2="44" stroke="#FF2E63" strokeWidth="3" strokeLinecap="round" />
              <line x1="82" y1="20" x2="58" y2="44" stroke="#FFB800" strokeWidth="3" strokeLinecap="round" />
              <polygon points="70,12 76,22 70,32 64,22" fill="#FF2E63" stroke="#FFFFFF" strokeWidth="1" className="animate-pulse" />

              {/* Perimeter Red Alarm Beacons */}
              <circle cx="32" cy="50" r="3" fill="#FF2E63" className="animate-ping" opacity="0.75" />
              <circle cx="108" cy="50" r="3" fill="#FF2E63" className="animate-ping" opacity="0.75" />
            </g>
          )}

          {/* ========================================================= */}
          {/* 3. REWARD & LOOT VAULT                                   */}
          {/* ========================================================= */}
          {building.type === 'rewards' && (
            <g>
              {/* Vault Stronghold Body */}
              <polygon points="34,86 70,104 70,62 34,46" fill={`url(#gradLeft_${building.id})`} stroke="#FFB800" strokeWidth="1" />
              <polygon points="70,104 106,86 106,46 70,62" fill={`url(#gradRight_${building.id})`} stroke="#FFB800" strokeWidth="1" />
              <polygon points="70,62 106,46 70,30 34,46" fill="#241400" stroke="#FFB800" strokeWidth="1.5" />

              {/* Vault Vault Dome / Safe Hatch */}
              <ellipse cx="70" cy="46" rx="22" ry="11" fill={`url(#gradTop_${building.id})`} stroke="#FFE066" strokeWidth="1.5" />
              <circle cx="70" cy="46" r="7" fill="#FFB800" stroke="#FFFFFF" strokeWidth="1.2" className="animate-pulse" />

              {/* Floating Golden Coin / Gem Hologram */}
              <circle cx="70" cy="18" r="9" fill="#FFB800" stroke="#FFFFFF" strokeWidth="1.5" filter={`url(#glow_${building.id})`} />
              <text x="70" y="22" textAnchor="middle" fill="#000" fontSize="10" fontWeight="bold">🪙</text>
            </g>
          )}

          {/* ========================================================= */}
          {/* 4. NEURAL SKILL LAB                                      */}
          {/* ========================================================= */}
          {building.type === 'lab' && (
            <g>
              {/* Quantum Lab Compound */}
              <polygon points="36,86 70,102 70,64 36,50" fill={`url(#gradLeft_${building.id})`} stroke="#00FF87" strokeWidth="1" />
              <polygon points="70,102 104,86 104,50 70,64" fill={`url(#gradRight_${building.id})`} stroke="#00FF87" strokeWidth="1" />
              <polygon points="70,64 104,50 70,36 36,50" fill="#051C14" stroke="#00FF87" strokeWidth="1.5" />

              {/* Holographic Neural Sphere / Atom */}
              <circle cx="70" cy="24" r="12" fill="none" stroke="#00FF87" strokeWidth="1.5" strokeDasharray="4 2" className="animate-spin" style={{ transformOrigin: '70px 24px' }} />
              <ellipse cx="70" cy="24" rx="16" ry="6" fill="none" stroke="#00F0FF" strokeWidth="1.2" opacity="0.8" />
              <circle cx="70" cy="24" r="4.5" fill="#00FF87" stroke="#FFFFFF" strokeWidth="1" className="animate-pulse" />

              {/* Glowing Bio-Tubes */}
              <line x1="48" y1="68" x2="48" y2="80" stroke="#00FF87" strokeWidth="3" strokeLinecap="round" />
              <line x1="92" y1="68" x2="92" y2="80" stroke="#00FF87" strokeWidth="3" strokeLinecap="round" />
            </g>
          )}

          {/* ========================================================= */}
          {/* 5. CAREER HUB & INDUSTRY LAUNCHPAD                       */}
          {/* ========================================================= */}
          {building.type === 'career' && (
            <g>
              {/* Spaceport Base & Runway */}
              <polygon points="30,88 70,108 70,66 30,48" fill={`url(#gradLeft_${building.id})`} stroke="#F472F6" strokeWidth="1" />
              <polygon points="70,108 110,88 110,48 70,66" fill={`url(#gradRight_${building.id})`} stroke="#F472F6" strokeWidth="1" />
              <polygon points="70,66 110,48 70,30 30,48" fill="#1C0926" stroke="#F472F6" strokeWidth="1.5" />

              {/* Holographic Radar / Satellite Antenna */}
              <ellipse cx="70" cy="32" rx="20" ry="10" fill="none" stroke="#8B5CF6" strokeWidth="1.2" strokeDasharray="3 3" />
              <polygon points="62,28 70,8 78,28" fill={`url(#gradTop_${building.id})`} stroke="#FFFFFF" strokeWidth="1.2" />
              <circle cx="70" cy="6" r="3.5" fill="#F472F6" stroke="#FFFFFF" strokeWidth="1" className="animate-ping" opacity="0.85" />

              {/* Career Rocket / Beacon */}
              <polygon points="70,-4 74,4 70,12 66,4" fill="#00F0FF" />
            </g>
          )}

          {/* ========================================================= */}
          {/* 6. COURSE CONCEPT SPIRE (Learning Module)                */}
          {/* ========================================================= */}
          {building.type === 'spire' && (
            <g>
              {/* Tier 1 Base Spire */}
              <polygon points="38,88 70,104 70,64 38,50" fill={`url(#gradLeft_${building.id})`} stroke="rgba(255,255,255,0.18)" strokeWidth="0.8" />
              <polygon points="70,104 102,88 102,50 70,64" fill={`url(#gradRight_${building.id})`} stroke="rgba(255,255,255,0.18)" strokeWidth="0.8" />
              <polygon points="70,64 102,50 70,36 38,50" fill={`url(#gradTop_${building.id})`} stroke={primaryColor} strokeWidth="1.5" />

              {/* Level Upgrades Visual Rings */}
              {building.level >= 2 && (
                <ellipse cx="70" cy="48" rx="18" ry="8" fill="none" stroke={primaryColor} strokeWidth="1.2" opacity="0.9" strokeDasharray="4 2" />
              )}
              {building.level >= 3 && (
                <polygon points="50,44 70,54 70,30 50,22" fill={`url(#gradLeft_${building.id})`} stroke="#A855F7" strokeWidth="0.8" />
              )}
              {building.level >= 3 && (
                <polygon points="70,54 90,44 90,22 70,30" fill={`url(#gradRight_${building.id})`} stroke="#A855F7" strokeWidth="0.8" />
              )}
              {building.level >= 4 && (
                <ellipse cx="70" cy="22" rx="12" ry="5" fill="none" stroke="#F472F6" strokeWidth="1.2" opacity="0.9" />
              )}

              {/* Apex Floating Mastery Jewel */}
              <polygon points="70,8 76,18 70,28 64,18" fill={primaryColor} stroke="#FFFFFF" strokeWidth="1" className="animate-pulse" filter={`url(#glow_${building.id})`} />
              <circle cx="70" cy="18" r="2.5" fill="#FFFFFF" />
            </g>
          )}

          {/* ========================================================= */}
          {/* 7. LOCKED SECTOR BARRIER                                  */}
          {/* ========================================================= */}
          {building.type === 'locked' && (
            <g>
              <polygon points="40,88 70,102 70,66 40,54" fill="#131722" stroke="#475569" strokeWidth="1" strokeDasharray="4 3" />
              <polygon points="70,102 100,88 100,54 70,66" fill="#0C0F17" stroke="#475569" strokeWidth="1" strokeDasharray="4 3" />
              <polygon points="70,66 100,54 70,42 40,54" fill="#1E293B" stroke="#64748B" strokeWidth="1.2" />

              {/* Laser Security Grid Shield */}
              <polygon points="70,20 96,38 70,56 44,38" fill="none" stroke="#FF2E63" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.7" />
              <circle cx="70" cy="38" r="6" fill="#1E293B" stroke="#EF4444" strokeWidth="1.5" />
              <text x="70" y="42" textAnchor="middle" fill="#EF4444" fontSize="10" fontWeight="bold">🔒</text>
            </g>
          )}
        </svg>
      </div>

      {/* 4. Building Level, Icon & Name Badge */}
      <div className="flex flex-col items-center -mt-3">
        {/* Name Pill */}
        <div
          className={`px-3 py-1 rounded-full bg-[#100B24]/95 border text-white text-[11px] font-bold tracking-tight shadow-xl backdrop-blur-md flex items-center gap-1.5 max-w-[150px] truncate transition-all ${
            isSelected
              ? 'border-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.6)] scale-105'
              : 'border-white/20 hover:border-white/40'
          }`}
        >
          {building.type === 'core' && <Layers className="w-3.5 h-3.5 text-[#00F0FF] shrink-0" />}
          {building.type === 'arena' && <Swords className="w-3.5 h-3.5 text-red-400 shrink-0" />}
          {building.type === 'rewards' && <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
          {building.type === 'lab' && <FlaskConical className="w-3.5 h-3.5 text-[#00FF87] shrink-0" />}
          {building.type === 'career' && <Briefcase className="w-3.5 h-3.5 text-fuchsia-400 shrink-0" />}
          {building.type === 'spire' && <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
          {isLocked && <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />}

          <span className="truncate">{building.name}</span>
        </div>

        {/* Level & Mastery % Pill */}
        {!isLocked && (
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/10 text-[#00F0FF] border border-white/15">
              Lv.{building.level}
            </span>
            <span
              className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/60 border ${
                isDecaying
                  ? 'text-red-400 border-red-500/40'
                  : isFullyMastered
                  ? 'text-[#00FF87] border-[#00FF87]/40'
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
