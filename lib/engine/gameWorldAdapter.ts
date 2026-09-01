/**
 * Game World Progression & State Adapter
 * Connects learner XP, streak, accuracy, BKT mastery, and concept skills
 * directly to the top-down continuous learning strategy world.
 */

import { UserStoreData, calculateStreak } from '../store';
import { thetaToPercent } from './mastery';

export type WorldTierLevel = 1 | 2 | 3 | 4 | 5;

export type GameLocationType =
  | 'knowledge_core'
  | 'course_academy'
  | 'skill_lab'
  | 'challenge_arena'
  | 'reward_vault'
  | 'practice_grounds'
  | 'career_hub'
  | 'hq'
  | 'library'
  | 'quest_board'
  | 'ai_lab'
  | 'gold_vault'
  | 'elixir_condenser'
  | 'workshop';

export interface GameBuildingState {
  id: string;
  name: string;
  conceptId?: string;
  conceptName: string;
  type: GameLocationType;
  level: number; // 1 to 5
  isUpgrading: boolean;
  masteryPercent: number;
  upgradeProgress: number; // 0 to 100
  title: string;
  subtitle: string;
  statsLabel: string;
  questsCompleted: number;
  actionText: string;
  actionUrl: string;
  status: 'unlocked' | 'in_progress' | 'completed' | 'locked';
  gridX: number; // 0 to 100% on continuous map
  gridY: number; // 0 to 100% on continuous map
  position: [number, number, number];
}

export interface GameMentorDialogue {
  npcName: string;
  avatarIcon: string;
  greeting: string;
  recommendedConceptId: string;
  recommendedConceptName: string;
  challengeTitle: string;
  difficultyLabel: string;
  actionUrl: string;
}

export interface PlayableGameWorldData {
  learnerName: string;
  learnerLevel: number;
  totalXp: number;
  worldLevel: WorldTierLevel;
  worldLevelName: string;
  worldProgressPercent: number; // 0 to 100 toward next World Tier
  currentXpInTier: number;
  xpNeededForNextTier: number;
  streakDays: number;
  accuracyRate: number; // 0 to 100
  workerCount: number;
  totalWorkers: number;
  shieldHoursRemaining: number;
  masteredTopicsCount: number;
  totalTopicsCount: number;
  availableQuestsCount: number;
  resources: {
    wood: number;
    stone: number;
    crystal: number;
    gold: number;
  };
  buildings: {
    knowledgeCore: GameBuildingState;
    courseAcademy: GameBuildingState;
    skillLab: GameBuildingState;
    challengeArena: GameBuildingState;
    rewardVault: GameBuildingState;
    practiceGrounds: GameBuildingState;
    careerHub: GameBuildingState;
    // Backwards compatibility aliases
    hq: GameBuildingState;
    library: GameBuildingState;
    questBoard: GameBuildingState;
    aiLab: GameBuildingState;
    goldVault: GameBuildingState;
    elixirCondenser: GameBuildingState;
    workshop: GameBuildingState;
  };
  mentor: GameMentorDialogue;
}

// XP Thresholds for World Evolution Tiers
const WORLD_TIER_THRESHOLDS: { tier: WorldTierLevel; name: string; minXp: number; maxXp: number }[] = [
  { tier: 1, name: 'Base Camp (Tier 1)', minXp: 0, maxXp: 500 },
  { tier: 2, name: 'Fortified Settlement (Tier 2)', minXp: 500, maxXp: 1500 },
  { tier: 3, name: 'Learning Stronghold (Tier 3)', minXp: 1500, maxXp: 3000 },
  { tier: 4, name: 'Grand Citadel (Tier 4)', minXp: 3000, maxXp: 5000 },
  { tier: 5, name: 'Metropolis Kingdom (Tier 5)', minXp: 5000, maxXp: 10000 },
];

export function computeGameWorldData(store: UserStoreData, fallbackXp: number = 240): PlayableGameWorldData {
  const concepts = store.concepts || [];
  const attempts = store.attempts || [];
  const streak = calculateStreak(attempts);

  // Calculate real metrics
  const correctAttempts = attempts.filter((a) => a.isCorrect).length;
  const accuracyRate = attempts.length > 0 ? Math.round((correctAttempts / attempts.length) * 100) : 75;

  let totalMasterySum = 0;
  let masteredCount = 0;
  concepts.forEach((c) => {
    const pct = c.thetaAssisted !== undefined ? thetaToPercent(c.thetaAssisted) : c.masteryPercentage || 0;
    totalMasterySum += pct;
    if (pct >= 80) masteredCount++;
  });

  const avgMastery = concepts.length > 0 ? Math.round(totalMasterySum / concepts.length) : 50;

  // Derive total XP from store attempts, rewards, and mastery
  const computedXp = attempts.length * 25 + correctAttempts * 15 + Math.round(totalMasterySum * 8) + (store.rewardsCount || 0) * 50;
  const totalXp = Math.max(computedXp, fallbackXp, 120);

  // Determine World Tier
  let currentTierInfo = WORLD_TIER_THRESHOLDS[0];
  for (const t of WORLD_TIER_THRESHOLDS) {
    if (totalXp >= t.minXp) {
      currentTierInfo = t;
    }
  }

  const range = currentTierInfo.maxXp - currentTierInfo.minXp;
  const inTier = Math.max(0, totalXp - currentTierInfo.minXp);
  const worldProgressPercent = Math.min(100, Math.max(0, Math.round((inTier / range) * 100)));
  const xpNeededForNextTier = Math.max(0, currentTierInfo.maxXp - totalXp);

  const learnerLevel = Math.max(1, Math.floor(Math.pow(totalXp / 100, 1 / 1.5)) + 1);

  // Dynamic Workers: More active days & streaks = more workers in the world
  const workerCount = Math.min(5, Math.max(2, Math.floor(streak / 2) + 2));
  const totalWorkers = 5;

  // Resources generated from real activity
  const wood = Math.floor(totalXp * 0.8 + attempts.length * 10 + 120);
  const stone = Math.floor(totalXp * 0.5 + correctAttempts * 12 + 80);
  const crystal = Math.floor(masteredCount * 40 + currentTierInfo.tier * 25 + 45);
  const gold = Math.floor(streak * 35 + (store.rewardsCount || 0) * 50 + totalXp * 0.45 + 250);

  // Concept mapping for individual domain buildings
  const c0 = concepts[0] || { id: 'c0', name: 'Core Foundations & Syntax', masteryPercentage: 80 };
  const c1 = concepts[1] || { id: 'c1', name: 'Object Architecture & Data', masteryPercentage: 65 };
  const c2 = concepts[2] || { id: 'c2', name: 'Algorithmic Problem Solving', masteryPercentage: 45 };
  const c3 = concepts[3] || { id: 'c3', name: 'System Optimization & AI', masteryPercentage: 30 };

  const getPct = (c: any) => (c.thetaAssisted !== undefined ? thetaToPercent(c.thetaAssisted) : c.masteryPercentage || 50);

  // Building Upgrade Levels based on real progression
  const hqLevel = currentTierInfo.tier >= 4 ? 4 : currentTierInfo.tier >= 2 ? 3 : 2;
  const academyLevel = getPct(c1) >= 80 ? 3 : getPct(c1) >= 40 ? 2 : 1;
  const skillLabLevel = getPct(c2) >= 80 ? 3 : getPct(c2) >= 40 ? 2 : 1;
  const arenaLevel = attempts.length >= 15 ? 3 : attempts.length >= 5 ? 2 : 1;
  const vaultLevel = totalXp >= 1500 ? 3 : totalXp >= 500 ? 2 : 1;
  const practiceLevel = getPct(c0) >= 80 ? 3 : getPct(c0) >= 40 ? 2 : 1;
  const careerLevel = 1;

  // Weakest Concept for Mentor Recommendations
  const sortedConcepts = [...concepts].sort((a: any, b: any) => getPct(a) - getPct(b));
  const weakestConcept = sortedConcepts[0] || c0;

  const mentorDialogue: GameMentorDialogue = {
    npcName: 'XYRA (Commander)',
    avatarIcon: '🤖',
    greeting: `Commander ${store.handle || 'Learner'}! Your village has ${workerCount} active builders. Recommended target: ${weakestConcept.name}.`,
    recommendedConceptId: weakestConcept.id,
    recommendedConceptName: weakestConcept.name,
    challengeTitle: `Adaptive Quest: ${weakestConcept.name}`,
    difficultyLabel: accuracyRate > 80 ? 'Mastery Raid' : 'Target Practice',
    actionUrl: `/quest?concept=${encodeURIComponent(weakestConcept.id)}`,
  };

  const knowledgeCore: GameBuildingState = {
    id: 'loc_knowledge_core',
    name: 'Knowledge Core',
    conceptName: 'Sovereign Domain Citadel',
    type: 'knowledge_core',
    level: hqLevel,
    isUpgrading: false,
    masteryPercent: avgMastery,
    upgradeProgress: worldProgressPercent,
    title: `Knowledge Core (Lv.${hqLevel})`,
    subtitle: `${currentTierInfo.name}`,
    statsLabel: `${totalXp} Total XP · ${streak} Day Streak`,
    questsCompleted: attempts.length,
    actionText: worldProgressPercent >= 100 ? 'Ascend Citadel' : 'Continue Learning',
    actionUrl: '/home',
    status: avgMastery >= 90 ? 'completed' : 'unlocked',
    gridX: 50,
    gridY: 46,
    position: [0, 0, -1.8],
  };

  const courseAcademy: GameBuildingState = {
    id: 'loc_course_academy',
    name: 'Course Academy',
    conceptId: c1.id,
    conceptName: c1.name,
    type: 'course_academy',
    level: academyLevel,
    isUpgrading: false,
    masteryPercent: getPct(c1),
    upgradeProgress: getPct(c1),
    title: `Academy: ${c1.name}`,
    subtitle: `Level ${academyLevel} · ${getPct(c1)}% Mastered`,
    statsLabel: `${masteredCount}/${concepts.length || 5} Concepts Mastered`,
    questsCompleted: Math.floor(attempts.length * 0.35),
    actionText: 'Study Modules',
    actionUrl: `/quest?concept=${encodeURIComponent(c1.id)}`,
    status: getPct(c1) >= 80 ? 'completed' : 'in_progress',
    gridX: 26,
    gridY: 30,
    position: [-3.8, 0, -1.5],
  };

  const skillLab: GameBuildingState = {
    id: 'loc_skill_lab',
    name: 'Skill Lab',
    conceptId: c2.id,
    conceptName: c2.name,
    type: 'skill_lab',
    level: skillLabLevel,
    isUpgrading: false,
    masteryPercent: getPct(c2),
    upgradeProgress: getPct(c2),
    title: `Skill Lab: ${c2.name}`,
    subtitle: `Level ${skillLabLevel} · ${getPct(c2)}% Synthesized`,
    statsLabel: `Synthesizing ${crystal} Mana Crystals`,
    questsCompleted: Math.floor(attempts.length * 0.25),
    actionText: 'Synthesize Skill',
    actionUrl: `/quest?concept=${encodeURIComponent(c2.id)}`,
    status: getPct(c2) >= 80 ? 'completed' : 'in_progress',
    gridX: 25,
    gridY: 62,
    position: [-1.8, 0, 3.6],
  };

  const challengeArena: GameBuildingState = {
    id: 'loc_challenge_arena',
    name: 'Challenge Arena',
    conceptName: 'PvP & Solo Mastery Colosseum',
    type: 'challenge_arena',
    level: arenaLevel,
    isUpgrading: false,
    masteryPercent: accuracyRate,
    upgradeProgress: Math.min(100, (attempts.length / 20) * 100),
    title: `Challenge Arena (Lv.${arenaLevel})`,
    subtitle: `${attempts.length} Battles Fought (${accuracyRate}% Win Rate)`,
    statsLabel: `${Math.max(3, concepts.length)} Active Raids Available`,
    questsCompleted: attempts.length,
    actionText: 'Enter Arena',
    actionUrl: '/arena',
    status: 'unlocked',
    gridX: 74,
    gridY: 30,
    position: [3.8, 0, -1.5],
  };

  const rewardVault: GameBuildingState = {
    id: 'loc_reward_vault',
    name: 'Reward Vault',
    conceptName: 'Treasury & Gold Reserves',
    type: 'reward_vault',
    level: vaultLevel,
    isUpgrading: false,
    masteryPercent: 88,
    upgradeProgress: 88,
    title: `Reward Vault (Lv.${vaultLevel})`,
    subtitle: `${gold} Gold Ingot Reserves`,
    statsLabel: `Capacity: ${Math.max(2000, totalXp * 3)} Gold`,
    questsCompleted: attempts.length,
    actionText: 'Claim Rewards',
    actionUrl: '/history',
    status: 'unlocked',
    gridX: 75,
    gridY: 62,
    position: [-3.6, 0, 2.2],
  };

  const practiceGrounds: GameBuildingState = {
    id: 'loc_practice_grounds',
    name: 'Practice Grounds',
    conceptId: c0.id,
    conceptName: c0.name,
    type: 'practice_grounds',
    level: practiceLevel,
    isUpgrading: false,
    masteryPercent: getPct(c0),
    upgradeProgress: getPct(c0),
    title: `Forge: ${c0.name}`,
    subtitle: `Level ${practiceLevel} · ${getPct(c0)}% Mastery`,
    statsLabel: `${wood} Wood · ${stone} Stone Available`,
    questsCompleted: Math.floor(attempts.length * 0.4),
    actionText: 'Craft Mastery',
    actionUrl: `/quest?concept=${encodeURIComponent(c0.id)}`,
    status: getPct(c0) >= 80 ? 'completed' : 'in_progress',
    gridX: 50,
    gridY: 22,
    position: [1.8, 0, 3.6],
  };

  const careerHub: GameBuildingState = {
    id: 'loc_career_hub',
    name: 'Career Hub',
    conceptName: 'Industry Learning Hub',
    type: 'career_hub',
    level: careerLevel,
    isUpgrading: false,
    masteryPercent: 0,
    upgradeProgress: 0,
    title: 'Career Hub',
    subtitle: 'Industry Learning · Unlocks at Tier 3',
    statsLabel: 'Professional Skill Pathways',
    questsCompleted: 0,
    actionText: 'Explore Careers',
    actionUrl: '/career',
    status: currentTierInfo.tier >= 3 ? 'unlocked' : 'locked',
    gridX: 50,
    gridY: 76,
    position: [3.6, 0, 2.2],
  };

  return {
    learnerName: store.handle || 'Commander',
    learnerLevel,
    totalXp,
    worldLevel: currentTierInfo.tier,
    worldLevelName: currentTierInfo.name,
    worldProgressPercent,
    currentXpInTier: inTier,
    xpNeededForNextTier,
    streakDays: streak,
    accuracyRate,
    workerCount,
    totalWorkers,
    shieldHoursRemaining: 14,
    masteredTopicsCount: masteredCount,
    totalTopicsCount: concepts.length || 6,
    availableQuestsCount: Math.max(3, concepts.length),
    resources: {
      wood,
      stone,
      crystal,
      gold,
    },
    buildings: {
      knowledgeCore,
      courseAcademy,
      skillLab,
      challengeArena,
      rewardVault,
      practiceGrounds,
      careerHub,
      // Compatibility aliases
      hq: knowledgeCore,
      library: courseAcademy,
      questBoard: challengeArena,
      aiLab: skillLab,
      goldVault: rewardVault,
      elixirCondenser: skillLab,
      workshop: practiceGrounds,
    },
    mentor: mentorDialogue,
  };
}
