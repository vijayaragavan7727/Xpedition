import { NextRequest, NextResponse } from "next/server";
import { Question, QuestionType } from "@/lib/types";

const ALL_TYPES: QuestionType[] = ["concept", "code_output", "debug", "scenario", "compare"];

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

function isDuplicatePrompt(prompt: string, recentPrompts: string[] = []): boolean {
  if (!recentPrompts || recentPrompts.length === 0) return false;
  return recentPrompts.some((prev) => calculateSimilarity(prompt, prev) > 0.60);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
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

    // Filter candidate question types to rotate away from last 3 served
    let candidateTypes = ALL_TYPES.filter((t) => !last3Types.includes(t));
    if (candidateTypes.length === 0) candidateTypes = ALL_TYPES;
    const targetType = candidateTypes[Math.floor(Math.random() * candidateTypes.length)];

    // Check for approved Peer Quests in Supabase with ~35% probability
    if (Math.random() < 0.35) {
      try {
        const { supabase, isSupabaseConfigured } = await import("@/lib/supabase");
        if (isSupabaseConfigured()) {
          const { data: peerData } = await supabase
            .from("peer_quests")
            .select("*")
            .eq("approved", true)
            .ilike("skill_name", `%${skillName.split(" ")[0]}%`)
            .limit(5);

          if (peerData && peerData.length > 0) {
            // Pick one that is not duplicate
            const nonDup = peerData.find((p) => !isDuplicatePrompt(p.prompt, promptHistory));
            const picked = nonDup || peerData[0];

            // Increment plays count
            await supabase
              .from("peer_quests")
              .update({ plays: (picked.plays || 0) + 1 })
              .eq("id", picked.id);

            return NextResponse.json({
              questionType: "scenario" as QuestionType,
              prompt: picked.prompt,
              options: Array.isArray(picked.options) ? picked.options : [],
              correctIndex: picked.correct_index,
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
      } catch (err) {
        console.warn("Peer quest lookup notice:", err);
      }
    }

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

        const generateQuestionWithGroq = async (typeToUse: QuestionType, extraDirective?: string) => {
          const promptText = `You are XPedition's Adaptive Quest Generator.
Generate ONE single multiple-choice question for the skill: "${skillName}" (Goal: "${goal}").
Target difficulty level: Level ${difficulty} out of 5 (${difficultyDesc}).
Previous answer was: ${wasCorrect !== undefined ? (wasCorrect ? "CORRECT" : "INCORRECT") : "N/A"}.

CRITICAL LEARNING STYLE REQUIREMENT: "${learningStyle}"
${styleDirective}

CRITICAL QUESTION TYPE REQUIREMENT:
You MUST set "questionType" to "${typeToUse}".
Do NOT use any of these recently served questionTypes: ${last3Types.join(", ") || "none"}.
${extraDirective || ""}

Framing instructions for questionType "${typeToUse}":
- "concept": Direct definition or conceptual understanding. Keep prompt clear. Set scenarioSetup=null, codeSnippet=null.
- "code_output": "What does this code snippet output or evaluate to?". Provide a clean 3-6 line code block in "codeSnippet". Set scenarioSetup=null.
- "debug": "Find the error or bug in this snippet". Provide a code block containing a subtle error in "codeSnippet". Set scenarioSetup=null.
- "scenario": Realistic practical problem setup. Provide a 2-3 sentence context scenario in "scenarioSetup". Set codeSnippet=null.
- "compare": Tradeoff or distinction between two related concepts (e.g., List vs Tuple, BFS vs DFS). Set scenarioSetup=null, codeSnippet=null.

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
  "conceptSummary": "A 1-2 sentence explanation of the core concept written in '${learningStyle}' style."
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
              temperature: 0.7,
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

        // First attempt with target type
        let parsed = await generateQuestionWithGroq(targetType);

        // Anti-repetition check: if too similar to any of recent 20 prompts, regenerate ONCE
        if (parsed && parsed.prompt && isDuplicatePrompt(parsed.prompt, promptHistory)) {
          const alternateType = candidateTypes.find((t) => t !== targetType) || targetType;
          const regenerated = await generateQuestionWithGroq(
            alternateType,
            `Do NOT use prompt similar to "${parsed.prompt}". Generate a completely new question on a different subtopic.`
          );
          if (regenerated && regenerated.prompt) {
            parsed = regenerated;
          }
        }

        if (parsed && parsed.prompt && Array.isArray(parsed.options) && typeof parsed.correctIndex === "number") {
          if (!parsed.questionType) parsed.questionType = targetType;
          return NextResponse.json(parsed);
        }
      } catch (err) {
        console.warn("Groq next-question API warning:", err);
      }
    }

    // Dynamic fallback question generator if API key is missing or call fails
    const fallbackQuestion = generateAdaptiveFallbackQuestion(
      skillName,
      difficulty,
      last3Types,
      promptHistory
    );
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
  skillName: string,
  difficulty: number,
  avoidTypes: QuestionType[] = [],
  promptHistory: string[] = []
): Question {
  const diffLevel = Math.min(5, Math.max(1, difficulty));

  const fallbackPool: Record<number, FallbackQ[]> = {
    1: [
      {
        questionType: "concept",
        prompt: `Which keyword in Python is used to define a reusable function block for ${skillName}?`,
        options: ["function", "def", "func", "declare"],
        correctIndex: 1,
        explanations: [
          "'function' is JavaScript syntax, not Python.",
          "✓ 'def' is Python's keyword used to define functions.",
          "'func' is used in languages like Go, not Python.",
          "'declare' is used in SQL or procedural languages, not Python."
        ],
        conceptSummary: "In Python, 'def' defines functions followed by parentheses and a colon."
      },
      {
        questionType: "code_output",
        prompt: "What does the following Python code output?",
        codeSnippet: `x = [1, 2, 3]\nx.append(4)\nprint(len(x))`,
        options: ["3", "4", "5", "TypeError"],
        correctIndex: 1,
        explanations: [
          "3 was the initial length before append(4).",
          "✓ append(4) adds one element, increasing the list length from 3 to 4.",
          "5 would require appending two elements.",
          "TypeError is incorrect — append() is a valid method on lists."
        ],
        conceptSummary: "append() adds a single element to the end of a list in-place and increases len(x) by 1."
      },
      {
        questionType: "debug",
        prompt: "Identify the syntax error in this Python function definition:",
        codeSnippet: `def greet(name)\n    print("Hello " + name)`,
        options: [
          "Missing colon (:) after def greet(name)",
          "Incorrect indentation on print",
          "Should use function instead of def",
          "String concatenation with + is invalid"
        ],
        correctIndex: 0,
        explanations: [
          "✓ In Python, header lines ending function/class/loop definitions MUST end with a colon (:).",
          "Indentation of 4 spaces is correct Python syntax.",
          "Python uses 'def', not 'function'.",
          "String concatenation with + is completely valid in Python."
        ],
        conceptSummary: "Python block headers (def, if, for, while, class) require a trailing colon (:) before the indented body block."
      },
      {
        questionType: "scenario",
        prompt: "Which data structure should you select to eliminate duplicates?",
        scenarioSetup: `You are building a user registration system for ${skillName}. You need to process a stream of incoming email addresses and immediately filter out duplicate entries while preserving fast O(1) lookup.`,
        options: ["List", "Tuple", "Set", "Dictionary Keys Only"],
        correctIndex: 2,
        explanations: [
          "Lists allow duplicate elements.",
          "Tuples allow duplicates and are immutable.",
          "✓ Sets automatically enforce uniqueness and provide O(1) membership testing.",
          "Dictionary keys also enforce uniqueness, but a Set is the dedicated data structure for unique collections."
        ],
        conceptSummary: "Python Sets are unordered collections of unique elements backed by hash tables, ideal for deduplication."
      },
      {
        questionType: "compare",
        prompt: "What is the primary operational difference between a Python List and a Tuple?",
        options: [
          "Lists are mutable (modifiable); Tuples are immutable (read-only)",
          "Tuples allow string keys; Lists only allow numeric indices",
          "Lists have O(1) search; Tuples have O(n) search",
          "Tuples consume more memory than Lists"
        ],
        correctIndex: 0,
        explanations: [
          "✓ Lists can be changed after creation (append, pop), while Tuples cannot be modified once defined.",
          "Dictionaries allow string keys, not Tuples.",
          "Both List and Tuple linear search takes O(n) time.",
          "Tuples actually consume LESS memory than Lists because they don't over-allocate buffer space."
        ],
        conceptSummary: "Mutability is the core distinction: Lists are mutable dynamic arrays; Tuples are immutable fixed sequences."
      }
    ],
    2: [
      {
        questionType: "concept",
        prompt: "In exception handling for ${skillName}, which block ALWAYS runs regardless of whether an exception occurred?",
        options: ["try", "except", "finally", "else"],
        correctIndex: 2,
        explanations: [
          "try contains code that might raise an exception.",
          "except only runs if a matching exception is raised.",
          "✓ finally always executes before leaving the try-except structure, ideal for resource cleanup.",
          "else only runs if NO exception was raised in the try block."
        ],
        conceptSummary: "The 'finally' block guarantees execution for cleanup (closing files, releasing database connections)."
      },
      {
        questionType: "code_output",
        prompt: "What is the output of this Python slice operation?",
        codeSnippet: `text = "XPedition"\nprint(text[1:4])`,
        options: ["Ped", "XPe", "Pedi", "xpe"],
        correctIndex: 0,
        explanations: [
          "✓ Slice [1:4] extracts characters from index 1 up to (excluding) index 4: 'P', 'e', 'd'.",
          "XPe starts at index 0.",
          "Pedi goes up to index 5.",
          "xpe is lowercase."
        ],
        conceptSummary: "Python slice notation [start:stop] is half-open: it includes 'start' and excludes 'stop'."
      },
      {
        questionType: "debug",
        prompt: "Why does this dictionary lookup crash at runtime?",
        codeSnippet: `scores = {"alice": 95, "bob": 88}\nprint(scores["charlie"])`,
        options: [
          "KeyError: 'charlie' does not exist in the dictionary",
          "TypeError: dictionary keys must be integers",
          "ValueError: string cannot be converted to score",
          "IndexError: index out of bounds"
        ],
        correctIndex: 0,
        explanations: [
          "✓ Direct square-bracket lookup [] on a missing key raises a KeyError. Use scores.get('charlie') to return None safely.",
          "Dictionary keys can be any hashable type including strings.",
          "ValueError is not raised during key lookups.",
          "IndexError occurs with lists/tuples, not dictionaries."
        ],
        conceptSummary: "Direct key access d[k] raises KeyError if missing; use d.get(k, default) for safe retrieval."
      },
      {
        questionType: "scenario",
        prompt: "How should you design the data processing pipeline to handle unexpected network drops?",
        scenarioSetup: `Your microservice ingests batch telemetry for ${skillName} over HTTP. Occasionally the remote API drops connections midway through batch processing.`,
        options: [
          "Wrap API calls in a try...except block with retry exponential backoff",
          "Increase the global server RAM allocation",
          "Use a for loop without exception handling",
          "Ignore error responses and continue silently"
        ],
        correctIndex: 0,
        explanations: [
          "✓ Wrapping network requests in try...except with retries handles transient failure gracefully.",
          "RAM does not prevent network socket timeouts.",
          "An unhandled network exception will crash the process.",
          "Ignoring errors leads to data loss and corrupted state."
        ],
        conceptSummary: "Robust network callers catch socket/HTTP exceptions and implement exponential backoff retries."
      },
      {
        questionType: "compare",
        prompt: "What is the key difference between list.sort() and sorted(list)?",
        options: [
          "list.sort() mutates the list in-place returning None; sorted(list) returns a new sorted list",
          "sorted(list) mutates in-place; list.sort() creates a copy",
          "list.sort() only works on numbers; sorted() works on strings",
          "sorted() operates in O(n^2); list.sort() operates in O(n log n)"
        ],
        correctIndex: 0,
        explanations: [
          "✓ list.sort() modifies the original list directly. sorted() leaves the original untouched and returns a new list.",
          "Incorrect — sorted() creates a copy, list.sort() modifies in-place.",
          "Both functions sort any comparable items using Timsort.",
          "Both functions use Timsort with O(n log n) worst-case time."
        ],
        conceptSummary: "In-place methods (list.sort) modify original objects and return None; built-in functions (sorted) return new instances."
      }
    ],
    3: [
      {
        questionType: "concept",
        prompt: "What is the average time complexity of looking up a key in a Python dictionary or hash table?",
        options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
        correctIndex: 0,
        explanations: [
          "✓ Hash tables hash the key to index directly in constant O(1) average time.",
          "O(log n) applies to binary search trees.",
          "O(n) is the worst case under extreme hash collisions.",
          "O(n log n) is sorting time."
        ],
        conceptSummary: "Hash tables achieve O(1) average lookup by mapping keys to array indices via hash functions."
      },
      {
        questionType: "code_output",
        prompt: "What is the output of this Python list comprehension with conditional filtering?",
        codeSnippet: `nums = [1, 2, 3, 4, 5, 6]\nevens_squared = [x**2 for x in nums if x % 2 == 0]\nprint(evens_squared)`,
        options: ["[4, 16, 36]", "[1, 9, 25]", "[2, 4, 6]", "[4, 8, 12]"],
        correctIndex: 0,
        explanations: [
          "✓ Evens are 2, 4, 6. Squaring them gives 2^2=4, 4^2=16, 6^2=36 -> [4, 16, 36].",
          "[1, 9, 25] are the squares of odd numbers.",
          "[2, 4, 6] are the unsquared evens.",
          "[4, 8, 12] are multiplied by 2, not squared."
        ],
        conceptSummary: "List comprehensions [expr for var in iterable if condition] map and filter in a single readable line."
      },
      {
        questionType: "debug",
        prompt: "Why does this class method fail when instantiated?",
        codeSnippet: `class Counter:\n    def __init__(val):\n        self.val = val`,
        options: [
          "Missing 'self' as the first parameter in __init__ signature",
          "__init__ must return an integer",
          "Classes cannot store instance variables",
          "def keyword cannot be used inside class body"
        ],
        correctIndex: 0,
        explanations: [
          "✓ Python instance methods MUST receive 'self' as their explicit first argument: def __init__(self, val):",
          "__init__ should return None, never an integer.",
          "Classes routinely store instance variables on self.",
          "def is required to define methods inside classes."
        ],
        conceptSummary: "Python methods explicitly receive the instance instance 'self' as the first parameter."
      },
      {
        questionType: "scenario",
        prompt: "Which algorithmic technique should you select to find the shortest path in an unweighted graph?",
        scenarioSetup: `You are designing a social network feature for ${skillName} that calculates the shortest degree of separation between two users in an unweighted connection graph.`,
        options: ["Breadth-First Search (BFS)", "Depth-First Search (DFS)", "Binary Search", "Quicksort"],
        correctIndex: 0,
        explanations: [
          "✓ BFS explores node-by-node outward level-by-level, guaranteeing the shortest path in unweighted graphs.",
          "DFS goes deep down one path first and may find a much longer path before finding the shortest.",
          "Binary Search operates on sorted arrays, not graphs.",
          "Quicksort sorts elements, not graph nodes."
        ],
        conceptSummary: "Breadth-First Search (BFS) uses a queue (FIFO) to explore graph nodes by distance, guaranteeing shortest paths on unweighted graphs."
      },
      {
        questionType: "compare",
        prompt: "How does Breadth-First Search (BFS) differ from Depth-First Search (DFS) in memory usage on deep trees?",
        options: [
          "BFS uses a queue storing frontier nodes by level; DFS uses a stack (or recursion) storing path height",
          "DFS uses more memory than BFS on wide shallow trees",
          "BFS requires no extra memory; DFS requires O(V+E)",
          "DFS processes nodes in FIFO order; BFS in LIFO order"
        ],
        correctIndex: 0,
        explanations: [
          "✓ BFS queue size depends on maximum tree width O(w); DFS stack size depends on maximum path height O(h).",
          "On wide shallow trees BFS memory dominates due to storing all leaf nodes in queue.",
          "Both algorithms require memory for visited tracking.",
          "BFS is FIFO (Queue); DFS is LIFO (Stack)."
        ],
        conceptSummary: "BFS uses FIFO queues (level-by-level); DFS uses LIFO stacks (branch-by-branch)."
      }
    ],
    4: [
      {
        questionType: "concept",
        prompt: "What is the primary memory advantage of Python generator functions using 'yield'?",
        options: [
          "Lazy evaluation: elements are generated one at a time without storing the full sequence in RAM",
          "Generators execute 10x faster than compiled C code",
          "Generators automatically parallelize across all CPU cores",
          "Generators prevent all garbage collection cycles"
        ],
        correctIndex: 0,
        explanations: [
          "✓ Yielding items on-demand keeps memory usage constant O(1) regardless of dataset size.",
          "Generators incur Python iterator overhead; they are not faster than C.",
          "Generators are single-threaded; GIL still applies.",
          "Generators do not disable garbage collection."
        ],
        conceptSummary: "Generators pause execution and stream values lazily, enabling processing of massive datasets with O(1) memory."
      },
      {
        questionType: "code_output",
        prompt: "What does this generator code print when iterated?",
        codeSnippet: `def countdown(n):\n    while n > 0:\n        yield n\n        n -= 1\n\nprint(list(countdown(3)))`,
        options: ["[3, 2, 1]", "[3, 2, 1, 0]", "[1, 2, 3]", "<generator object>"],
        correctIndex: 0,
        explanations: [
          "✓ The loop yields 3, then 2, then 1, stopping when n becomes 0.",
          "n > 0 condition prevents 0 from being yielded.",
          "Values are yielded in descending order starting at 3.",
          "list() evaluates the generator into a list, so it prints the list, not the raw generator object."
        ],
        conceptSummary: "list(generator) consumes all yielded values sequentially until StopIteration."
      },
      {
        questionType: "debug",
        prompt: "Why does this mutable default argument cause unexpected state retention across function calls?",
        codeSnippet: `def add_item(item, target_list=[]):\n    target_list.append(item)\n    return target_list`,
        options: [
          "Default argument target_list is evaluated ONCE when function is defined, sharing the list across all calls",
          "Lists cannot be passed as default parameters",
          "append() returns a new list instead of modifying in-place",
          "target_list variable is deleted after function returns"
        ],
        correctIndex: 0,
        explanations: [
          "✓ Python default parameter expressions execute once at definition time. The default list object is shared across calls!",
          "Lists can be passed, but mutable defaults are a known Python gotcha.",
          "append() modifies in-place and returns None.",
          "Default parameter objects persist in the function's __defaults__ attribute."
        ],
        conceptSummary: "Never use mutable defaults (lists, dicts). Use 'target_list=None' and initialize inside the body."
      },
      {
        questionType: "scenario",
        prompt: "Which optimization technique should you apply to convert exponential O(2^n) recursive Fibonacci into linear O(n)?",
        scenarioSetup: `You are optimizing a recursive algorithm in ${skillName} that calculates overlapping subproblems. The recursive call tree is repeating the exact same calculations millions of times.`,
        options: ["Memoization / Dynamic Programming", "Multiprocessing", "Tail recursion", "Increasing stack size"],
        correctIndex: 0,
        explanations: [
          "✓ Memoization stores computed subproblem outputs in a cache dict, cutting redundant recursive branches.",
          "Multiprocessing distributes work but does not eliminate redundant subproblems.",
          "Tail recursion reduces call stack depth but doesn't solve exponential overlapping work.",
          "Increasing stack size prevents RecursionError but leaves time complexity at O(2^n)."
        ],
        conceptSummary: "Memoization caches recursive function call results to solve overlapping subproblems in O(n) time."
      },
      {
        questionType: "compare",
        prompt: "What is the key functional difference between multiprocessing and multithreading in Python?",
        options: [
          "Multiprocessing spawns separate OS processes bypassing GIL for CPU-bound tasks; Multithreading shares memory space under GIL",
          "Multithreading bypasses the GIL; Multiprocessing does not",
          "Multiprocessing uses less memory than Multithreading",
          "Multithreading allows true parallel execution on CPU-heavy math tasks"
        ],
        correctIndex: 0,
        explanations: [
          "✓ Multiprocessing creates separate memory spaces and GIL instances per core. Multithreading is bound by a single GIL.",
          "Multithreading is constrained by GIL; Multiprocessing bypasses it.",
          "Multiprocessing consumes MORE memory due to process overhead.",
          "GIL prevents true CPU-bound parallelism in threads."
        ],
        conceptSummary: "Use multiprocessing for CPU-bound computation (bypasses GIL); use multithreading/asyncio for I/O-bound wait states."
      }
    ],
    5: [
      {
        questionType: "concept",
        prompt: "In Python's execution architecture, what is the exact function of the Global Interpreter Lock (GIL)?",
        options: [
          "A mutex lock ensuring only one thread executes Python bytecode at any single moment",
          "A security firewall preventing code injection",
          "A compiler optimizer that converts Python to C assembly",
          "A database lock for SQLite transactions"
        ],
        correctIndex: 0,
        explanations: [
          "✓ The GIL protects memory management (C Python reference counting) by serializing bytecode execution.",
          "The GIL is not a security firewall.",
          "The GIL does not compile code to C assembly.",
          "The GIL is internal to CPython interpreter, unrelated to databases."
        ],
        conceptSummary: "The GIL prevents multi-threaded CPython from running threads in true parallel on multiple CPU cores."
      },
      {
        questionType: "code_output",
        prompt: "What is the output of this decorator pattern in Python?",
        codeSnippet: `def uppercase(func):\n    def wrapper():\n        return func().upper()\n    return wrapper\n\n@uppercase\ndef greet():\n    return "hello"\n\nprint(greet())`,
        options: ["HELLO", "hello", "TypeError", "<function wrapper>"],
        correctIndex: 0,
        explanations: [
          "✓ @uppercase wraps greet(), transforming its return value 'hello' into 'HELLO'.",
          "hello would be returned without decorator.",
          "TypeError is incorrect — decorator syntax is valid.",
          "greet() calls wrapper() which returns the string result 'HELLO'."
        ],
        conceptSummary: "@decorator syntax wraps functions, modifying arguments or return values transparently."
      },
      {
        questionType: "debug",
        prompt: "What causes a deadlock in this concurrent multi-threading scenario?",
        codeSnippet: `# Thread A locks Lock 1, waits for Lock 2\n# Thread B locks Lock 2, waits for Lock 1`,
        options: [
          "Circular dependency / Lock acquisition ordering conflict",
          "GIL prevents threads from running",
          "Memory leak in Thread A",
          "Queue overflow"
        ],
        correctIndex: 0,
        explanations: [
          "✓ Circular wait condition: Thread A holds L1 needing L2; Thread B holds L2 needing L1. Neither can proceed.",
          "GIL causes serialization, not deadlocks.",
          "Memory leaks do not cause thread deadlocks.",
          "Queue overflow causes buffer errors, not mutual exclusion deadlocks."
        ],
        conceptSummary: "Deadlocks occur when threads hold resources while waiting for others in a circular dependency chain. Enforce strict lock acquisition order."
      },
      {
        questionType: "scenario",
        prompt: "How should you architect cache invalidation to prevent the 'thundering herd' problem during high traffic surge?",
        scenarioSetup: `Your system experiences 100,000 requests/sec. When a core Redis cache key for ${skillName} expires, thousands of incoming requests simultaneously hit the primary database.`,
        options: [
          "Use Mutex locking with probabilistic early expiration (PER)",
          "Double the database connection pool limit",
          "Disable cache TTL completely",
          "Increase HTTP timeout to 60 seconds"
        ],
        correctIndex: 0,
        explanations: [
          "✓ Mutex locks ensure only ONE worker recomputes cache while others wait or serve stale values.",
          "Doubling connection pool will overwhelm and crash the database under stampede.",
          "Disabling TTL causes permanent stale data bugs.",
          "Increasing timeout worsens user latency without resolving database stampede."
        ],
        conceptSummary: "Thundering herd is solved via distributed locks or probabilistic early recomputation (XFetch)."
      },
      {
        questionType: "compare",
        prompt: "What is the architectural tradeoff between REST and gRPC for high-throughput microservices?",
        options: [
          "gRPC uses Protocol Buffers over HTTP/2 with binary serialization; REST uses JSON over HTTP/1.1 with text payload",
          "REST is faster than gRPC because JSON requires no compilation",
          "gRPC only works with Python; REST works with all languages",
          "REST supports bi-directional streaming; gRPC does not"
        ],
        correctIndex: 0,
        explanations: [
          "✓ gRPC leverages HTTP/2 multiplexing and compact Protobuf binary format for up to 7x higher throughput.",
          "Binary Protobuf is significantly faster to serialize/deserialize than text JSON.",
          "gRPC supports code generation across virtually all major programming languages.",
          "gRPC supports native HTTP/2 bi-directional streaming; REST on HTTP/1.1 does not."
        ],
        conceptSummary: "gRPC achieves higher performance via Protobuf binary serialization and HTTP/2 multiplexed streaming."
      }
    ]
  };

  const pool = fallbackPool[diffLevel] || fallbackPool[2];

  // 1. Filter out questions whose questionType is in avoidTypes
  let filtered = pool.filter((q) => !avoidTypes.includes(q.questionType));

  // 2. Filter out questions whose prompt is duplicate
  let nonDups = filtered.filter((q) => !isDuplicatePrompt(q.prompt, promptHistory));

  if (nonDups.length === 0) {
    // Relax questionType constraint
    nonDups = pool.filter((q) => !isDuplicatePrompt(q.prompt, promptHistory));
  }

  const selected = nonDups.length > 0 ? nonDups[Math.floor(Math.random() * nonDups.length)] : pool[Math.floor(Math.random() * pool.length)];

  return {
    questionType: selected.questionType,
    prompt: selected.prompt,
    scenarioSetup: selected.scenarioSetup,
    codeSnippet: selected.codeSnippet,
    options: selected.options,
    correctIndex: selected.correctIndex,
    explanations: selected.explanations,
    conceptSummary: selected.conceptSummary,
  };
}
