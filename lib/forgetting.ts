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
 * - Initial / First review window: 10 minutes (0.1667 hours) so concepts become due quickly in demo
 * - Subsequent correct answer: extend half-life exponentially (0.1667h -> 1h -> 4h -> 16h -> 64h up to 720h)
 * - Mistake: shrink half-life back to 10 minutes (0.1667h)
 */
export function updateHalfLife(currentHalfLifeHours: number = 0.1667, wasCorrect: boolean): number {
  if (wasCorrect) {
    if (currentHalfLifeHours >= 48) return 0.1667; // 10 minutes for initial review
    if (currentHalfLifeHours <= 0.17) return 1.0; // 1 hour for 2nd review
    const extended = currentHalfLifeHours * 2.5;
    return Math.min(720, Number(extended.toFixed(2)));
  } else {
    return 0.1667; // Reset to 10 minutes on mistake
  }
}

/**
 * Computes next_review_at timestamp given last_seen_at Date and half_life_hours
 */
export function computeNextReviewAt(lastSeenAt: Date = new Date(), halfLifeHours: number = 0.1667): string {
  const nextDate = new Date(lastSeenAt.getTime() + halfLifeHours * 3600 * 1000);
  return nextDate.toISOString();
}

/**
 * Retrieves skills due for review (where next_review_at <= NOW()), ordered by most overdue first.
 * Integrates both DB records and local forced-due items for stage demos.
 */
export async function getDueSkills(userId?: string): Promise<DueSkill[]> {
  const now = new Date();

  // Check local storage for forced due skill (Stage Demo Mode)
  let forcedDue: DueSkill[] = [];
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("xpedition_forced_due");
      if (stored) {
        forcedDue = JSON.parse(stored);
      }
    } catch (e) {}
  }

  let dbDueSkills: DueSkill[] = [];

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

      if (error) {
        console.warn("Supabase getDueSkills query error:", error);
      }

      if (masteryRecords && masteryRecords.length > 0) {
        dbDueSkills = masteryRecords.map((m: any) => {
          const nextRev = new Date(m.next_review_at || now);
          const overdueMinutes = Math.max(0, Math.floor((now.getTime() - nextRev.getTime()) / 60000));

          return {
            id: m.skill_id,
            name: m.skills?.name || "General Skill",
            difficulty: m.skills?.difficulty || 2,
            halfLifeHours: m.half_life_hours || 0.1667,
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

  // Merge forced due and DB due skills, deduplicating by ID
  const combined = [...forcedDue, ...dbDueSkills];
  const uniqueMap = new Map<string, DueSkill>();
  combined.forEach((item) => {
    if (!uniqueMap.has(item.id)) {
      uniqueMap.set(item.id, item);
    }
  });

  const dueList = Array.from(uniqueMap.values());

  console.log(`[getDueSkills] User: ${userId || "anon"}, Found ${dueList.length} due skills for Memory Raid`);
  return dueList;
}
