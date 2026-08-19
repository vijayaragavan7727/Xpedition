/**
 * XPedition Level Growth Curve Progression System
 * Formula: xpForLevel(n) = Math.floor(100 * (n ^ 1.5))
 */

export function xpForLevel(level: number): number {
  if (level <= 0) return 0;
  return Math.floor(100 * Math.pow(level, 1.5));
}

export function levelFromXp(totalXp: number): number {
  if (totalXp <= 0) return 1;
  let level = 1;
  while (totalXp >= xpForLevel(level)) {
    level++;
  }
  return level;
}

export interface XPProgressResult {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  percent: number;
  xpInLevel: number;
  xpNeededForNext: number;
}

export function xpProgress(totalXp: number): XPProgressResult {
  const level = levelFromXp(totalXp);
  const currentLevelXp = level === 1 ? 0 : xpForLevel(level - 1);
  const nextLevelXp = xpForLevel(level);

  const xpInLevel = Math.max(0, totalXp - currentLevelXp);
  const xpNeededForNext = nextLevelXp - currentLevelXp;
  const percent = Math.min(100, Math.max(0, Math.round((xpInLevel / xpNeededForNext) * 100)));

  return {
    level,
    currentLevelXp,
    nextLevelXp,
    percent,
    xpInLevel,
    xpNeededForNext,
  };
}
