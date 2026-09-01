'use client';

import React, { useState, useEffect } from 'react';
import { HeroCharacter, HERO_CHARACTERS, getActiveHero, saveActiveHero } from '@/lib/heroEngine';
import { soundFx } from '@/lib/soundEngine';
import { X, Shield, Clock, Zap, Target, Check, Sparkles, Trophy } from 'lucide-react';

interface HeroSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onHeroSelected?: (hero: HeroCharacter) => void;
}

export const HeroSelectModal: React.FC<HeroSelectModalProps> = ({
  isOpen,
  onClose,
  onHeroSelected,
}) => {
  const [selectedHeroId, setSelectedHeroId] = useState<string>('hero_tactician');
  const [activeHero, setActiveHeroState] = useState<HeroCharacter>(HERO_CHARACTERS[0]);

  useEffect(() => {
    if (isOpen) {
      const hero = getActiveHero();
      setSelectedHeroId(hero.id);
      setActiveHeroState(hero);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentHero = HERO_CHARACTERS.find((h) => h.id === selectedHeroId) || HERO_CHARACTERS[0];
  const isCurrentlyEquipped = activeHero.id === currentHero.id;

  const handleSelect = (hero: HeroCharacter) => {
    soundFx.playTick();
    setSelectedHeroId(hero.id);
  };

  const handleEquip = () => {
    soundFx.playUpgrade();
    saveActiveHero(currentHero);
    setActiveHeroState(currentHero);
    if (onHeroSelected) onHeroSelected(currentHero);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#0F0B21] border border-white/15 rounded-3xl p-5 sm:p-7 shadow-[0_0_50px_rgba(0,240,255,0.15)] flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#00F0FF] to-[#A855F7] flex items-center justify-center text-black font-black">
              ⚡
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">Hero Tactical Dossier</h2>
              <p className="text-xs text-[#00F0FF]/80">Choose your champion archetype for the Arena</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hero Grid Selection */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4">
          {HERO_CHARACTERS.map((hero) => {
            const isSelected = hero.id === selectedHeroId;
            const isEquipped = activeHero.id === hero.id;

            return (
              <button
                key={hero.id}
                onClick={() => handleSelect(hero)}
                className={`relative flex flex-col items-center text-center p-3 rounded-2xl border transition-all duration-300 ${
                  isSelected
                    ? 'bg-gradient-to-b from-[#1E163E] to-[#140E2C] border-[#00F0FF] shadow-[0_0_20px_rgba(0,240,255,0.3)] scale-[1.02]'
                    : 'bg-[#140E2C]/70 border-white/10 hover:border-white/20'
                }`}
              >
                {/* Equipped Badge */}
                {isEquipped && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-[#00FF87]/20 border border-[#00FF87]/50 text-[#00FF87] text-[9px] font-mono font-bold">
                    ACTIVE
                  </span>
                )}

                {/* Hero Avatar Icon */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-2 shadow-inner border border-white/10"
                  style={{
                    background: `radial-gradient(circle, ${hero.avatarSvgColor}22 0%, rgba(18,14,34,0.9) 100%)`,
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-base"
                    style={{ color: hero.avatarSvgColor }}
                  >
                    {hero.archetype === 'tactician' && <Shield className="w-6 h-6" />}
                    {hero.archetype === 'sage' && <Clock className="w-6 h-6" />}
                    {hero.archetype === 'valkyrie' && <Zap className="w-6 h-6" />}
                    {hero.archetype === 'striker' && <Target className="w-6 h-6" />}
                  </div>
                </div>

                <div className="text-xs font-bold text-white truncate w-full">{hero.name}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">{hero.title}</div>
                
                <div className="mt-2 text-[9px] font-mono px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[#00F0FF]">
                  {hero.perk.badge}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Hero Detailed Card */}
        <div className="bg-[#120D28]/90 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col gap-3 my-auto">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-white">{currentHero.name}</span>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF]">
                  {currentHero.title}
                </span>
              </div>
              <p className="text-xs text-slate-300 italic mt-1">&quot;{currentHero.quote}&quot;</p>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-[10px] font-mono text-slate-400">HERO LEVEL</span>
              <span className="text-sm font-black text-[#00FF87]">Lv. {currentHero.level}</span>
            </div>
          </div>

          {/* Passive Perk Box */}
          <div className="bg-gradient-to-r from-[#181135] to-[#201547] border border-white/10 rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-[#A855F7]/30 to-[#00F0FF]/30 border border-white/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-[#00F0FF]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">{currentHero.perk.name}</span>
                <span className="text-[10px] font-mono text-amber-400 font-bold">{currentHero.perk.badge}</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">{currentHero.perk.description}</p>
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            {isCurrentlyEquipped ? 'Currently Deployed' : 'Ready for Deployment'}
          </span>

          <button
            onClick={handleEquip}
            disabled={isCurrentlyEquipped}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all flex items-center gap-2 ${
              isCurrentlyEquipped
                ? 'bg-white/10 text-slate-400 border border-white/5 cursor-default'
                : 'bg-gradient-to-r from-[#00F0FF] to-[#A855F7] text-black hover:opacity-90 shadow-[0_0_20px_rgba(0,240,255,0.4)]'
            }`}
          >
            {isCurrentlyEquipped ? (
              <>
                <Check className="w-4 h-4" /> Equipped
              </>
            ) : (
              'Deploy Hero'
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
