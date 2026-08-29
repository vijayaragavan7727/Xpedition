/**
 * Pure engine module for Rasch ability (theta) updates and dual-theta gap computation.
 * Manages thetaAssisted (normal sessions) and thetaSolo (solo sessions).
 */

/**
 * Converts a logit ability (theta) to a 0-100 mastery percentage.
 */
export function thetaToPercent(theta: number): number {
  const p = 1 / (1 + Math.exp(-theta));
  return Math.round(p * 100);
}

/**
 * Updates a theta value based on item correctness and difficulty.
 * Used identically for both thetaAssisted and thetaSolo.
 */
export function updateTheta(
  currentTheta: number,
  isCorrect: boolean,
  itemDifficulty: number = 0
): number {
  const prob = 1 / (1 + Math.exp(-(currentTheta - itemDifficulty)));
  const delta = isCorrect ? 0.35 * (1 - prob) : -0.35 * prob;
  const newTheta = currentTheta + delta;
  // Clamp theta within reasonable Rasch boundaries [-3, +3]
  return Math.max(-3, Math.min(3, Number(newTheta.toFixed(2))));
}

/**
 * Computes the mastery gap: masteryPercent(thetaAssisted) - masteryPercent(thetaSolo).
 * Returns null if solo data is unknown or solo attempts < 3.
 */
export function computeGap(
  thetaAssisted: number,
  thetaSolo?: number | null,
  soloCount: number = 0
): number | null {
  if (thetaSolo === undefined || thetaSolo === null || soloCount < 3) {
    return null;
  }
  const assistedPct = thetaToPercent(thetaAssisted);
  const soloPct = thetaToPercent(thetaSolo);
  return assistedPct - soloPct;
}
