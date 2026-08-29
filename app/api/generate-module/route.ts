import { NextRequest, NextResponse } from "next/server";
import { cleanAndParseJSON, isProgrammingSubject, validateQuestion } from "@/lib/aiParser";

export const dynamic = "force-dynamic";

interface Section {
  sectionId: string;
  heading: string;
  paragraphs: string[];
  codeExample?: {
    code: string;
    explanation: string;
  } | null;
}

interface SourceCitation {
  title: string;
  url: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      skillId = "s1",
      skillName = "General Skill",
      level = 1,
      learningStyle = "story",
      goal = "Learning Goal",
    } = body;

    const groqKey = process.env.GROQ_API_KEY;
    const tavilyKey = process.env.TAVILY_API_KEY;

    const isProg = isProgrammingSubject(skillName, goal);

    const levelLabels: Record<number, string> = {
      1: "Basics & Foundations",
      2: "Intermediate Concepts & Practical Application",
      3: "Advanced Mastery & Real-World Systems",
    };

    const levelDesc = levelLabels[level] || levelLabels[1];

    // 1. Check Supabase cache for (skill_id, level, learning_style)
    try {
      const { supabase, isSupabaseConfigured } = await import("@/lib/supabase");
      if (isSupabaseConfigured()) {
        const { data: cachedModule } = await supabase
          .from("modules")
          .select("*")
          .eq("skill_id", skillId)
          .eq("level", level)
          .eq("learning_style", learningStyle)
          .single();

        if (cachedModule && cachedModule.content && Array.isArray(cachedModule.questions) && cachedModule.questions.length >= 8) {
          // Validate cached questions - if any question is a placeholder, skip cache!
          const allValid = cachedModule.questions.every((q: any) => validateQuestion(q, skillName, goal).isValid);
          if (allValid) {
            console.log(`[MODULE CACHE HIT - VALID] Skill: ${skillName} | Level: ${level} | Style: ${learningStyle}`);
            return NextResponse.json({
              title: cachedModule.title,
              sections: cachedModule.content,
              takeaways: cachedModule.takeaways,
              sources: cachedModule.sources,
              questions: cachedModule.questions,
              isCached: true,
            });
          } else {
            console.log(`[MODULE CACHE INVALID - STUBS DETECTED] Invalidating cache & re-generating fresh AI questions for: ${skillName}`);
          }
        }
      }
    } catch (e) {
      console.warn("Notice checking module cache:", e);
    }

    // 2. Fetch grounded Web Search results via Tavily
    let searchContent = "";
    let extractedSources: SourceCitation[] = [];

    const academicKeywords = [
      "computer", "science", "algorithm", "data structure", "database", "sql",
      "python", "java", "c++", "engineering", "electronics", "math", "physics",
      "machine learning", "ai", "operating system", "network", "compiler", "software"
    ];

    const isAcademicTopic = academicKeywords.some((kw) =>
      skillName.toLowerCase().includes(kw) || goal.toLowerCase().includes(kw)
    );

    if (tavilyKey && tavilyKey.trim() !== "") {
      try {
        let academicResults: any[] = [];
        if (isAcademicTopic) {
          try {
            const nptelRes = await fetch("https://api.tavily.com/search", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                api_key: tavilyKey,
                query: `${skillName} course syllabus nptel swayam`,
                include_domains: ["nptel.ac.in", "swayam.gov.in"],
                search_depth: "basic",
                max_results: 3,
              }),
            });
            if (nptelRes.ok) {
              const nptelData = await nptelRes.json();
              if (nptelData.results && Array.isArray(nptelData.results)) {
                academicResults = nptelData.results;
              }
            }
          } catch (e) {
            console.warn("Notice fetching NPTEL/SWAYAM search:", e);
          }
        }

        const queryStr = `learn ${skillName} ${levelDesc} tutorial guide`;
        const tavilyRes = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: tavilyKey,
            query: queryStr,
            search_depth: "basic",
            max_results: 5,
          }),
        });

        let generalResults: any[] = [];
        if (tavilyRes.ok) {
          const tavilyData = await tavilyRes.json();
          if (tavilyData.results && Array.isArray(tavilyData.results)) {
            generalResults = tavilyData.results;
          }
        }

        const combinedResults = [...academicResults, ...generalResults];
        if (combinedResults.length > 0) {
          extractedSources = combinedResults.slice(0, 6).map((r: any) => ({
            title: r.title || skillName,
            url: r.url || "https://nptel.ac.in",
          }));

          searchContent = combinedResults
            .map((r: any) => `Source: ${r.title} (${r.url})\nContent: ${r.content || ""}`)
            .join("\n\n");
        }
      } catch (err) {
        console.warn("Tavily search notice during module generation:", err);
      }
    }

    if (extractedSources.length === 0) {
      extractedSources = [
        { title: `${skillName} Reference Material`, url: "https://nptel.ac.in" },
        { title: `${skillName} ${levelDesc} Guide`, url: "https://swayam.gov.in" },
      ];
    }

    // 3. Subject-Aware Directives for Non-Programming vs Programming Subjects
    const nonProgrammingDirective = `
CRITICAL NON-PROGRAMMING DOMAIN RULES:
- This course ("${skillName}") is a NON-PROGRAMMING subject (e.g. Spoken English, Communication, Business, History, etc.).
- You MUST NEVER mention "syntax", "compiler", "code snippet", "runtime", "variable", "programming", or "bug" anywhere in the title, text, questions, or options!
- Test concrete real-world principles, vocabulary, grammar rules, active listening, tone of voice, situation dialogues, and practical communication strategies.
- Every question MUST name a specific, concrete concept or scenario. NEVER use vague phrases like "Section 1", "this concept", "Option A:", or "(Level 1 - Q1)".`;

    const programmingDirective = `
CRITICAL PROGRAMMING DOMAIN RULES:
- All syntax, terminology, questions, and code snippets MUST strictly belong to "${skillName}".
- Include code examples and syntax breakdowns where helpful.
- Every question MUST test a concrete syntax rule, function behavior, logic pattern, or error case.`;

    const domainRule = isProg ? programmingDirective : nonProgrammingDirective;

    const stylePromptDirectives: Record<string, string> = {
      story: "Explain concepts through vivid real-world analogies, metaphors, and story narratives.",
      theory: "Focus on formal definitions, underlying theoretical mechanics, and fundamental principles.",
      code: "Lead with clear practical examples, inline explanations, and operational mechanics.",
      stepwise: "Structure section explanations into clear numbered 1-2-3 step-by-step breakdowns.",
    };

    const styleDirective = stylePromptDirectives[learningStyle] || stylePromptDirectives.story;

    const systemPrompt = `You are XPedition's Master Educator & Curriculum Designer.
Generate a comprehensive 600-900 WORD TEACHING MODULE and a 12-QUESTION TEST BANK derived directly from the module text.

TOPIC DETAILS:
- Overall Goal: "${goal}"
- Skill Topic: "${skillName}"
- Level: Level ${level} (${levelDesc})
- Learning Style: "${learningStyle}" (${styleDirective})

${domainRule}

GROUNDED WEB CONTEXT:
${searchContent || "Use authoritative standard domain knowledge for this topic."}

CRITICAL FORMAT REQUIREMENTS:
1. "sections": Array of 4 to 6 short sections. Each section must have:
   - "sectionId": string (e.g., "section-0", "section-1", "section-2")
   - "heading": Descriptive title (e.g., "Active Listening & Non-Verbal Cues")
   - "paragraphs": Array of 2-4 thorough educational paragraph strings.
   - "codeExample": Object { "code": string, "explanation": string } or null.
2. "takeaways": Array of 3 to 5 key bullet strings.
3. "questions": EXACTLY 12 real, specific questions derived DIRECTLY from the sections above.
   - Each question has: "prompt", "options" [4], "correctIndex", "explanations" [4], "sourceSection", "questionType", "difficulty".
   - NO template placeholders. NO vague "Option A:" prefixes. NO references like "Based on Section N".
4. "challenges": If programming, generate 2 coding challenges matching schema; else return [].

Return STRICT JSON ONLY matching this structure:
{
  "title": "Level ${level} Masterclass: ${skillName}",
  "sections": [
    {
      "sectionId": "section-0",
      "heading": "Section Title",
      "paragraphs": ["Paragraph 1...", "Paragraph 2..."],
      "codeExample": null
    }
  ],
  "takeaways": ["Key Takeaway 1..."],
  "questions": [
    {
      "prompt": "Specific question prompt naming a concrete concept...",
      "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
      "correctIndex": 0,
      "explanations": ["Why A is right...", "Why B is wrong...", "Why C is wrong...", "Why D is wrong..."],
      "sourceSection": 0,
      "questionType": "concept",
      "difficulty": 1
    }
  ],
  "challenges": []
}`;

    if (!groqKey || groqKey.trim() === "") {
      console.error("[GROQ ERROR] GROQ_API_KEY missing in environment.");
      return NextResponse.json(
        { error: "AI Service Configuration Error: GROQ_API_KEY is missing." },
        { status: 500 }
      );
    }

    console.log(`[GENERATING MODULE & 12 QUESTIONS VIA GROQ] Model: openai/gpt-oss-120b | Skill: "${skillName}" | Goal: "${goal}" | Level: ${level}`);

    // Call Groq API with robust model fallback sequence
    const modelsToTry = [
      "llama3-70b-8192",
      "mixtral-8x7b-32768",
      "llama-3.1-8b-instant",
      "openai/gpt-oss-120b",
      "openai/gpt-oss-20b",
      "groq/compound-mini"
    ];
    let contentStr: string | null = null;
    let usedModel = "";

    for (const model of modelsToTry) {
      try {
        console.log(`[CALLING GROQ API] Model: ${model}...`);
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: systemPrompt }],
            temperature: 0.7,
            max_tokens: 3500,
            response_format: { type: "json_object" },
          }),
        });

        console.log(`[GROQ RESPONSE STATUS] Model: ${model} -> Status: ${groqRes.status}`);

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          const rawContent = groqData.choices?.[0]?.message?.content;
          if (rawContent) {
            contentStr = rawContent;
            usedModel = model;
            break;
          }
        } else {
          const errText = await groqRes.text();
          console.warn(`[GROQ API CALL FAILED] Model: ${model} | Status: ${groqRes.status} | Output: ${errText.slice(0, 300)}`);
        }
      } catch (callErr) {
        console.warn(`[GROQ FETCH EXCEPTION] Model: ${model}:`, callErr);
      }
    }

    if (!contentStr) {
      console.error("[AI GENERATION FAILED] All Groq model endpoints failed or returned empty content.");
      return NextResponse.json(
        { error: "AI Generation Failed", details: "Unable to reach Groq AI model. Please check network connection or retry." },
        { status: 500 }
      );
    }

    let parsed = cleanAndParseJSON(contentStr);

    // If initial parse fails, retry once with a strict formatting prompt
    if (!parsed) {
      console.warn("[AI JSON PARSE FAILED] Retrying once with strict formatting directive...");
      try {
        const retryRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: "openai/gpt-oss-120b",
            messages: [
              { role: "user", content: systemPrompt },
              { role: "assistant", content: contentStr },
              { role: "user", content: "Return ONLY valid JSON matching the exact schema above. No markdown fences or commentary." }
            ],
            temperature: 0.3,
            response_format: { type: "json_object" },
          }),
        });
        if (retryRes.ok) {
          const retryData = await retryRes.json();
          const retryStr = retryData.choices?.[0]?.message?.content;
          if (retryStr) {
            parsed = cleanAndParseJSON(retryStr);
          }
        }
      } catch (retryErr) {
        console.warn("[RETRY PARSE FAILED]:", retryErr);
      }
    }

    if (!parsed || !Array.isArray(parsed.questions)) {
      console.error("[AI GENERATION INVALID JSON] Response could not be parsed into module JSON schema.");
      return NextResponse.json(
        { error: "AI Generation Error", details: "AI returned an invalid JSON response structure. Please retry." },
        { status: 500 }
      );
    }

    // Validate generated questions
    const rawQuestions: any[] = parsed.questions || [];
    const validQuestions: any[] = [];

    for (const q of rawQuestions) {
      const vResult = validateQuestion(q, skillName, goal);
      if (vResult.isValid) {
        validQuestions.push(q);
      } else {
        console.warn(`[REJECTED INVALID QUESTION] Reason: ${vResult.reason} | Prompt: "${q.prompt}"`);
      }
    }

    if (validQuestions.length < 6) {
      console.error(`[AI GENERATION VALIDATION FAILURE] Only ${validQuestions.length} of 12 questions passed subject validation.`);
      return NextResponse.json(
        { error: "AI Question Validation Failed", details: `Only ${validQuestions.length} valid questions generated for ${skillName}. Please retry generation.` },
        { status: 500 }
      );
    }

    console.log(`[MODULE GENERATED SUCCESSFULLY] Model: ${usedModel} | Sections: ${parsed.sections?.length || 0} | Valid Questions: ${validQuestions.length}`);

    // Cache in Supabase
    try {
      const { supabase, isSupabaseConfigured } = await import("@/lib/supabase");
      if (isSupabaseConfigured()) {
        await supabase.from("modules").upsert({
          skill_id: skillId,
          level,
          learning_style: learningStyle,
          title: parsed.title || `Level ${level}: ${skillName}`,
          content: parsed.sections || [],
          takeaways: parsed.takeaways || [],
          sources: extractedSources,
          questions: validQuestions,
        });
      }
    } catch (dbErr) {
      console.warn("Notice saving module to cache:", dbErr);
    }

    return NextResponse.json({
      title: parsed.title || `Level ${level}: ${skillName}`,
      sections: parsed.sections || [],
      takeaways: parsed.takeaways || [],
      sources: extractedSources,
      questions: validQuestions,
      isCached: false,
    });
  } catch (error: any) {
    console.error("Generate Module API error:", error);
    return NextResponse.json(
      { error: "Failed to generate learning module.", details: error?.message || "Internal Error" },
      { status: 500 }
    );
  }
}
