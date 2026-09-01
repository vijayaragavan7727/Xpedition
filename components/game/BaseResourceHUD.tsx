'use client';

import React, { useState, useEffect } from 'react';
import { getBaseResources, BaseResources } from '@/lib/economyEngine';
import { getActiveHero, HeroCharacter } from '@/lib/heroEngine';
import { UserStoreData, calculateStreak } from '@/lib/store';
import {
  Shield,
  Clock,
  Zap,
  Target,
  Flame,
  Layers,
  Swords,
  Trophy,
  FlaskConical,
  Briefcase,
  BookOpen,
} from 'lucide-react';

interface BaseResourceHUDProps {
  townHallLevel?: number;
  storeData?: UserStoreData | null;
  onOpenHeroModal?: () => void;
  onOpenTownHall?: () => void;
  onSelectZone?: (zone: 'core' | 'spire' | 'arena' | 'rewards' | 'lab' | 'career') => void;
  activeZone?: string;
}

export const BaseResourceHUD: React.FC<BaseResourceHUDProps> = ({
  townHallLevel = 1,
  storeData,
  onOpenHeroModal,
  onOpenTownHall,
  onSelectZone,
  activeZone = 'core',
}) => {
  const [resources, setResources] = useState<BaseResources>({
    gold: 450,
    crystals: 85,
    techElixir: 120,
  });
  const [hero, setHero] = useState<HeroCharacter>(getActiveHero());

  useEffect(() => {
    const update = () => {
      setResources(getBaseResources());
      setHero(getActiveHero());
    };
    update();
    window.addEventListener('xpedition_resources_updated', update);
    window.addEventListener('xpedition_hero_updated', update);
    return () => {
      window.removeEventListener('xpedition_resources_updated', update);
      window.removeEventListener('xpedition_hero_updated', update);
    };
  }, []);

  const streak = storeData ? calculateStreak(storeData.attempts) : 0;
  const learnerName = storeData?.handle || 'Commander';
  const goalText = storeData?.goalText || 'Core Mastery';
  const totalConcepts = storeData?.concepts?.length || 0;
  const avgMastery =
    totalConcepts > 0
      ? Math.round(
          storeData!.concepts.reduce((acc, c) => acc + (c.masteryPercentage || 0), 0) /
            totalConcepts
        )
      : 50;

  // Level calculated from base town hall + attempts
  const playerLevel = Math.max(1, townHallLevel * 2 + Math.floor((storeData?.attempts?.length || 0) / 5));

  return (
    <div className="w-full flex flex-col gap-2 p-2 sm:p-4 select-none pointer-events-none">
      {/* Top Main Resource Bar */}
      <div className="w-full flex items-center justify-between gap-2">
        {/* Left: Player Profile & Hero Badge */}
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
          {/* Hero Avatar & Level Capsule */}
          <button
            onClick={onOpenHeroModal}
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl bg-[#100B24]/90 backdrop-blur-xl border border-white/15 shadow-xl hover:border-[#00F0FF]/50 transition-all cursor-pointer group text-left"
          >
            {/* Hero Icon with Level Badge */}
            <div className="relative">
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border border-white/20 shadow-md group-hover:scale-105 transition-transform"
                style={{ backgroundColor: `${hero.avatarSvgColor}25` }}
              >
                {hero.archetype === 'tactician' && <Shield className="w-4 h-4 text-[#00F0FF]" />}
                {hero.archetype === 'sage' && <Clock className="w-4 h-4 text-[#A855F7]" />}
                {hero.archetype === 'valkyrie' && <Zap className="w-4 h-4 text-[#FFB800]" />}
                {hero.archetype === 'striker' && <Target className="w-4 h-4 text-[#F472F6]" />}
              </div>
              <div className="absolute -bottom-1 -right-1 px-1 rounded bg-[#00F0FF] text-black font-mono font-black text-[8px] leading-tight shadow">
                Lv.{playerLevel}
              </div>
            </div>

            {/* Learner Handle & Goal */}
            <div className="hidden sm:block">
              <div className="text-xs font-bold text-white group-hover:text-[#00F0FF] transition-colors truncate max-w-[110px]">
                {learnerName}
              </div>
              <div className="text-[10px] font-mono text-[#00FF87] font-semibold flex items-center gap-1">
                <span>{hero.name.split(' ')[0]}</span>
                <span className="text-slate-500">•</span>
                <span className="text-[#00F0FF]">{hero.perk.badge}</span>
              </div>
            </div>
          </button>

          {/* Citadel Level Pill */}
          <button
            onClick={onOpenTownHall}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-[#100B24]/90 backdrop-blur-xl border border-white/15 shadow-xl hover:border-purple-400/50 transition-all cursor-pointer text-left"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#A855F7] to-[#00F0FF] flex items-center justify-center font-mono font-black text-xs text-black">
              {townHallLevel}
            </div>
            <div className="hidden md:block">
              <div className="text-[9px] font-mono text-slate-400 uppercase font-bold">CITADEL</div>
              <div className="text-[11px] font-bold text-slate-200">Tier {townHallLevel}</div>
            </div>
          </button>

          {/* Streak Flame Badge */}
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-2xl bg-[#100B24]/90 backdrop-blur-xl border border-amber-500/30 text-amber-300 shadow-xl font-mono text-xs font-black">
            <Flame className="w-4 h-4 fill-amber-400 text-amber-500 animate-pulse" />
            <span>{streak}d</span>
          </div>
        </div>

        {/* Right: Currency Counters (Gold, Crystals, Elixir, Shields) */}
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
          {/* Shields (Lives) indicator */}
          <div
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-2xl bg-[#100B24]/90 backdrop-blur-xl border border-cyan-500/30 text-cyan-300 shadow-xl font-mono text-xs font-bold"
            title="Active Base Defense Shields"
          >
            <Shield className="w-3.5 h-3.5 fill-[#00F0FF] text-[#00F0FF]" />
            <span className="text-[11px] font-black">4/4</span>
          </div>

          {/* Gold */}
          <div
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-2xl bg-[#100B24]/90 backdrop-blur-xl border border-amber-500/30 text-amber-300 shadow-xl font-mono text-xs font-bold"
            title="Knowledge Gold"
          >
            <span className="text-xs">🪙</span>
            <span>{resources.gold.toLocaleString()}</span>
          </div>

          {/* Crystals */}
          <div
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-2xl bg-[#100B24]/90 backdrop-blur-xl border border-cyan-500/30 text-cyan-300 shadow-xl font-mono text-xs font-bold"
            title="Mastery Crystals"
          >
            <span className="text-xs">💎</span>
            <span>{resources.crystals.toLocaleString()}</span>
          </div>

          {/* Tech Elixir (Desktop) */}
          <div
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-2xl bg-[#100B24]/90 backdrop-blur-xl border border-fuchsia-500/30 text-fuchsia-300 shadow-xl font-mono text-xs font-bold"
            title="Tech-Elixir"
          >
            <span className="text-xs">🧪</span>
            <span>{resources.techElixir}</span>
          </div>
        </div>
      </div>

      {/* Quick Zone Navigator Pill Bar (Centered & Interactive) */}
      {onSelectZone && (
        <div className="flex items-center justify-center gap-1 sm:gap-1.5 overflow-x-auto py-0.5 pointer-events-auto max-w-full">
          {[
            { id: 'core', label: 'Citadel', icon: Layers, color: 'text-cyan-400' },
            { id: 'spire', label: 'Courses', icon: BookOpen, color: 'text-purple-400' },
            { id: 'arena', label: 'Arena', icon: Swords, color: 'text-red-400' },
            { id: 'rewards', label: 'Vault', icon: Trophy, color: 'text-amber-400' },
            { id: 'lab', label: 'Skill Lab', icon: FlaskConical, color: 'text-emerald-400' },
            { id: 'career', label: 'Career Hub', icon: Briefcase, color: 'text-fuchsia-400' },
          ].map((zone) => {
            const Icon = zone.icon;
            const isActive = activeZone === zone.id;

            return (
              <button
                key={zone.id}
                onClick={() => onSelectZone(zone.id as any)}
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all backdrop-blur-md shadow-md cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#1C133B] border border-[#00F0FF] text-white shadow-[0_0_12px_rgba(0,240,255,0.4)] scale-105'
                    : 'bg-[#100B24]/80 border border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20'
                }`}
              >
                <Icon className={`w-3 h-3 ${zone.color}`} />
                <span>{zone.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
