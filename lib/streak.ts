/**
 * XPedition Real Timezone Streak & Streak Freeze Engine
 */

export interface StreakState {
  streakDays: number;
  longestStreak: number;
  streakFreezes: number;
  lastActiveDate: string; // YYYY-MM-DD
  freezeUsed?: boolean;
}

/**
 * Gets local YYYY-MM-DD date string for a timezone
 */
export function getLocalDateString(date: Date = new Date(), timeZone?: string): string {
  try {
    const tz = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(date); // Returns YYYY-MM-DD
  } catch (e) {
    return date.toISOString().split("T")[0];
  }
}

/**
 * Calculate difference in days between two YYYY-MM-DD date strings
 */
export function getDiffInDays(dateStr1: string, dateStr2: string): number {
  const d1 = new Date(dateStr1 + "T00:00:00Z");
  const d2 = new Date(dateStr2 + "T00:00:00Z");
  const diffMs = d2.getTime() - d1.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Evaluates and updates streak state upon quest completion
 */
export function calculateUpdatedStreak(
  currentStreak: StreakState,
  userTimeZone?: string,
  now: Date = new Date()
): StreakState {
  const todayStr = getLocalDateString(now, userTimeZone);
  const lastStr = currentStreak.lastActiveDate || todayStr;

  const diffDays = getDiffInDays(lastStr, todayStr);

  let newStreakDays = currentStreak.streakDays || 1;
  let newFreezes = currentStreak.streakFreezes ?? 0;
  let freezeUsed = false;

  if (diffDays === 0) {
    // Same day activity -> maintain current streak
    newStreakDays = currentStreak.streakDays || 1;
  } else if (diffDays === 1) {
    // Consecutive day activity -> increment streak
    newStreakDays = (currentStreak.streakDays || 0) + 1;
  } else if (diffDays === 2 && newFreezes > 0) {
    // Missed 1 day but has a banked freeze -> consume freeze and preserve streak!
    newFreezes = Math.max(0, newFreezes - 1);
    newStreakDays = (currentStreak.streakDays || 0) + 1;
    freezeUsed = true;
  } else {
    // Gap > 1 day with no freeze -> reset streak to 1
    newStreakDays = 1;
  }

  // Earn streak freeze every 7 days (max 2 banked)
  if (newStreakDays > 0 && newStreakDays % 7 === 0 && newFreezes < 2 && !freezeUsed) {
    newFreezes = Math.min(2, newFreezes + 1);
  }

  const newLongest = Math.max(currentStreak.longestStreak || 1, newStreakDays);

  return {
    streakDays: newStreakDays,
    longestStreak: newLongest,
    streakFreezes: newFreezes,
    lastActiveDate: todayStr,
    freezeUsed,
  };
}
