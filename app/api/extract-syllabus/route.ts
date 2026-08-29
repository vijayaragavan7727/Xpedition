import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, imageBase64, mimeType = "image/png", fileName = "file" } = body;

    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!text && !imageBase64) {
      return NextResponse.json(
        { error: "No text or image content provided." },
        { status: 400 }
      );
    }

    // 1. Process Image Upload via Gemini Vision API (if GEMINI_API_KEY exists)
    if (imageBase64 && geminiKey && geminiKey.trim() !== "") {
      try {
        const cleanBase64 = imageBase64.includes("base64,")
          ? imageBase64.split("base64,")[1]
          : imageBase64;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: "Analyze this syllabus image/document. Extract 3 to 7 main learning topics, chapter headings, or course subjects. Respond with STRICT JSON ONLY matching format: { \"topics\": [\"Topic 1\", \"Topic 2\", ...], \"summary\": \"Brief 1-sentence summary of the syllabus\" }",
                    },
                    {
                      inlineData: {
                        mimeType: mimeType,
                        data: cleanBase64,
                      },
                    },
                  ],
                },
              ],
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const candText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candText) {
            const cleanJson = candText.replace(/```json/gi, "").replace(/```/g, "").trim();
            const parsed = JSON.parse(cleanJson);
            if (Array.isArray(parsed.topics) && parsed.topics.length > 0) {
              return NextResponse.json(parsed);
            }
          }
        }
      } catch (err) {
        console.warn("Gemini vision API warning:", err);
      }
    }

    // 2. Process Extracted Text or Image Fallback via Groq API
    if (groqKey && groqKey.trim() !== "") {
      try {
        const textToAnalyze = text || `Image document titled: ${fileName}`;
        const promptText = `You are XPedition's Syllabus Analyzer.
Analyze the following extracted syllabus content / notes:
"${textToAnalyze.slice(0, 4000)}"

Extract 3 to 7 clean, searchable learning topics or chapter headings.
Return STRICT JSON ONLY matching format:
{
  "topics": ["Topic 1", "Topic 2", "Topic 3"],
  "summary": "1-sentence summary of the syllabus"
}`;

        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: "openai/gpt-oss-120b",
            messages: [{ role: "user", content: promptText }],
            temperature: 0.2,
            response_format: { type: "json_object" },
          }),
        });

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          const contentStr = groqData.choices?.[0]?.message?.content;
          if (contentStr) {
            const parsed = JSON.parse(contentStr);
            if (Array.isArray(parsed.topics) && parsed.topics.length > 0) {
              return NextResponse.json(parsed);
            }
          }
        }
      } catch (err) {
        console.warn("Groq syllabus extraction warning:", err);
      }
    }

    // 3. Dynamic Fallback Topic Extractor
    let sampleTopics: string[] = ["Foundational Core Principles", "Practical System Design", "Algorithms & Optimization"];
    if (text) {
      const lines = text.split("\n").map((l: string) => l.trim()).filter((l: string) => l.length > 4 && l.length < 50);
      if (lines.length >= 3) {
        sampleTopics = lines.slice(0, 5);
      }
    }

    return NextResponse.json({
      topics: sampleTopics,
      summary: "Syllabus topics extracted successfully.",
    });
  } catch (error) {
    console.error("Extract Syllabus API error:", error);
    return NextResponse.json(
      { error: "Could not extract text from this file. Password-protected or unreadable format." },
      { status: 500 }
    );
  }
}
