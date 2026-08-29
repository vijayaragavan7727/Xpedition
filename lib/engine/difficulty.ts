import type { MotivationState, Quest, Reward } from '@/lib/types';

/** Target p(correct) per motivation state. Flow band is 0.70-0.85. */
export const TARGET_SUCCESS: Record<MotivationState, number> = {
  flow: 0.78,
  frustrated: 0.92, // give them a win, fast
  bored: 0.62,      // make them work
  drifting: 0.85,
  unknown: 0.80,
};

/**
 * Invert the Rasch model: given ability and a target success rate, the
 * ideal item difficulty is theta - logit(target).
 */
export function idealDifficulty(theta: number, target: number): number {
  const t = Math.min(0.97, Math.max(0.03, target));
  return theta - Math.log(t / (1 - t));
}

export function selectQuest(
  pool: Quest[],
  theta: number,
  motivation: MotivationState,
  seenIds: string[] | Set<string> = [],
): { quest: Quest | null; target: number; ideal: number } {
  const target = TARGET_SUCCESS[motivation] ?? 0.8;
  const ideal = idealDifficulty(theta, target);

  const seenSet = seenIds instanceof Set ? seenIds : new Set(seenIds);
  const unseen = pool.filter((q) => !seenSet.has(q.id));

  // If unseen items exist, pick from unseen pool; otherwise pool exhausted
  const candidates = unseen;
  if (!candidates.length) return { quest: null, target, ideal };

  const quest = candidates.reduce((best, q) =>
    Math.abs(q.difficulty - ideal) < Math.abs(best.difficulty - ideal) ? q : best,
  candidates[0]);

  return { quest, target, ideal };
}

const LABELS: Record<Reward['rarity'], string[]> = {
  common: ['Shard', 'Focus Token', 'Spark'],
  rare:   ['Insight Core', 'Streak Sigil', 'Deep Cut'],
  epic:   ['Mastery Relic', 'Arena Crown', 'Breakthrough'],
};

/**
 * Variable-ratio, not fixed points. Fixed rewards get priced in and stop
 * motivating; unpredictable ones don't. A pity counter stops a bad streak
 * from ever feeling unfair, and a frustrated learner is never denied a drop.
 */
export function rollReward(
  correct: boolean,
  motivation: MotivationState,
  sinceLastDrop: number,
  rand: () => number = Math.random,
): Reward | null {
  if (!correct) return null;

  let chance = 0.45 + Math.min(0.5, sinceLastDrop * 0.14);
  if (motivation === 'frustrated') chance = 1;   // always pay out a hard-won win
  if (motivation === 'bored') chance *= 0.7;     // scarcity restores value

  if (rand() > chance) return null;

  const r = rand();
  let rarity: Reward['rarity'] = 'common';
  if (motivation === 'bored') {
    rarity = r > 0.75 ? 'epic' : r > 0.35 ? 'rare' : 'common';
  } else {
    rarity = r > 0.93 ? 'epic' : r > 0.68 ? 'rare' : 'common';
  }

  const pool = LABELS[rarity];
  return {
    id: `rw_${Date.now().toString(36)}_${Math.floor(rand() * 1e4)}`,
    rarity,
    label: pool[Math.floor(rand() * pool.length)],
    at: Date.now(),
  };
}
