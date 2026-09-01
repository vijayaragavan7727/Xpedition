import { UserStoreData } from './store';

export type OnboardingStep = 'goal' | 'calibrate' | 'ready';

export function getNextStep(state: UserStoreData | null): OnboardingStep {
  if (!state) {
    console.log('[Onboarding Gate] No store state present -> goal');
    return 'goal';
  }

  const activeGraph = state.graphs?.find((g) => g.id === state.activeGraphId) || state.graphs?.[0];

  if (!activeGraph) {
    console.log('[Onboarding Gate] No active skill graph found -> goal');
    return 'goal';
  }

  const concepts = activeGraph.concepts || [];
  const conceptIds = concepts.map((c) => c.id);

  // Check if concept IDs belong to the active graph
  const isConceptsEmpty = concepts.length === 0;
  if (isConceptsEmpty) {
    console.log(`[Onboarding Gate] Graph ID: ${activeGraph.id} (${activeGraph.goalText}) has 0 concepts -> goal`);
    return 'goal';
  }

  // Calibration completion evaluation
  const isCalibrated =
    activeGraph.calibrationCompletedAt !== undefined ||
    activeGraph.calibratedTheta !== undefined ||
    concepts.some((c) => c.baselineTheta !== undefined) ||
    (activeGraph.attempts && activeGraph.attempts.length > 0);

  console.log(`[Onboarding Gate] Graph ID: ${activeGraph.id} | Goal: "${activeGraph.goalText}" | Concepts: [${conceptIds.join(', ')}] | Calibrated: ${isCalibrated} (completedAt: ${activeGraph.calibrationCompletedAt ?? 'none'}, theta: ${activeGraph.calibratedTheta ?? 'none'}, attempts: ${activeGraph.attempts?.length ?? 0})`);

  if (!isCalibrated) {
    return 'calibrate';
  }

  return 'ready';
}
