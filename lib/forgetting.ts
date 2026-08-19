import { supabase, isSupabaseConfigured } from "./supabase";
import { Skill } from "./types";

export interface DueSkill extends Skill {
  halfLifeHours: number;
  nextReviewAt: string;
  pKnow: number;
  overdueMinutes: number;
}

/**
 * Updates half-life memory decay value (in hours):
 * - Correct answer: extend half-life by 1.6x (capped at 720h = 30 days)
 * - Mistake: shrink half-life by 0.5x (floored at 4h)
 */
export function updateHalfLife(currentHalfLifeHours: number = 48, wasCorrect: boolean): number {
  if (wasCorrect) {
    const extended = currentHalfLifeHours * 1.6;
    return Math.min(720, Math.max(4, Number(extended.toFixed(2))));
  } else {
    const shrunk = currentHalfLifeHours * 0.5;
    return Math.max(4, Number(shrunk.toFixed(2)));
  }
}

/**
 * Computes next_review_at timestamp given last_seen_at Date and half_life_hours
 */
export function computeNextReviewAt(lastSeenAt: Date = new Date(), halfLifeHours: number = 48): string {
  const nextDate = new Date(lastSeenAt.getTime() + halfLifeHours * 3600 * 1000);
  return nextDate.toISOString();
}

/**
 * Retrieves skills due for review (where next_review_at <= NOW()), ordered by most overdue first.
 */
export async function getDueSkills(userId?: string): Promise<DueSkill[]> {
  const now = new Date();

  if (isSupabaseConfigured() && userId) {
    try {
      const { data: masteryRecords, error } = await supabase
        .from("mastery")
        .select(`
          skill_id,
          p_know,
          half_life_hours,
          next_review_at,
          skills (
            id,
            name,
            difficulty
          )
        `)
        .eq("user_id", userId)
        .lte("next_review_at", now.toISOString())
        .order("next_review_at", { ascending: true });

      if (masteryRecords && masteryRecords.length > 0) {
        return masteryRecords.map((m: any) => {
          const nextRev = new Date(m.next_review_at || now);
          const overdueMinutes = Math.max(0, Math.floor((now.getTime() - nextRev.getTime()) / 60000));

          return {
            id: m.skill_id,
            name: m.skills?.name || "General Skill",
            difficulty: m.skills?.difficulty || 2,
            halfLifeHours: m.half_life_hours || 48,
            nextReviewAt: m.next_review_at,
            pKnow: m.p_know || 0.15,
            overdueMinutes,
          };
        });
      }
    } catch (err) {
      console.warn("Supabase getDueSkills notice:", err);
    }
  }

  // Fallback demo due skills if no DB record found
  const pastDate = new Date(now.getTime() - 24 * 3600 * 1000).toISOString();
  return [
    {
      id: "due-1",
      name: "Python Core Syntax & Data Structures",
      difficulty: 1,
      halfLifeHours: 48,
      nextReviewAt: pastDate,
      pKnow: 0.45,
      overdueMinutes: 1440,
    },
    {
      id: "due-2",
      name: "Object-Oriented Programming (Classes & Decorators)",
      difficulty: 2,
      halfLifeHours: 24,
      nextReviewAt: pastDate,
      pKnow: 0.35,
      overdueMinutes: 720,
    },
  ];
}
