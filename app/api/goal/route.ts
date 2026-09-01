import { NextResponse } from 'next/server';
import { callAi } from '@/lib/ai';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface RawConcept {
  id: string;
  name: string;
  summary?: string;
  difficulty?: number;
  prereqs?: string[];
}

interface RawQuest {
  id: string;
  conceptId: string;
  title?: string;
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation?: string;
  difficulty?: number;
  scaffold?: {
    prompt: string;
    options: string[];
    answerIndex: number;
  };
}

interface GroqResponsePayload {
  role: string;
  concepts: RawConcept[];
  quests: RawQuest[];
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { goal, bypassCache = false } = body;

    if (!goal || typeof goal !== 'string' || !goal.trim()) {
      return NextResponse.json({ error: 'Goal is required' }, { status: 400 });
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!groqApiKey && !geminiApiKey) {
      return NextResponse.json({ error: 'no_key' }, { status: 503 });
    }

    // Optional Tavily Grounding Search
    let groundingContext = '';
    const tavilyApiKey = process.env.TAVILY_API_KEY;
    if (tavilyApiKey) {
      try {
        const tavilyRes = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: tavilyApiKey,
            query: `${goal} — required skills, interview topics, core principles`,
            search_depth: 'basic',
            max_results: 5,
          }),
        });
        if (tavilyRes.ok) {
          const tavilyData = await tavilyRes.json();
          if (tavilyData.results && Array.isArray(tavilyData.results)) {
            groundingContext = tavilyData.results
              .map((r: { content?: string }) => r.content || '')
              .filter(Boolean)
              .join('\n\n')
              .slice(0, 2000);
          }
        }
      } catch (err) {
        console.warn('Tavily grounding search skipped or failed:', err);
      }
    }

    const systemPrompt = `You are an expert curriculum engine.
Return ONLY valid minified JSON without markdown code fences, prose, or commentary.
Required JSON Schema:
{
  "role": "curriculum",
  "concepts": [
    { "id": "c_1", "name": "string", "summary": "string", "difficulty": 0.0, "prereqs": [] }
  ],
  "quests": [
    {
      "id": "q1",
      "conceptId": "c_1",
      "title": "string",
      "prompt": "string",
      "options": ["opt1", "opt2", "opt3", "opt4"],
      "answerIndex": 0,
      "explanation": "One clear sentence explanation.",
      "difficulty": -1.8,
      "scaffold": {
        "prompt": "Easier 1-step prompt variant",
        "options": ["opt1", "opt2"],
        "answerIndex": 0
      }
    }
  ]
}

STRICT GENERATION RULES:
1. Generate 4 to 5 concepts and 12 to 16 quests total about the specific goal requested.
2. Every quest MUST have exactly 4 options and a valid 0-based answerIndex.
3. Quest difficulty MUST be spread evenly across -2.0 to +2.0 (e.g. -1.8, -1.2, -0.6, 0.0, +0.6, +1.2, +1.8). Do NOT cluster difficulties.
4. At least 4 quests MUST include a "scaffold" object containing an easier 1-step prompt variant with exactly 2 options.
5. Questions test deep conceptual understanding of the requested topic, NOT trivia or programming if the topic is non-technical.
6. Concept IDs MUST be formatted as c_1, c_2, etc., and quest IDs as q1, q2, ... q14.`;

    const userPrompt = `Learning Goal: "${goal}"
${groundingContext ? `Industry Grounding Context:\n${groundingContext}\n` : ''}
Generate the full concept graph and item bank now.`;

    // Unified Centralized AI Call via lib/ai.ts
    const aiResult = await callAi<GroqResponsePayload>({
      systemPrompt,
      userPrompt,
      json: true,
      temperature: 0.4,
      maxTokens: 6000,
      bypassCache,
      cacheKey: `goal:${goal.trim().toLowerCase()}`,
      route: '/api/goal',
    });

    const payload = aiResult.data;

    if (!payload || !Array.isArray(payload.concepts) || !Array.isArray(payload.quests)) {
      console.error('Goal generation payload invalid:', aiResult.error);
      return NextResponse.json({ error: 'Failed to generate goal graph', provider: aiResult.provider }, { status: 502 });
    }

    // Normalization Pipeline with Explicit Drop Logging
    const validConceptIds = new Set(payload.concepts.map((c, idx) => c.id || `c_${idx + 1}`));

    const normalizedConcepts = payload.concepts.map((c, idx) => ({
      id: c.id || `c_${idx + 1}`,
      name: (c.name || `Concept ${idx + 1}`).slice(0, 80),
      summary: (c.summary || '').slice(0, 200),
      difficulty: Math.max(-2, Math.min(2, Number(c.difficulty) || 0)),
      prereqs: Array.isArray(c.prereqs) ? c.prereqs : [],
    }));

    const normalizedQuests: RawQuest[] = [];

    payload.quests.forEach((q, idx) => {
      const qId = q.id || `q${idx + 1}`;
      if (!q.prompt || typeof q.prompt !== 'string') {
        console.warn(`[Goal Normalizer] Dropped quest ${qId}: Missing or invalid prompt.`);
        return;
      }
      if (!Array.isArray(q.options) || q.options.length < 2) {
        console.warn(`[Goal Normalizer] Dropped quest ${qId}: Fewer than 2 options provided.`);
        return;
      }

      const safeOptions = q.options.slice(0, 4).map((opt) => String(opt).slice(0, 250));
      // Pad to 4 options if fewer than 4 provided
      while (safeOptions.length < 4) {
        safeOptions.push(`Option ${safeOptions.length + 1}`);
      }

      const safeAnswerIdx = Math.max(0, Math.min(safeOptions.length - 1, Number(q.answerIndex) || 0));
      let safeConceptId = q.conceptId;
      if (!validConceptIds.has(safeConceptId)) {
        safeConceptId = normalizedConcepts[idx % normalizedConcepts.length].id;
      }

      const stepDiff = -2 + (idx / Math.max(1, payload.quests.length - 1)) * 4;
      const clampedDifficulty = Math.max(-2, Math.min(2, Number(q.difficulty) ?? stepDiff));

      let safeScaffold: RawQuest['scaffold'] = undefined;
      if (q.scaffold && typeof q.scaffold.prompt === 'string' && Array.isArray(q.scaffold.options)) {
        const scOpts = q.scaffold.options.slice(0, 2).map((opt) => String(opt).slice(0, 200));
        while (scOpts.length < 2) scOpts.push(`Scaffold Option ${scOpts.length + 1}`);
        safeScaffold = {
          prompt: q.scaffold.prompt.slice(0, 300),
          options: scOpts,
          answerIndex: Math.max(0, Math.min(scOpts.length - 1, Number(q.scaffold.answerIndex) || 0)),
        };
      }

      normalizedQuests.push({
        id: qId,
        conceptId: safeConceptId,
        title: (q.title || `Quest ${idx + 1}`).slice(0, 100),
        prompt: q.prompt.slice(0, 500),
        options: safeOptions,
        answerIndex: safeAnswerIdx,
        explanation: (q.explanation || 'Select the option that correctly satisfies the concept condition.').slice(0, 300),
        difficulty: Number(clampedDifficulty.toFixed(2)),
        scaffold: safeScaffold,
      });
    });

    console.log(`[Goal Normalizer] Successfully normalized ${normalizedQuests.length} of ${payload.quests.length} quests for goal "${goal}".`);

    if (normalizedQuests.length < 4) {
      return NextResponse.json({ error: 'Fewer than 4 usable quests generated' }, { status: 502 });
    }

    return NextResponse.json({
      role: payload.role || goal,
      concepts: normalizedConcepts,
      quests: normalizedQuests,
      provider: aiResult.provider,
      latencyMs: aiResult.latencyMs,
      cached: aiResult.cached,
    });
  } catch (err: any) {
    console.error('API Goal Endpoint Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
