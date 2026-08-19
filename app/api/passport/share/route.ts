import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { signPassportSnapshot, SkillSnapshotItem } from "@/lib/cryptoSign";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, userName, goalTitle, skills, overallReadiness } = body;

    const effectiveUserId = userId || "demo-user-1";
    const effectiveGoal = goalTitle || "Python Mastery Quest";
    const effectiveReadiness = typeof overallReadiness === "number" ? overallReadiness : 0.85;

    const formattedSkills: SkillSnapshotItem[] = Array.isArray(skills)
      ? skills.map((s: any) => ({
          name: typeof s === "string" ? s : s.name || "Skill",
          pKnow: typeof s.pKnow === "number" ? s.pKnow : 0.8,
        }))
      : [{ name: "Python Core Syntax", pKnow: 0.9 }];

    // Sign payload server-side using HMAC-SHA256
    const signature = signPassportSnapshot(
      effectiveUserId,
      effectiveGoal,
      effectiveReadiness,
      formattedSkills
    );

    const shareId = crypto.randomUUID();
    const snapshotId = crypto.randomUUID();
    const issuedAt = new Date().toISOString();

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from("passport_snapshots").insert({
        id: snapshotId,
        user_id: effectiveUserId,
        share_id: shareId,
        goal_title: effectiveGoal,
        skills_json: formattedSkills,
        overall_readiness: effectiveReadiness,
        signature,
        issued_at: issuedAt,
      }).select().single();

      if (error) {
        console.warn("Error saving snapshot to Supabase:", error);
      }
    }

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const publicUrl = `${protocol}://${host}/p/${shareId}`;

    return NextResponse.json({
      success: true,
      snapshotId,
      shareId,
      publicUrl,
      signature,
      issuedAt,
    });
  } catch (err: any) {
    console.error("Passport share endpoint error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate passport snapshot signature" },
      { status: 500 }
    );
  }
}
