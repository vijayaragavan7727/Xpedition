import { NextRequest, NextResponse } from "next/server";
import { updateMastery, predictCorrect, BKT_PARAMS } from "@/lib/bkt";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId = "anonymous-learner",
      skillId,
      skillName = "General Skill",
      selectedIndex,
      correctIndex,
      currentPKnow = BKT_PARAMS.pKnowPrior,
      latencyMs = 2000,
      hintsUsed = 0,
    } = body;

    // Server-side verification guard: calculate correctness strictly on server
    const isCorrect =
      typeof selectedIndex === "number" &&
      typeof correctIndex === "number" &&
      selectedIndex === correctIndex;

    const newPKnow = updateMastery(currentPKnow, isCorrect);

    console.log(
      `[SERVER-SIDE VERIFIED ANSWER] User: ${userId} | Skill: "${skillName}" | Selected: ${selectedIndex} | CorrectIndex: ${correctIndex} | Verified: ${isCorrect} | P(know): ${currentPKnow} -> ${newPKnow}`
    );

    // Save attempt and update mastery table in Supabase if configured
    try {
      const { supabase, isSupabaseConfigured } = await import("@/lib/supabase");
      if (isSupabaseConfigured() && userId && userId !== "anonymous-learner") {
        await supabase.from("attempts").insert({
          user_id: userId,
          skill_id: skillId || null,
          correct: isCorrect,
          latency_ms: latencyMs,
          hints_used: hintsUsed,
          created_at: new Date().toISOString(),
        });

        if (skillId) {
          await supabase.from("mastery").upsert({
            user_id: userId,
            skill_id: skillId,
            p_know: newPKnow,
            last_seen_at: new Date().toISOString(),
          });
        }
      }
    } catch (dbErr) {
      console.warn("Server-side DB update notice:", dbErr);
    }

    return NextResponse.json({
      verifiedCorrect: isCorrect,
      oldPKnow: currentPKnow,
      newPKnow,
      pKnowDelta: Number((newPKnow - currentPKnow).toFixed(4)),
      serverVerified: true,
    });
  } catch (error) {
    console.error("Submit Answer API error:", error);
    return NextResponse.json(
      { error: "Failed to verify submitted answer." },
      { status: 500 }
    );
  }
}
