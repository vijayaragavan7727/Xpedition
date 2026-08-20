import { NextResponse } from "next/server";

interface TestCase {
  input: string;
  expectedOutput: string;
  hidden?: boolean;
}

const PISTON_LANG_MAP: Record<string, { language: string; version: string }> = {
  python: { language: "python", version: "3.10.0" },
  java: { language: "java", version: "15.0.2" },
  cpp: { language: "cpp", version: "10.2.0" },
  c: { language: "c", version: "10.2.0" },
  javascript: { language: "javascript", version: "18.15.0" },
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      language = "python",
      code = "",
      testCases = [],
      runOnlyVisible = false,
      userId = "anon",
      problemTitle = "Coding Challenge",
    } = body;

    if (!code || code.trim() === "") {
      return NextResponse.json(
        { error: "Code submission cannot be empty." },
        { status: 400 }
      );
    }

    const pistonTarget = PISTON_LANG_MAP[language.toLowerCase()] || PISTON_LANG_MAP.python;
    const casesToRun: TestCase[] = runOnlyVisible
      ? testCases.filter((tc: TestCase) => !tc.hidden)
      : testCases;

    const evaluatedResults = [];
    let allPassed = true;

    for (const tc of casesToRun) {
      try {
        const pistonRes = await fetch("https://emkc.org/api/v2/piston/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            language: pistonTarget.language,
            version: pistonTarget.version,
            files: [
              {
                name: language === "java" ? "Main.java" : "solution",
                content: code,
              },
            ],
            stdin: tc.input || "",
            run_timeout: 3000,
          }),
        });

        if (!pistonRes.ok) {
          return NextResponse.json({
            error: "Code runner unavailable, try again.",
            pistonDown: true,
          });
        }

        const pistonData = await pistonRes.json();
        const runInfo = pistonData.run || {};
        const rawOutput = (runInfo.stdout || "").trim();
        const rawError = (runInfo.stderr || "").trim();

        if (runInfo.code !== 0 || rawError.length > 0) {
          allPassed = false;
          // Plain language compilation/runtime error formatting
          const cleanError = formatErrorPlainLanguage(rawError, language);
          evaluatedResults.push({
            passed: false,
            error: cleanError,
            input: tc.hidden ? undefined : tc.input,
            expectedOutput: tc.hidden ? undefined : tc.expectedOutput,
            actualOutput: tc.hidden ? undefined : rawOutput,
            isHidden: Boolean(tc.hidden),
          });
          continue;
        }

        const expectedClean = (tc.expectedOutput || "").trim();
        const passed = rawOutput === expectedClean;
        if (!passed) allPassed = false;

        evaluatedResults.push({
          passed,
          input: tc.hidden ? undefined : tc.input,
          expectedOutput: tc.hidden ? undefined : expectedClean,
          actualOutput: tc.hidden ? undefined : rawOutput,
          isHidden: Boolean(tc.hidden),
        });
      } catch (err) {
        console.warn("Piston test case execution error:", err);
        allPassed = false;
        evaluatedResults.push({
          passed: false,
          error: "Execution timeout or sandbox notice.",
          isHidden: Boolean(tc.hidden),
        });
      }
    }

    // AI Code Feedback via Groq
    let aiFeedback = "";
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey && groqKey.trim() !== "") {
      try {
        const feedbackPrompt = `You are XPedition's Master Code Reviewer.
Analyze this learner code submission for challenge "${problemTitle}":

LANGUAGE: ${language}
CODE SUBMITTED:
\`\`\`${language}
${code}
\`\`\`

TEST RESULTS: ${allPassed ? "ALL TEST CASES PASSED" : "FAILED SOME TEST CASES"}

INSTRUCTIONS:
1. Provide a concise, encouraging 2-3 SENTENCE code review.
2. If FAILED: Explain the conceptual mistake or missing edge case. Do NOT write out the full corrected code.
3. If PASSED: Provide 1 concrete tip for improvement (readability, efficiency, clean syntax).
4. Keep under 50 words.`;

        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: feedbackPrompt }],
            temperature: 0.5,
            max_tokens: 120,
          }),
        });

        if (groqRes.ok) {
          const gData = await groqRes.json();
          aiFeedback = gData.choices?.[0]?.message?.content || "";
        }
      } catch (e) {
        console.warn("Notice fetching AI code feedback:", e);
      }
    }

    if (!aiFeedback) {
      aiFeedback = allPassed
        ? "Excellent solution! Your logic handled all test cases efficiently. Consider adding clean comments for maintainability."
        : "Some test cases failed. Carefully verify how edge inputs are handled or double-check print statement output formatting.";
    }

    return NextResponse.json({
      allPassed,
      results: evaluatedResults,
      aiFeedback,
    });
  } catch (error) {
    console.error("Execute Code API Error:", error);
    return NextResponse.json(
      { error: "Code runner unavailable, try again." },
      { status: 500 }
    );
  }
}

function formatErrorPlainLanguage(rawError: string, language: string): string {
  if (rawError.includes("SyntaxError")) {
    return "Syntax Error: Check for missing colons, parentheses, or unclosed quotation marks.";
  }
  if (rawError.includes("IndentationError")) {
    return "Indentation Error: Ensure consistent tab/space formatting across statements.";
  }
  if (rawError.includes("NameError")) {
    return "Name Error: You referenced a variable or function that was not defined.";
  }
  if (rawError.includes("TypeError")) {
    return "Type Error: An operation was attempted on incompatible data types.";
  }
  if (rawError.includes("IndexError") || rawError.includes("ArrayIndexOutOfBoundsException")) {
    return "Index Error: You attempted to access an element outside the array/list bounds.";
  }
  if (rawError.includes("ZeroDivisionError")) {
    return "Math Error: Attempted division by zero.";
  }
  return rawError.split("\n")[0] || "Runtime Exception encountered.";
}
