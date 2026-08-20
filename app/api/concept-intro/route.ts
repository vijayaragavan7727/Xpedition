import { NextRequest, NextResponse } from "next/server";
import { LearningStyle } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { skillName = "General Skill", goal = "Learning", learningStyle = "story" } = body;

    const groqKey = process.env.GROQ_API_KEY;

    if (groqKey && groqKey.trim() !== "") {
      try {
        const styleInstructions: Record<LearningStyle, string> = {
          story: "Use a vivid real-world analogy or narrative metaphor (e.g., comparing data structures to everyday items or real-life situations). Paint a clear visual picture.",
          theory: "Provide a precise formal definition, underlying computer science/domain principles, and exact theoretical mechanics.",
          code: "Focus on code execution, syntax semantics, and practical implementation patterns. Explain directly through how code operates.",
          stepwise: "Structure the explanation as 3 clear, numbered steps (1. Setup/Input..., 2. Core Operation..., 3. Result/Output...).",
        };

        const promptText = `You are XPedition's Master Educator specializing in personalized learning styles.
Teach the learner the concept of: "${skillName}" (Goal: "${goal}").

LEARNING STYLE REQUIREMENT: "${learningStyle}"
${styleInstructions[learningStyle as LearningStyle] || styleInstructions.story}

Write a 3-4 sentence concept primer that teaches the core principle BEFORE the learner is quizzed on it.

Return STRICT JSON ONLY:
{
  "conceptIntro": "3-4 sentence explanation written strictly in the requested ${learningStyle} style.",
  "keyTakeaways": [
    "Key takeaway point 1",
    "Key takeaway point 2",
    "Key takeaway point 3"
  ]
}`;

        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: promptText }],
            temperature: 0.5,
            response_format: { type: "json_object" },
          }),
        });

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          const contentStr = groqData.choices?.[0]?.message?.content;
          if (contentStr) {
            const parsed = JSON.parse(contentStr);
            if (parsed.conceptIntro) {
              return NextResponse.json(parsed);
            }
          }
        }
      } catch (err) {
        console.warn("Groq concept intro API warning:", err);
      }
    }

    // Dynamic fallback concept intros by learning style
    const fallbackIntros: Record<LearningStyle, string> = {
      story: `Imagine ${skillName} like a well-organized library catalog: instead of searching through every shelf, you look up the index card to find your book instantly!`,
      theory: `${skillName} defines the core formal abstraction governing how data and control structures interact under deterministic execution constraints.`,
      code: `In code, ${skillName} operates by encapsulating data transformation logic: input values pass through defined methods to produce predictable outputs.`,
      stepwise: `1. Initialize the ${skillName} structure. 2. Process incoming data operations sequentially. 3. Validate state transitions and return the final output.`,
    };

    return NextResponse.json({
      conceptIntro: fallbackIntros[learningStyle as LearningStyle] || fallbackIntros.story,
      keyTakeaways: [
        `Understand core mechanics of ${skillName}`,
        `Apply practical patterns in ${goal}`,
        `Recognize edge cases and optimal usage`
      ],
    });
  } catch (error) {
    console.error("Concept Intro API error:", error);
    return NextResponse.json(
      { error: "Failed to generate concept intro." },
      { status: 500 }
    );
  }
}
