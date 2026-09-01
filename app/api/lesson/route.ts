import { NextResponse } from 'next/server';
import { callAi } from '@/lib/ai';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface LessonChunk {
  say: string;
  code?: string;
}

interface LessonCheckpoint {
  ask: string;
  options: string[];
  answerIndex: number;
  why: string;
}

interface LessonResponse {
  chunks?: LessonChunk[];
  checkpoint?: LessonCheckpoint;
  error?: boolean;
  message?: string;
  provider?: string;
  latencyMs?: number;
  cached?: boolean;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      conceptId = 'c_1',
      conceptName = 'Photosynthesis',
      conceptSummary = '',
      language = 'english',
      startingLevel = 'Complete beginner',
      masteryPercentage = 0,
      isQuickLearn = false,
      bypassCache = false,
    } = body;

    const groqApiKey = process.env.GROQ_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const masteryNum = Number(masteryPercentage) || 0;

    // Cache bucketing
    let masteryBand = isQuickLearn ? 'quick' : 'new';
    if (!isQuickLearn) {
      if (masteryNum > 60) masteryBand = 'revision';
      else if (masteryNum > 0) masteryBand = 'partial';
    }

    let levelBand = 'beginner';
    const normLevel = String(startingLevel).toLowerCase();
    if (normLevel.includes('deeper') || normLevel.includes('advanced')) levelBand = 'advanced';
    else if (normLevel.includes('basic') || normLevel.includes('intermediate')) levelBand = 'intermediate';

    // Strict No-Template Policy: Never fabricate fake lessons.
    if (!groqApiKey && !geminiApiKey) {
      return NextResponse.json({
        error: true,
        message: 'No AI API keys configured (GROQ_API_KEY / GEMINI_API_KEY).',
      }, { status: 503 });
    }

    const isRevision = masteryBand === 'revision';
    const chunkCountRule = isQuickLearn
      ? 'Generate EXACTLY 2 to 3 concise, fast-paced chunks for a quick 2-minute answer.'
      : isRevision
        ? 'Generate EXACTLY 2 concise revision chunks (this is a review for a learner with >60% mastery).'
        : 'Generate 3 to 5 chunks.';

    let languageRule = 'CRITICAL LANGUAGE DIRECTIVE: Write strictly in clear, conversational English.';
    if (language === 'tanglish') {
      languageRule = `CRITICAL LANGUAGE DIRECTIVE: Write EVERY SINGLE CHUNK AND CHECKPOINT strictly in TANGLISH — Tamil language written in Latin script, with all technical terms left in English. Example: "Indha concept-la main problem enna-na, 19th century-la European powers Africa-va split panna fight pannanga." Do NOT write pure English. Do NOT use Tamil script (தமிழ்). Write Tamil in Latin script only.`;
    } else if (language === 'tamil') {
      languageRule = `CRITICAL LANGUAGE DIRECTIVE: Write EVERY SINGLE CHUNK AND CHECKPOINT strictly in TAMIL SCRIPT (தமிழ்), keeping technical terms in English. Do NOT write in English.`;
    }

    console.log('[Language Diagnostic 3] Provider System Prompt Language Directive:', languageRule);

    const systemPrompt = `${languageRule}

You are a world-class, engaging technical and academic tutor.
Return ONLY valid minified JSON without markdown code fences, prose, or commentary.
Required JSON Schema:
{
  "chunks": [
    {
      "say": "40-70 words conversational chunk text containing REAL subject facts and mechanics",
      "code": "optional code snippet string or omit",
      "visual": { "type": "cycle", "steps": ["Step 1", "Step 2", "Step 3"] }
    }
  ],
  "checkpoint": {
    "ask": "Simple 1-sentence attention check question",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answerIndex": 0,
    "why": "Two sentence explanation of why this answer is correct."
  }
}

VISUAL FIELD SPECIFICATION:
For each chunk, if the concept has a visual component (a diagram, a cycle, a structure, a comparison), add a 'visual' field with one of these types:
- { "type": "cycle", "steps": ["Step 1", "Step 2", "Step 3"] }
- { "type": "comparison", "left": "Left Title", "right": "Right Title", "points": ["Point A vs B"] }
- { "type": "list", "items": ["Item 1", "Item 2"] }
- { "type": "none" }
Keep it simple — max 4 items. Only add when genuinely useful.

STRICT TEACHING & STRUCTURE RULES:
1. ${chunkCountRule} Each chunk MUST be 40 to 70 words long (the length someone speaks in 20 seconds).
2. CHUNK 1 MUST OPEN WITH THE REAL-WORLD PROBLEM OR HISTORICAL CONTEXT OF THE SUBJECT. Never start with a definition like "X is a...". Open directly with the real subject context (e.g. for history, specific dates/nations; for science, natural phenomena; for code, architectural bottlenecks).
3. NO generic filler phrases like "In this lesson we will", "Let's dive in", or programming jargon for non-code subjects.
4. One concrete example: If programming/code topic, put the snippet string in the "code" field. If history or science, describe the specific historical event or natural mechanism in natural sentences in "say".
5. Explicitly name the single most common misunderstanding in one of the middle chunks.
6. The checkpoint question tests basic attention/comprehension of the chunks. Provide 4 clear options and a valid 0-based answerIndex.
7. Adapt to starting level "${startingLevel}":
   - "Complete beginner": Simpler example, extra scaffolding.
   - "Know it, going deeper": Skip basics, jump directly to subtleties and historical/technical edge cases.
8. PERSONALITY REMARK: Once per lesson (not every chunk), add one short remark that fits the moment naturally:
   — after a tricky concept: acknowledge it is hard ("Idhu konjam kastam-a irukkum, adhu normal.")
   — after a correct checkpoint: a genuine reaction ("Correct! Neenga nenaichadha vida faster-a pidicheenga.")
   — when naming a common misunderstanding: light solidarity ("Ellaarum mudhal-la indha thappaiye panraanga, neenga matum illa.")

   One remark only. It must sound like a person, not a script. Never forced, never every chunk.`;

    const userPrompt = `Concept Name: "${conceptName}"
Concept Summary: "${conceptSummary}"
Learner Language: ${language}
Starting Level: ${startingLevel}
Current Mastery: ${masteryPercentage}% (${masteryBand} band)

Generate the complete authentic lesson now.`;

    const cacheKey = `lesson:${conceptName.toLowerCase().trim()}:${language}:${levelBand}:${masteryBand}`;

    const aiResult = await callAi<any>({
      systemPrompt,
      userPrompt,
      json: true,
      temperature: 0.3,
      maxTokens: 3500,
      bypassCache,
      cacheKey,
      route: '/api/lesson',
    });

    const parsed = aiResult.data;

    if (parsed && Array.isArray(parsed.chunks) && parsed.chunks.length >= 2 && parsed.checkpoint) {
      return NextResponse.json({
        chunks: parsed.chunks,
        checkpoint: {
          ask: parsed.checkpoint.ask || `What is the key takeaway of ${conceptName}?`,
          options: Array.isArray(parsed.checkpoint.options) && parsed.checkpoint.options.length >= 2
            ? parsed.checkpoint.options.slice(0, 4)
            : ['Option A', 'Option B', 'Option C', 'Option D'],
          answerIndex: Number(parsed.checkpoint.answerIndex) || 0,
          why: parsed.checkpoint.why || `This checks fundamental understanding of ${conceptName}.`,
        },
        provider: aiResult.provider,
        latencyMs: aiResult.latencyMs,
        cached: aiResult.cached,
      });
    }

    // Explicit notice on AI generation failure — NEVER serve hardcoded template
    return NextResponse.json({
      error: true,
      message: 'AI provider returned invalid lesson format.',
    }, { status: 502 });
  } catch (e) {
    console.error('Lesson API Error:', e);
    return NextResponse.json({
      error: true,
      message: 'Lesson API unexpected error.',
    }, { status: 500 });
  }
}
