import { NextResponse } from 'next/server';
import { callAi } from '@/lib/ai';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface PlanTopic {
  id: string;
  title: string;
  hours: number;
  why: string;
}

interface PlanMilestone {
  afterTopic: string;
  checkpoint: string;
}

interface StudyPlanResponse {
  totalHours: number;
  weeks: number;
  topics: PlanTopic[];
  milestones: PlanMilestone[];
  guidance?: string;
  provider?: string;
  latencyMs?: number;
  cached?: boolean;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      pathType = 'goal',
      topic = 'Python Programming',
      language = 'english',
      dailyMinutes = 60,
      startingLevel = 'Complete beginner',
      whyGoal = 'curiosity',
      deadlineDate = '',
      testDate = '',
      syllabusText = '',
      bypassCache = false,
    } = body;

    const groqApiKey = process.env.GROQ_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const mins = Math.max(5, Number(dailyMinutes) || 15);
    const dailyHours = mins / 60;
    const weeklyHours = dailyHours * 7;
    const normWhy = String(whyGoal).toLowerCase();
    const isSpecificQuestion = normWhy.includes('specific') || normWhy.includes('single') || normWhy.includes('quick');

    // Fallback Plan Generator
    const createFallbackPlan = (estHours: number): StudyPlanResponse => {
      const totalMins = Math.round(estHours * 60);
      const totalSessions = Math.max(1, Math.ceil(totalMins / mins));
      const estWeeks = Math.max(1, Math.ceil(estHours / weeklyHours));

      const formattedTimeStr = estHours < 2 ? `${totalMins} minutes` : `${estHours} hours`;

      return {
        totalHours: estHours,
        weeks: estWeeks,
        topics: [
          { id: 't1', title: `${topic} — Core Overview`, hours: Number((estHours * 0.5).toFixed(1)), why: 'Key concepts breakdown.' },
          { id: 't2', title: `${topic} — Key Application`, hours: Number((estHours * 0.5).toFixed(1)), why: 'Practical execution and validation.' },
        ],
        milestones: [{ afterTopic: 't2', checkpoint: 'Completion verification' }],
        guidance: `About ${formattedTimeStr} — roughly ${totalSessions} sessions at ${mins} minutes a day.`,
      };
    };

    if (!groqApiKey && !geminiApiKey) {
      const defaultHours = isSpecificQuestion ? 0.75 : normWhy.includes('job') ? 25 : 2;
      return NextResponse.json(createFallbackPlan(defaultHours));
    }

    const systemPrompt = `You are an expert, subject-driven study planner.
Estimate the total hours this SPECIFIC subject genuinely takes at this depth.
A broad subject learned for a job (e.g. "Python for a job at Zoho") takes weeks (e.g. 20-50 hours).
A narrow question (e.g. "how to write a follow-up email") learned for a job takes under 2 hours (e.g. 1 hour).
A narrow question asked out of curiosity (e.g. "Just curious about something specific" or "what is entropy") takes 15 to 45 minutes total (0.25 to 0.75 hours).
Do not pad. Do not round up to make the plan look substantial.

Return ONLY valid minified JSON without markdown code fences, prose, or commentary.
Required JSON Schema:
{
  "totalHours": 1.5,
  "weeks": 1,
  "topics": [
    { "id": "t1", "title": "Topic Title", "hours": 0.75, "why": "One sentence rationale." }
  ],
  "milestones": [
    { "afterTopic": "t1", "checkpoint": "One sentence milestone checkpoint description." }
  ],
  "guidance": "About X hours/minutes — roughly Y sessions at Z minutes a day."
}`;

    const userPrompt = `Subject / Goal Text: "${topic}"
Motivation / Intent: "${whyGoal}"
Daily Time Allotted: ${mins} minutes/day
Starting Level: ${startingLevel}
Target Deadline: ${deadlineDate || 'None'}
Syllabus / Context: ${syllabusText || 'None'}

Estimate realistic hours for THIS specific subject and generate JSON plan now.`;

    const cacheKey = `plan:${topic.toLowerCase().trim()}:${whyGoal}:${mins}`;

    const aiResult = await callAi<any>({
      systemPrompt,
      userPrompt,
      json: true,
      temperature: 0.2,
      maxTokens: 3000,
      bypassCache,
      cacheKey,
      route: '/api/plan',
    });

    const parsed = aiResult.data;

    if (parsed && Array.isArray(parsed.topics) && parsed.topics.length > 0) {
      let rawHours = Number(parsed.totalHours) || parsed.topics.reduce((acc: number, t: PlanTopic) => acc + (Number(t.hours) || 0.5), 0);

      // SANITY CHECK & ADJUSTMENTS
      const isNarrowSubject = topic.length < 35 && (topic.toLowerCase().includes('email') || topic.toLowerCase().includes('what is') || topic.toLowerCase().includes('how to'));

      if ((normWhy.includes('curiosity') || isSpecificQuestion) && rawHours > 5) {
        rawHours = isSpecificQuestion ? 0.75 : 2; // Clamp absurd curiosity estimates >5h down
      } else if (normWhy.includes('job') && !isNarrowSubject && rawHours < 2) {
        rawHours = 20; // Scale broad job goal up
      } else if (normWhy.includes('job') && isNarrowSubject && rawHours > 3) {
        rawHours = 1.5; // Scale narrow job email question down under 2h
      }

      const totalMins = Math.round(rawHours * 60);
      const totalSessions = Math.max(1, Math.ceil(totalMins / mins));
      const calcWeeks = Math.max(1, Math.ceil(rawHours / weeklyHours));
      const timeDisplayStr = rawHours < 2 ? `${totalMins} minutes` : `${rawHours} hours`;

      return NextResponse.json({
        totalHours: Number(rawHours.toFixed(1)),
        weeks: calcWeeks,
        topics: parsed.topics,
        milestones: Array.isArray(parsed.milestones) ? parsed.milestones : [],
        guidance: `About ${timeDisplayStr} — roughly ${totalSessions} sessions at ${mins} minutes a day.`,
        provider: aiResult.provider,
        latencyMs: aiResult.latencyMs,
        cached: aiResult.cached,
      });
    }

    const defaultHours = isSpecificQuestion ? 0.75 : normWhy.includes('job') ? 25 : 2;
    return NextResponse.json(createFallbackPlan(defaultHours));
  } catch (e) {
    console.error('Plan API Error:', e);
    return NextResponse.json({
      totalHours: 1,
      weeks: 1,
      topics: [
        { id: 't1', title: 'Subject Core Overview', hours: 0.5, why: 'High-level breakdown' },
        { id: 't2', title: 'Practical Application', hours: 0.5, why: 'Practical breakdown' },
      ],
      milestones: [{ afterTopic: 't2', checkpoint: 'Completion verification' }],
      guidance: 'About 60 minutes — roughly 4 sessions at 15 minutes a day.',
    });
  }
}
