import { NextRequest, NextResponse } from "next/server";
import { Question, QuestionType } from "@/lib/types";
import crypto from "crypto";

const ALL_TYPES: QuestionType[] = ["concept", "code_output", "debug", "scenario", "compare"];

// Local in-memory set fallback if Supabase table is loading
const localServedHashes = new Set<string>();

function hashPrompt(prompt: string): string {
  const normalized = prompt.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
  const words1 = new Set(normalize(str1).split(/\s+/).filter(Boolean));
  const words2 = new Set(normalize(str2).split(/\s+/).filter(Boolean));
  if (words1.size === 0 || words2.size === 0) return 0;
  let intersection = 0;
  words1.forEach((w) => {
    if (words2.has(w)) intersection++;
  });
  const union = new Set([...words1, ...words2]).size;
  return intersection / union;
}

function isDuplicatePrompt(
  prompt: string,
  userServedHashes: Set<string>,
  recentPrompts: string[] = []
): boolean {
  if (!prompt) return true;
  const qHash = hashPrompt(prompt);
  if (userServedHashes.has(qHash)) return true;
  if (recentPrompts.some((prev) => calculateSimilarity(prompt, prev) > 0.50)) return true;
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId = "anonymous-learner",
      skillId = "s1",
      skillName = "General Skill",
      difficulty = 2,
      wasCorrect,
      goal = "Programming",
      learningStyle = "story",
      recentTypes = [],
      recentPrompts = [],
    } = body;

    const groqKey = process.env.GROQ_API_KEY;
    const last3Types: QuestionType[] = Array.isArray(recentTypes) ? recentTypes.slice(-3) : [];
    const promptHistory: string[] = Array.isArray(recentPrompts) ? recentPrompts.slice(-20) : [];

    // 1. Fetch user's last 50 served question hashes from Supabase or local set
    const userServedHashes = new Set<string>();
    let dbPrompts: string[] = [];

    try {
      const { supabase, isSupabaseConfigured } = await import("@/lib/supabase");
      if (isSupabaseConfigured()) {
        const { data: servedRows } = await supabase
          .from("served_questions")
          .select("question_hash, prompt")
          .eq("user_id", userId)
          .order("served_at", { ascending: false })
          .limit(50);

        if (servedRows && servedRows.length > 0) {
          servedRows.forEach((r) => {
            if (r.question_hash) userServedHashes.add(r.question_hash);
            if (r.prompt) dbPrompts.push(r.prompt);
          });
        }
      }
    } catch (e) {
      console.warn("Notice reading served_questions table:", e);
    }

    // Merge in-memory local hashes
    localServedHashes.forEach((h) => {
      if (h.startsWith(`${userId}:`)) {
        userServedHashes.add(h.split(":")[1]);
      }
    });

    const combinedHistory = Array.from(new Set([...promptHistory, ...dbPrompts])).slice(-25);

    // 2. Select target question type (rotate away from last 3 served)
    let candidateTypes = ALL_TYPES.filter((t) => !last3Types.includes(t));
    if (candidateTypes.length === 0) candidateTypes = ALL_TYPES;
    let targetType = candidateTypes[Math.floor(Math.random() * candidateTypes.length)];

    // Helper to persist served question hash to DB and local memory
    const recordServedQuestion = async (qPrompt: string) => {
      const qHash = hashPrompt(qPrompt);
      localServedHashes.add(`${userId}:${qHash}`);
      try {
        const { supabase, isSupabaseConfigured } = await import("@/lib/supabase");
        if (isSupabaseConfigured()) {
          await supabase.from("served_questions").insert({
            user_id: userId,
            question_hash: qHash,
            prompt: qPrompt,
            skill_id: skillId,
            skill_name: skillName,
            served_at: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn("Notice inserting served_questions:", err);
      }
    };

    // 3. Optional Peer Quest lookup with anti-repetition check for this specific user
    if (Math.random() < 0.25) {
      try {
        const { supabase, isSupabaseConfigured } = await import("@/lib/supabase");
        if (isSupabaseConfigured()) {
          const { data: peerData } = await supabase
            .from("peer_quests")
            .select("*")
            .eq("approved", true)
            .ilike("skill_name", `%${skillName.split(" ")[0]}%`)
            .limit(10);

          if (peerData && peerData.length > 0) {
            const freshPeer = peerData.find((p) => !isDuplicatePrompt(p.prompt, userServedHashes, combinedHistory));
            if (freshPeer) {
              await supabase
                .from("peer_quests")
                .update({ plays: (freshPeer.plays || 0) + 1 })
                .eq("id", freshPeer.id);

              await recordServedQuestion(freshPeer.prompt);

              console.log(`[PEER QUEST SERVED] User: ${userId} | Prompt: ${freshPeer.prompt}`);

              return NextResponse.json({
                questionType: "scenario" as QuestionType,
                prompt: freshPeer.prompt,
                options: Array.isArray(freshPeer.options) ? freshPeer.options : [],
                correctIndex: freshPeer.correct_index,
                explanations: [
                  "Option A evaluation from peer quest author.",
                  "Option B evaluation from peer quest author.",
                  "Option C evaluation from peer quest author.",
                  "Option D evaluation from peer quest author."
                ],
                explanation: "Peer quest created by an XPedition learner & verified by Groq AI!",
                conceptSummary: "This question was authored by a fellow learner who has already mastered this concept.",
                isPeerQuest: true,
                authorName: "Learner Contributor",
              });
            }
          }
        }
      } catch (err) {
        console.warn("Peer quest lookup notice:", err);
      }
    }

    // 4. Groq AI Question Generation with High Temperature (0.85) & Anti-Repetition Prompting
    if (groqKey && groqKey.trim() !== "") {
      try {
        const difficultyDesc = [
          "very basic introductory concepts",
          "foundational principles & standard syntax",
          "intermediate problem solving & logic",
          "advanced optimization & edge cases",
          "mastery-level system design & expert scenario"
        ][Math.min(4, Math.max(0, difficulty - 1))];

        const stylePromptDirectives: Record<string, string> = {
          story: "Use vivid real-world analogies, metaphors, and story-driven narratives in explanations and conceptSummary.",
          theory: "Provide precise formal definitions, underlying theoretical principles, and mathematical mechanics.",
          code: "Lead with code examples and explain concepts directly through code comments, syntax semantics, and output behavior.",
          stepwise: "Format explanations and conceptSummary into clear numbered steps (e.g., 1. Step one..., 2. Step two...).",
        };

        const styleDirective = stylePromptDirectives[learningStyle] || stylePromptDirectives.story;
        const historyText = combinedHistory.slice(-5).map((p, i) => `${i + 1}. "${p}"`).join("\n");

        const generateQuestionWithGroq = async (typeToUse: QuestionType, extraDirective?: string) => {
          const promptText = `You are XPedition's Adaptive Quest Generator.
CRITICAL OVERALL GOAL CONTEXT: "${goal}"
SPECIFIC SKILL MODULE TO TEST: "${skillName}"
Target difficulty level: Level ${difficulty} out of 5 (${difficultyDesc}).
Previous learner answer was: ${wasCorrect !== undefined ? (wasCorrect ? "CORRECT" : "INCORRECT") : "N/A"}.

CRITICAL DOMAIN RULES:
- All syntax, terminology, questions, and code snippets MUST strictly belong to the goal "${goal}" and skill "${skillName}".
- If the Goal is "SQL Basics", all code snippets MUST be valid SQL queries (e.g. SELECT, JOIN, GROUP BY, WHERE).
- If the Goal is "Python Basics", all code snippets MUST be valid Python code.
- If the Goal is "System Design", questions MUST cover caching, load balancing, sharding, or CAP theorem.

CRITICAL ANTI-REPETITION REQUIREMENT:
The learner "${userId}" has ALREADY answered the following questions:
${historyText || "None so far"}

You MUST generate a COMPLETELY NEW, UNIQUE question testing a DIFFERENT subtopic, function, or scenario than the questions above.
${extraDirective || ""}

LEARNING STYLE REQUIREMENT: "${learningStyle}"
${styleDirective}

QUESTION TYPE REQUIREMENT:
Set "questionType" to "${typeToUse}".
Do NOT use any of these recently served questionTypes: ${last3Types.join(", ") || "none"}.

Framing instructions for questionType "${typeToUse}":
- "concept": Direct definition or conceptual understanding for "${skillName}". Set scenarioSetup=null, codeSnippet=null.
- "code_output": "What does this code snippet output or evaluate to?". Provide a clean 3-6 line code block in "codeSnippet". Set scenarioSetup=null.
- "debug": "Find the error or bug in this snippet". Provide a code block containing a subtle error in "codeSnippet". Set scenarioSetup=null.
- "scenario": Realistic practical problem setup for "${skillName}". Provide a 2-3 sentence context scenario in "scenarioSetup". Set codeSnippet=null.
- "compare": Tradeoff or distinction between two related concepts in "${skillName}". Set scenarioSetup=null, codeSnippet=null.

Return STRICT JSON ONLY matching this format:
{
  "questionType": "${typeToUse}",
  "prompt": "Clear, engaging multiple-choice question prompt",
  "scenarioSetup": "Optional string if type is 'scenario', else null",
  "codeSnippet": "Optional formatted code snippet if type is 'code_output' or 'debug', else null",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctIndex": number (0 to 3),
  "explanations": [
    "Why Option A is correct or wrong — written in '${learningStyle}' style, specific to concept",
    "Why Option B is correct or wrong — written in '${learningStyle}' style, specific to concept",
    "Why Option C is correct or wrong — written in '${learningStyle}' style, specific to concept",
    "Why Option D is correct or wrong — written in '${learningStyle}' style, specific to concept"
  ],
  "conceptSummary": "A 1-2 sentence explanation of the core concept written in '${learningStyle}' style.",
  "reinforcement": {
    "whyItMatters": "A 1-sentence 'Why this matters' insight or common gotcha about this specific concept",
    "format": "true_false",
    "prompt": "A quick-check True/False or Fill-in-the-blank question testing a nuance of the same concept",
    "options": ["True", "False"],
    "correctIndex": 0,
    "explanation": "1-sentence explanation of why the answer is correct"
  }
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
              temperature: 0.85,
              response_format: { type: "json_object" },
            }),
          });

          if (groqRes.ok) {
            const groqData = await groqRes.json();
            const contentStr = groqData.choices?.[0]?.message?.content;
            if (contentStr) {
              return JSON.parse(contentStr) as Question;
            }
          }
          return null;
        };

        // Retry Loop (max 2 retries on collision)
        let parsed = await generateQuestionWithGroq(targetType);
        let retries = 0;

        while (parsed && parsed.prompt && isDuplicatePrompt(parsed.prompt, userServedHashes, combinedHistory) && retries < 2) {
          retries++;
          const alternateType = candidateTypes[(candidateTypes.indexOf(targetType) + retries) % candidateTypes.length] || targetType;
          console.log(`[GROQ COLLISION RETRY ${retries}] User: ${userId} | Previous: "${parsed.prompt}". Retrying with type: ${alternateType}`);
          parsed = await generateQuestionWithGroq(
            alternateType,
            `DO NOT generate a question about "${parsed.prompt}". Focus on a completely different sub-concept or function.`
          );
        }

        if (parsed && parsed.prompt && Array.isArray(parsed.options) && typeof parsed.correctIndex === "number") {
          if (!parsed.questionType) parsed.questionType = targetType;
          await recordServedQuestion(parsed.prompt);

          // RAW LOGGING for verification
          console.log(`[GROQ RAW RESPONSE SUCCESS] User: ${userId} | Goal: "${goal}" | Skill: "${skillName}" | Type: ${parsed.questionType} | Prompt: "${parsed.prompt}"`);

          return NextResponse.json(parsed);
        }
      } catch (err) {
        console.warn("Groq next-question API warning:", err);
      }
    }

    // 5. Dynamic Topic-Aware Fallback Question Generator
    const fallbackQuestion = generateAdaptiveFallbackQuestion(
      userId,
      goal,
      skillName,
      difficulty,
      userServedHashes,
      combinedHistory
    );

    await recordServedQuestion(fallbackQuestion.prompt);

    console.log(`[FALLBACK QUESTION SERVED] User: ${userId} | Goal: "${goal}" | Skill: "${skillName}" | Prompt: "${fallbackQuestion.prompt}"`);

    return NextResponse.json(fallbackQuestion);
  } catch (error) {
    console.error("Next Question API error:", error);
    return NextResponse.json(
      { error: "Failed to generate next question." },
      { status: 500 }
    );
  }
}

interface FallbackQ {
  questionType: QuestionType;
  prompt: string;
  scenarioSetup?: string;
  codeSnippet?: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanations: [string, string, string, string];
  conceptSummary: string;
}

function generateAdaptiveFallbackQuestion(
  userId: string,
  goal: string,
  skillName: string,
  difficulty: number,
  userServedHashes: Set<string>,
  promptHistory: string[] = []
): Question {
  const isSql = goal.toLowerCase().includes("sql") || skillName.toLowerCase().includes("sql") || skillName.toLowerCase().includes("database");
  const isPython = goal.toLowerCase().includes("python") || skillName.toLowerCase().includes("python") || skillName.toLowerCase().includes("data structures");
  const isSystemDesign = goal.toLowerCase().includes("system") || skillName.toLowerCase().includes("system") || skillName.toLowerCase().includes("architecture");

  let pool: FallbackQ[] = [];

  if (isSql) {
    pool = [
      {
        questionType: "concept",
        prompt: `Which SQL clause is used to filter records after aggregation in ${skillName}?`,
        options: ["WHERE", "HAVING", "GROUP BY", "FILTER"],
        correctIndex: 1,
        explanations: [
          "WHERE filters rows BEFORE aggregation occurs.",
          "✓ HAVING filters aggregated group results after GROUP BY.",
          "GROUP BY groups rows, but doesn't filter aggregate conditions.",
          "FILTER is not a standard SQL filtering clause."
        ],
        conceptSummary: "Use WHERE for filtering rows prior to grouping, and HAVING for filtering grouped aggregates."
      },
      {
        questionType: "code_output",
        prompt: `What is the result of the following SQL query for ${skillName}?`,
        codeSnippet: `SELECT COUNT(*)\nFROM users\nWHERE status = 'active';`,
        options: [
          "Returns all columns for active users",
          "Returns the total count of active user records",
          "Deletes all inactive users",
          "Syntax Error"
        ],
        correctIndex: 1,
        explanations: [
          "COUNT(*) returns a numeric scalar count, not individual row columns.",
          "✓ COUNT(*) with WHERE returns the integer count of rows matching status='active'.",
          "This is a SELECT query, not a DELETE query.",
          "This is completely valid standard SQL."
        ],
        conceptSummary: "COUNT(*) aggregates the total row count matching specified WHERE conditions."
      },
      {
        questionType: "compare",
        prompt: `What is the primary difference between INNER JOIN and LEFT JOIN in SQL for ${skillName}?`,
        options: [
          "INNER JOIN returns matching rows; LEFT JOIN returns all left table rows plus matches",
          "LEFT JOIN is faster than INNER JOIN in all databases",
          "INNER JOIN supports string comparison; LEFT JOIN only supports integer keys",
          "There is no functional difference"
        ],
        correctIndex: 0,
        explanations: [
          "✓ INNER JOIN requires matches in both tables; LEFT JOIN preserves all left table records even without right matches.",
          "Join speed depends on index availability, not join type name.",
          "Both joins support any comparable data types.",
          "They return fundamentally different result sets when unmatched rows exist."
        ],
        conceptSummary: "LEFT JOIN preserves all rows from the left table, filling unmatched right table columns with NULL."
      },
      {
        questionType: "debug",
        prompt: `Identify the SQL syntax error in this query for ${skillName}:`,
        codeSnippet: `SELECT department, AVG(salary)\nFROM employees\nWHERE AVG(salary) > 50000\nGROUP BY department;`,
        options: [
          "Aggregate functions like AVG() cannot be used in a WHERE clause",
          "GROUP BY must appear before FROM",
          "AVG(salary) requires an alias",
          "SELECT cannot contain multiple expressions"
        ],
        correctIndex: 0,
        explanations: [
          "✓ Aggregate functions cannot be evaluated in WHERE; use HAVING AVG(salary) > 50000 instead.",
          "FROM always precedes GROUP BY in standard SQL execution order.",
          "Aliases are optional for aggregate expressions.",
          "SELECT commonly includes multiple comma-separated expressions."
        ],
        conceptSummary: "Aggregates belong in the HAVING clause because WHERE executes before row groups are computed."
      }
    ];
  } else if (isSystemDesign) {
    pool = [
      {
        questionType: "scenario",
        prompt: `Which strategy should you deploy to handle high read traffic in ${skillName}?`,
        scenarioSetup: `Your web service is experiencing 100,000 read requests per second on user profiles while writes are under 100 per second. Database CPU utilization has hit 98%.`,
        options: [
          "Implement an in-memory caching layer (e.g., Redis / Memcached)",
          "Increase database connection timeout limits",
          "Replace all indexes with full table scans",
          "Convert all HTTP GET endpoints to POST endpoints"
        ],
        correctIndex: 0,
        explanations: [
          "✓ In-memory caches offload frequent read requests from the primary database.",
          "Increasing timeout limits will cause request queuing and worse latency.",
          "Full table scans destroy database performance.",
          "Changing HTTP verbs does not reduce database workload."
        ],
        conceptSummary: "In-memory caching is the primary pattern for offloading heavy read traffic from persistent databases."
      },
      {
        questionType: "compare",
        prompt: `According to the CAP Theorem in ${skillName}, what trade-off occurs during a network partition?`,
        options: [
          "You must choose between Consistency or Availability",
          "You must choose between Speed or Security",
          "You lose both Consistency and Partition Tolerance",
          "No trade-off is required if using SSD storage"
        ],
        correctIndex: 0,
        explanations: [
          "✓ In a distributed system network partition (P), you can guarantee Consistency (CP) or Availability (AP), but not both.",
          "Speed and Security are not the core parameters of CAP theorem.",
          "Partition tolerance (P) is mandatory in distributed networks.",
          "Storage hardware does not prevent network partitioning."
        ],
        conceptSummary: "CAP Theorem states a distributed system cannot simultaneously guarantee Consistency, Availability, and Partition Tolerance."
      }
    ];
  } else {
    // Default Python & General Programming Pool
    pool = [
      {
        questionType: "concept",
        prompt: `Which built-in Python function returns the number of items in a list or container for ${skillName}?`,
        options: ["size()", "len()", "count()", "length()"],
        correctIndex: 1,
        explanations: [
          "size() is used in C++ or NumPy, not standard Python built-ins.",
          "✓ len() returns the total item count of any Python sequence or collection.",
          "count() counts occurrences of a specific value, not total length.",
          "length() is used in JavaScript, not Python."
        ],
        conceptSummary: "The built-in function len(sequence) returns the number of elements in dynamic containers."
      },
      {
        questionType: "code_output",
        prompt: `What is the output of the following code snippet for ${skillName}?`,
        codeSnippet: `items = [10, 20, 30]\nitems.append(40)\nprint(items[-1])`,
        options: ["10", "30", "40", "IndexError"],
        correctIndex: 2,
        explanations: [
          "10 is items[0] (first element).",
          "30 was the last element before appending 40.",
          "✓ append(40) adds 40 to the end, and items[-1] accesses the last element.",
          "IndexError does not occur because items[-1] is valid in Python."
        ],
        conceptSummary: "In Python, negative indexing [-1] retrieves the last item in a sequence."
      },
      {
        questionType: "debug",
        prompt: `Find the bug in this function definition for ${skillName}:`,
        codeSnippet: `def calculate_total(prices):\n    total = 0\n    for p in prices\n        total += p\n    return total`,
        options: [
          "Missing colon (:) at the end of the for loop statement",
          "total += p is invalid syntax",
          "Function must return total as a string",
          "for loop variable p is undefined"
        ],
        correctIndex: 0,
        explanations: [
          "✓ In Python, compound headers like 'for p in prices:' require a trailing colon.",
          "total += p is valid in-place addition.",
          "Functions can return integers or floats directly.",
          "p is implicitly defined by the for loop iteration."
        ],
        conceptSummary: "Every header line in Python (def, for, while, if, try) requires a trailing colon (:)."
      },
      {
        questionType: "scenario",
        prompt: `Which data structure should you choose to maintain key-value lookups for ${skillName}?`,
        scenarioSetup: `You are designing a high-speed user session store for ${skillName}. You need to retrieve user profiles by their unique string User ID in O(1) average time.`,
        options: ["Dictionary (Dict / Hash Map)", "List", "Tuple", "Linked List"],
        correctIndex: 0,
        explanations: [
          "✓ Dictionaries store key-value pairs and offer O(1) average lookup by key.",
          "Lists require O(n) search time to find matching elements.",
          "Tuples are immutable sequences, not key-value stores.",
          "Linked Lists require O(n) traversal time."
        ],
        conceptSummary: "Python Dictionaries use hash tables to provide O(1) key-value retrieval."
      }
    ];
  }

  // Filter pool entries that haven't been served to this user
  const freshItems = pool.filter((q) => !isDuplicatePrompt(q.prompt, userServedHashes, promptHistory));
  const picked = freshItems.length > 0 ? freshItems[Math.floor(Math.random() * freshItems.length)] : pool[Math.floor(Math.random() * pool.length)];

  return {
    questionType: picked.questionType,
    prompt: picked.prompt,
    scenarioSetup: picked.scenarioSetup,
    codeSnippet: picked.codeSnippet,
    options: picked.options,
    correctIndex: picked.correctIndex,
    explanations: picked.explanations,
    conceptSummary: picked.conceptSummary,
    reinforcement: {
      whyItMatters: `Gotcha for ${skillName}: Always test edge cases and verify performance under high volume.`,
      format: "true_false",
      prompt: `True or False: Core concepts in ${skillName} operate deterministically across all environments.`,
      options: ["True", "False"],
      correctIndex: 0,
      explanation: "True! Understanding core principles guarantees predictable behavior."
    }
  };
}
