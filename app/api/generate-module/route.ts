import { NextRequest, NextResponse } from "next/server";

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

        if (cachedModule && cachedModule.content) {
          console.log(`[MODULE CACHE HIT] Skill: ${skillName} | Level: ${level} | Style: ${learningStyle}`);
          return NextResponse.json({
            title: cachedModule.title,
            sections: cachedModule.content,
            takeaways: cachedModule.takeaways,
            sources: cachedModule.sources,
            isCached: true,
          });
        }
      }
    } catch (e) {
      console.warn("Notice checking module cache:", e);
    }

    // 2. Fetch grounded Web Search results via Tavily
    let searchContent = "";
    let extractedSources: SourceCitation[] = [];

    if (tavilyKey && tavilyKey.trim() !== "") {
      try {
        const queryStr = `learn ${skillName} ${levelDesc} tutorial guide code examples`;
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

        if (tavilyRes.ok) {
          const tavilyData = await tavilyRes.json();
          if (tavilyData.results && Array.isArray(tavilyData.results)) {
            extractedSources = tavilyData.results.slice(0, 4).map((r: any) => ({
              title: r.title || skillName,
              url: r.url || "https://docs.python.org",
            }));

            searchContent = tavilyData.results
              .map((r: any) => `Source: ${r.title}\nContent: ${r.content || ""}`)
              .join("\n\n");
          }
        }
      } catch (err) {
        console.warn("Tavily search notice during module generation:", err);
      }
    }

    if (extractedSources.length === 0) {
      extractedSources = [
        { title: `${skillName} Official Documentation`, url: "https://developer.mozilla.org" },
        { title: `${skillName} ${levelDesc} Guide`, url: "https://docs.python.org" },
      ];
    }

    // 3. Prompt Groq LLM to generate 600-900 word teaching module
    const stylePromptDirectives: Record<string, string> = {
      story: "Explain concepts through vivid real-world analogies, metaphors, and story narratives.",
      theory: "Focus on formal definitions, underlying theoretical mechanics, and fundamental principles.",
      code: "Lead with clear code blocks, inline comments, syntax breakdowns, and line-by-line explanations.",
      stepwise: "Structure section explanations into clear numbered 1-2-3 step-by-step breakdowns.",
    };

    const styleDirective = stylePromptDirectives[learningStyle] || stylePromptDirectives.story;

    const systemPrompt = `You are XPedition's Master Educator & Curriculum Designer.
Generate a comprehensive, high-quality, 600-900 WORD TEACHING MODULE for:
- Overall Goal: "${goal}"
- Skill Topic: "${skillName}"
- Level: Level ${level} (${levelDesc})
- Learning Style: "${learningStyle}" (${styleDirective})

GROUNDED WEB CONTEXT:
${searchContent || "Use authoritative standard domain knowledge for this topic."}

CRITICAL FORMAT REQUIREMENTS:
1. Provide 4 to 6 short sections. Each section must have:
   - "sectionId": string (e.g., "section-1", "section-2")
   - "heading": Descriptive title (e.g., "Section 1: Understanding Syntax & Structure")
   - "paragraphs": Array of 2-4 thorough, educational paragraph strings (600-900 words total across all sections).
   - "codeExample": (Include at least ONE worked example across the module). Object with { "code": string, "explanation": string } or null.
2. Provide a "takeaways" array with 3 to 5 key bullet strings summarizing core learnings.

Return STRICT JSON ONLY matching this format:
{
  "title": "Comprehensive Level ${level} Module: ${skillName}",
  "sections": [
    {
      "sectionId": "section-1",
      "heading": "Section 1: ...",
      "paragraphs": ["Paragraph 1...", "Paragraph 2..."],
      "codeExample": null
    },
    {
      "sectionId": "section-2",
      "heading": "Section 2: Worked Example & Application",
      "paragraphs": ["Paragraph 1..."],
      "codeExample": {
        "code": "SELECT name, email FROM users WHERE active = 1;",
        "explanation": "Line-by-line explanation of the query..."
      }
    }
  ],
  "takeaways": [
    "Key Takeaway 1...",
    "Key Takeaway 2...",
    "Key Takeaway 3..."
  ]
}`;

    if (!groqKey || groqKey.trim() === "") {
      console.warn("GROQ_API_KEY missing, using fallback module generator.");
      return NextResponse.json(generateFallbackModule(skillName, level, learningStyle, extractedSources));
    }

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: systemPrompt }],
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
    });

    if (groqRes.ok) {
      const groqData = await groqRes.json();
      const contentStr = groqData.choices?.[0]?.message?.content;
      if (contentStr) {
        const parsed = JSON.parse(contentStr);

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
          isCached: false,
        });
      }
    }

    return NextResponse.json(generateFallbackModule(skillName, level, learningStyle, extractedSources));
  } catch (error) {
    console.error("Generate Module API error:", error);
    return NextResponse.json(
      { error: "Failed to generate learning module." },
      { status: 500 }
    );
  }
}

function generateFallbackModule(
  skillName: string,
  level: number,
  learningStyle: string,
  sources: SourceCitation[]
) {
  const isCoding =
    skillName.toLowerCase().includes("python") ||
    skillName.toLowerCase().includes("sql") ||
    skillName.toLowerCase().includes("web") ||
    skillName.toLowerCase().includes("code");

  return {
    title: `Level ${level} Masterclass: ${skillName}`,
    sections: [
      {
        sectionId: "section-1",
        heading: `Section 1: Foundations & Fundamentals of ${skillName}`,
        paragraphs: [
          `Welcome to Level ${level} of ${skillName}. In this module, we explore the core building blocks and principles that govern effective problem solving in this domain. Understanding foundational mechanics is essential before attempting higher-level architectural decisions.`,
          `When working with ${skillName}, every component plays a specific role. By mastering how data flows and how syntax behaves under varying conditions, you ensure clean execution, high reliability, and optimal performance across projects.`
        ],
        codeExample: null
      },
      {
        sectionId: "section-2",
        heading: `Section 2: Worked Example & Practical Execution`,
        paragraphs: [
          `Let us examine a concrete, practical example demonstrating ${skillName} in action. Analyzing practical implementations helps connect theoretical concepts with real-world output.`
        ],
        codeExample: {
          code: isCoding
            ? `# Worked Example for ${skillName}\ndef process_data(inputs):\n    result = [item.strip() for item in inputs if item]\n    return sorted(result)\n\nprint(process_data(['sql ', ' python', '']))`
            : `Problem: Evaluate system throughput for ${skillName}\nSolution: Calculate Total Requests / Response Latency\nResult: 99.9% Uptime SLA guaranteed.`,
          explanation: `This worked example illustrates input sanitization, filtering out empty entries, and returning a predictable, ordered result set.`
        }
      },
      {
        sectionId: "section-3",
        heading: `Section 3: Optimization & Key Trade-offs`,
        paragraphs: [
          `As complexity grows, efficiency becomes critical. In ${skillName}, optimization requires balancing execution speed, memory footprint, and maintainability. Avoid premature optimization, but adhere strictly to best practices.`
        ],
        codeExample: null
      },
      {
        sectionId: "section-4",
        heading: `Section 4: Summary & Practical Checklist`,
        paragraphs: [
          `To summarize Level ${level}: always verify syntax correctness, test edge cases, and ensure your solution scales predictably. You are now prepared to test your knowledge in the Level Test!`
        ],
        codeExample: null
      }
    ],
    takeaways: [
      `Understand core mechanics and syntax rules for ${skillName}`,
      `Verify input data and handle edge cases gracefully`,
      `Apply worked pattern templates to maximize execution accuracy`,
      `Maintain clean code structure for long-term scalability`
    ],
    sources,
    isCached: false,
  };
}
