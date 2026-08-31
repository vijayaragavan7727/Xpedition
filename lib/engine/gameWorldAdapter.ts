/**
 * Game World Progression & State Adapter
 * Connects learner XP, streak, accuracy, BKT mastery, and attempts directly
 * to the playable 3D game island state.
 */

import { UserStoreData, calculateStreak } from '../store';
import { thetaToPercent } from './mastery';

export type WorldTierLevel = 1 | 2 | 3 | 4 | 5;

export interface GameBuildingState {
  id: string;
  name: string;
  type: 'hq' | 'library' | 'quest_board';
  level: number; // 1 to 3
  isUpgrading: boolean;
  upgradeProgress: number; // 0 to 100
  title: string;
  subtitle: string;
  statsLabel: string;
  actionText: string;
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
  };
  mentor: GameMentorDialogue;
}

// XP Thresholds for World Evolution Tiers
const WORLD_TIER_THRESHOLDS: { tier: WorldTierLevel; name: string; minXp: number; maxXp: number }[] = [
  { tier: 1, name: 'Starter Camp', minXp: 0, maxXp: 500 },
  { tier: 2, name: 'Growing Settlement', minXp: 500, maxXp: 1500 },
  { tier: 3, name: 'Learning Village', minXp: 1500, maxXp: 3000 },
  { tier: 4, name: 'Advanced Learning City', minXp: 3000, maxXp: 5000 },
  { tier: 5, name: 'XPedition World Metropolis', minXp: 5000, maxXp: 10000 },
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

  // Resources generated from real activity
  const wood = Math.floor(totalXp * 0.8 + attempts.length * 10 + 50);
  const stone = Math.floor(totalXp * 0.5 + correctAttempts * 12 + 30);
  const crystal = Math.floor(masteredCount * 40 + currentTierInfo.tier * 25 + 15);
  const gold = Math.floor(streak * 30 + (store.rewardsCount || 0) * 50 + totalXp * 0.4);

  // Building Upgrade Levels based on metrics
  const hqLevel = currentTierInfo.tier >= 4 ? 3 : currentTierInfo.tier >= 2 ? 2 : 1;
  const libraryLevel = masteredCount >= 3 ? 3 : concepts.length >= 2 ? 2 : 1;
  const questBoardLevel = attempts.length >= 15 ? 3 : attempts.length >= 5 ? 2 : 1;

  // Weakest Concept for Mentor Recommendations
  const sortedConcepts = [...concepts].sort((a: any, b: any) => {
    const aPct = a.thetaAssisted !== undefined ? thetaToPercent(a.thetaAssisted) : a.masteryPercentage || 0;
    const bPct = b.thetaAssisted !== undefined ? thetaToPercent(b.thetaAssisted) : b.masteryPercentage || 0;
    return aPct - bPct;
  });

  const weakestConcept = sortedConcepts[0] || {
    id: 'core_foundations',
    name: 'Core Foundations & Practice',
    masteryPercentage: 40,
  };

  const mentorDialogue: GameMentorDialogue = {
    npcName: 'XYRA (Mentor)',
    avatarIcon: '🤖',
    greeting: `Greetings, ${store.handle}! Your realm is expanding. Let's sharpen your mastery in ${weakestConcept.name}.`,
    recommendedConceptId: weakestConcept.id,
    recommendedConceptName: weakestConcept.name,
    challengeTitle: `Adaptive Challenge: ${weakestConcept.name}`,
    difficultyLabel: accuracyRate > 80 ? 'Advanced Mastery' : 'Target Practice',
    actionUrl: `/quest?concept=${encodeURIComponent(weakestConcept.id)}`,
  };

  return {
    learnerName: store.handle || 'Explorer',
    learnerLevel,
    totalXp,
    worldLevel: currentTierInfo.tier,
    worldLevelName: currentTierInfo.name,
    worldProgressPercent,
    currentXpInTier: inTier,
    xpNeededForNextTier,
    streakDays: streak,
    accuracyRate,
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
        name: 'Learning HQ',
        type: 'hq',
        level: hqLevel,
        isUpgrading: false,
        upgradeProgress: worldProgressPercent,
        title: `HQ Level ${hqLevel}`,
        subtitle: `${currentTierInfo.name} Sovereign`,
        statsLabel: `${totalXp} Total XP · ${streak} Day Streak`,
        actionText: worldProgressPercent >= 100 ? 'Ascend World' : 'View Progress',
        position: [0, 0, -3.2],
      },
      library: {
        id: 'bldg_library',
        name: 'Grand Library',
        type: 'library',
        level: libraryLevel,
        isUpgrading: false,
        upgradeProgress: Math.min(100, (masteredCount / Math.max(1, concepts.length)) * 100),
        title: `Library Level ${libraryLevel}`,
        subtitle: `${masteredCount}/${concepts.length || 5} Topics Mastered`,
        statsLabel: `${avgMastery}% Overall Domain Mastery`,
        actionText: 'Explore Topics',
        position: [-3.5, 0, 0.5],
      },
      questBoard: {
        id: 'bldg_quest_board',
        name: 'Quest Notice Board',
        type: 'quest_board',
        level: questBoardLevel,
        isUpgrading: false,
        upgradeProgress: Math.min(100, (attempts.length / 20) * 100),
        title: `Quest Board Level ${questBoardLevel}`,
        subtitle: `${attempts.length} Quests Solved (${accuracyRate}% Accuracy)`,
        statsLabel: `${Math.max(3, concepts.length)} Active Bounties Available`,
        actionText: 'View Quests',
        position: [3.5, 0, 0.5],
      },
    },
    mentor: mentorDialogue,
  };
}
