'use client';

export interface HeroPerk {
  id: string;
  name: string;
  description: string;
  badge: string;
  bonusTimerSeconds?: number;
  bonusExtraLife?: number;
  bonusGoldPercent?: number;
  hasFiftyFifty?: boolean;
}

export interface HeroCharacter {
  id: string;
  name: string;
  title: string;
  archetype: 'tactician' | 'sage' | 'valkyrie' | 'striker';
  avatarSvgColor: string;
  accentColor: string;
  quote: string;
  perk: HeroPerk;
  level: number;
  xp: number;
  unlocked: boolean;
}

export const HERO_CHARACTERS: HeroCharacter[] = [
  {
    id: 'hero_tactician',
    name: 'Aegis Vector',
    title: 'Cyber Strategist',
    archetype: 'tactician',
    avatarSvgColor: '#00F0FF',
    accentColor: 'from-[#00F0FF] to-[#3B82F6]',
    quote: 'Precision and preparation build impenetrable fortresses.',
    perk: {
      id: 'perk_shield',
      name: 'Data Bastion',
      description: 'Start every Quest Arena with +1 Extra Shield (4 Lives total).',
      badge: '🛡️ +1 SHIELD',
      bonusExtraLife: 1,
    },
    level: 1,
    xp: 0,
    unlocked: true,
  },
  {
    id: 'hero_sage',
    name: 'Chronos Lumina',
    title: 'Quantum Sage',
    archetype: 'sage',
    avatarSvgColor: '#A855F7',
    accentColor: 'from-[#A855F7] to-[#EC4899]',
    quote: 'Time bends to those who understand the core principles.',
    perk: {
      id: 'perk_time',
      name: 'Chronos Distortion',
      description: '+5 extra seconds on every high-tension countdown timer.',
      badge: '⏳ +5s TIMER',
      bonusTimerSeconds: 5,
    },
    level: 1,
    xp: 0,
    unlocked: true,
  },
  {
    id: 'hero_valkyrie',
    name: 'Nova Sparks',
    title: 'Code Valkyrie',
    archetype: 'valkyrie',
    avatarSvgColor: '#FFB800',
    accentColor: 'from-[#FFB800] to-[#F97316]',
    quote: 'Speed and relentless focus turn knowledge into raw power.',
    perk: {
      id: 'perk_overclock',
      name: 'Overclock Rush',
      description: '+35% bonus Gold and Crystals on surviving quest waves.',
      badge: '⚡ +35% LOOT',
      bonusGoldPercent: 35,
    },
    level: 1,
    xp: 0,
    unlocked: true,
  },
  {
    id: 'hero_striker',
    name: 'Cipher Neon',
    title: 'Shadow Striker',
    archetype: 'striker',
    avatarSvgColor: '#F472F6',
    accentColor: 'from-[#F472F6] to-[#A855F7]',
    quote: 'Eliminate false paths with surgical clarity.',
    perk: {
      id: 'perk_fifty',
      name: 'Neural Purge',
      description: 'Unlocks 1 free 50/50 option elimination per survivor round.',
      badge: '🎯 50/50 PURGE',
      hasFiftyFifty: true,
    },
    level: 1,
    xp: 0,
    unlocked: true,
  },
];

const ACTIVE_HERO_KEY = 'xpedition_active_hero_v1';

export function getActiveHero(): HeroCharacter {
  if (typeof window === 'undefined') return HERO_CHARACTERS[0];
  try {
    const raw = localStorage.getItem(ACTIVE_HERO_KEY);
    if (!raw) return HERO_CHARACTERS[0];
    const parsed = JSON.parse(raw);
    const hero = HERO_CHARACTERS.find((h) => h.id === parsed.id) || HERO_CHARACTERS[0];
    return {
      ...hero,
      level: parsed.level || 1,
      xp: parsed.xp || 0,
    };
  } catch (e) {
    return HERO_CHARACTERS[0];
  }
}

export function saveActiveHero(hero: HeroCharacter): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ACTIVE_HERO_KEY, JSON.stringify(hero));
    window.dispatchEvent(new Event('xpedition_hero_updated'));
  } catch (e) {}
}
