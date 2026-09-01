'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IsometricBuildingData } from './IsometricBuilding';
import { getBaseResources, getUpgradeCost, saveBuildingLevel, addRewards } from '@/lib/economyEngine';
import { soundFx } from '@/lib/soundEngine';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  ArrowUpCircle,
  Play,
  Sparkles,
  Swords,
  Trophy,
  BookOpen,
  FlaskConical,
  Briefcase,
  Layers,
  Lock,
  Flame,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Target,
} from 'lucide-react';

interface BuildingDetailModalProps {
  building: IsometricBuildingData | null;
  onClose: () => void;
  onBuildingUpdated?: () => void;
  totalMastery?: number;
}

export const BuildingDetailModal: React.FC<BuildingDetailModalProps> = ({
  building,
  onClose,
  onBuildingUpdated,
  totalMastery = 50,
}) => {
  const router = useRouter();
  const [resources, setResources] = useState(getBaseResources());
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [careerTargetSaved, setCareerTargetSaved] = useState<string | null>(null);

  useEffect(() => {
    setResources(getBaseResources());
  }, [building]);

  if (!building) return null;

  const cost = getUpgradeCost(building.level);
  const canAfford = resources.gold >= cost.gold && resources.crystals >= cost.crystals;
  const isMaxLevel = building.level >= 5;
  const isDecaying = (building.retentionRisk || 0) > 0.35;
  const isLocked = Boolean(building.isLocked);

  const handleUpgrade = () => {
    if (!canAfford || isMaxLevel || isUpgrading || isLocked) return;
    setIsUpgrading(true);
    soundFx.playUpgrade();

    // Deduct cost and level up
    addRewards(-cost.gold, -cost.crystals, 25);
    const newLevel = building.level + 1;
    saveBuildingLevel(building.id, newLevel);
    building.level = newLevel;
    setResources(getBaseResources());

    setTimeout(() => {
      setIsUpgrading(false);
      if (onBuildingUpdated) onBuildingUpdated();
    }, 400);
  };

  const handleLaunchQuest = () => {
    soundFx.playTick();
    onClose();
    if (building.conceptId) {
      router.push(`/quest?concept=${encodeURIComponent(building.conceptId)}&mode=arena`);
    } else {
      router.push('/quest?mode=arena');
    }
  };

  const handleLaunchLesson = () => {
    soundFx.playTick();
    onClose();
    if (building.conceptId) {
      router.push(`/learn?concept=${encodeURIComponent(building.conceptId)}`);
    } else {
      router.push('/learn');
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-[#0F0B24] border border-white/20 rounded-3xl p-5 sm:p-6 shadow-[0_0_60px_rgba(0,240,255,0.25)] flex flex-col gap-4.5 max-h-[90vh] overflow-y-auto"
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xs shadow-lg ${
                building.type === 'core'
                  ? 'bg-gradient-to-tr from-[#A855F7] to-[#00F0FF] text-black'
                  : building.type === 'arena'
                  ? 'bg-gradient-to-tr from-red-600 to-amber-500 text-white'
                  : building.type === 'rewards'
                  ? 'bg-gradient-to-tr from-amber-400 to-yellow-600 text-black'
                  : building.type === 'lab'
                  ? 'bg-gradient-to-tr from-emerald-400 to-[#00F0FF] text-black'
                  : building.type === 'career'
                  ? 'bg-gradient-to-tr from-fuchsia-500 to-purple-600 text-white'
                  : 'bg-gradient-to-tr from-[#00F0FF] to-[#A855F7] text-black'
              }`}
            >
              {isLocked ? (
                <Lock className="w-5 h-5 text-slate-300" />
              ) : (
                `Lv.${building.level}`
              )}
            </div>

            <div>
              <h3 className="text-lg font-black text-white tracking-wide flex items-center gap-2">
                <span>{building.name}</span>
                {!isLocked && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-[#00F0FF] border border-white/10">
                    Tier {building.level}
                  </span>
                )}
              </h3>
              <p className="text-xs text-[#00F0FF]/80 font-mono capitalize">
                {building.type === 'core'
                  ? 'Knowledge Citadel (Central Command)'
                  : building.type === 'arena'
                  ? 'Survivor Arena (Battle Warzone)'
                  : building.type === 'rewards'
                  ? 'Quantum Loot Vault (Resource Depository)'
                  : building.type === 'lab'
                  ? 'Neural Skill Lab (Synthesis & Mastery)'
                  : building.type === 'career'
                  ? 'Career Hub & Industry Launchpad'
                  : 'Course Concept Spire'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* LOCKED SECTOR VIEW */}
        {isLocked ? (
          <div className="bg-slate-900/80 border border-slate-700/60 rounded-2xl p-5 flex flex-col gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-black/50 border border-slate-600 flex items-center justify-center mx-auto text-slate-400">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-slate-200 text-base">Frontier Zone Locked</div>
              <p className="text-xs text-slate-400 mt-1">
                {building.unlockRequirement ||
                  'Expand your knowledge base and upgrade your Knowledge Citadel to breach this perimeter.'}
              </p>
            </div>

            <div className="w-full bg-black/60 rounded-full h-2.5 overflow-hidden border border-white/10 mt-2">
              <div
                className="h-full bg-gradient-to-r from-slate-600 to-cyan-500 rounded-full"
                style={{ width: `${Math.min(100, (totalMastery || 0) * 1.2)}%` }}
              />
            </div>
            <div className="text-[10px] font-mono text-slate-400">
              Current Base Progress: <span className="text-[#00F0FF]">{totalMastery}%</span>
            </div>
          </div>
        ) : (
          <>
            {/* 1. STATUS & ALERTS BANNER */}
            {isDecaying ? (
              <div className="bg-red-500/15 border border-red-500/40 rounded-2xl p-3.5 flex items-center gap-3 shadow-[0_0_20px_rgba(255,46,99,0.2)]">
                <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 animate-bounce" />
                <div className="text-xs">
                  <div className="font-black text-red-300 uppercase tracking-wider">
                    Memory Decay Detected!
                  </div>
                  <div className="text-red-300/80 text-[11px] mt-0.5">
                    Retention risk is critical. Defend this sector in the Survivor Arena to restore stability.
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#00FF87]/10 border border-[#00FF87]/25 rounded-2xl p-3.5 flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-[#00FF87] shrink-0" />
                <div className="text-xs">
                  <div className="font-black text-[#00FF87] uppercase tracking-wider">
                    Sector Fortified & Operational
                  </div>
                  <div className="text-slate-300 text-[11px] mt-0.5">
                    Defenses active. Generating passive resource yield and mastery resonance.
                  </div>
                </div>
              </div>
            )}

            {/* 2. SPECIFIC BUILDING CONTENT VIEWS */}

            {/* A. COURSE SPIRE VIEW */}
            {building.type === 'spire' && (
              <div className="bg-[#140E2E] border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400 font-bold">Concept Mastery Level</span>
                  <span className="text-[#00F0FF] font-black text-sm">{building.masteryPercent}%</span>
                </div>
                <div className="h-3 w-full bg-black/60 rounded-full overflow-hidden border border-white/15 p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-[#00F0FF] via-[#A855F7] to-[#F472F6] rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(0,240,255,0.6)]"
                    style={{ width: `${building.masteryPercent}%` }}
                  />
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Interactive module zone. Complete lesson modules and defend questions in the Arena to fortify this spire to Tier 5.
                </p>
              </div>
            )}

            {/* B. CAREER HUB & INDUSTRY ZONE VIEW */}
            {building.type === 'career' && (
              <div className="bg-[#140E2E] border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-fuchsia-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Industry Learning & Future Pathways
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
                    Future-Ready
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Bridge your core learning milestones with verified real-world engineering standards and upcoming career paths.
                </p>

                {/* Industry Tracks Preview */}
                <div className="space-y-2 pt-1">
                  {[
                    {
                      id: 'track_ai',
                      title: 'AI & Machine Learning Systems',
                      desc: 'Autonomous agents, neural architectures & prompt synthesis',
                      match: '94% Aligned',
                    },
                    {
                      id: 'track_cloud',
                      title: 'Cloud & Distributed Architecture',
                      desc: 'Scalable backends, event queues & containerization',
                      match: '88% Aligned',
                    },
                    {
                      id: 'track_fullstack',
                      title: 'Full-Stack Modern Platforms',
                      desc: 'Reactive interfaces, state management & edge APIs',
                      match: '96% Aligned',
                    },
                  ].map((track) => (
                    <div
                      key={track.id}
                      onClick={() => {
                        soundFx.playTick();
                        setCareerTargetSaved(track.title);
                      }}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        careerTargetSaved === track.title
                          ? 'bg-fuchsia-950/40 border-fuchsia-500/80 shadow-[0_0_12px_rgba(244,114,246,0.3)]'
                          : 'bg-black/40 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>{track.title}</span>
                          {careerTargetSaved === track.title && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#00FF87]" />
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">{track.desc}</div>
                      </div>
                      <span className="text-[9px] font-mono font-bold text-fuchsia-300 px-2 py-0.5 rounded bg-fuchsia-500/10 border border-fuchsia-500/20 whitespace-nowrap">
                        {track.match}
                      </span>
                    </div>
                  ))}
                </div>

                {careerTargetSaved && (
                  <div className="text-[11px] font-mono text-[#00FF87] flex items-center gap-1.5 bg-[#00FF87]/10 p-2 rounded-xl border border-[#00FF87]/30">
                    <CheckCircle2 className="w-4 h-4 text-[#00FF87] shrink-0" />
                    <span>Selected target path: <b>{careerTargetSaved}</b>. Curricula will prioritize this domain.</span>
                  </div>
                )}
              </div>
            )}

            {/* C. SURVIVOR ARENA VIEW */}
            {building.type === 'arena' && (
              <div className="bg-[#140E2E] border border-white/10 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400 font-bold">Battle Readiness</span>
                  <span className="text-red-400 font-black">100% READY</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  The Survivor Arena pits your knowledge against high-tension countdown timers. Defeat questions to defend decaying spires and claim huge Gold and Crystal bounties.
                </p>
              </div>
            )}

            {/* D. LOOT VAULT VIEW */}
            {building.type === 'rewards' && (
              <div className="bg-[#140E2E] border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400 font-bold">Depository Yield</span>
                  <span className="text-amber-300 font-bold">+50 Gold / +15 Crystals per win</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                  <div className="p-2 rounded-xl bg-black/40 border border-amber-500/20">
                    <div className="text-amber-300 font-black">🪙 {resources.gold}</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">Knowledge Gold</div>
                  </div>
                  <div className="p-2 rounded-xl bg-black/40 border border-cyan-500/20">
                    <div className="text-cyan-300 font-black">💎 {resources.crystals}</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">Mastery Gems</div>
                  </div>
                  <div className="p-2 rounded-xl bg-black/40 border border-fuchsia-500/20">
                    <div className="text-fuchsia-300 font-black">🧪 {resources.techElixir}</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">Tech Elixir</div>
                  </div>
                </div>
              </div>
            )}

            {/* E. NEURAL LAB VIEW */}
            {building.type === 'lab' && (
              <div className="bg-[#140E2E] border border-white/10 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400 font-bold">Neural Retention Synthesis</span>
                  <span className="text-[#00FF87] font-bold">Adaptive AI Active</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Continuous cognitive memory tracking automatically detects fading concepts and schedules reinforcement drills to keep mastery permanent.
                </p>
              </div>
            )}

            {/* 3. UPGRADE ACTION CARD */}
            {!isMaxLevel ? (
              <div className="bg-[#140E2E]/80 border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                    UPGRADE TO TIER {building.level + 1}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs font-mono font-bold">
                    <span
                      className={
                        resources.gold >= cost.gold ? 'text-amber-300' : 'text-red-400'
                      }
                    >
                      🪙 {cost.gold}
                    </span>
                    <span
                      className={
                        resources.crystals >= cost.crystals ? 'text-cyan-300' : 'text-red-400'
                      }
                    >
                      💎 {cost.crystals}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleUpgrade}
                  disabled={!canAfford || isUpgrading}
                  className={`px-5 py-2.5 rounded-xl text-xs font-black font-mono transition-all flex items-center gap-1.5 ${
                    canAfford
                      ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 text-black hover:opacity-95 shadow-[0_0_20px_rgba(251,191,36,0.4)] cursor-pointer'
                      : 'bg-white/10 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <ArrowUpCircle className="w-4 h-4" />
                  <span>{isUpgrading ? 'Upgrading...' : 'Upgrade Tier'}</span>
                </button>
              </div>
            ) : (
              <div className="text-center py-2 text-xs font-mono text-amber-400 font-bold bg-amber-400/10 rounded-2xl border border-amber-400/20">
                👑 MAX FORTRESS LEVEL REACHED (TIER 5)
              </div>
            )}

            {/* 4. PRIMARY LAUNCH ACTIONS */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={handleLaunchQuest}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-[#A855F7] to-[#00F0FF] text-white font-black text-xs uppercase tracking-wider shadow-[0_0_30px_rgba(0,240,255,0.4)] hover:opacity-95 transition-all flex items-center justify-center gap-2 group cursor-pointer border border-white/20"
              >
                <Swords className="w-4 h-4 fill-white group-hover:scale-110 transition-transform" />
                <span>
                  {building.type === 'arena'
                    ? 'Enter Survivor Arena'
                    : building.type === 'spire'
                    ? 'Defend Spire in Arena'
                    : 'Battle in Survivor Arena'}
                </span>
              </button>

              {building.conceptId && (
                <button
                  onClick={handleLaunchLesson}
                  className="w-full py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-[#00F0FF]" />
                  <span>Study Topic Lesson</span>
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
