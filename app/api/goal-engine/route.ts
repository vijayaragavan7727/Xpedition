import { NextRequest, NextResponse } from "next/server";
import { GoalEngineResponse } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { goal } = body;

    if (!goal || typeof goal !== "string" || goal.trim() === "") {
      return NextResponse.json(
        { error: "Goal text is required." },
        { status: 400 }
      );
    }

    const trimmedGoal = goal.trim();
    const tavilyKey = process.env.TAVILY_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    let searchContent = "";
    let extractedSources: { title: string; url: string; domain: string }[] = [];

    // 1. Tavily Search API Integration
    if (tavilyKey && tavilyKey.trim() !== "") {
      try {
        const tavilyRes = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: tavilyKey,
            query: `skills topics syllabus interview prep for ${trimmedGoal}`,
            search_depth: "basic",
            max_results: 5,
          }),
        });

        if (tavilyRes.ok) {
          const tavilyData = await tavilyRes.json();
          if (tavilyData.results && Array.isArray(tavilyData.results)) {
            extractedSources = tavilyData.results.map((r: { title: string; url: string }) => {
              let domain = "web";
              try {
                domain = new URL(r.url).hostname.replace("www.", "");
              } catch (e) {}
              return {
                title: r.title || domain,
                url: r.url,
                domain,
              };
            });

            searchContent = tavilyData.results
              .map((r: { title: string; content: string; url: string }) => `${r.title} (${r.url}): ${r.content}`)
              .join("\n\n");
          }
        }
      } catch (err) {
        console.warn("Tavily search API warning:", err);
      }
    }

    // Default sources if Tavily API unconfigured or fallback
    if (extractedSources.length === 0) {
      extractedSources = [
        { title: "GeeksforGeeks Programming Guide", url: "https://www.geeksforgeeks.org", domain: "geeksforgeeks.org" },
        { title: "MDN Web Docs Documentation", url: "https://developer.mozilla.org", domain: "developer.mozilla.org" },
        { title: "freeCodeCamp Curriculum Reference", url: "https://www.freecodecamp.org", domain: "freecodecamp.org" },
        { title: "Official Documentation Hub", url: "https://docs.python.org/3/", domain: "docs.python.org" },
      ];
    }

    // 2. Groq LLM API Integration (llama-3.3-70b-versatile)
    if (groqKey && groqKey.trim() !== "") {
      try {
        const systemPrompt = `You are XPedition's Master Gamified Learning Architect.
Create an adaptive learning quest line for the user's goal: "${trimmedGoal}".
Use the following live research sources if available:
${searchContent || JSON.stringify(extractedSources)}

Respond with STRICT JSON ONLY. Do not wrap in markdown backticks. The JSON structure MUST be:
{
  "title": "A short, heroic course title for the goal",
  "skills": [
    {
      "id": "skill-1",
      "name": "Skill Name",
      "difficulty": number from 1 to 5,
      "sourceUrl": "The exact or domain URL from the provided research sources best covering this skill"
    }
  ],
  "firstQuestion": {
    "prompt": "An engaging multiple-choice diagnostic/quest question related to the first skill",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanations": [
      "Why Option A is correct or wrong — be specific to the concept, not generic",
      "Why Option B is correct or wrong — be specific to the concept, not generic",
      "Why Option C is correct or wrong — be specific to the concept, not generic",
      "Why Option D is correct or wrong — be specific to the concept, not generic"
    ],
    "conceptSummary": "A 1-2 sentence explanation of the core concept this question tests, giving the learner the key insight they need."
  }
}

Rules:
- explanations must have exactly 4 strings, one per option, in the same order as options[].
- Each explanation must be specific to why that option is right or wrong — never say just 'this is incorrect'.
- conceptSummary must teach the underlying principle, not just restate which answer is right.
- Attribute each generated skill to whichever of the provided sources best covers it in the sourceUrl property.
- Provide 4 to 6 core skills ordered logically from foundational to advanced.`;

        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `Generate learning quest for goal: "${trimmedGoal}"` }
            ],
            temperature: 0.4,
            response_format: { type: "json_object" }
          }),
        });

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          const contentStr = groqData.choices?.[0]?.message?.content;
          if (contentStr) {
            const parsed = JSON.parse(contentStr) as GoalEngineResponse;
            if (parsed.title && Array.isArray(parsed.skills) && parsed.firstQuestion) {
              parsed.sources = extractedSources;
              return NextResponse.json(parsed);
            }
          }
        }
      } catch (err) {
        console.warn("Groq API warning:", err);
      }
    }

    // 3. Fallback Engine: Context-aware dynamic fallback when API keys are missing or invalid
    const fallbackResponse = generateSmartFallback(trimmedGoal);
    fallbackResponse.sources = extractedSources;
    return NextResponse.json(fallbackResponse);

  } catch (error) {
    console.error("Goal Engine API error:", error);
    return NextResponse.json(
      { error: "Failed to generate goal course structure." },
      { status: 500 }
    );
  }
}

function generateSmartFallback(goal: string): GoalEngineResponse {
  const lowerGoal = goal.toLowerCase();

  if (lowerGoal.includes("python") || lowerGoal.includes("zoho")) {
    return {
      title: "Python Mastery for Zoho Interview Quest",
      skills: [
        { id: "p1", name: "Python Core Syntax & Data Structures (Lists, Dicts, Sets)", difficulty: 1 },
        { id: "p2", name: "Object-Oriented Programming (Classes, Inheritance, Decorators)", difficulty: 2 },
        { id: "p3", name: "Zoho Problem Solving (Arrays, String Manipulation & Matrices)", difficulty: 3 },
        { id: "p4", name: "Algorithms & Time Complexity (Recursion, Sorting, Searching)", difficulty: 4 },
        { id: "p5", name: "System Design & Coding Interview Live Practice", difficulty: 5 }
      ],
      firstQuestion: {
        prompt: "In Python, which of the following data structures is immutable and defined using parentheses?",
        options: ["List", "Tuple", "Dictionary", "Set"],
        correctIndex: 1
      }
    };
  } else if (lowerGoal.includes("dsa") || lowerGoal.includes("faang") || lowerGoal.includes("algorithm")) {
    return {
      title: "FAANG DSA Conquest & Algorithm Mastery",
      skills: [
        { id: "d1", name: "Big-O Analysis & Array Manipulation", difficulty: 1 },
        { id: "d2", name: "Two Pointers & Sliding Window Technique", difficulty: 2 },
        { id: "d3", name: "Trees, Graphs & BFS/DFS Traversal", difficulty: 3 },
        { id: "d4", name: "Dynamic Programming & Pattern Recognition", difficulty: 4 },
        { id: "d5", name: "Mock FAANG Coding Interview Simulations", difficulty: 5 }
      ],
      firstQuestion: {
        prompt: "What is the worst-case time complexity of finding an element in a balanced Binary Search Tree (BST)?",
        options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
        correctIndex: 1
      }
    };
  }

  // Generic adaptive fallback
  return {
    title: `${goal.charAt(0).toUpperCase() + goal.slice(1)} Mastery Journey`,
    skills: [
      { id: "s1", name: `Foundational Principles of ${goal}`, difficulty: 1 },
      { id: "s2", name: "Core Concepts & Practical Techniques", difficulty: 2 },
      { id: "s3", name: "Intermediate Problem Solving & Project Work", difficulty: 3 },
      { id: "s4", name: "Advanced Optimization & Best Practices", difficulty: 4 },
      { id: "s5", name: "Capstones & Real-World Interview Readiness", difficulty: 5 }
    ],
    firstQuestion: {
      prompt: `Which approach is most effective when initiating a deep dive into ${goal}?`,
      options: [
        "Mastering key fundamentals and hands-on application",
        "Skipping fundamentals to build complex apps directly",
        "Memorizing definitions without practical execution",
        "Focusing only on theoretical research"
      ],
      correctIndex: 0
    }
  };
}
