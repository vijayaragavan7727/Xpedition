/**
 * Robust AI JSON Parser & Subject Question Validator for XPedition
 */

export function cleanAndParseJSON<T = any>(rawStr: string): T | null {
  if (!rawStr || typeof rawStr !== "string") return null;

  try {
    // 1. Direct parse try
    return JSON.parse(rawStr);
  } catch (firstErr) {
    // Continue to cleaning pipeline
  }

  try {
    let cleaned = rawStr.trim();

    // 2. Strip markdown code fences (```json ... ``` or ``` ...)
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");

    // Find first '{' or '[' and last '}' or ']'
    const firstBrace = cleaned.search(/[\{\[]/);
    const lastBrace = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));

    if (firstBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    // 3. Strip trailing commas before closing braces/brackets
    cleaned = cleaned.replace(/,\s*([\}\]])/g, "$1");

    // 4. Sanitize invalid escape sequences (e.g. \d, \s, \w -> \\d, \\s, \\w)
    cleaned = cleaned.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");

    try {
      return JSON.parse(cleaned);
    } catch (e1) {
      // 5. Handle literal unescaped newlines/tabs inside quotes
      const sanitizeQuotes = cleaned.replace(/[\u0000-\u001F]+/g, (match) => {
        if (match === "\n") return "\\n";
        if (match === "\r") return "\\r";
        if (match === "\t") return "\\t";
        return "";
      });
      return JSON.parse(sanitizeQuotes);
    }
  } catch (err) {
    console.warn("[AI JSON PARSE ERROR] Failed cleaning & parsing JSON string:", err, "Raw length:", rawStr.length);
    return null;
  }
}

export function isProgrammingSubject(skillName: string, goal: string = ""): boolean {
  const text = `${skillName} ${goal}`.toLowerCase();
  const programmingKeywords = [
    "python", "sql", "javascript", "typescript", "java", "c++", "cpp", "c#",
    "html", "css", "react", "next.js", "node", "express", "data structure",
    "algorithm", "code", "coding", "programming", "database", "web dev",
    "backend", "frontend", "compiler", "git", "linux command"
  ];
  return programmingKeywords.some((kw) => text.includes(kw));
}

const TEMPLATE_FORBIDDEN_PATTERNS = [
  /Based on Section \d+/i,
  /\(Level \d+ - Q\d+\)/i,
  /what is the key rule or syntax requirement for this concept/i,
  /Option A: Primary rule taught in Section/i,
  /Option B: Incorrect syntax variation/i,
  /Option C: Invalid runtime assumption/i,
  /Option D: Deprecated legacy pattern/i,
  /Primary rule taught in Section \d+/i,
  /Incorrect syntax variation/i,
  /Invalid runtime assumption/i,
  /Deprecated legacy pattern/i,
  /what is the key rule or syntax requirement/i,
  /Option A:/i,
  /Option B:/i,
  /Option C:/i,
  /Option D:/i,
];

const NON_PROGRAMMING_FORBIDDEN_WORDS = [
  "syntax", "compiler", "code snippet", "runtime error", "variable declaration",
  "data type", "function header", "null pointer", "indentation error"
];

export function validateQuestion(q: any, skillName: string = "", goal: string = ""): { isValid: boolean; reason?: string } {
  if (!q || typeof q !== "object") {
    return { isValid: false, reason: "Question object is null or invalid" };
  }

  const prompt = typeof q.prompt === "string" ? q.prompt.trim() : "";
  const options = Array.isArray(q.options) ? q.options : [];

  if (!prompt || prompt.length < 10) {
    return { isValid: false, reason: "Prompt is missing or too short" };
  }

  if (options.length < 4) {
    return { isValid: false, reason: "Question must have at least 4 options" };
  }

  // 1. Check for template placeholder strings
  for (const pattern of TEMPLATE_FORBIDDEN_PATTERNS) {
    if (pattern.test(prompt)) {
      return { isValid: false, reason: `Prompt matched forbidden template pattern: ${pattern}` };
    }
    for (const opt of options) {
      if (typeof opt === "string" && pattern.test(opt)) {
        return { isValid: false, reason: `Option matched forbidden template pattern: ${pattern}` };
      }
    }
  }

  // 2. Check for non-programming subject domain leaks
  const isProg = isProgrammingSubject(skillName, goal);
  if (!isProg) {
    const promptLower = prompt.toLowerCase();
    for (const word of NON_PROGRAMMING_FORBIDDEN_WORDS) {
      if (promptLower.includes(word)) {
        return { isValid: false, reason: `Non-programming subject contains programming word: "${word}"` };
      }
      for (const opt of options) {
        if (typeof opt === "string" && opt.toLowerCase().includes(word)) {
          return { isValid: false, reason: `Non-programming option contains programming word: "${word}"` };
        }
      }
    }
  }

  return { isValid: true };
}
