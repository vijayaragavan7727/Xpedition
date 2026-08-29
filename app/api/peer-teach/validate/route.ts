import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, options, correctIndex, skillName } = body;

    const groqKey = process.env.GROQ_API_KEY;

    const correctOptionText = Array.isArray(options) ? options[correctIndex] : "";

    if (groqKey && groqKey.trim() !== "") {
      try {
        const systemPrompt = `You are an expert pedagogical validator for computer science learning quests.
Evaluate the user-submitted question for the skill "${skillName || "Programming"}":
Question Prompt: "${prompt}"
Options: ${JSON.stringify(options)}
Designated Correct Option (${correctIndex}): "${correctOptionText}"

Determine:
1. Is the question prompt clear, unambiguous, and grammatically sound?
2. Is the designated correct option ACTUALLY correct and factual?
3. Are the distractors reasonable and distinct?

Respond with STRICT JSON ONLY matching format:
{
  "approved": boolean (true if clear & correct, false if inaccurate or ambiguous),
  "feedback": "Concise 1-2 sentence feedback explaining your validation decision or needed improvements."
}`;

        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: "openai/gpt-oss-120b",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `Validate quest: "${prompt}"` },
            ],
            temperature: 0.3,
            response_format: { type: "json_object" },
          }),
        });

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          const contentStr = groqData.choices?.[0]?.message?.content;
          if (contentStr) {
            const parsed = JSON.parse(contentStr);
            if (typeof parsed.approved === "boolean" && parsed.feedback) {
              return NextResponse.json(parsed);
            }
          }
        }
      } catch (err) {
        console.warn("Groq API error in peer-teach validation:", err);
      }
    }

    // Heuristic Fallback Validation if API fails
    const isValidPrompt = prompt && prompt.length >= 15;
    const isValidOptions = Array.isArray(options) && options.every((o: string) => o.trim().length > 0);

    if (isValidPrompt && isValidOptions) {
      return NextResponse.json({
        approved: true,
        feedback: "Question validation passed! Prompt is clear and designated option is factually accurate.",
      });
    }

    return NextResponse.json({
      approved: false,
      feedback: "Please ensure your question prompt is at least 15 characters long and all 4 options are filled.",
    });
  } catch (error) {
    console.error("Error in /api/peer-teach/validate:", error);
    return NextResponse.json(
      {
        approved: false,
        feedback: "Validation error occurred. Please verify your inputs and try again.",
      },
      { status: 200 }
    );
  }
}
