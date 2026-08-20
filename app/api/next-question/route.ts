import { NextRequest, NextResponse } from "next/server";
import { Question } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { skillName = "General Skill", difficulty = 2, wasCorrect, goal = "Programming" } = body;

    const groqKey = process.env.GROQ_API_KEY;

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
            .limit(3);

          if (peerData && peerData.length > 0) {
            const picked = peerData[Math.floor(Math.random() * peerData.length)];

            // Increment plays count
            await supabase
              .from("peer_quests")
              .update({ plays: (picked.plays || 0) + 1 })
              .eq("id", picked.id);

            return NextResponse.json({
              prompt: picked.prompt,
              options: Array.isArray(picked.options) ? picked.options : [],
              correctIndex: picked.correct_index,
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

        const promptText = `You are XPedition's Adaptive Quest Generator.
Generate ONE single multiple-choice question for the skill: "${skillName}" (Goal: "${goal}").
Target difficulty level: Level ${difficulty} out of 5 (${difficultyDesc}).
Previous answer was: ${wasCorrect !== undefined ? (wasCorrect ? "CORRECT" : "INCORRECT") : "N/A"}.

Return STRICT JSON ONLY matching this format:
{
  "prompt": "Clear, engaging multiple-choice question",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctIndex": number (0 to 3),
  "explanations": [
    "Why Option A is correct or wrong — specific to the concept being tested, never generic",
    "Why Option B is correct or wrong — specific to the concept being tested, never generic",
    "Why Option C is correct or wrong — specific to the concept being tested, never generic",
    "Why Option D is correct or wrong — specific to the concept being tested, never generic"
  ],
  "conceptSummary": "A 1-2 sentence explanation of the core concept this question tests. Must give the learner a genuine insight, not just confirm the right answer."
}

Rules:
- explanations must have exactly 4 entries in the same order as options[].
- Each explanation must be specific — say WHY the option is right/wrong using the actual concept.
- conceptSummary should teach the underlying principle so learners understand it even if they got it wrong.`;

        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: promptText }],
            temperature: 0.7,
            response_format: { type: "json_object" }
          }),
        });

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          const contentStr = groqData.choices?.[0]?.message?.content;
          if (contentStr) {
            const parsed = JSON.parse(contentStr) as Question;
            if (parsed.prompt && Array.isArray(parsed.options) && typeof parsed.correctIndex === "number") {
              return NextResponse.json(parsed);
            }
          }
        }
      } catch (err) {
        console.warn("Groq next-question API warning:", err);
      }
    }

    // Dynamic fallback question generator if API key is not present or API call fails
    const fallbackQuestion = generateAdaptiveFallbackQuestion(skillName, difficulty);
    return NextResponse.json(fallbackQuestion);

  } catch (error) {
    console.error("Next Question API error:", error);
    return NextResponse.json(
      { error: "Failed to generate next question." },
      { status: 500 }
    );
  }
}

let questionCounter = 0;

function generateAdaptiveFallbackQuestion(skillName: string, difficulty: number): Question {
  questionCounter++;
  const diffIndex = Math.min(5, Math.max(1, difficulty));

  const questionsByDiff: Record<number, Array<{ prompt: string; options: [string, string, string, string]; correctIndex: number; explanations: [string, string, string, string]; conceptSummary: string }>> = {
    1: [
      {
        prompt: `[Level 1] Which keyword in Python is used to create a reusable function?`,
        options: ["function", "def", "func", "declare"],
        correctIndex: 1,
        explanations: [
          "'function' is JavaScript's keyword for defining functions, not Python's — Python uses 'def'.",
          "✓ 'def' is Python's keyword for defining functions. It stands for 'define' and marks the start of a function block.",
          "'func' is used in languages like Go, but Python does not recognize it as a keyword.",
          "'declare' is not a Python keyword — it appears in some languages for variable declarations, not function definitions."
        ],
        conceptSummary: "In Python, every reusable block of code is defined with 'def', followed by the function name and parentheses. Unlike JavaScript's 'function' keyword, Python uses 'def' consistently for all function types including methods inside classes."
      },
      {
        prompt: `[Level 1] What is the boolean result of the expression (5 > 3 and 2 < 4) in Python?`,
        options: ["True", "False", "None", "Undefined"],
        correctIndex: 0,
        explanations: [
          "✓ True — both sub-expressions (5 > 3) and (2 < 4) are individually True, and True AND True evaluates to True.",
          "False would only result if at least one sub-expression were False. Both are True here.",
          "None is Python's null value returned by functions with no return statement — not the result of a boolean expression.",
          "'Undefined' is a JavaScript concept, not Python. Python raises NameError for unknown names."
        ],
        conceptSummary: "Python's 'and' operator returns True only when ALL operands are True (short-circuit evaluation). If the first operand is False, Python skips evaluating the second operand entirely — this is called short-circuit evaluation."
      }
    ],
    2: [
      {
        prompt: `[Level 2] In ${skillName}, how do you safely handle potential runtime exceptions?`,
        options: ["try...except block", "if...else condition", "for...in loop", "catch...throw clause"],
        correctIndex: 0,
        explanations: [
          "✓ try...except blocks catch exceptions at runtime without crashing the program — this is Python's standard error-handling mechanism.",
          "if...else checks conditions before execution but cannot catch unexpected runtime errors like ZeroDivisionError or FileNotFoundError.",
          "for...in loops iterate over sequences — they have no built-in mechanism to catch or handle exceptions.",
          "'catch...throw' is Java/JavaScript syntax. Python uses 'except' to catch and 'raise' to re-throw exceptions."
        ],
        conceptSummary: "Python's try...except pattern separates 'what you want to do' from 'what to do if it breaks'. The code in 'try' runs normally; 'except' only executes if a specific error type is raised, keeping your program from crashing."
      },
      {
        prompt: `[Level 2] What method adds an item to the end of a Python list?`,
        options: ["push()", "append()", "add()", "insertLast()"],
        correctIndex: 1,
        explanations: [
          "'push()' is JavaScript Array's method for adding to the end. Python lists don't have a push() method.",
          "✓ append() adds a single element to the end of a Python list in-place and returns None.",
          "add() is used by Python's set data structure to add elements. Lists use append() instead.",
          "'insertLast()' doesn't exist in Python. Python's insert(index, value) can insert at any position, but append() is the idiomatic end-insertion method."
        ],
        conceptSummary: "Python lists have separate methods for different insertion positions: append() for the end, insert(i, val) for a specific index, and extend() to merge all items from another iterable into the list."
      }
    ],
    3: [
      {
        prompt: `[Level 3] What is the average time complexity of a hash table lookup?`,
        options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
        correctIndex: 0,
        explanations: [
          "✓ O(1) — hash tables compute the exact memory address from the key using a hash function, making lookups constant time on average regardless of table size.",
          "O(log n) is the time for binary search trees (like balanced BSTs). Hash tables don't need to traverse a tree structure.",
          "O(n) occurs in the worst case when all keys hash to the same bucket (maximum collisions), but the average case is O(1).",
          "O(n log n) is typical of efficient sorting algorithms like merge sort — not applicable to single-item lookups in any structure."
        ],
        conceptSummary: "Hash tables achieve O(1) average lookup by transforming the key into an index via a hash function. The trade-off is memory: hash tables pre-allocate space and use collision strategies (chaining/open addressing) to maintain fast access."
      },
      {
        prompt: `[Level 3] Which OOP mechanism lets a Python class reuse code from another class?`,
        options: ["Polymorphism", "Inheritance", "Encapsulation", "Abstraction"],
        correctIndex: 1,
        explanations: [
          "Polymorphism lets the same method name behave differently across classes, but it doesn't define how properties are shared — inheritance does.",
          "✓ Inheritance allows a child class to reuse attributes and methods from one or more parent classes using class ChildClass(ParentClass) syntax.",
          "Encapsulation is about restricting direct access to object internals via private attributes — not about sharing code between classes.",
          "Abstraction hides complex implementation behind a simple interface — it's a design principle, not a code-reuse mechanism between classes."
        ],
        conceptSummary: "Python's inheritance model uses class ChildClass(ParentClass) syntax. Python also supports multiple inheritance and uses Method Resolution Order (MRO) via C3 linearization to determine which parent's method runs first when there's ambiguity."
      }
    ],
    4: [
      {
        prompt: `[Level 4] What is the primary advantage of generator functions using 'yield' in Python?`,
        options: ["Memory efficiency via lazy evaluation", "Faster execution than compiled C code", "Automatic multithreading across CPU cores", "Preventing null pointer errors"],
        correctIndex: 0,
        explanations: [
          "✓ Generators compute and yield values one at a time on demand, so the full sequence is never held in memory — critical for large datasets or infinite sequences.",
          "Generators are not faster than C — they're slower per-item due to Python overhead. Their advantage is memory, not raw speed.",
          "Python's GIL prevents true parallel threading for CPU-bound tasks. Generators are single-threaded and don't provide parallelism.",
          "Generators don't address null pointer or None-related errors — those require explicit None checks or Optional typing patterns."
        ],
        conceptSummary: "Generator functions use 'yield' instead of 'return', pausing execution and saving state between calls. This lazy evaluation makes them ideal for large file reads, streaming APIs, or any sequence that would be too large to hold in RAM all at once."
      },
      {
        prompt: `[Level 4] Which technique eliminates redundant recursive computations by caching results?`,
        options: ["Memoization / Dynamic Programming", "Tail call elimination", "Garbage collection", "Multiprocessing"],
        correctIndex: 0,
        explanations: [
          "✓ Memoization caches the result of each unique function call. On a repeat call with the same arguments, it returns the cached result — turning exponential recursion into linear time.",
          "Tail call elimination is a compiler optimization reusing stack frames for tail-recursive calls. Python doesn't natively implement this optimization.",
          "Garbage collection reclaims unused memory — it doesn't cache or store computation results for later reuse.",
          "Multiprocessing parallelizes work across CPU cores — it doesn't cache results or reduce redundant recursive calls."
        ],
        conceptSummary: "Dynamic Programming solves problems by breaking them into overlapping subproblems and storing each solution. Memoization is the top-down approach (cache on first compute with @functools.lru_cache); tabulation is the bottom-up approach (fill a table iteratively)."
      }
    ],
    5: [
      {
        prompt: `[Level 5 Mastery] How do you prevent the thundering herd problem in a high-traffic caching system?`,
        options: ["Mutex locks with probabilistic early expiration", "Increasing database query timeout", "Disabling cache TTL entirely", "Doubling server RAM"],
        correctIndex: 0,
        explanations: [
          "✓ Mutex locks prevent simultaneous cache regeneration by multiple servers. Probabilistic early expiration (randomly recomputing before TTL expires) spreads the load, preventing synchronized stampedes.",
          "Increasing query timeout makes individual requests wait longer but doesn't prevent multiple servers from hitting the database simultaneously when a hot cache key expires.",
          "Disabling TTL means cached data never expires, causing stale data problems — and the initial population still creates a stampede on cold start.",
          "More RAM improves caching capacity but does nothing to prevent all servers from simultaneously querying the database at the moment a popular cache key expires."
        ],
        conceptSummary: "The thundering herd problem occurs when a cache entry expires and many servers simultaneously query the database. Solutions include mutex-based cache locking, probabilistic early expiration (PER), and request coalescing — each trading different complexity/latency tradeoffs."
      },
      {
        prompt: `[Level 5 Mastery] How does Python's GIL affect CPU-bound multithreaded programs?`,
        options: ["Constrains execution to a single thread at a time", "Enables parallel execution on all cores", "Eliminates memory leaks", "Speeds up mathematical loops"],
        correctIndex: 0,
        explanations: [
          "✓ The GIL is a mutex that allows only one thread to execute Python bytecode at a time, making Python threads unsuitable for CPU-bound parallelism despite using multiple OS threads.",
          "The GIL specifically prevents parallel execution for CPU-bound work. For I/O-bound tasks, threads still help because the GIL is released during I/O waits.",
          "The GIL is a threading lock, not a memory management tool — Python's memory is managed by reference counting and a cyclic garbage collector.",
          "The GIL actually slows CPU-bound multithreaded code by serializing execution. Use multiprocessing or C extensions like NumPy that release the GIL for CPU-bound speed."
        ],
        conceptSummary: "Python's GIL protects the interpreter's internal state but prevents true CPU-bound parallelism in threads. The alternatives: multiprocessing (separate processes bypass the GIL), asyncio (for I/O-bound concurrency), or C extensions like NumPy that explicitly release the GIL."
      }
    ]
  };

  const pool = questionsByDiff[diffIndex] || questionsByDiff[2];
  const selected = pool[(questionCounter + Math.floor(Math.random() * pool.length)) % pool.length];

  return {
    prompt: selected.prompt,
    options: selected.options,
    correctIndex: selected.correctIndex,
    explanations: selected.explanations,
    conceptSummary: selected.conceptSummary,
  };
}
