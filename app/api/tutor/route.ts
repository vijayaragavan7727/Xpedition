import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, userTranscript, transcript, skillName, masteryLevel, pKnow } = body;

    const groqKey = process.env.GROQ_API_KEY;
    console.log("[TUTOR API] GROQ_API_KEY defined:", !!groqKey);

    if (!groqKey || groqKey.trim() === "") {
      console.error("[TUTOR API] GROQ_API_KEY is missing or empty.");
      return NextResponse.json(
        { error: "Couldn't reach the tutor, try again" },
        { status: 500 }
      );
    }

    const questionPrompt = typeof question === "string" 
      ? question 
      : (question?.prompt || "Current question context");
    const optionsText = Array.isArray(question?.options) && question.options.length > 0
      ? ` Options: ${question.options.join(", ")}` 
      : "";

    const actualTranscript = userTranscript || transcript || "I need help understanding this question.";
    const learnerMastery = masteryLevel ?? pKnow ?? "Unknown";

    console.log("[TUTOR API] Request context received:", {
      questionPrompt,
      actualTranscript,
      skillName: skillName || "General",
      learnerMastery,
    });

    const fullQuestionStr = `${questionPrompt}${optionsText}`;
    const systemPrompt = `You are a patient tutor. The learner is stuck on this specific question: ${fullQuestionStr}. They said: ${actualTranscript}. Give a hint that guides them toward the answer WITHOUT revealing it. Two sentences maximum. Reference their actual words.`;

    const userMessage = `Skill: ${skillName || "General"} | Mastery Level: ${learnerMastery}\nQuestion: ${fullQuestionStr}\nLearner said: "${actualTranscript}"`;

    const candidateModels = ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.6-27b", "groq/compound-mini"];
    let hintText: string | null = null;
    let lastStatus = 500;

    for (const modelName of candidateModels) {
      console.log(`[TUTOR API] Attempting Groq call with model: ${modelName}`);
      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          temperature: 0.5,
          max_tokens: 150,
        }),
      });

      const groqResText = await groqRes.text();
      console.log(`[TUTOR API] Raw Groq response status (${modelName}):`, groqRes.status);
      console.log(`[TUTOR API] Raw Groq response body (${modelName}):`, groqResText);

      lastStatus = groqRes.status;
      if (groqRes.ok) {
        try {
          const groqData = JSON.parse(groqResText);
          const candidateHint = groqData.choices?.[0]?.message?.content?.trim();
          if (candidateHint) {
            hintText = candidateHint;
            break;
          }
        } catch (e) {
          console.warn("[TUTOR API] Error parsing JSON from Groq:", e);
        }
      }
    }

    if (hintText) {
      return NextResponse.json({ hint: hintText });
    }

    console.error("[TUTOR API] Groq API call failed or returned empty response for all candidate models.");
    return NextResponse.json(
      { error: "Couldn't reach the tutor, try again" },
      { status: lastStatus >= 400 ? lastStatus : 500 }
    );
  } catch (error) {
    console.error("[TUTOR API] Error processing tutor request:", error);
    return NextResponse.json(
      { error: "Couldn't reach the tutor, try again" },
      { status: 500 }
    );
  }
}

