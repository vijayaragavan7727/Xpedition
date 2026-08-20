"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Editor from "@monaco-editor/react";
import { useQuest } from "@/lib/QuestContext";
import { CodingChallenge } from "@/lib/types";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import {
  Code,
  Play,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowLeft,
  Loader2,
  Terminal,
  Cpu,
  Bot,
  AlertTriangle,
  Trophy,
} from "lucide-react";

export default function CodingLabPage() {
  const params = useParams();
  const router = useRouter();
  const challengeId = (params?.challengeId as string) || "c1";
  const { user, isAuthLoading, course, pKnow, answerQuestion, claimReward } = useQuest();

  const [challenge, setChallenge] = useState<CodingChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<"python" | "java" | "cpp">("python");
  const [code, setCode] = useState<string>("");

  const [executing, setExecuting] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [allPassed, setAllPassed] = useState<boolean | null>(null);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  useEffect(() => {
    // Load challenge data (either sample or from sessionStorage / localStorage / API)
    const sampleChallenge: CodingChallenge = {
      id: challengeId,
      title: "Reverse String & Validate Syntax",
      problemStatement:
        "Write a program that takes a string input from standard input (stdin) and prints its reversed representation. Handles all printable ASCII characters gracefully.",
      inputFormat: "A single line string text from standard input.",
      outputFormat: "A single line containing the reversed string text.",
      examples: [
        {
          input: "hello",
          expectedOutput: "olleh",
          explanation: "Reversing the characters in 'hello' produces 'olleh'.",
        },
        {
          input: "XPedition 2026",
          expectedOutput: "6202 noitidepX",
          explanation: "Preserves spaces and capital digits in reverse.",
        },
      ],
      testCases: [
        { input: "hello", expectedOutput: "olleh", hidden: false },
        { input: "XPedition 2026", expectedOutput: "6202 noitidepX", hidden: false },
        { input: "python", expectedOutput: "nohtyp", hidden: true },
        { input: "racecar", expectedOutput: "racecar", hidden: true },
        { input: "a", expectedOutput: "a", hidden: true },
      ],
      starterCode: {
        python: `# Write your Python solution below\nimport sys\n\ndef solve():\n    data = sys.stdin.read().strip()\n    if data:\n        print(data[::-1])\n\nif __name__ == '__main__':\n    solve()`,
        java: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextLine()) {\n            String str = sc.nextLine();\n            System.out.println(new StringBuilder(str).reverse().toString());\n        }\n    }\n}`,
        cpp: `#include <iostream>\n#include <string>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    string s;\n    if (getline(cin, s)) {\n        reverse(s.begin(), s.end());\n        cout << s << endl;\n    }\n    return 0;\n}`,
      },
      difficulty: 2,
      xpReward: 150,
      conceptTested: "String Reversal & Input Streams",
    };

    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem(`xpedition_lab_${challengeId}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setChallenge(parsed);
          setCode(parsed.starterCode?.[language] || sampleChallenge.starterCode[language]);
          setLoading(false);
          return;
        } catch (e) {
          console.warn("Notice parsing lab challenge from session:", e);
        }
      }
    }

    setChallenge(sampleChallenge);
    setCode(sampleChallenge.starterCode[language]);
    setLoading(false);
  }, [challengeId, language]);

  const handleLanguageChange = (newLang: "python" | "java" | "cpp") => {
    setLanguage(newLang);
    if (challenge?.starterCode?.[newLang]) {
      setCode(challenge.starterCode[newLang]);
    }
  };

  const runCodeExecution = async (runOnlyVisible: boolean) => {
    if (!challenge) return;
    setExecuting(true);
    setErrorNotice(null);
    setResults(null);
    setAiFeedback(null);

    try {
      const res = await fetch("/api/execute-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          code,
          testCases: challenge.testCases,
          runOnlyVisible,
          userId: user?.id || "anon",
          problemTitle: challenge.title,
        }),
      });

      if (!res.ok) {
        setErrorNotice("Code runner unavailable, try again.");
        return;
      }

      const data = await res.json();
      if (data.error) {
        setErrorNotice(data.error);
        return;
      }

      setResults(data.results || []);
      setAllPassed(Boolean(data.allPassed));
      if (data.aiFeedback) {
        setAiFeedback(data.aiFeedback);
      }

      if (!runOnlyVisible && data.allPassed) {
        // Award XP and BKT update
        answerQuestion(true);
        claimReward({
          type: "+20 XP",
          xpBonus: 150,
          title: "Coding Lab Solved",
          description: "All test cases passed cleanly!",
        });
      }
    } catch (err) {
      console.error("Execute code submission error:", err);
      setErrorNotice("Code runner unavailable, try again.");
    } finally {
      setExecuting(false);
    }
  };

  if (isAuthLoading || loading) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00F0FF] animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#000000] text-white relative flex flex-col justify-between p-3 sm:p-6 overflow-x-hidden font-sans">
      <div className="w-full max-w-7xl mx-auto space-y-4">
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-3 bg-[#0D0D1A] border border-[#00F0FF]/30 p-4 rounded-2xl shadow-xl glow-cyan">
          <div className="flex items-center gap-3 truncate">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-[#00F0FF] text-slate-300 hover:text-white transition-all cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-[#00F0FF]/20 text-[#00F0FF] font-mono text-[10px] font-bold border border-[#00F0FF]/40">
                  CODING PRACTICE LAB
                </span>
                <span className="text-[#FFB800] font-mono text-xs font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> +150 XP
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-white font-heading truncate mt-0.5">
                {challenge?.title || "Coding Challenge"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400 hidden sm:inline">Language:</span>
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl bg-[#000000] border border-[#00F0FF]/40 text-[#00F0FF] font-mono text-xs font-bold focus:outline-none cursor-pointer"
            >
              <option value="python">Python 3</option>
              <option value="java">Java 15</option>
              <option value="cpp">C++ 17</option>
            </select>
          </div>
        </div>

        {/* 2-Panel Lab Screen (Left: Problem Specs | Right: Monaco Code Editor) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[68vh]">
          {/* LEFT PANEL (Problem Statement & Test Results) */}
          <div className="lg:col-span-5 bg-[#0D0D1A] border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4 overflow-y-auto max-h-[72vh] custom-scrollbar">
            {/* Problem Statement */}
            <section className="space-y-2">
              <h2 className="text-sm font-mono font-bold text-[#00F0FF] uppercase tracking-wider flex items-center gap-2">
                <Code className="w-4 h-4 text-[#00FF87]" />
                <span>Problem Description</span>
              </h2>
              <p className="text-xs text-slate-200 leading-relaxed font-sans">
                {challenge?.problemStatement}
              </p>
            </section>

            {/* Input & Output Format */}
            <div className="grid grid-cols-1 gap-2 text-xs font-mono">
              <div className="p-3 rounded-2xl bg-[#000000] border border-white/10 space-y-1">
                <span className="text-[#00FF87] font-bold block text-[10px]">INPUT FORMAT</span>
                <p className="text-slate-300">{challenge?.inputFormat}</p>
              </div>

              <div className="p-3 rounded-2xl bg-[#000000] border border-white/10 space-y-1">
                <span className="text-[#A855F7] font-bold block text-[10px]">OUTPUT FORMAT</span>
                <p className="text-slate-300">{challenge?.outputFormat}</p>
              </div>
            </div>

            {/* Visible Examples */}
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-slate-300 uppercase block">
                Sample Test Cases:
              </span>
              {challenge?.examples.map((ex, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-[#000000] border border-white/10 space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Example {idx + 1}</span>
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div>
                      <span className="text-slate-500">Input:</span>{" "}
                      <code className="text-[#00F0FF] font-bold">{ex.input}</code>
                    </div>
                    <div>
                      <span className="text-slate-500">Expected Output:</span>{" "}
                      <code className="text-[#00FF87] font-bold">{ex.expectedOutput}</code>
                    </div>
                    {ex.explanation && (
                      <p className="text-[10px] text-slate-400 font-sans italic pt-0.5">
                        {ex.explanation}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* TEST CASE RESULTS SECTION */}
            {results && results.length > 0 && (
              <div className="p-4 rounded-2xl bg-[#000000] border border-[#00F0FF]/40 space-y-3 shadow-xl animate-fadeIn">
                <div className="flex items-center justify-between text-xs font-mono font-bold">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-[#00F0FF]" />
                    <span className="text-white">Execution Results</span>
                  </div>
                  <span className={allPassed ? "text-[#00FF87]" : "text-[#FF0055]"}>
                    {allPassed ? "PASSED ALL CASES" : "SOME CASES FAILED"}
                  </span>
                </div>

                <div className="space-y-2 font-mono text-xs">
                  {results.map((res, rIdx) => (
                    <div
                      key={rIdx}
                      className={`p-3 rounded-xl border flex flex-col space-y-1.5 ${
                        res.passed
                          ? "bg-[#00FF87]/10 border-[#00FF87]/40 text-[#00FF87]"
                          : "bg-[#FF0055]/10 border-[#FF0055]/40 text-[#FF7185]"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="flex items-center gap-1.5">
                          {res.passed ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#00FF87]" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-[#FF0055]" />
                          )}
                          <span>
                            Case {rIdx + 1} {res.isHidden ? "(Hidden Case)" : "(Visible Case)"}
                          </span>
                        </span>
                        <span>{res.passed ? "✓ PASS" : "✗ FAIL"}</span>
                      </div>

                      {res.error && (
                        <p className="text-[10px] text-[#FF7185] font-mono bg-black/60 p-2 rounded-lg">
                          {res.error}
                        </p>
                      )}

                      {!res.isHidden && !res.passed && !res.error && (
                        <div className="text-[10px] space-y-0.5 font-mono text-slate-300 bg-black/50 p-2 rounded-lg">
                          <div>
                            <span className="text-slate-500">Input:</span> <code>{res.input}</code>
                          </div>
                          <div>
                            <span className="text-slate-500">Expected:</span>{" "}
                            <code className="text-[#00FF87]">{res.expectedOutput}</code>
                          </div>
                          <div>
                            <span className="text-slate-500">Actual:</span>{" "}
                            <code className="text-[#FF0055]">{res.actualOutput || "<empty>"}</code>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI CODE REVIEW (GROQ DIFFERENTIATOR) */}
            {aiFeedback && (
              <div className="p-4 rounded-2xl bg-[#000000] border border-[#A855F7]/50 space-y-2 shadow-xl animate-fadeIn">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#A855F7]">
                  <Bot className="w-4 h-4 text-[#00F0FF]" />
                  <span>AI CODE TUTOR REVIEW</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  {aiFeedback}
                </p>
              </div>
            )}
          </div>

          {/* RIGHT PANEL (MONACO CODE EDITOR & ACTION BAR) */}
          <div className="lg:col-span-7 bg-[#0D0D1A] border border-white/10 rounded-3xl p-4 shadow-2xl flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-white/10 pb-2.5">
              <span className="flex items-center gap-2 text-white font-bold">
                <Cpu className="w-4 h-4 text-[#00F0FF]" /> Code Editor ({language.toUpperCase()})
              </span>
              <span className="text-[10px] text-slate-400">Monaco Syntax Engine</span>
            </div>

            {/* MONACO EDITOR */}
            <div className="w-full flex-1 min-h-[380px] rounded-2xl overflow-hidden border border-white/10 bg-[#000000] p-1">
              <Editor
                height="400px"
                language={language === "cpp" ? "cpp" : language}
                theme="vs-dark"
                value={code}
                onChange={(value) => setCode(value || "")}
                options={{
                  fontSize: 13,
                  fontFamily: "Fira Code, monospace",
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  lineNumbers: "on",
                  roundedSelection: true,
                  automaticLayout: true,
                }}
              />
            </div>

            {/* ERROR NOTICE */}
            {errorNotice && (
              <div className="p-3 rounded-xl bg-[#FF0055]/10 border border-[#FF0055]/40 text-[#FF7185] text-xs font-mono flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorNotice}</span>
              </div>
            )}

            {/* ACTION BUTTONS: RUN CODE & SUBMIT SOLUTION */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                disabled={executing}
                onClick={() => runCodeExecution(true)}
                className="py-3.5 px-4 rounded-2xl bg-[#000000] border border-[#00F0FF]/40 text-[#00F0FF] hover:bg-[#00F0FF]/10 font-bold text-xs uppercase tracking-wider font-mono flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {executing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 text-[#00FF87]" />}
                <span>Run Code (Visible)</span>
              </button>

              <button
                type="button"
                disabled={executing}
                onClick={() => runCodeExecution(false)}
                className="py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#00FF87] via-[#00F0FF] to-[#A855F7] text-black font-black text-xs uppercase tracking-wider font-mono flex items-center justify-center gap-2 shadow-lg hover:brightness-110 transition-all cursor-pointer glow-cyan"
              >
                {executing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
                <span>Submit Solution</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
