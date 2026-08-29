import { NextRequest, NextResponse } from "next/server";
import { Question } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { goal = "Programming & Technology", learningStyle = "story" } = body;

    const groqKey = process.env.GROQ_API_KEY;

    if (!groqKey || groqKey.trim() === "") {
      return NextResponse.json({ questions: generateFallbackPlacementQuestions(goal) });
    }

    const systemPrompt = `You are XPedition's Diagnostic Placement Engine.
Generate a 10-QUESTION PLACEMENT TEST for the goal: "${goal}".

DISTRIBUTION REQUIREMENTS:
- Questions 1 to 3: Level 1 (Basic foundational concepts & syntax)
- Questions 4 to 7: Level 2 (Intermediate problem solving & logic)
- Questions 8 to 10: Level 3 (Advanced edge cases, optimization & architecture)

Return STRICT JSON ONLY matching this format:
{
  "questions": [
    {
      "questionType": "concept",
      "prompt": "Question prompt text...",
      "codeSnippet": "Optional code snippet or null",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": number (0 to 3),
      "explanations": [
        "Why A is correct or wrong...",
        "Why B is correct or wrong...",
        "Why C is correct or wrong...",
        "Why D is correct or wrong..."
      ],
      "conceptSummary": "1-sentence concept summary",
      "difficulty": 1
    }
  ]
}`;

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [{ role: "user", content: systemPrompt }],
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
    });

    if (groqRes.ok) {
      const groqData = await groqRes.json();
      const contentStr = groqData.choices?.[0]?.message?.content;
      if (contentStr) {
        const { cleanAndParseJSON } = await import("@/lib/aiParser");
        const parsed = cleanAndParseJSON(contentStr);
        if (parsed && parsed.questions && Array.isArray(parsed.questions) && parsed.questions.length >= 8) {
          return NextResponse.json({ questions: parsed.questions });
        }
      }
    }

    return NextResponse.json({ questions: generateFallbackPlacementQuestions(goal) });
  } catch (error) {
    console.error("Placement Test API error:", error);
    return NextResponse.json(
      { error: "Failed to generate placement test." },
      { status: 500 }
    );
  }
}

function generateFallbackPlacementQuestions(goal: string): Question[] {
  const isSql = goal.toLowerCase().includes("sql") || goal.toLowerCase().includes("database");
  const topic = isSql ? "SQL" : "Python";

  return [
    {
      questionType: "concept",
      prompt: `(Level 1 - Basic) What is the primary keyword used to retrieve data in ${topic}?`,
      options: isSql ? ["SELECT", "GET", "EXTRACT", "FETCH"] : ["print", "input", "def", "import"],
      correctIndex: 0,
      explanations: ["✓ Primary retrieval keyword.", "Incorrect syntax.", "Incorrect syntax.", "Incorrect syntax."],
      conceptSummary: `Basic retrieval syntax in ${topic}.`,
      difficulty: 1,
    },
    {
      questionType: "code_output",
      prompt: `(Level 1 - Basic) What does this statement evaluate to in ${topic}?`,
      codeSnippet: isSql ? `SELECT 5 + 5;` : `print(5 + 5)`,
      options: ["10", "55", "Error", "None"],
      correctIndex: 0,
      explanations: ["✓ Simple arithmetic evaluation.", "Concatenation occurs on strings.", "Syntax is valid.", "Evaluates to 10."],
      conceptSummary: "Basic arithmetic operator behavior.",
      difficulty: 1,
    },
    {
      questionType: "concept",
      prompt: `(Level 1 - Basic) Which data structure stores key-value pairs?`,
      options: ["Dictionary / Hash Map", "List / Array", "Set", "Tuple"],
      correctIndex: 0,
      explanations: ["✓ Key-value store.", "Ordered sequence.", "Unique set.", "Immutable sequence."],
      conceptSummary: "Key-value data mapping.",
      difficulty: 1,
    },
    {
      questionType: "scenario",
      prompt: `(Level 2 - Intermediate) How do you filter records matching a specific condition?`,
      scenarioSetup: `You need to query all items where price exceeds $100.`,
      options: ["WHERE price > 100", "ORDER BY price > 100", "GROUP BY price", "SELECT price"],
      correctIndex: 0,
      explanations: ["✓ Filtering condition.", "Sorting operator.", "Grouping operator.", "Column selection."],
      conceptSummary: "Filtering conditional logic.",
      difficulty: 2,
    },
    {
      questionType: "compare",
      prompt: `(Level 2 - Intermediate) What is the distinction between INNER and LEFT joins/lookups?`,
      options: [
        "INNER requires matches in both sets; LEFT keeps all left records",
        "LEFT is faster than INNER",
        "INNER only works on numbers",
        "There is no difference"
      ],
      correctIndex: 0,
      explanations: ["✓ Record preservation distinction.", "Speed depends on indexing.", "Works on any types.", "Different result sets."],
      conceptSummary: "Set intersection vs outer join preservation.",
      difficulty: 2,
    },
    {
      questionType: "debug",
      prompt: `(Level 2 - Intermediate) Identify the error in this conditional statement:`,
      codeSnippet: isSql ? `SELECT * FROM users WHERE count = NULL;` : `if x = 10:\n    print(x)`,
      options: [
        isSql ? "Must use IS NULL instead of = NULL" : "Should use == for comparison instead of =",
        "Syntax is valid",
        "Missing quote marks",
        "Invalid table name"
      ],
      correctIndex: 0,
      explanations: ["✓ Operator correction.", "Contains syntax error.", "Quotes not required.", "Table name valid."],
      conceptSummary: "Comparison operator rules.",
      difficulty: 2,
    },
    {
      questionType: "scenario",
      prompt: `(Level 2 - Intermediate) Which operation eliminates duplicate rows?`,
      options: ["DISTINCT / Set", "ORDER BY", "COUNT", "MAX"],
      correctIndex: 0,
      explanations: ["✓ Deduplication operator.", "Sorting.", "Counting.", "Maximum value."],
      conceptSummary: "Deduplication mechanics.",
      difficulty: 2,
    },
    {
      questionType: "concept",
      prompt: `(Level 3 - Advanced) How do database indexes improve search performance?`,
      options: [
        "B-Tree structures reduce search complexity from O(n) to O(log n)",
        "Indexes delete slow rows",
        "Indexes compress stored strings",
        "Indexes bypass transaction logs"
      ],
      correctIndex: 0,
      explanations: ["✓ O(log n) tree lookup.", "Indexes do not delete rows.", "Indexing is not compression.", "Transaction logs are separate."],
      conceptSummary: "Indexing data structure complexity.",
      difficulty: 3,
    },
    {
      questionType: "scenario",
      prompt: `(Level 3 - Advanced) Under high read traffic, what architectural pattern prevents database CPU overload?`,
      options: ["In-memory Redis / Memcached caching layer", "Increasing connection timeouts", "Removing indexes", "Changing GET to POST"],
      correctIndex: 0,
      explanations: ["✓ Read caching pattern.", "Timeouts cause queue buildup.", "Removing indexes degrades performance.", "HTTP verbs do not affect DB load."],
      conceptSummary: "Caching architecture.",
      difficulty: 3,
    },
    {
      questionType: "compare",
      prompt: `(Level 3 - Advanced) What trade-off is described by the CAP Theorem during a network partition?`,
      options: ["Choose between Consistency or Availability", "Choose between Speed or Security", "Lose both Consistency & Partitioning", "No trade-off required"],
      correctIndex: 0,
      explanations: ["✓ CP vs AP trade-off.", "Speed and security are unrelated.", "Partitioning is given in distributed networks.", "Trade-off is mandatory."],
      conceptSummary: "CAP theorem distributed systems tradeoff.",
      difficulty: 3,
    },
  ];
}
