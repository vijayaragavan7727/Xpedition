/**
 * Game World Progression & State Adapter
 * Connects learner XP, streak, accuracy, BKT mastery, and concept skills
 * directly to the 3D continuous strategy world.
 */

import { UserStoreData, calculateStreak } from '../store';
import { thetaToPercent } from './mastery';

export type WorldTierLevel = 1 | 2 | 3 | 4 | 5;

export interface GameBuildingState {
  id: string;
  name: string;
  conceptId?: string;
  conceptName: string;
  type: 'hq' | 'library' | 'quest_board' | 'ai_lab' | 'gold_vault' | 'elixir_condenser' | 'workshop';
  level: number; // 1 to 3
  isUpgrading: boolean;
  masteryPercent: number;
  upgradeProgress: number; // 0 to 100
  title: string;
  subtitle: string;
  statsLabel: string;
  questsCompleted: number;
  actionText: string;
  actionUrl: string;
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
  const workerCount = Math.min(6, Math.max(2, Math.floor(streak / 2) + 2));

  // Resources generated from real activity
  const wood = Math.floor(totalXp * 0.8 + attempts.length * 10 + 65);
  const stone = Math.floor(totalXp * 0.5 + correctAttempts * 12 + 45);
  const crystal = Math.floor(masteredCount * 40 + currentTierInfo.tier * 25 + 20);
  const gold = Math.floor(streak * 35 + (store.rewardsCount || 0) * 50 + totalXp * 0.45);

  // Concept mapping for individual domain buildings
  const c0 = concepts[0] || { id: 'c0', name: 'Foundational Syntax', masteryPercentage: 80 };
  const c1 = concepts[1] || { id: 'c1', name: 'Object Architecture', masteryPercentage: 65 };
  const c2 = concepts[2] || { id: 'c2', name: 'Algorithmic Logic', masteryPercentage: 45 };
  const c3 = concepts[3] || { id: 'c3', name: 'System Optimization', masteryPercentage: 30 };

  const getPct = (c: any) => (c.thetaAssisted !== undefined ? thetaToPercent(c.thetaAssisted) : c.masteryPercentage || 50);

  // Building Upgrade Levels based on metrics
  const hqLevel = currentTierInfo.tier >= 4 ? 3 : currentTierInfo.tier >= 2 ? 2 : 1;
  const libraryLevel = getPct(c1) >= 80 ? 3 : getPct(c1) >= 40 ? 2 : 1;
  const questBoardLevel = attempts.length >= 15 ? 3 : attempts.length >= 5 ? 2 : 1;
  const aiLabLevel = accuracyRate >= 80 ? 3 : accuracyRate >= 60 ? 2 : 1;
  const goldVaultLevel = totalXp >= 1500 ? 3 : totalXp >= 500 ? 2 : 1;
  const elixirLevel = getPct(c2) >= 80 ? 3 : getPct(c2) >= 40 ? 2 : 1;
  const workshopLevel = getPct(c0) >= 80 ? 3 : getPct(c0) >= 40 ? 2 : 1;

  // Weakest Concept for Mentor Recommendations
  const sortedConcepts = [...concepts].sort((a: any, b: any) => getPct(a) - getPct(b));
  const weakestConcept = sortedConcepts[0] || c0;

  const mentorDialogue: GameMentorDialogue = {
    npcName: 'XYRA (Mentor)',
    avatarIcon: '🤖',
    greeting: `Commander ${store.handle}! Your world is thriving with ${workerCount} active workers. Let's strengthen ${weakestConcept.name}.`,
    recommendedConceptId: weakestConcept.id,
    recommendedConceptName: weakestConcept.name,
    challengeTitle: `Adaptive Challenge: ${weakestConcept.name}`,
    difficultyLabel: accuracyRate > 80 ? 'Elite Mastery' : 'Target Practice',
    actionUrl: `/quest?concept=${encodeURIComponent(weakestConcept.id)}`,
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
    masteredTopicsCount: masteredCount,
    totalTopicsCount: concepts.length || 5,
    availableQuestsCount: Math.max(3, concepts.length),
    resources: {
      wood,
      stone,
      crystal,
      gold,
    },
    buildings: {
      hq: {
        id: 'bldg_hq',
        name: 'Town Hall',
        conceptName: 'Overall Domain Sovereignty',
        type: 'hq',
        level: hqLevel,
        isUpgrading: false,
        masteryPercent: avgMastery,
        upgradeProgress: worldProgressPercent,
        title: `Town Hall (Lv.${hqLevel})`,
        subtitle: `${currentTierInfo.name}`,
        statsLabel: `${totalXp} Total XP · ${streak} Day Streak`,
        questsCompleted: attempts.length,
        actionText: worldProgressPercent >= 100 ? 'Ascend Town Hall' : 'Upgrade Realm',
        actionUrl: '/home',
        position: [0, 0, -1.8],
      },
      library: {
        id: 'bldg_library',
        name: 'Grand Archives',
        conceptId: c1.id,
        conceptName: c1.name,
        type: 'library',
        level: libraryLevel,
        isUpgrading: false,
        masteryPercent: getPct(c1),
        upgradeProgress: getPct(c1),
        title: `Archives: ${c1.name}`,
        subtitle: `Level ${libraryLevel} · ${getPct(c1)}% Mastered`,
        statsLabel: `${masteredCount}/${concepts.length || 5} Domain Topics Mastered`,
        questsCompleted: Math.floor(attempts.length * 0.3),
        actionText: 'Explore Knowledge',
        actionUrl: `/quest?concept=${encodeURIComponent(c1.id)}`,
        position: [-3.8, 0, -1.5],
      },
      questBoard: {
        id: 'bldg_quest_board',
        name: 'Quest Outpost',
        conceptName: 'Adaptive Quests & Bounties',
        type: 'quest_board',
        level: questBoardLevel,
        isUpgrading: false,
        masteryPercent: accuracyRate,
        upgradeProgress: Math.min(100, (attempts.length / 20) * 100),
        title: `Quest Outpost (Lv.${questBoardLevel})`,
        subtitle: `${attempts.length} Quests Solved (${accuracyRate}% Accuracy)`,
        statsLabel: `${Math.max(3, concepts.length)} Active Bounties Available`,
        questsCompleted: attempts.length,
        actionText: 'View Bounties',
        actionUrl: mentorDialogue.actionUrl,
        position: [3.8, 0, -1.5],
      },
      aiLab: {
        id: 'bldg_ai_lab',
        name: 'AI Research Spire',
        conceptId: c3.id,
        conceptName: c3.name,
        type: 'ai_lab',
        level: aiLabLevel,
        isUpgrading: false,
        masteryPercent: getPct(c3),
        upgradeProgress: accuracyRate,
        title: `AI Spire: ${c3.name}`,
        subtitle: `Level ${aiLabLevel} · ${getPct(c3)}% Calibration`,
        statsLabel: 'Bayesian Knowledge Tracing Active',
        questsCompleted: Math.floor(attempts.length * 0.25),
        actionText: 'Calibrate Skill',
        actionUrl: `/quest?concept=${encodeURIComponent(c3.id)}`,
        position: [3.6, 0, 2.2],
      },
      goldVault: {
        id: 'bldg_gold_vault',
        name: 'Gold Vault',
        conceptName: 'Treasury & XP Bank',
        type: 'gold_vault',
        level: goldVaultLevel,
        isUpgrading: false,
        masteryPercent: 85,
        upgradeProgress: 85,
        title: `Gold Vault (Lv.${goldVaultLevel})`,
        subtitle: `${gold} Gold Stored`,
        statsLabel: `Capacity: ${Math.max(1000, totalXp * 2)} Gold`,
        questsCompleted: attempts.length,
        actionText: 'Collect Gold',
        actionUrl: '/history',
        position: [-3.6, 0, 2.2],
      },
      elixirCondenser: {
        id: 'bldg_elixir',
        name: 'Mana Condenser',
        conceptId: c2.id,
        conceptName: c2.name,
        type: 'elixir_condenser',
        level: elixirLevel,
        isUpgrading: false,
        masteryPercent: getPct(c2),
        upgradeProgress: getPct(c2),
        title: `Mana Vat: ${c2.name}`,
        subtitle: `Level ${elixirLevel} · ${getPct(c2)}% Mana Charge`,
        statsLabel: `Synthesizing ${masteredCount} Domain Crystals`,
        questsCompleted: Math.floor(attempts.length * 0.35),
        actionText: 'Harvest Crystals',
        actionUrl: `/quest?concept=${encodeURIComponent(c2.id)}`,
        position: [-1.8, 0, 3.6],
      },
      workshop: {
        id: 'bldg_workshop',
        name: "Builder's Forge",
        conceptId: c0.id,
        conceptName: c0.name,
        type: 'workshop',
        level: workshopLevel,
        isUpgrading: false,
        masteryPercent: getPct(c0),
        upgradeProgress: getPct(c0),
        title: `Forge: ${c0.name}`,
        subtitle: `Level ${workshopLevel} · ${getPct(c0)}% Mastery`,
        statsLabel: `${wood} Wood · ${stone} Stone Available`,
        questsCompleted: Math.floor(attempts.length * 0.4),
        actionText: 'Craft Mastery',
        actionUrl: `/quest?concept=${encodeURIComponent(c0.id)}`,
        position: [1.8, 0, 3.6],
      },
    },
    mentor: mentorDialogue,
  };
}
