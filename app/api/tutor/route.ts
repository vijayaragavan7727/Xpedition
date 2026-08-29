import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      question,
      userTranscript,
      transcript,
      skillName = "General Skill",
      masteryLevel,
      pKnow,
      history = [],
    } = body;

    const groqKey = process.env.GROQ_API_KEY;

    if (!groqKey || groqKey.trim() === "") {
      console.error("[TUTOR API] GROQ_API_KEY is missing or empty.");
      return NextResponse.json(
        { error: "Couldn't reach the tutor, try again" },
        { status: 500 }
      );
    }

    const rawTranscript = (userTranscript || transcript || "").trim();

    // Guard: If transcript is empty, return "I didn't catch that, try again" without calling AI
    if (!rawTranscript) {
      console.log("[TUTOR API] Empty transcript received. Returning fallback prompt.");
      return NextResponse.json({ hint: "I didn't catch that, try again" });
    }

    const questionPrompt = typeof question === "string"
      ? question
      : (question?.prompt || "Current learning concept");
    const optionsText = Array.isArray(question?.options) && question.options.length > 0
      ? ` Options: ${question.options.join(", ")}`
      : "";

    const learnerMastery = masteryLevel ?? pKnow ?? "Intermediate";
    const fullQuestionStr = `${questionPrompt}${optionsText}`;

    console.log("[TUTOR API RAW REQUEST]", {
      rawTranscript,
      questionPrompt,
      skillName,
      learnerMastery,
      historyLength: Array.isArray(history) ? history.length : 0,
    });

    const systemPrompt = `You are XPedition's Voice AI Tutor — a patient, highly knowledgeable mentor.
The learner is practicing the skill: "${skillName}" (Mastery level: ${learnerMastery}).
Target Question: "${fullQuestionStr}".

INSTRUCTIONS:
1. Provide a direct, helpful, natural, 1-3 sentence explanation or hint answering the learner's exact question or comment.
2. Directly reference their actual words: "${rawTranscript}".
3. Guide them toward understanding without giving away the answer directly.
4. Keep your answer conversational, encouraging, and clear for voice text-to-speech output.`;

    const formattedHistory = Array.isArray(history)
      ? history.slice(-6).map((msg: any) => ({
          role: msg.role === "assistant" ? "assistant" : "user",
          content: String(msg.content || ""),
        }))
      : [];

    const messages = [
      { role: "system", content: systemPrompt },
      ...formattedHistory,
      { role: "user", content: rawTranscript },
    ];

    // Valid Groq API models
    const candidateModels = [
      "openai/gpt-oss-120b",
      "llama-3.1-8b-instant",
      "mixtral-8x7b-32768"
    ];

    let hintText: string | null = null;
    let lastStatus = 500;

    for (const modelName of candidateModels) {
      console.log(`[TUTOR API] Calling Groq model: ${modelName} with temperature 0.7`);
      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: modelName,
          messages,
          temperature: 0.7,
          max_tokens: 200,
        }),
      });

      const groqResText = await groqRes.text();
      lastStatus = groqRes.status;

      if (groqRes.ok) {
        try {
          const groqData = JSON.parse(groqResText);
          const candidateHint = groqData.choices?.[0]?.message?.content?.trim();
          if (candidateHint) {
            hintText = candidateHint;
            console.log(`[TUTOR API RAW RESPONSE SUCCESS] Model: ${modelName} | Hint: "${hintText}"`);
            break;
          }
        } catch (e) {
          console.warn("[TUTOR API] Error parsing JSON response:", e);
        }
      } else {
        console.warn(`[TUTOR API FAIL] Model: ${modelName} | Status: ${groqRes.status} | Output: ${groqResText}`);
      }
    }

    if (hintText) {
      return NextResponse.json({ hint: hintText });
    }

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
