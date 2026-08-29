import { NextResponse } from 'next/server';
import { callAi } from '@/lib/ai';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { message = '', context = {} } = body;

    const trimmedMessage = String(message).trim();
    if (!trimmedMessage) {
      return NextResponse.json({ reply: "I'm here! What would you like to explore today?" });
    }

    const {
      scope = 'home',
      concept = 'Core Topic',
      chunk = '',
      theta = -0.4,
      language = 'english',
      name = 'Learner',
      goal = 'Skill Goal',
      concepts = [],
      fadingConcepts = [],
    } = context;

    let systemPrompt = '';

    if (scope === 'tutor') {
      systemPrompt = `You are XYRA, the classroom AI teacher in XPedition.
Current Concept: ${concept}
Current Lesson Chunk: "${chunk || 'Core Concept introduction'}"
Learner Ability Level (theta): ${theta}
Learner Name: ${name}
Preferred Language: ${language}

Rules:
1. Answer ONLY about "${concept}" or directly related technical principles.
2. Keep answers concise, plain, and strictly under 80 words.
3. End with one engaging follow-up question to check their understanding.
4. Never reveal direct quiz answers — provide helpful scaffolding hints.
5. If the user asks something completely unrelated (e.g. general chit-chat, unrelated trivia): refuse kindly and redirect them back to ${concept} in ${language}.
6. Speak in a friendly, supportive teacher tone.`;
    } else {
      systemPrompt = `You are XYRA, personal AI learning guide in XPedition.
Learner Name: ${name}
Active Learning Goal: ${goal}
Skill Graph Concepts & Mastery: ${JSON.stringify(concepts)}
Fading Concepts (Retention Risk): ${JSON.stringify(fadingConcepts)}
Preferred Language: ${language}

Rules:
1. Answer questions about what to study today, which concept is weakest, overall progress, or explain any concept from their skill graph.
2. Keep answers helpful, encouraging, and strictly under 80 words.
3. If the user asks something completely unrelated to their study plan or skills: refuse politely in ${language} and suggest a quick learning activity instead.
4. Maintain a warm, encouraging teacher voice.`;
    }

    const userPrompt = `Learner asks: "${trimmedMessage}"`;
    const cacheKey = `xyra_chat:${scope}:${concept}:${trimmedMessage.toLowerCase()}`;

    const aiResult = await callAi<string>({
      systemPrompt,
      userPrompt,
      json: false,
      temperature: 0.5,
      maxTokens: 200,
      cacheKey,
      route: '/api/chat',
    });

    if (aiResult.text) {
      return NextResponse.json({ reply: aiResult.text.trim() });
    }

    const fallback = scope === 'tutor'
      ? `Focus on the core mechanism of ${concept}. What happens when you apply this rule in practice?`
      : `Keep up your momentum on ${goal}! Would you like to practice your next concept today?`;

    return NextResponse.json({ reply: fallback });
  } catch (err: any) {
    console.error('XYRA Chat API Error:', err);
    return NextResponse.json({
      reply: "I'm having a brief connection pause. Let's keep exploring our learning path!",
    });
  }
}
