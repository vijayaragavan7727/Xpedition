/**
 * Learning Power Score (LPS) Engine
 * Pure mathematical functions for computing learning progress, tiers, and learner profiles.
 */

export type LearnerProfile = 'scholar' | 'trainer' | 'comeback' | 'independent';

export interface LPSBreakdown {
  accuracy: number;     // 0-30
  consistency: number;  // 0-25
  improvement: number;  // 0-20
  completion: number;   // 0-15
  depth: number;        // 0-10
}

export interface LPSResult {
  score: number;          // 0-100
  tier: 1 | 2 | 3 | 4 | 5;
  tierName: string;       // Base Camp → Village → Town → City → Civilization
  profile: LearnerProfile;
  breakdown: LPSBreakdown;
}

export interface LPSInput {
  avgTheta?: number;
  avgMasteryPercent?: number; // 0-100
  streak: number;
  thetaGrowthRate: number;
  totalSessions: number;
  soloSessionCount: number;
  calibrationScore: number;
  thetaSolo?: number;
  thetaAssisted?: number;
}

const TIER_MAP: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'Base Camp',
  2: 'Village',
  3: 'Town',
  4: 'City',
  5: 'Civilization',
};

/**
 * Calculates the overall Learning Power Score (LPS), Tier, and Learner Profile.
 */
export function calculateLPS(input: LPSInput): LPSResult {
  const masteryPercent = input.avgMasteryPercent !== undefined
    ? Math.min(100, Math.max(0, input.avgMasteryPercent))
    : input.avgTheta !== undefined
      ? Math.min(100, Math.max(0, (input.avgTheta + 3) * (100 / 6)))
      : 50;

  // 1. Component calculations
  const accuracy = Math.min(30, Math.max(0, (masteryPercent / 100) * 30));
  const consistency = Math.min(25, Math.max(0, (Math.min(input.streak, 30) / 30) * 25));
  const improvement = Math.min(20, Math.max(0, Math.min(Math.max(0, input.thetaGrowthRate) * 10, 1) * 20));
  const completion = Math.min(15, Math.max(0, (Math.min(input.totalSessions, 20) / 20) * 15));
  
  const depthFactor = (input.soloSessionCount > 0 ? 0.5 : 0) +
                      (Math.abs(input.calibrationScore) < 0.2 ? 0.5 : 0);
  const depth = Math.min(10, Math.max(0, depthFactor * 10));

  const totalRaw = accuracy + consistency + improvement + completion + depth;
  const score = Math.round(Math.min(100, Math.max(0, totalRaw)));

  // 2. Profile logic
  let profile: LearnerProfile = 'scholar';
  const thetaSolo = input.thetaSolo ?? 0;
  const thetaAssisted = input.thetaAssisted ?? 0;

  if (input.soloSessionCount >= 3 && thetaSolo > thetaAssisted - 10) {
    profile = 'independent';
  } else if (masteryPercent > 70 && consistency > 15) {
    profile = 'scholar';
  } else if (consistency > 15 && masteryPercent <= 70) {
    profile = 'trainer';
  } else if (score < 30 && improvement > 5) {
    profile = 'comeback';
  } else {
    profile = 'scholar';
  }

  // 3. Tier logic
  let tier: 1 | 2 | 3 | 4 | 5 = 1;
  if (score <= 20) tier = 1;
  else if (score <= 40) tier = 2;
  else if (score <= 60) tier = 3;
  else if (score <= 80) tier = 4;
  else tier = 5;

  return {
    score,
    tier,
    tierName: TIER_MAP[tier],
    profile,
    breakdown: {
      accuracy: Math.round(accuracy * 10) / 10,
      consistency: Math.round(consistency * 10) / 10,
      improvement: Math.round(improvement * 10) / 10,
      completion: Math.round(completion * 10) / 10,
      depth: Math.round(depth * 10) / 10,
    },
  };
}
