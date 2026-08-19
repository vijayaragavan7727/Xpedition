import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { goalText, userSkills } = body;

    const trimmedGoal = goalText?.trim() || "Software Development";
    const tavilyKey = process.env.TAVILY_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    let searchContent = "";

    // 1. Search real job requirements using Tavily Search API
    if (tavilyKey && tavilyKey.trim() !== "") {
      try {
        const tavilyRes = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: tavilyKey,
            query: `job requirements interview skills syllabus for ${trimmedGoal}`,
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

    // 2. Call Groq LLM to generate structured career mapping
    if (groqKey && groqKey.trim() !== "") {
      try {
        const systemPrompt = `You are a Career Outcome & Skill Gap Analyst.
Analyze the user's target goal "${trimmedGoal}" and their current skill mastery vector:
${JSON.stringify(userSkills || [])}

Using the industry research context below:
${searchContent || "No extra web research available."}

Respond with STRICT JSON ONLY. Do not wrap in markdown backticks.
The JSON structure MUST be:
{
  "roleName": "Specific target industry role title (e.g. Python Backend Engineer / Zoho Developer)",
  "readinessPercent": number between 30 and 95 based on their mastery vector,
  "matchedSkills": ["Skill Name 1", "Skill Name 2"],
  "gapSkills": [
    {
      "name": "Gap Skill Name",
      "why": "Clear 1-sentence reason why this skill is vital for this target role"
    }
  ]
}

Provide 2 to 4 gap skills that complement their existing path.`;

        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `Generate career map for goal: "${trimmedGoal}"` },
            ],
            temperature: 0.4,
            response_format: { type: "json_object" },
          }),
        });

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          const contentStr = groqData.choices?.[0]?.message?.content;
          if (contentStr) {
            const parsed = JSON.parse(contentStr);
            if (parsed.roleName && typeof parsed.readinessPercent === "number" && Array.isArray(parsed.gapSkills)) {
              return NextResponse.json(parsed);
            }
          }
        }
      } catch (err) {
        console.warn("Groq API error in career-map:", err);
      }
    }

    // Fallback career outcome mapping if API is unavailable
    const fallbackMatched = userSkills?.map((s: any) => s.name) || ["Python Core Syntax & Data Structures"];
    return NextResponse.json({
      roleName: `${trimmedGoal.replace(/basics|prep|interview/gi, "").trim() || "Software"} Engineer`,
      readinessPercent: 62,
      matchedSkills: fallbackMatched,
      gapSkills: [
        {
          name: "System Design & AsyncIO",
          why: "Required for high-concurrency production microservices.",
        },
        {
          name: "REST API & Database Optimization",
          why: "Essential for building production backend APIs and query performance.",
        },
      ],
    });
  } catch (error) {
    console.error("Error in /api/career-map:", error);
    return NextResponse.json(
      {
        roleName: "Software Engineer",
        readinessPercent: 55,
        matchedSkills: ["Core Fundamentals"],
        gapSkills: [
          {
            name: "API Design & Microservices",
            why: "Key prerequisite for enterprise software roles.",
          },
        ],
      },
      { status: 200 }
    );
  }
}
