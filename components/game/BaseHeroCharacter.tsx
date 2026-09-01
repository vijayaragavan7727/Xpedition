'use client';

import React, { useState, useEffect } from 'react';
import { HeroCharacter, getActiveHero } from '@/lib/heroEngine';
import { soundFx } from '@/lib/soundEngine';
import { Shield, Clock, Zap, Target, MessageSquare } from 'lucide-react';

interface BaseHeroCharacterProps {
  onTap?: () => void;
  activeGoal?: string;
  fadingCount?: number;
}

export const BaseHeroCharacter: React.FC<BaseHeroCharacterProps> = ({
  onTap,
  activeGoal = 'Blender Mastery',
  fadingCount = 0,
}) => {
  const [hero, setHero] = useState<HeroCharacter>(getActiveHero());
  const [speechText, setSpeechText] = useState<string>('Base defenses operational, Commander!');
  const [showSpeech, setShowSpeech] = useState<boolean>(true);

  useEffect(() => {
    const update = () => setHero(getActiveHero());
    update();
    window.addEventListener('xpedition_hero_updated', update);
    return () => window.removeEventListener('xpedition_hero_updated', update);
  }, []);

  useEffect(() => {
    if (fadingCount > 0) {
      setSpeechText(`⚠️ ${fadingCount} concept spire${fadingCount > 1 ? 's are' : ' is'} under siege! Tap to defend.`);
    } else {
      const tips = [
        `Defend ${activeGoal} spires in the Arena to earn Gold & Crystals!`,
        'Upgrade our Knowledge Core to unlock advanced perks.',
        'Precision and speed grant streak frenzy combos in battle!',
        'Base is fortified. Ready for next survivor wave.',
      ];
      setSpeechText(tips[Math.floor(Math.random() * tips.length)]);
    }
  }, [fadingCount, activeGoal]);

  const handleHeroClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundFx.playTick();
    setShowSpeech((prev) => !prev);
    if (onTap) onTap();
  };

  return (
    <div
      onClick={handleHeroClick}
      className="absolute cursor-pointer select-none transition-all duration-300 hover:scale-110 z-30 group"
      style={{
        left: 'calc(50% + 40px)',
        top: 'calc(40% + 40px)',
        transform: 'translate(-50%, -100%)',
      }}
    >
      {/* Speech Bubble */}
      {showSpeech && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-2xl bg-[#120E24]/95 border border-[#00F0FF]/40 text-white text-[11px] font-sans font-medium shadow-[0_0_15px_rgba(0,240,255,0.3)] backdrop-blur-md whitespace-nowrap animate-bounce flex items-center gap-1.5 z-40">
          <MessageSquare className="w-3.5 h-3.5 text-[#00F0FF] shrink-0" />
          <span>{speechText}</span>
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#120E24] border-r border-b border-[#00F0FF]/40 rotate-45" />
        </div>
      )}

      {/* Hero Shadow & Ground Halo */}
      <div
        className="w-16 h-8 rounded-full blur-sm absolute -bottom-2 left-1/2 -translate-x-1/2"
        style={{ backgroundColor: `${hero.avatarSvgColor}44` }}
      />

      {/* Animated 2.5D Hero Graphic */}
      <div className="relative w-16 h-20 flex flex-col items-center justify-center animate-pulse">
        {/* Hero Crown / Level Badge */}
        <div className="px-1.5 py-0.2 rounded-full bg-black/80 border border-white/20 text-[#00FF87] font-mono text-[9px] font-bold mb-1 shadow">
          HERO Lv.{hero.level}
        </div>

        {/* Hero Body SVG */}
        <svg viewBox="0 0 60 70" className="w-12 h-14 drop-shadow-[0_8px_10px_rgba(0,0,0,0.8)]">
          <defs>
            <radialGradient id="heroGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={hero.avatarSvgColor} stopOpacity="0.8" />
              <stop offset="100%" stopColor="#120E24" stopOpacity="0.9" />
            </radialGradient>
          </defs>

          {/* Hero Cyber Armor Body */}
          <polygon points="30,15 48,26 42,55 18,55 12,26" fill="url(#heroGlow)" stroke={hero.avatarSvgColor} strokeWidth="1.5" />
          
          {/* Head / Cyber Helmet */}
          <circle cx="30" cy="18" r="9" fill="#0A071B" stroke="#00F0FF" strokeWidth="1.2" />
          <rect x="24" y="15" width="12" height="4" rx="2" fill="#00FF87" className="animate-pulse" />

          {/* Armor Core Reactor */}
          <circle cx="30" cy="34" r="5" fill="#00F0FF" stroke="#FFFFFF" strokeWidth="1" className="animate-ping" opacity="0.75" />
          <circle cx="30" cy="34" r="3.5" fill="#00F0FF" />

          {/* Weapon / Relic */}
          <line x1="46" y1="20" x2="52" y2="52" stroke={hero.avatarSvgColor} strokeWidth="2.5" strokeLinecap="round" />
          <polygon points="52,14 55,22 49,22" fill="#FFB800" stroke="#FFFFFF" strokeWidth="0.8" />
        </svg>

        {/* Hero Name Tag */}
        <div className="px-2 py-0.5 rounded-md bg-[#120E24]/90 border border-white/15 text-[9px] font-bold text-slate-200 mt-0.5 tracking-wider truncate max-w-[90px]">
          {hero.name.split(' ')[0]}
        </div>
      </div>
    </div>
  );
};
