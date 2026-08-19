import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { verifyPassportSignature, SkillSnapshotItem } from "@/lib/cryptoSign";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ snapshotId: string }> }
) {
  try {
    const { snapshotId } = await params;

    if (!snapshotId) {
      return NextResponse.json({ valid: false, error: "Missing snapshot ID" }, { status: 400 });
    }

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from("passport_snapshots")
        .select("*")
        .eq("id", snapshotId)
        .single();

      if (error || !data) {
        return NextResponse.json({
          valid: false,
          error: "Snapshot not found or record has been tampered with/deleted",
        });
      }

      const skills: SkillSnapshotItem[] = Array.isArray(data.skills_json)
        ? data.skills_json
        : [];

      // Recompute HMAC signature and compare
      let isValid = false;
      try {
        isValid = verifyPassportSignature(
          data.user_id,
          data.goal_title,
          data.overall_readiness,
          skills,
          data.signature
        );
      } catch (e) {
        isValid = false;
      }

      return NextResponse.json({
        valid: isValid,
        issuedAt: data.issued_at,
        goalTitle: data.goal_title,
        overallReadiness: data.overall_readiness,
        skillCount: skills.length,
        signature: data.signature,
      });
    }

    // Fallback response for unconfigured Supabase demo
    return NextResponse.json({
      valid: true,
      issuedAt: new Date().toISOString(),
      goalTitle: "Verified Practice Credential",
      overallReadiness: 0.88,
      skillCount: 5,
    });
  } catch (err: any) {
    console.error("Verification endpoint error:", err);
    return NextResponse.json({ valid: false, error: err.message }, { status: 500 });
  }
}
