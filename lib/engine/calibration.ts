import { Attempt } from '@/lib/store';

export type Quadrant = 'solid' | 'honest_gap' | 'fragile' | 'blind_spot';

/**
 * Maps a single attempt to one of the four confidence calibration quadrants:
 * - solid: known + correct (real mastery)
 * - honest_gap: unsure + wrong (aware of gap)
 * - fragile: unsure + correct (guessed or shaky)
 * - blind_spot: known + wrong (dangerous misconception)
 */
export function quadrant(
  confidence: 'known' | 'unsure' | undefined,
  isCorrect: boolean
): Quadrant {
  if (confidence === 'known') {
    return isCorrect ? 'solid' : 'blind_spot';
  }
  // Default or 'unsure'
  return isCorrect ? 'fragile' : 'honest_gap';
}

/**
 * Computes calibration score from -1 to +1:
 * +1 = fully overconfident, -1 = fully underconfident / cautious, 0 = accurate.
 * Formula: (share of 'known' that were wrong) - (share of 'unsure' that were right)
 * Returns null if attempts with recorded confidence < 8.
 */
export function calibrationScore(attempts: Attempt[]): number | null {
  const valid = (attempts || []).filter((a) => a.confidence !== undefined);
  if (valid.length < 8) return null;

  const knowns = valid.filter((a) => a.confidence === 'known');
  const unsures = valid.filter((a) => a.confidence === 'unsure');

  const knownWrongShare =
    knowns.length > 0
      ? knowns.filter((a) => !a.isCorrect).length / knowns.length
      : 0;

  const unsureRightShare =
    unsures.length > 0
      ? unsures.filter((a) => a.isCorrect).length / unsures.length
      : 0;

  const rawScore = knownWrongShare - unsureRightShare;
  // Clamp between -1 and +1
  return Math.max(-1, Math.min(1, rawScore));
}

/**
 * Returns concepts where known + wrong ('blind_spot') occurred,
 * sorted by frequency count descending.
 */
export function blindSpots(
  attempts: Attempt[],
  concepts: { id: string; name: string }[]
): { conceptId: string; conceptName: string; count: number }[] {
  const map = new Map<string, { conceptName: string; count: number }>();

  (attempts || []).forEach((a) => {
    if (a.confidence === 'known' && !a.isCorrect) {
      const cId = a.conceptId;
      const cName =
        a.conceptName ||
        concepts.find((c) => c.id === cId)?.name ||
        'Target Subject';

      const existing = map.get(cId) || { conceptName: cName, count: 0 };
      map.set(cId, { conceptName: cName, count: existing.count + 1 });
    }
  });

  return Array.from(map.entries())
    .map(([conceptId, data]) => ({
      conceptId,
      conceptName: data.conceptName,
      count: data.count,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Returns breakdown of attempts into the four quadrants.
 */
export function confidenceBreakdown(attempts: Attempt[]): {
  solid: number;
  honestGap: number;
  fragile: number;
  blindSpot: number;
  totalWithConfidence: number;
} {
  let solid = 0;
  let honestGap = 0;
  let fragile = 0;
  let blindSpot = 0;
  let totalWithConfidence = 0;

  (attempts || []).forEach((a) => {
    if (a.confidence) {
      totalWithConfidence++;
      const q = quadrant(a.confidence, a.isCorrect);
      if (q === 'solid') solid++;
      else if (q === 'honest_gap') honestGap++;
      else if (q === 'fragile') fragile++;
      else if (q === 'blind_spot') blindSpot++;
    }
  });

  return { solid, honestGap, fragile, blindSpot, totalWithConfidence };
}
