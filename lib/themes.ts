export type WorldThemeId = 'cosmos' | 'cyber_city' | 'enchanted_kingdom' | 'ocean_world' | 'desert_empire';

export interface WorldThemeTier {
  tier: number;
  name: string;
  minMastery: number;
  desc: string;
}

export interface WorldThemeConfig {
  id: WorldThemeId;
  name: string;
  subtitle: string;
  icon: string;
  bestFor: string;
  color: string;
  accentColor: string;
  bgGradients: [string, string, string];
  sphereColors: [string, string, string, string];
  particleType: 'stars' | 'circuits' | 'spores' | 'bubbles' | 'embers';
  particleColor: string;
  quote: string;
  tiers: [WorldThemeTier, WorldThemeTier, WorldThemeTier, WorldThemeTier];
}

export const WORLD_THEMES: Record<WorldThemeId, WorldThemeConfig> = {
  cosmos: {
    id: 'cosmos',
    name: 'Cosmos',
    subtitle: 'Planets, stars & orbital rings',
    icon: '🪐',
    bestFor: 'Engineering, Physics, Technical skills',
    color: '#00F0FF',
    accentColor: '#A855F7',
    bgGradients: ['#070414', '#130B2D', '#241042'],
    sphereColors: ['#3A1C71', '#1D0E3B', '#0B051D', '#04020A'],
    particleType: 'stars',
    particleColor: '#00F0FF',
    quote: 'A sovereign domain across the knowledge cosmos.',
    tiers: [
      { tier: 1, name: 'Awakening Core', minMastery: 0, desc: 'Primordial floating core with cosmic energy sparks.' },
      { tier: 2, name: 'Solar System', minMastery: 40, desc: 'Orbiting planetary satellites & solar rings.' },
      { tier: 3, name: 'Galaxy', minMastery: 60, desc: 'Interconnected star systems & nebula bridges.' },
      { tier: 4, name: 'Universe', minMastery: 80, desc: 'Infinite cosmos sphere of transcendent understanding.' },
    ],
  },
  cyber_city: {
    id: 'cyber_city',
    name: 'Cyber City',
    subtitle: 'Neon buildings, circuits & holographic displays',
    icon: '🏙️',
    bestFor: 'Programming, AI, Design',
    color: '#00FF87',
    accentColor: '#FF0055',
    bgGradients: ['#030712', '#0A152E', '#102A45'],
    sphereColors: ['#003B46', '#07575B', '#0B1C28', '#020B10'],
    particleType: 'circuits',
    particleColor: '#00FF87',
    quote: 'High-density computational architecture fully compiled.',
    tiers: [
      { tier: 1, name: 'Empty Grid', minMastery: 0, desc: 'Raw circuit traces & foundational holographic grid.' },
      { tier: 2, name: 'Street Block', minMastery: 40, desc: 'Neon alleys, power conduits & glowing data hubs.' },
      { tier: 3, name: 'District', minMastery: 60, desc: 'Skyscraper spires, highway conduits & data streams.' },
      { tier: 4, name: 'Megacity', minMastery: 80, desc: 'Autonomous cyber metropolis radiating computational power.' },
    ],
  },
  enchanted_kingdom: {
    id: 'enchanted_kingdom',
    name: 'Enchanted Kingdom',
    subtitle: 'Castles, magical towers & glowing rivers',
    icon: '🏰',
    bestFor: 'Biology, History, Literature, Languages',
    color: '#34D399',
    accentColor: '#C084FC',
    bgGradients: ['#04140F', '#0B291E', '#174735'],
    sphereColors: ['#1B4D3E', '#10382B', '#082118', '#020C08'],
    particleType: 'spores',
    particleColor: '#34D399',
    quote: 'Ancient wisdom and living magic woven into an enduring realm.',
    tiers: [
      { tier: 1, name: 'Seed', minMastery: 0, desc: 'Mythic seedling rooted in enchanted soil.' },
      { tier: 2, name: 'Village', minMastery: 40, desc: 'Glowing riverside cottages & magical sanctuaries.' },
      { tier: 3, name: 'Town', minMastery: 60, desc: 'Fortified citadels, archways & crystal towers.' },
      { tier: 4, name: 'Kingdom', minMastery: 80, desc: 'Magnificent sovereign kingdom crowned in celestial aura.' },
    ],
  },
  ocean_world: {
    id: 'ocean_world',
    name: 'Ocean World',
    subtitle: 'Underwater city, coral reefs & deep sea abyss',
    icon: '🌊',
    bestFor: 'Marine science, Chemistry, Environment',
    color: '#38BDF8',
    accentColor: '#2DD4BF',
    bgGradients: ['#020B14', '#041E33', '#063552'],
    sphereColors: ['#0A4D68', '#083344', '#041B26', '#010B10'],
    particleType: 'bubbles',
    particleColor: '#38BDF8',
    quote: 'Deep subterranean currents flowing with crystal clarity.',
    tiers: [
      { tier: 1, name: 'Shore', minMastery: 0, desc: 'Sunlit shallow reef & tidal baseline.' },
      { tier: 2, name: 'Reef', minMastery: 40, desc: 'Bioluminescent coral groves & thermal vents.' },
      { tier: 3, name: 'Deep Sea', minMastery: 60, desc: 'Sub-oceanic domes, trenches & pressure sanctuaries.' },
      { tier: 4, name: 'Abyss', minMastery: 80, desc: 'Phosphorescent trench metropolis of infinite depth.' },
    ],
  },
  desert_empire: {
    id: 'desert_empire',
    name: 'Desert Empire',
    subtitle: 'Sand dunes, ancient temples & trade routes',
    icon: '🏜️',
    bestFor: 'Business, Economics, History, Culture',
    color: '#F59E0B',
    accentColor: '#FB923C',
    bgGradients: ['#140A04', '#261206', '#3D1D09'],
    sphereColors: ['#6B3008', '#451D04', '#260F02', '#0F0500'],
    particleType: 'embers',
    particleColor: '#F59E0B',
    quote: 'Monuments of perseverance carved from shifting sands.',
    tiers: [
      { tier: 1, name: 'Oasis', minMastery: 0, desc: 'Palm spring oasis surrounded by vast golden dunes.' },
      { tier: 2, name: 'Outpost', minMastery: 40, desc: 'Caravan waystations & fortified stone watchtowers.' },
      { tier: 3, name: 'City', minMastery: 60, desc: 'Sun-drenched grand plazas, sandstone palaces & bazaars.' },
      { tier: 4, name: 'Empire', minMastery: 80, desc: 'Golden pyramid citadel ruling across the desert horizons.' },
    ],
  },
};

export function getThemeConfig(themeId?: string): WorldThemeConfig {
  if (themeId && themeId in WORLD_THEMES) {
    return WORLD_THEMES[themeId as WorldThemeId];
  }
  return WORLD_THEMES.cosmos;
}

export function getThemeTierInfo(themeId: string | undefined, mastery: number) {
  const theme = getThemeConfig(themeId);
  let activeTier = theme.tiers[0];
  let tierIndex = 1;

  if (mastery >= 80) {
    activeTier = theme.tiers[3];
    tierIndex = 4;
  } else if (mastery >= 60) {
    activeTier = theme.tiers[2];
    tierIndex = 3;
  } else if (mastery >= 40) {
    activeTier = theme.tiers[1];
    tierIndex = 2;
  } else {
    activeTier = theme.tiers[0];
    tierIndex = 1;
  }

  return {
    tierNumber: tierIndex,
    name: activeTier.name,
    desc: activeTier.desc,
    themeName: theme.name,
    color: theme.color,
    accentColor: theme.accentColor,
    bgGradients: theme.bgGradients,
    sphereColors: theme.sphereColors,
    particleType: theme.particleType,
    particleColor: theme.particleColor,
    quote: theme.quote,
    icon: theme.icon,
  };
}
