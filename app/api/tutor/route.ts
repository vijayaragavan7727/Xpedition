import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, userTranscript, skillName } = body;

    const groqKey = process.env.GROQ_API_KEY;

    const questionPrompt = typeof question === "string" 
      ? question 
      : (question?.prompt || "Current question context");
    const optionsText = Array.isArray(question?.options) 
      ? ` Options: ${question.options.join(", ")}` 
      : "";

    if (groqKey && groqKey.trim() !== "") {
      try {
        const systemPrompt = "You are a patient tutor. The learner is stuck on this question. Give a HINT that guides them toward the answer WITHOUT revealing it. Two sentences maximum.";
        const userMessage = `Skill: ${skillName || "General"}\nQuestion: ${questionPrompt}${optionsText}\nLearner asked/said: "${userTranscript || "I need a hint"}"`;

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
              { role: "user", content: userMessage },
            ],
            temperature: 0.5,
            max_tokens: 150,
          }),
        });

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          const hintText = groqData.choices?.[0]?.message?.content?.trim();
          if (hintText) {
            return NextResponse.json({ hint: hintText });
          }
        }
      } catch (err) {
        console.warn("Groq API error in /api/tutor:", err);
      }
    }

    // Contextual Fallback Hint if API unavailable or fails
    let fallbackHint = "Think carefully about the core rules of this topic. Identify which option matches the required property without modifying existing structures!";
    if (userTranscript?.toLowerCase().includes("base case")) {
      fallbackHint = "The base case is the condition where a recursive function stops calling itself. Look for the boundary condition that prevents an infinite loop!";
    } else if (questionPrompt.toLowerCase().includes("immutable") || questionPrompt.toLowerCase().includes("tuple")) {
      fallbackHint = "Recall which Python collection cannot be mutated after creation and uses parentheses syntax. Compare Lists (brackets) with Tuples!";
    }

    return NextResponse.json({ hint: fallbackHint });
  } catch (error) {
    console.error("Error in /api/tutor:", error);
    return NextResponse.json(
      { hint: "Consider the key definitions for this skill and eliminate options that violate the constraints." },
      { status: 200 }
    );
  }
}
