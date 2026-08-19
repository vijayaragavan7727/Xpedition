import { supabase, isSupabaseConfigured } from "./supabase";

export type ArmType = "badge" | "lore" | "guild_invite" | "leaderboard" | "cosmetic";

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
  "cosmetic",
];

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
 * Beta(a, b) = X / (X + Y) where X ~ Gamma(a) and Y ~ Gamma(b)
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
 * Selects the optimal arm using Thompson Sampling:
 * For each arm, draws a sample from Beta(alpha, beta) and selects the arm with max sample.
 */
export function selectArm(arms: RewardArm[]): RewardArm {
  if (!arms || arms.length === 0) {
    return {
      arm: "badge",
      alpha: 3,
      beta: 1,
      pulls: 1,
      returns: 1,
      lastSampledValue: 0.75,
    };
  }

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
 * - Delayed 24h Return Signal (weight = 1.0): User returned for a new session within 24 hours of reward drop.
 * - Same-Session Return Signal (weight = 0.3): User completed another quest within the same session.
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

  // Delayed 24h return signal is weighted at 1.0 (alpha += 1.0), whereas same-session return is weighted at 0.3 (alpha += 0.3)
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
 * Warm starts user reward arms in Supabase:
 * Sets alpha = 3 for the user's selected motivation arm
 */
export async function initUserArms(userId: string, motivatedArm: ArmType = "badge"): Promise<RewardArm[]> {
  const armsToCreate: RewardArm[] = BANDIT_ARMS.map((arm) => ({
    arm,
    alpha: arm === motivatedArm ? 3 : 1, // Warm prior alpha = 3 for motivated arm
    beta: 1,
    pulls: 0,
    returns: 0,
  }));

  if (isSupabaseConfigured() && userId) {
    try {
      const records = armsToCreate.map((a) => ({
        user_id: userId,
        arm: a.arm,
        alpha: a.alpha,
        beta: a.beta,
        pulls: a.pulls,
        returns: a.returns,
      }));

      await supabase.from("reward_arms").upsert(records);
    } catch (err) {
      console.warn("Supabase initUserArms error:", err);
    }
  }

  return armsToCreate;
}
