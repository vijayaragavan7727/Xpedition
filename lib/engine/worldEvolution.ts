/**
 * World Evolution Engine
 * Maps LPS Results & Concept Mastery into 3D World States, Dynamic Buildings, Environments, and Missions.
 */

import { LPSResult, LearnerProfile } from './lps';

export type BuildingType = 'academy' | 'workshop' | 'observatory' | 'arena' | 'citadel';
export type BuildingStage = 'empty' | 'partial' | 'built' | 'upgraded' | 'mastered';

export interface ConceptMastery {
  id: string;
  name: string;
  masteryPercent: number;
}

export interface WorldBuilding3D {
  id: string;
  conceptId: string;
  conceptName: string;
  type: BuildingType;
  stage: BuildingStage;
  masteryPercent: number;
  position: [number, number, number]; // [x, y, z] in Three.js coordinates
  rotation?: [number, number, number];
  nextRequirement: string;
}

export interface WorldEnvironment {
  skyColor: string;
  ambientIntensity: number;
  lightColor: string;
  groundColor: string;
  pathColor: string;
  description: string;
}

export interface Mission {
  id: string;
  conceptId: string;
  conceptName: string;
  buildingType: BuildingType;
  currentMastery: number;
  targetMastery: number;
  title: string;
  description: string;
  reward: {
    wood: number;
    stone: number;
    crystal: number;
    gold: number;
  };
  actionUrl: string;
}

export interface WorldStateDelta {
  lps: LPSResult;
  buildings: WorldBuilding3D[];
  unlockedAreas: string[];
  environment: WorldEnvironment;
  resources: {
    wood: number;
    stone: number;
    crystal: number;
    gold: number;
  };
  missions: Mission[];
}

const BUILDING_TYPES: BuildingType[] = ['academy', 'workshop', 'observatory', 'arena', 'citadel'];

// 3D Positions arranged around central courtyard
const BUILDING_POSITIONS: [number, number, number][] = [
  [0, 0, -3.2],   // 0. Academy: North
  [3.2, 0, -1.0],  // 1. Workshop: East
  [-3.2, 0, -1.0], // 2. Observatory: West
  [2.2, 0, 2.8],   // 3. Arena: South-East
  [-2.2, 0, 2.8],  // 4. Citadel: South-West
];

const UNLOCKED_AREAS_MAP: Record<1 | 2 | 3 | 4 | 5, string[]> = {
  1: ['central'],
  2: ['central', 'north'],
  3: ['central', 'north', 'east'],
  4: ['central', 'north', 'east', 'west'],
  5: ['central', 'north', 'east', 'west', 'south'],
};

const NEXT_REQ_MAP: Record<BuildingStage, string> = {
  empty: 'Mastery > 0% to lay foundation',
  partial: 'Reach 30% mastery to complete building',
  built: 'Reach 60% mastery for Tier II upgrade',
  upgraded: 'Reach 90% mastery to ascend to Mastered Landmark',
  mastered: 'Fully Mastered Pinnacle Realm Landmark',
};

export function getStageFromMastery(mastery: number): BuildingStage {
  if (mastery <= 0) return 'empty';
  if (mastery < 30) return 'partial';
  if (mastery < 60) return 'built';
  if (mastery < 90) return 'upgraded';
  return 'mastered';
}

export function getEnvironmentForProfile(profile: LearnerProfile): WorldEnvironment {
  switch (profile) {
    case 'scholar':
      return {
        skyColor: '#0C0A1D',
        ambientIntensity: 0.7,
        lightColor: '#67E8F9',
        groundColor: '#166534',
        pathColor: '#FDE047',
        description: 'Clear crystalline sky with enlightened spires and golden paths.',
      };
    case 'trainer':
      return {
        skyColor: '#0F172A',
        ambientIntensity: 0.8,
        lightColor: '#38BDF8',
        groundColor: '#15803D',
        pathColor: '#F97316',
        description: 'Vibrant training arena with dynamic coaching flags and energized grounds.',
      };
    case 'comeback':
      return {
        skyColor: '#1E1B4B',
        ambientIntensity: 0.75,
        lightColor: '#FDBA74',
        groundColor: '#14532D',
        pathColor: '#FB923C',
        description: 'Inspiring dawn lighting across recovery trails and warm sandstone.',
      };
    case 'independent':
      return {
        skyColor: '#090514',
        ambientIntensity: 0.65,
        lightColor: '#C084FC',
        groundColor: '#064E3B',
        pathColor: '#A855F7',
        description: 'Mystical twilight citadel standing proud on sovereign territory.',
      };
  }
}

/**
 * Computes 3 active learning missions prioritised by the weakest concepts.
 */
export function getMissions(lps: LPSResult, concepts: ConceptMastery[]): Mission[] {
  if (!concepts || concepts.length === 0) {
    return [
      {
        id: 'mission_init',
        conceptId: 'core',
        conceptName: 'Core Foundations',
        buildingType: 'academy',
        currentMastery: 0,
        targetMastery: 30,
        title: 'Construct the Academy',
        description: 'Complete your first lesson to lay the foundation of your world.',
        reward: { wood: 50, stone: 30, crystal: 10, gold: 20 },
        actionUrl: '/home',
      },
    ];
  }

  // Sort concepts by mastery ascending (weakest first)
  const sorted = [...concepts].sort((a, b) => a.masteryPercent - b.masteryPercent);
  const nextAreaName = lps.tier < 5 ? UNLOCKED_AREAS_MAP[Math.min(5, lps.tier + 1) as 1 | 2 | 3 | 4 | 5].slice(-1)[0] : 'Legendary Realm';

  return sorted.slice(0, 3).map((c, idx) => {
    const bType = BUILDING_TYPES[idx % BUILDING_TYPES.length];
    const target = c.masteryPercent < 30 ? 30 : c.masteryPercent < 60 ? 60 : c.masteryPercent < 90 ? 90 : 100;
    
    return {
      id: `mission_${c.id}_${idx}`,
      conceptId: c.id,
      conceptName: c.name,
      buildingType: bType,
      currentMastery: c.masteryPercent,
      targetMastery: target,
      title: `Evolve ${bType.toUpperCase()}: ${c.name}`,
      description: `Your ${c.name} is at ${c.masteryPercent}%. Upgrade the ${bType} to ${target}% to expand the ${nextAreaName} district.`,
      reward: {
        wood: Math.floor((100 - c.masteryPercent) * 0.8 + 20),
        stone: Math.floor((100 - c.masteryPercent) * 0.6 + 15),
        crystal: Math.floor(lps.tier * 25),
        gold: Math.floor(lps.score * 2 + 30),
      },
      actionUrl: `/quest?concept=${encodeURIComponent(c.id)}`,
    };
  });
}

/**
 * Evolve the 3D world state delta given LPS results and current concept masteries.
 */
export function evolveWorld(lps: LPSResult, concepts: ConceptMastery[]): WorldStateDelta {
  const safeConcepts = concepts && concepts.length > 0
    ? concepts.slice(0, 5)
    : [
        { id: 'c1', name: 'Core Foundations', masteryPercent: 0 },
        { id: 'c2', name: 'Applied Practice', masteryPercent: 0 },
        { id: 'c3', name: 'Analytical Insight', masteryPercent: 0 },
      ];

  const buildings: WorldBuilding3D[] = safeConcepts.map((concept, idx) => {
    const type = BUILDING_TYPES[idx % BUILDING_TYPES.length];
    const stage = getStageFromMastery(concept.masteryPercent);
    const position = BUILDING_POSITIONS[idx % BUILDING_POSITIONS.length];

    return {
      id: `bldg_3d_${concept.id}`,
      conceptId: concept.id,
      conceptName: concept.name,
      type,
      stage,
      masteryPercent: concept.masteryPercent,
      position,
      nextRequirement: NEXT_REQ_MAP[stage],
    };
  });

  const unlockedAreas = UNLOCKED_AREAS_MAP[lps.tier] || ['central'];
  const environment = getEnvironmentForProfile(lps.profile);
  const missions = getMissions(lps, safeConcepts);

  const completedCount = buildings.filter((b) => b.stage === 'built' || b.stage === 'upgraded' || b.stage === 'mastered').length;
  const masteredCount = buildings.filter((b) => b.stage === 'mastered').length;

  const resources = {
    wood: Math.floor(lps.score * 12 + completedCount * 45),
    stone: Math.floor(lps.score * 8 + completedCount * 30),
    crystal: Math.floor(masteredCount * 60 + lps.tier * 35),
    gold: Math.floor(lps.score * 15 + lps.breakdown.consistency * 20),
  };

  return {
    lps,
    buildings,
    unlockedAreas,
    environment,
    resources,
    missions,
  };
}
