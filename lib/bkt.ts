/**
 * Bayesian Knowledge Tracing (BKT) Implementation
 *
 * Parameters:
 * - pKnow (prior, default 0.15)
 * - pTransit (learning probability, default 0.20)
 * - pSlip (probability of mistake despite knowing, default 0.10)
 * - pGuess (probability of guessing correctly without knowing, default 0.25)
 */

export const BKT_PARAMS = {
  pKnowPrior: 0.15,
  pTransit: 0.20,
  pSlip: 0.10,
  pGuess: 0.25,
  masteryThreshold: 0.85,
};

/**
 * Predicts the probability of answering correctly given the current mastery P(know).
 * P(correct) = P(know) * (1 - P(slip)) + (1 - P(know)) * P(guess)
 */
export function predictCorrect(pKnow: number): number {
  const p = Math.max(0, Math.min(1, pKnow));
  return p * (1 - BKT_PARAMS.pSlip) + (1 - p) * BKT_PARAMS.pGuess;
}

/**
 * Updates mastery P(know) after observing evidence (wasCorrect).
 * Returns posterior P(know_new).
 */
export function updateMastery(pKnow: number, wasCorrect: boolean): number {
  const p = Math.max(0, Math.min(0.99, pKnow));
  const { pSlip, pGuess, pTransit } = BKT_PARAMS;

  let pKnowGivenObs: number;

  if (wasCorrect) {
    const pCorrect = p * (1 - pSlip) + (1 - p) * pGuess;
    pKnowGivenObs = (p * (1 - pSlip)) / (pCorrect || 1);
  } else {
    const pIncorrect = p * pSlip + (1 - p) * (1 - pGuess);
    pKnowGivenObs = (p * pSlip) / (pIncorrect || 1);
  }

  // Apply transition (learning) update
  const pKnowNew = pKnowGivenObs + (1 - pKnowGivenObs) * pTransit;

  return Math.max(0.01, Math.min(0.99, Number(pKnowNew.toFixed(4))));
}
