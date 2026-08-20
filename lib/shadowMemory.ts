export interface ShadowMistake {
  id: string;
  conceptName: string;
  skillName: string;
  recordedAt: number;
}

const STORAGE_KEY_PREFIX = "xpedition_shadow_mistakes_";

export function getShadowMistakes(userId: string): ShadowMistake[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("Error reading shadow mistakes:", e);
  }
  return [
    {
      id: "m1",
      conceptName: "Tuples and Immutability",
      skillName: "Python Core Syntax",
      recordedAt: Date.now() - 86400000,
    },
    {
      id: "m2",
      conceptName: "Dictionary Key Lookup",
      skillName: "Python Core Syntax",
      recordedAt: Date.now() - 43200000,
    },
  ];
}

export function recordShadowMistake(
  userId: string,
  conceptName: string,
  skillName: string
) {
  if (typeof window === "undefined" || !conceptName) return;
  try {
    const current = getShadowMistakes(userId);
    const exists = current.some(
      (m) => m.conceptName.toLowerCase() === conceptName.toLowerCase()
    );
    if (!exists) {
      const updated = [
        ...current,
        {
          id: `m_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          conceptName,
          skillName,
          recordedAt: Date.now(),
        },
      ].slice(-10); // Keep max 10
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(updated));
    }
  } catch (e) {
    console.warn("Error recording shadow mistake:", e);
  }
}

export function resolveShadowMistake(userId: string, conceptName: string): boolean {
  if (typeof window === "undefined" || !conceptName) return false;
  try {
    const current = getShadowMistakes(userId);
    const filtered = current.filter(
      (m) => m.conceptName.toLowerCase() !== conceptName.toLowerCase()
    );
    if (filtered.length !== current.length) {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(filtered));
      return true;
    }
  } catch (e) {
    console.warn("Error resolving shadow mistake:", e);
  }
  return false;
}
