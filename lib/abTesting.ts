import { supabase, isSupabaseConfigured } from "./supabase";

export type CohortType = "adaptive" | "control";

export interface CohortAssignment {
  userId: string;
  cohort: CohortType;
  assignedAt: string;
}

export interface AssessmentRecord {
  id?: number;
  userId: string;
  goalId?: string;
  phase: "pre" | "post";
  score: number;
  maxScore: number;
  takenAt?: string;
}

/**
 * Assigns a 50/50 cohort ("adaptive" vs "control") upon signup/onboarding
 */
export async function assignCohort(userId: string): Promise<CohortType> {
  // Check local cache first
  if (typeof window !== "undefined") {
    const cached = localStorage.getItem(`xpedition_cohort_${userId}`);
    if (cached === "adaptive" || cached === "control") {
      return cached;
    }
  }

  // Check Supabase if configured
  if (isSupabaseConfigured() && userId) {
    try {
      const { data } = await supabase
        .from("experiment_assignments")
        .select("cohort")
        .eq("user_id", userId)
        .single();

      if (data?.cohort) {
        if (typeof window !== "undefined") {
          localStorage.setItem(`xpedition_cohort_${userId}`, data.cohort);
        }
        return data.cohort as CohortType;
      }
    } catch (e) {
      console.warn("Error fetching experiment assignment:", e);
    }
  }

  // Random 50/50 assignment
  const cohort: CohortType = Math.random() < 0.5 ? "adaptive" : "control";

  if (typeof window !== "undefined") {
    localStorage.setItem(`xpedition_cohort_${userId}`, cohort);
  }

  if (isSupabaseConfigured() && userId) {
    try {
      await supabase.from("experiment_assignments").upsert({
        user_id: userId,
        cohort,
        assigned_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn("Error saving experiment assignment to Supabase:", e);
    }
  }

  return cohort;
}

/**
 * Computes Hake's Normalized Learning Gain: g = (post - pre) / (max - pre)
 */
export function computeHakeGain(preScore: number, postScore: number, maxScore: number = 5.0): number {
  const denominator = maxScore - preScore;
  if (denominator <= 0) return 0;
  const gain = (postScore - preScore) / denominator;
  return Math.min(1.0, Math.max(-1.0, Number(gain.toFixed(4))));
}
