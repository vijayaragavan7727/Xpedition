import { NextRequest, NextResponse } from "next/server";
import { GoalEngineResponse } from "@/lib/types";

function isObviousNonsense(input: string): boolean {
  const s = input.trim().toLowerCase();
  if (s.length < 2) return true;
  // Identical repeated characters (e.g. "aaaaa", "zzzzzz")
  if (/^(.)\1+$/.test(s) && s.length > 3) return true;
  // Keyboard mashing regexes (e.g. "asdfgh", "qwerty", "zxcvbn", "12345")
  if (/^(asdfgh|qwerty|zxcvbn|12345|asdf|qwer|zxcv)/i.test(s) && !s.includes(" ")) return true;
  return false;
}

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

    let normalizedTopic = trimmedGoal;
    let isNonsense = isObviousNonsense(trimmedGoal);

    // 1. Normalization & Intent Inference Step via Groq
    if (groqKey && groqKey.trim() !== "") {
      try {
        const normRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              {
                role: "system",
                content: `You are XPedition's Goal Normalizer & Intent Classifier.
Convert raw user learning input into a clear, searchable, accurate technical/educational topic string.
Examples:
- "pythn basics" -> "Python Basics"
- "i wanna learn ML" -> "Machine Learning & AI"
- "dsa" -> "Data Structures & Algorithms"
- "react js" -> "React & Next.js Web Development"
- "sql" -> "SQL & Database Management"
- "spoken eng" -> "Spoken English & Professional Communication"

If the input is total random gibberish or keyboard mashing (e.g., "asdfgh", "qwerty", "123456", "hjklmn"), set "isNonsense": true.

Return STRICT JSON ONLY:
{
  "normalizedTopic": "Corrected searchable topic string",
  "isNonsense": boolean
}`,
              },
              { role: "user", content: `Raw user goal input: "${trimmedGoal}"` },
            ],
            temperature: 0.2,
            response_format: { type: "json_object" },
          }),
        });

        if (normRes.ok) {
          const normData = await normRes.json();
          const normStr = normData.choices?.[0]?.message?.content;
          if (normStr) {
            const normParsed = JSON.parse(normStr);
            if (normParsed.isNonsense) {
              isNonsense = true;
            } else if (normParsed.normalizedTopic && typeof normParsed.normalizedTopic === "string") {
              normalizedTopic = normParsed.normalizedTopic;
            }
          }
        }
      } catch (err) {
        console.warn("Groq goal normalization notice:", err);
      }
    }

    // Handle nonsense input gracefully
    if (isNonsense) {
      return NextResponse.json(
        {
          error: "nonsense",
          message: "We couldn't recognize a valid learning goal. Please try a real topic or pick one of these popular goals!",
          examples: [
            "Python Basics for Beginners",
            "Data Structures & Algorithms",
            "Machine Learning & AI",
            "Full Stack Web Development",
          ],
        },
        { status: 400 }
      );
    }

    let searchContent = "";
    let extractedSources: { title: string; url: string; domain: string }[] = [];
    let isWebGrounded = false;

    const academicKeywords = [
      "computer", "science", "algorithm", "data structure", "database", "sql",
      "python", "java", "c++", "engineering", "electronics", "math", "physics",
      "machine learning", "ai", "operating system", "network", "compiler", "software"
    ];

    const isAcademic = academicKeywords.some(kw => normalizedTopic.toLowerCase().includes(kw));

    // Helper for Tavily API Academic Search (NPTEL & SWAYAM)
    const fetchAcademicSources = async (queryStr: string) => {
      if (!tavilyKey || tavilyKey.trim() === "" || !isAcademic) return [];
      try {
        const tavilyRes = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: tavilyKey,
            query: `${queryStr} course syllabus nptel swayam`,
            include_domains: ["nptel.ac.in", "swayam.gov.in"],
            search_depth: "basic",
            max_results: 3,
          }),
        });

        if (tavilyRes.ok) {
          const tavilyData = await tavilyRes.json();
          if (tavilyData.results && Array.isArray(tavilyData.results)) {
            return tavilyData.results;
          }
        }
      } catch (err) {
        console.warn("Tavily academic search warning:", err);
      }
      return [];
    };

    // Helper for Tavily API Search
    const fetchTavilySources = async (queryStr: string) => {
      if (!tavilyKey || tavilyKey.trim() === "") return [];
      try {
        const tavilyRes = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: tavilyKey,
            query: `skills topics syllabus interview prep for ${queryStr}`,
            search_depth: "basic",
            max_results: 5,
          }),
        });

        if (tavilyRes.ok) {
          const tavilyData = await tavilyRes.json();
          if (tavilyData.results && Array.isArray(tavilyData.results)) {
            return tavilyData.results;
          }
        }
      } catch (err) {
        console.warn("Tavily search API warning:", err);
      }
      return [];
    };

    // 2. Tavily Search & Fallback Chain
    const academicResults = await fetchAcademicSources(normalizedTopic);
    let tavilyResults = await fetchTavilySources(normalizedTopic);
    tavilyResults = [...academicResults, ...tavilyResults];

    // Fallback: If Tavily returns < 2 results, try broader query (dropping extra words)
    if (tavilyResults.length < 2) {
      const words = normalizedTopic.split(" ");
      if (words.length > 2) {
        const broaderTopic = words.slice(0, 2).join(" ");
        const broaderResults = await fetchTavilySources(broaderTopic);
        if (broaderResults.length > tavilyResults.length) {
          tavilyResults = broaderResults;
        }
      }
    }

    if (tavilyResults.length >= 2) {
      isWebGrounded = true;
      extractedSources = tavilyResults.map((r: { title: string; url: string }) => {
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

      searchContent = tavilyResults
        .map((r: { title: string; content: string; url: string }) => `${r.title} (${r.url}): ${r.content}`)
        .join("\n\n");
    } else {
      isWebGrounded = false;
      // Default reference sources when live search returns no web results
      extractedSources = [
        { title: "GeeksforGeeks Guide", url: "https://www.geeksforgeeks.org", domain: "geeksforgeeks.org" },
        { title: "MDN Web Docs", url: "https://developer.mozilla.org", domain: "developer.mozilla.org" },
        { title: "freeCodeCamp Curriculum", url: "https://www.freecodecamp.org", domain: "freecodecamp.org" },
        { title: "Official Docs Hub", url: "https://docs.python.org/3/", domain: "docs.python.org" },
      ];
    }

    // 3. Groq Course Curriculum Generation
    if (groqKey && groqKey.trim() !== "") {
      try {
        const systemPrompt = `You are XPedition's Master Gamified Learning Architect.
Create an adaptive learning quest line for the normalized learning goal: "${normalizedTopic}" (Original user input: "${trimmedGoal}").
${
  isWebGrounded
    ? `Use the following live research sources harvested from the web:\n${searchContent}`
    : "Note: Live web search yielded insufficient results. Generate this curriculum using your internal expertise."
}

Respond with STRICT JSON ONLY. Do not wrap in markdown backticks. The JSON structure MUST be:
{
  "title": "A short, heroic course title for ${normalizedTopic}",
  "skills": [
    {
      "id": "skill-1",
      "name": "Skill Name",
      "difficulty": number from 1 to 5,
      "sourceUrl": "The exact or domain URL from provided sources best covering this skill"
    }
  ],
  "firstQuestion": {
    "questionType": "concept" | "code_output" | "debug" | "scenario" | "compare",
    "prompt": "An engaging multiple-choice diagnostic question related to the first skill",
    "scenarioSetup": "Optional 2-sentence scenario background if type is 'scenario', else null",
    "codeSnippet": "Optional clean code block if type is 'code_output' or 'debug', else null",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanations": [
      "Why Option A is correct or wrong — specific to the concept, never generic",
      "Why Option B is correct or wrong — specific to the concept, never generic",
      "Why Option C is correct or wrong — specific to the concept, never generic",
      "Why Option D is correct or wrong — specific to the concept, never generic"
    ],
    "conceptSummary": "A 1-2 sentence explanation of the core concept this question tests.",
    "reinforcement": {
      "whyItMatters": "A 1-sentence 'Why this matters' insight or common gotcha about this specific concept",
      "format": "true_false",
      "prompt": "A quick-check True/False or Fill-in-the-blank question testing a nuance of the same concept",
      "options": ["True", "False"],
      "correctIndex": 0,
      "explanation": "1-sentence explanation of why the answer is correct"
    }
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
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `Generate learning quest for normalized goal: "${normalizedTopic}"` },
            ],
            temperature: 0.4,
            response_format: { type: "json_object" },
          }),
        });

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          const contentStr = groqData.choices?.[0]?.message?.content;
          if (contentStr) {
            const parsed = JSON.parse(contentStr) as GoalEngineResponse;
            if (parsed.title && Array.isArray(parsed.skills) && parsed.firstQuestion) {
              parsed.normalizedTopic = normalizedTopic;
              parsed.isWebGrounded = isWebGrounded;
              parsed.sources = extractedSources;
              return NextResponse.json(parsed);
            }
          }
        }
      } catch (err) {
        console.warn("Groq API warning:", err);
      }
    }

    // 4. Fallback Engine when Groq API key is unconfigured or call fails
    const fallbackResponse = generateSmartFallback(normalizedTopic);
    fallbackResponse.normalizedTopic = normalizedTopic;
    fallbackResponse.isWebGrounded = isWebGrounded;
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
      normalizedTopic: "Python Basics for Beginners",
      isWebGrounded: true,
      skills: [
        { id: "p1", name: "Python Core Syntax & Data Structures (Lists, Dicts, Sets)", difficulty: 1 },
        { id: "p2", name: "Object-Oriented Programming (Classes, Inheritance, Decorators)", difficulty: 2 },
        { id: "p3", name: "Zoho Problem Solving (Arrays, String Manipulation & Matrices)", difficulty: 3 },
        { id: "p4", name: "Algorithms & Time Complexity (Recursion, Sorting, Searching)", difficulty: 4 },
        { id: "p5", name: "System Design & Coding Interview Live Practice", difficulty: 5 },
      ],
      firstQuestion: {
        questionType: "concept",
        prompt: "In Python, which of the following data structures is immutable and defined using parentheses?",
        options: ["List", "Tuple", "Dictionary", "Set"],
        correctIndex: 1,
        explanations: [
          "Lists are mutable and defined using square brackets [], not parentheses.",
          "✓ Tuples are defined using parentheses () and cannot be modified after creation (immutable).",
          "Dictionaries store key-value pairs using curly braces {}, not parentheses.",
          "Sets store unique unordered elements using curly braces {}, not parentheses."
        ],
        conceptSummary: "Tuples are immutable sequence types in Python defined with parentheses. Once instantiated, elements cannot be modified."
      },
    };
  } else if (lowerGoal.includes("dsa") || lowerGoal.includes("faang") || lowerGoal.includes("algorithm")) {
    return {
      title: "FAANG DSA Conquest & Algorithm Mastery",
      normalizedTopic: "Data Structures & Algorithms",
      isWebGrounded: true,
      skills: [
        { id: "d1", name: "Big-O Analysis & Array Manipulation", difficulty: 1 },
        { id: "d2", name: "Two Pointers & Sliding Window Technique", difficulty: 2 },
        { id: "d3", name: "Trees, Graphs & BFS/DFS Traversal", difficulty: 3 },
        { id: "d4", name: "Dynamic Programming & Pattern Recognition", difficulty: 4 },
        { id: "d5", name: "Mock FAANG Coding Interview Simulations", difficulty: 5 },
      ],
      firstQuestion: {
        questionType: "concept",
        prompt: "What is the worst-case time complexity of finding an element in a balanced Binary Search Tree (BST)?",
        options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
        correctIndex: 1,
        explanations: [
          "O(1) constant time is achieved by Hash Tables, not BST searches.",
          "✓ Balanced BSTs halve the search space at each level, taking O(log n) time.",
          "O(n) occurs only in unbalanced / degenerate BSTs (like linked lists), not balanced BSTs.",
          "O(n log n) is standard sorting algorithm complexity, not tree lookup complexity."
        ],
        conceptSummary: "Searching a balanced BST takes O(log n) time because each comparison eliminates half of the remaining subtree."
      },
    };
  }

  // Generic adaptive fallback
  return {
    title: `${goal.charAt(0).toUpperCase() + goal.slice(1)} Mastery Journey`,
    normalizedTopic: goal,
    isWebGrounded: false,
    skills: [
      { id: "s1", name: `Foundational Principles of ${goal}`, difficulty: 1 },
      { id: "s2", name: "Core Concepts & Practical Techniques", difficulty: 2 },
      { id: "s3", name: "Intermediate Problem Solving & Project Work", difficulty: 3 },
      { id: "s4", name: "Advanced Optimization & Best Practices", difficulty: 4 },
      { id: "s5", name: "Capstones & Real-World Interview Readiness", difficulty: 5 },
    ],
    firstQuestion: {
      questionType: "concept",
      prompt: `Which approach is most effective when initiating a deep dive into ${goal}?`,
      options: [
        "Mastering key fundamentals and hands-on application",
        "Skipping fundamentals to build complex apps directly",
        "Memorizing definitions without practical execution",
        "Focusing only on theoretical research",
      ],
      correctIndex: 0,
      explanations: [
        "✓ Building strong foundational knowledge combined with hands-on practice leads to sustainable skill acquisition.",
        "Skipping fundamentals creates knowledge gaps that make debugging complex applications difficult.",
        "Rote memorization without hands-on coding fails to build problem-solving capability.",
        "Pure theory without practical application fails to build muscle memory."
      ],
      conceptSummary: "Effective learning requires combining core theory with immediate hands-on practice."
    },
  };
}
