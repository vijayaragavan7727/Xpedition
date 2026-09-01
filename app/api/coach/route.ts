import { NextResponse } from 'next/server';
import { callAi } from '@/lib/ai';

export const runtime = 'nodejs';

const FALLBACK_COACH_RESPONSE = {
  advice: 'Notice the underlying reference mutation behavior. When evaluating expressions, track whether values are mutated in-place or return new instances.',
  offline: true,
  provider: 'fallback',
};

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { concept, prompt, chosen, correct, questId = 'q_generic', bypassCache = false } = body;

    const groqApiKey = process.env.GROQ_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!groqApiKey && !geminiApiKey) {
      return NextResponse.json(FALLBACK_COACH_RESPONSE);
    }

    const systemPrompt = `You are a concise, direct technical tutor speaking to a learner whom our telemetry system has detected is frustrated.
Provide at most 3 short sentences. Explain the single core idea they are missing plainly.
Strict constraints:
- Do NOT use lists, bullet points, or headings.
- Do NOT use filler encouragement or praise (never say "great question", "good try", "no worries").
- Do NOT apologize.
- End with exactly one concrete pattern or detail for them to notice next time.`;

    const userPrompt = `Concept: ${concept || 'Core Concept'}
Question Prompt: ${prompt || 'Code execution item'}
Learner Selected Answer: "${chosen || ''}"
Correct Answer: "${correct || ''}"

Provide targeted guidance now.`;

    // Cache keyed explicitly on (questId + chosen) so students making the exact same mistake share guidance
    const customCoachCacheKey = `coach:${questId}:${chosen || 'blank'}`;

    const aiResult = await callAi<string>({
      systemPrompt,
      userPrompt,
      json: false,
      temperature: 0.5,
      maxTokens: 220,
      bypassCache,
      cacheKey: customCoachCacheKey,
      route: '/api/coach',
    });

    if (aiResult.text) {
      return NextResponse.json({
        advice: aiResult.text,
        offline: false,
        provider: aiResult.provider,
        latencyMs: aiResult.latencyMs,
        cached: aiResult.cached,
      });
    }

    return NextResponse.json(FALLBACK_COACH_RESPONSE);
  } catch (e) {
    return NextResponse.json(FALLBACK_COACH_RESPONSE);
  }
}
