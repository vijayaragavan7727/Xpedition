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
 * Guaranteed contract:
 * - wasCorrect = true  -> P(know) strictly INCREASES
 * - wasCorrect = false -> P(know) strictly DECREASES
 */
export function updateMastery(pKnow: number, wasCorrect: boolean): number {
  const p = Math.max(0.01, Math.min(0.99, pKnow));
  const { pSlip, pGuess, pTransit } = BKT_PARAMS;

  let pKnowGivenObs: number;

  if (wasCorrect) {
    const pCorrect = p * (1 - pSlip) + (1 - p) * pGuess;
    pKnowGivenObs = (p * (1 - pSlip)) / (pCorrect || 1);
    // Apply learning transition only on correct answers
    const pKnowNew = pKnowGivenObs + (1 - pKnowGivenObs) * pTransit;
    const finalMastery = Math.max(p + 0.05, Math.min(0.99, Number(pKnowNew.toFixed(4))));
    console.log(`[BKT CORRECTION LOG] Correct answer. P(know): ${p.toFixed(4)} -> ${finalMastery.toFixed(4)} (+${(finalMastery - p).toFixed(4)})`);
    return finalMastery;
  } else {
    const pIncorrect = p * pSlip + (1 - p) * (1 - pGuess);
    pKnowGivenObs = (p * pSlip) / (pIncorrect || 1);
    // NO learning transit added on wrong answers — strictly decrease mastery
    const finalMastery = Math.max(0.01, Math.min(p - 0.04, Number(pKnowGivenObs.toFixed(4))));
    console.log(`[BKT DECAY LOG] Wrong answer. P(know): ${p.toFixed(4)} -> ${finalMastery.toFixed(4)} (${(finalMastery - p).toFixed(4)})`);
    return finalMastery;
  }
}
