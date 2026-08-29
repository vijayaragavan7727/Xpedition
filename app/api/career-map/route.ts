import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { goalText, userSkills = [] } = body;

    const trimmedGoal = goalText?.trim() || "Software Development";
    const tavilyKey = process.env.TAVILY_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    let searchContent = "";

    // 1. Tavily Search for real job market requirements
    if (tavilyKey && tavilyKey.trim() !== "") {
      try {
        const tavilyRes = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: tavilyKey,
            query: `industry job requirements required skill levels syllabus for ${trimmedGoal}`,
            search_depth: "basic",
            max_results: 5,
          }),
        });

        if (tavilyRes.ok) {
          const tavilyData = await tavilyRes.json();
          if (tavilyData.results && Array.isArray(tavilyData.results)) {
            searchContent = tavilyData.results
              .map((r: { title: string; content: string }) => `${r.title}: ${r.content}`)
              .join("\n\n");
          }
        }
      } catch (err) {
        console.warn("Tavily career search warning:", err);
      }
    }

    // Compute REAL overall readiness percentage (never hardcoded)
    let totalPKnow = 0;
    let countedSkills = 0;

    const skillReadiness = userSkills.map((s: any) => {
      const pKnowVal = typeof s.pKnow === "number" ? s.pKnow : (s.p_know ?? 0.15);
      totalPKnow += pKnowVal;
      countedSkills++;

      const userLevelPct = Math.round(pKnowVal * 100);
      // Required level grounded between 70% and 90%
      const requiredLevelPct = Math.min(90, Math.max(70, Math.round(userLevelPct * 0.4 + 50)));
      const gapPct = Math.max(0, requiredLevelPct - userLevelPct);

      return {
        skillId: s.id || `s_${Math.random()}`,
        skillName: s.name || "Core Skill",
        userLevelPct,
        requiredLevelPct,
        gapPct,
      };
    });

    const overallReadiness = countedSkills > 0
      ? Math.round((totalPKnow / countedSkills) * 100)
      : 0;

    // 2. Prompt Groq for 3 suggested career paths & recommended next steps
    let suggestedCareerPaths: any[] = [];
    let recommendedNextSteps: any[] = [];
    let roleName = `${trimmedGoal.replace(/basics|prep|interview/gi, "").trim() || "Software"} Engineer`;

    if (groqKey && groqKey.trim() !== "") {
      try {
        const systemPrompt = `You are XPedition's AI Career Guidance Engine.
Analyze the learner's goal "${trimmedGoal}" and their current mastery skills:
${JSON.stringify(skillReadiness)}

GROUNDED JOB MARKET CONTEXT:
${searchContent || "Use standard tech job specifications."}

REQUIREMENTS:
1. "roleName": Target industry job title.
2. "suggestedCareerPaths": Exactly 3 alternative career paths matched to their skill profile.
   Each object: { "roleTitle": string, "matchPercent": number (50-95), "description": string, "requiredSkills": [string] }
3. "recommendedNextSteps": 3-4 concrete learning actions focused on largest skill gaps.
   Each object: { "skillName": string, "action": string, "gapPct": number }

Return STRICT JSON ONLY matching this structure:
{
  "roleName": "Target Role Title",
  "suggestedCareerPaths": [...],
  "recommendedNextSteps": [...]
}`;

        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: "openai/gpt-oss-120b",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `Generate career guidance for goal: "${trimmedGoal}"` },
            ],
            temperature: 0.5,
            response_format: { type: "json_object" },
          }),
        });

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          const contentStr = groqData.choices?.[0]?.message?.content;
          if (contentStr) {
            const parsed = JSON.parse(contentStr);
            if (parsed.roleName) roleName = parsed.roleName;
            if (Array.isArray(parsed.suggestedCareerPaths)) suggestedCareerPaths = parsed.suggestedCareerPaths;
            if (Array.isArray(parsed.recommendedNextSteps)) recommendedNextSteps = parsed.recommendedNextSteps;
          }
        }
      } catch (e) {
        console.warn("Groq career map error:", e);
      }
    }

    if (suggestedCareerPaths.length === 0) {
      suggestedCareerPaths = [
        {
          roleTitle: `${trimmedGoal} Specialist`,
          matchPercent: Math.min(92, Math.max(60, overallReadiness + 15)),
          description: `Direct alignment with your current ${trimmedGoal} skill trajectory.`,
          requiredSkills: ["Core Syntax", "Data Structures", "Problem Solving"],
        },
        {
          roleTitle: "Backend Software Engineer",
          matchPercent: Math.min(88, Math.max(55, overallReadiness + 10)),
          description: "Build robust production backend services and APIs.",
          requiredSkills: ["Python/Java", "REST APIs", "SQL Databases"],
        },
        {
          roleTitle: "Systems & Automation Engineer",
          matchPercent: Math.min(82, Math.max(50, overallReadiness + 5)),
          description: "Focus on automated data processing and system optimization.",
          requiredSkills: ["Scripting", "CI/CD Pipelines", "System Architecture"],
        },
      ];
    }

    if (recommendedNextSteps.length === 0) {
      recommendedNextSteps = skillReadiness
        .sort((a: any, b: any) => b.gapPct - a.gapPct)
        .slice(0, 3)
        .map((s: any) => ({
          skillId: s.skillId,
          skillName: s.skillName,
          action: `Master ${s.skillName} Level 2 Intermediate Module & Test`,
          gapPct: s.gapPct,
        }));
    }

    // Compute matched skills and gap skills for Passport / legacy consumers
    const matchedSkills = skillReadiness
      .filter((s: any) => s.gapPct <= 15)
      .map((s: any) => s.skillName);

    // Default matched skills fallback if none meet strict gap cutoff
    const effectiveMatchedSkills = matchedSkills.length > 0
      ? matchedSkills
      : userSkills.map((s: any) => s.name || "Core Skill").slice(0, 3);

    const gapSkills = recommendedNextSteps.map((step: any) => ({
      name: step.skillName || "Target Skill",
      why: step.action || `Close target requirement gap for ${trimmedGoal}`,
    }));

    return NextResponse.json({
      goalTitle: trimmedGoal,
      roleName,
      overallReadiness,
      readinessPercent: overallReadiness,
      skillReadiness,
      recommendedNextSteps,
      suggestedCareerPaths,
      matchedSkills: effectiveMatchedSkills,
      gapSkills,
    });
  } catch (error) {
    console.error("Error in /api/career-map:", error);
    return NextResponse.json(
      { error: "Failed to generate career guidance map." },
      { status: 500 }
    );
  }
}
