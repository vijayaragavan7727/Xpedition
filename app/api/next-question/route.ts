import { NextRequest, NextResponse } from "next/server";
import { Question } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { skillId, skillName = "General Skill", difficulty = 2, wasCorrect, goal = "Programming" } = body;

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

        const prompt = `You are XPedition's Adaptive Quest Generator.
Generate ONE single multiple-choice question for the skill: "${skillName}" (Goal: "${goal}").
Target difficulty level: Level ${difficulty} out of 5 (${difficultyDesc}).
Previous answer was: ${wasCorrect !== undefined ? (wasCorrect ? "CORRECT" : "INCORRECT") : "N/A"}.

Return STRICT JSON ONLY matching this format:
{
  "prompt": "Clear, engaging multiple-choice question",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctIndex": number (0 to 3),
  "explanation": "Short 1-sentence explanation of why the answer is correct"
}`;

        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
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

  const questionsByDiff: Record<number, Array<{ prompt: string; options: [string, string, string, string]; correctIndex: number; explanation: string }>> = {
    1: [
      {
        prompt: `[Level 1] Which keyword in Python or basic programming is used to create a reusable function for ${skillName}?`,
        options: ["function", "def", "func", "declare"],
        correctIndex: 1,
        explanation: "The 'def' keyword is used to define functions in Python."
      },
      {
        prompt: `[Level 1] What is the boolean result of expression (5 > 3 and 2 < 4) in ${skillName}?`,
        options: ["True", "False", "None", "Undefined"],
        correctIndex: 0,
        explanation: "Both conditions (5 > 3) and (2 < 4) evaluate to True."
      }
    ],
    2: [
      {
        prompt: `[Level 2] In ${skillName}, how do you safely handle potential runtime exceptions?`,
        options: ["try...except block", "if...else condition", "for...in loop", "catch...throw clause"],
        correctIndex: 0,
        explanation: "try...except blocks catch and handle execution exceptions safely."
      },
      {
        prompt: `[Level 2] What method adds an item to the end of a list in Python?`,
        options: ["push()", "append()", "add()", "insertLast()"],
        correctIndex: 1,
        explanation: "append() adds a single element to the end of a list."
      }
    ],
    3: [
      {
        prompt: `[Level 3] For ${skillName}, what is the time complexity of searching in a hash table on average?`,
        options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
        correctIndex: 0,
        explanation: "Hash table lookups operate in O(1) constant average time."
      },
      {
        prompt: `[Level 3] Which mechanism allows a Python class to inherit properties from another class in ${skillName}?`,
        options: ["Polymorphism", "Single/Multiple Inheritance", "Encapsulation", "Abstraction"],
        correctIndex: 1,
        explanation: "Inheritance allows child classes to reuse code from parent classes."
      }
    ],
    4: [
      {
        prompt: `[Level 4] In advanced ${skillName}, what is the primary benefit of using generator functions with 'yield'?`,
        options: ["Memory efficiency via lazy evaluation", "Faster execution than compiled C code", "Automatic multithreading across CPU cores", "Preventing null pointer errors"],
        correctIndex: 0,
        explanation: "Generators compute items on-demand, consuming minimal RAM."
      },
      {
        prompt: `[Level 4] When optimizing recursion in ${skillName}, which technique stores previously computed results?`,
        options: ["Memoization / Dynamic Programming", "Tail call elimination", "Garbage collection", "Multiprocessing"],
        correctIndex: 0,
        explanation: "Memoization caches function call outputs for overlapping subproblems."
      }
    ],
    5: [
      {
        prompt: `[Level 5 Mastery] In high-scale system design for ${skillName}, how do you prevent thundering herd cache problems?`,
        options: ["Mutex locks with probabilistic early expiration", "Increasing database query timeout", "Disabling cache TTL entirely", "Doubling server RAM"],
        correctIndex: 0,
        explanation: "Mutex locks or probabilistic early recomputation prevent simultaneous cache misses."
      },
      {
        prompt: `[Level 5 Mastery] How does Python's GIL (Global Interpreter Lock) impact multithreading in CPU-bound tasks?`,
        options: ["Constrains execution to a single thread at a time", "Enables parallel execution on all cores", "Eliminates memory leaks", "Speeds up mathematical loops"],
        correctIndex: 0,
        explanation: "The GIL prevents multiple native threads from executing Python bytecode simultaneously."
      }
    ]
  };

  const pool = questionsByDiff[diffIndex] || questionsByDiff[2];
  const selected = pool[(questionCounter + Math.floor(Math.random() * pool.length)) % pool.length];

  return {
    prompt: selected.prompt,
    options: selected.options,
    correctIndex: selected.correctIndex,
    explanation: selected.explanation,
  };
}
