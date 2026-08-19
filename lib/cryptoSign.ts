import crypto from "crypto";

const PASSPORT_SECRET = process.env.PASSPORT_SIGNING_SECRET || "xpedition-passport-hmac-secret-2026";

export interface SkillSnapshotItem {
  name: string;
  pKnow: number;
}

export function computeCanonicalPayload(
  userId: string,
  goalTitle: string,
  overallReadiness: number,
  skills: SkillSnapshotItem[]
): string {
  const normalizedSkills = skills.map((s) => ({
    name: s.name.trim(),
    pKnow: Number(s.pKnow.toFixed(4)),
  }));

  const payload = {
    userId,
    goalTitle: goalTitle.trim(),
    overallReadiness: Number(overallReadiness.toFixed(4)),
    skills: normalizedSkills,
  };

  return JSON.stringify(payload);
}

export function signPassportSnapshot(
  userId: string,
  goalTitle: string,
  overallReadiness: number,
  skills: SkillSnapshotItem[]
): string {
  const canonicalStr = computeCanonicalPayload(userId, goalTitle, overallReadiness, skills);
  return crypto.createHmac("sha256", PASSPORT_SECRET).update(canonicalStr).digest("hex");
}

export function verifyPassportSignature(
  userId: string,
  goalTitle: string,
  overallReadiness: number,
  skills: SkillSnapshotItem[],
  existingSignature: string
): boolean {
  const expectedSignature = signPassportSnapshot(userId, goalTitle, overallReadiness, skills);
  return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(existingSignature));
}
