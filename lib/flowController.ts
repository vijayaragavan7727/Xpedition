import { predictCorrect } from "./bkt";

export interface FlowState {
  currentDifficulty: number; // 1 to 5
  outOfBandCounter: number; // tracks consecutive out-of-band signals
  outOfBandDirection: "up" | "down" | "none";
  lastAccuracyHistory: boolean[];
}

export const TARGET_BAND = {
  min: 0.70,
  max: 0.85,
};

export interface FlowDecision {
  nextDifficulty: number;
  explanation: string;
  newOutOfBandCounter: number;
  newOutOfBandDirection: "up" | "down" | "none";
}

/**
 * Determines the next difficulty level (1-5) using Hysteresis Flow Control:
 * - Target success band: 0.70 to 0.85
 * - Hysteresis: Never change difficulty by more than 1 step at a time.
 * - Requires 2 consecutive out-of-band signals to shift levels.
 */
export function determineNextDifficulty(
  pKnow: number,
  currentDifficulty: number,
  state: FlowState,
  hintsUsed: number = 0
): FlowDecision {
  const pPredicted = predictCorrect(pKnow);
  let nextDifficulty = currentDifficulty;
  let newCounter = state.outOfBandCounter;
  let newDirection = state.outOfBandDirection;
  let explanation = "";

  // Heavy hint usage (> 1 hint) acts as a partial struggle signal
  if (hintsUsed >= 2) {
    nextDifficulty = Math.max(1, currentDifficulty - 1);
    newCounter = 0;
    newDirection = "none";
    explanation = `Difficulty nudged to Level ${nextDifficulty}: Heavy hint usage (${hintsUsed} hints used) treated as partial struggle signal to maintain optimal flow.`;
  } else if (pPredicted > TARGET_BAND.max) {
    // Predicted accuracy is above target band -> learner is ready for higher challenge
    if (state.outOfBandDirection === "up") {
      newCounter += 1;
    } else {
      newDirection = "up";
      newCounter = 1;
    }

    if (newCounter >= 2) {
      nextDifficulty = Math.min(5, currentDifficulty + 1);
      newCounter = 0;
      newDirection = "none";
      explanation = `Difficulty raised to Level ${nextDifficulty}: You demonstrated high accuracy, and your mastery estimate rose to ${(pKnow * 100).toFixed(0)}% (Predicted success ${(pPredicted * 100).toFixed(0)}% > 85%).`;
    } else {
      explanation = `Maintained Level ${currentDifficulty}: Predicted accuracy (${(pPredicted * 100).toFixed(0)}%) is high. 1 more high-performance signal will raise difficulty.`;
    }
  } else if (pPredicted < TARGET_BAND.min) {
    // Predicted accuracy is below target band -> ease challenge to restore flow
    if (state.outOfBandDirection === "down") {
      newCounter += 1;
    } else {
      newDirection = "down";
      newCounter = 1;
    }

    if (newCounter >= 2) {
      nextDifficulty = Math.max(1, currentDifficulty - 1);
      newCounter = 0;
      newDirection = "none";
      explanation = `Difficulty eased to Level ${nextDifficulty}: Mastery estimate is ${(pKnow * 100).toFixed(0)}% (Predicted success ${(pPredicted * 100).toFixed(0)}% < 70%). Adjusted for optimal learning flow.`;
    } else {
      explanation = `Maintained Level ${currentDifficulty}: Predicted accuracy is ${(pPredicted * 100).toFixed(0)}%. 1 more low-performance signal will lower difficulty.`;
    }
  } else {
    // Inside target flow band (0.70 - 0.85)
    newCounter = 0;
    newDirection = "none";
    explanation = `Optimal Flow Active at Level ${currentDifficulty}: Predicted success is ${(pPredicted * 100).toFixed(0)}%, perfectly inside the ideal 70%-85% flow zone!`;
  }

  // Enforce Hysteresis Rule: Never jump by more than 1 step
  const diffDelta = nextDifficulty - currentDifficulty;
  if (Math.abs(diffDelta) > 1) {
    nextDifficulty = currentDifficulty + Math.sign(diffDelta);
  }

  return {
    nextDifficulty,
    explanation,
    newOutOfBandCounter: newCounter,
    newOutOfBandDirection: newDirection,
  };
}
