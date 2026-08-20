import { supabase, isSupabaseConfigured } from "./supabase";

export type ArmType = "badge" | "lore" | "guild_invite" | "leaderboard";

export interface RewardArm {
  arm: ArmType;
  alpha: number;
  beta: number;
  pulls: number;
  returns: number;
  lastSampledValue?: number;
}

export const BANDIT_ARMS: ArmType[] = [
  "badge",
  "lore",
  "guild_invite",
  "leaderboard",
];

export const ARM_LABELS: Record<ArmType, string> = {
  badge: "Trophy & Badges",
  lore: "Cyber Lore & Story",
  guild_invite: "Squad & Co-op Raids",
  leaderboard: "Rank & Leaderboards",
};

/**
 * Marsaglia and Tsang method for sampling Gamma(shape, 1) distribution
 */
function sampleGamma(shape: number): number {
  if (shape < 1) {
    return sampleGamma(1 + shape) * Math.pow(Math.random(), 1 / shape);
  }

  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);

  while (true) {
    let u1 = Math.random();
    let u2 = Math.random();
    let z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    let v = 1 + c * z;

    if (v <= 0) continue;

    v = v * v * v;
    let u = Math.random();

    if (u < 1 - 0.0331 * z * z * z * z) return d * v;
    if (Math.log(u) < 0.5 * z * z + d * (1 - v + Math.log(v))) return d * v;
  }
}

/**
 * Generates a random sample from Beta(alpha, beta) distribution
 */
export function sampleBeta(alpha: number, beta: number): number {
  const a = Math.max(0.01, alpha);
  const b = Math.max(0.01, beta);

  const x = sampleGamma(a);
  const y = sampleGamma(b);

  const val = x / (x + y);
  return Number(val.toFixed(4));
}

/**
 * Selects reward arm:
 * - For first 8 rewards: Forced Exploration (rotates through all 4 arms twice so bandit gets real behavioral data)
 * - After 8 rewards: Standard Thompson Sampling (sampleBeta)
 */
export function selectArm(arms: RewardArm[]): RewardArm {
  if (!arms || arms.length === 0) {
    arms = BANDIT_ARMS.map((arm) => ({
      arm,
      alpha: 1,
      beta: 1,
      pulls: 0,
      returns: 0,
    }));
  }

  // Ensure all 4 arms exist
  for (const armType of BANDIT_ARMS) {
    if (!arms.some((a) => a.arm === armType)) {
      arms.push({ arm: armType, alpha: 1, beta: 1, pulls: 0, returns: 0 });
    }
  }

  const totalPulls = arms.reduce((sum, a) => sum + (a.pulls || 0), 0);

  // 1. Behavioral Warm Start: First 8 rewards force exploration across all 4 arms twice
  if (totalPulls < 8) {
    // Find arms that have less than 2 pulls
    const unservedArms = arms.filter((a) => (a.pulls || 0) < 2);
    if (unservedArms.length > 0) {
      // Pick the arm with the minimum number of pulls (cycle tie-breaking)
      const minPullsArm = unservedArms.reduce((prev, curr) =>
        (curr.pulls || 0) < (prev.pulls || 0) ? curr : prev
      );
      return minPullsArm;
    }
  }

  // 2. Thompson Sampling (after 8 forced exploration rewards)
  let bestArm = arms[0];
  let maxSample = -1;

  for (const armItem of arms) {
    const sample = sampleBeta(armItem.alpha, armItem.beta);
    armItem.lastSampledValue = sample;

    if (sample > maxSample) {
      maxSample = sample;
      bestArm = armItem;
    }
  }

  return bestArm;
}

/**
 * Records outcome of reward drop (return visit signal):
 * - If success = true: alpha += weight, returns += weight, pulls += 1
 * - If success = false: beta += weight, pulls += 1
 */
export async function recordOutcome(
  userId: string,
  arm: ArmType,
  success: boolean,
  currentArms?: RewardArm[],
  signalType: "24h_return" | "same_session" = "same_session"
): Promise<RewardArm | null> {
  const targetArm = currentArms?.find((a) => a.arm === arm) || {
    arm,
    alpha: 1,
    beta: 1,
    pulls: 0,
    returns: 0,
  };

  const weight = signalType === "24h_return" ? 1.0 : 0.3;

  const newAlpha = success ? targetArm.alpha + weight : targetArm.alpha;
  const newBeta = success ? targetArm.beta : targetArm.beta + weight;
  const newPulls = targetArm.pulls + 1;
  const newReturns = success ? targetArm.returns + weight : targetArm.returns;

  const updated: RewardArm = {
    arm,
    alpha: Number(newAlpha.toFixed(2)),
    beta: Number(newBeta.toFixed(2)),
    pulls: newPulls,
    returns: Number(newReturns.toFixed(2)),
  };

  if (isSupabaseConfigured() && userId) {
    try {
      await supabase.from("reward_arms").upsert({
        user_id: userId,
        arm,
        alpha: updated.alpha,
        beta: updated.beta,
        pulls: newPulls,
        returns: updated.returns,
      });
    } catch (err) {
      console.warn("Supabase recordOutcome error:", err);
    }
  }

  return updated;
}

/**
 * Behavioral Warm Start:
 * Initializes all 4 reward arms with equal priors (alpha = 1, beta = 1)
 */
export async function initUserArms(userId: string): Promise<RewardArm[]> {
  const armsToCreate: RewardArm[] = BANDIT_ARMS.map((arm) => ({
    arm,
    alpha: 1,
    beta: 1,
    pulls: 0,
    returns: 0,
  }));

  if (isSupabaseConfigured() && userId) {
    try {
      const records = armsToCreate.map((a) => ({
        user_id: userId,
        arm: a.arm,
        alpha: 1,
        beta: 1,
        pulls: 0,
        returns: 0,
      }));

      await supabase.from("reward_arms").upsert(records);
    } catch (err) {
      console.warn("Supabase initUserArms error:", err);
    }
  }

  return armsToCreate;
}

/**
 * Computes top arm insight for profile page:
 * Shown only once there are at least 10 recorded outcomes.
 */
export function getTopArmInsight(arms: RewardArm[]): {
  isLearned: boolean;
  totalOutcomes: number;
  topArm?: ArmType;
  label?: string;
  expectedValue?: number;
} {
  if (!arms || arms.length === 0) {
    return { isLearned: false, totalOutcomes: 0 };
  }

  const totalOutcomes = arms.reduce((sum, a) => sum + (a.pulls || 0), 0);

  if (totalOutcomes < 10) {
    return { isLearned: false, totalOutcomes };
  }

  // Find arm with highest mean alpha / (alpha + beta)
  let bestArm = arms[0];
  let maxEV = -1;

  for (const armItem of arms) {
    const ev = armItem.alpha / (armItem.alpha + armItem.beta);
    if (ev > maxEV) {
      maxEV = ev;
      bestArm = armItem;
    }
  }

  return {
    isLearned: true,
    totalOutcomes,
    topArm: bestArm.arm,
    label: ARM_LABELS[bestArm.arm] || bestArm.arm,
    expectedValue: Number((maxEV * 100).toFixed(0)),
  };
}
