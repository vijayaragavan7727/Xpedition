import crypto from 'crypto';

export interface AiCallOptions {
  systemPrompt: string;
  userPrompt: string;
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
  bypassCache?: boolean;
  cacheKey?: string;
  route?: string;
}

export interface AiCallResult<T = any> {
  data: T | null;
  text: string;
  provider: 'groq' | 'gemini' | 'cache' | 'fallback';
  latencyMs: number;
  cached: boolean;
  error?: string;
}

// In-memory cache for fast lookup across local requests
const memoryCache = new Map<string, { data: any; text: string; hitCount: number }>();

function generateHash(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function stripMarkdownFences(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned.trim();
}

export async function callAi<T = any>(options: AiCallOptions): Promise<AiCallResult<T>> {
  const startTime = Date.now();
  const {
    systemPrompt,
    userPrompt,
    json = false,
    temperature = 0.4,
    maxTokens = 4000,
    bypassCache = false,
    cacheKey,
    route = '/api/ai',
  } = options;

  const finalCacheKey = cacheKey || generateHash(`${route}:${json}:${systemPrompt}:${userPrompt}`);

  // 1. CHECK CACHE (Unless bypassed)
  if (!bypassCache) {
    const memHit = memoryCache.get(finalCacheKey);
    if (memHit) {
      memHit.hitCount++;
      const latencyMs = Date.now() - startTime;
      console.log(`[AI Layer] Served by CACHE (memory) in ${latencyMs}ms | Key: ${finalCacheKey.slice(0, 12)} | Hits: ${memHit.hitCount}`);
      return {
        data: memHit.data as T,
        text: memHit.text,
        provider: 'cache',
        latencyMs,
        cached: true,
      };
    }
  }

  const groqApiKey = process.env.GROQ_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  let rawResultText = '';
  let providerUsed: 'groq' | 'gemini' | 'fallback' = 'fallback';

  // 2. TRY GROQ PRIMARY (Primary: openai/gpt-oss-120b)
  if (groqApiKey) {
    const groqModels = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'groq/compound'];

    for (const model of groqModels) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout limit

      try {
        const bodyPayload: any = {
          model,
          temperature,
          max_tokens: maxTokens,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        };

        if (json) {
          bodyPayload.response_format = { type: 'json_object' };
        }

        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${groqApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bodyPayload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            rawResultText = content;
            providerUsed = 'groq';
            break;
          }
        } else {
          console.warn(`[AI Layer] Groq (${model}) status ${res.status}. Trying next model...`);
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        console.warn(`[AI Layer] Groq (${model}) failed/timed out:`, err?.message || err);
      }
    }
  }

  // 3. TRY GEMINI FALLBACK (Primary: gemini-3.6-flash)
  if (!rawResultText && geminiApiKey) {
    const geminiModels = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-flash-latest'];

    for (const model of geminiModels) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      try {
        const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;

        const geminiPayload: any = {
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
            },
          ],
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
          },
        };

        if (json) {
          geminiPayload.generationConfig.responseMimeType = 'application/json';
        }

        const res = await fetch(geminiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(geminiPayload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (content) {
            rawResultText = content;
            providerUsed = 'gemini';
            break;
          }
        } else {
          const errTxt = await res.text();
          console.warn(`[AI Layer] Gemini (${model}) status ${res.status}:`, errTxt.slice(0, 150));
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        console.warn(`[AI Layer] Gemini (${model}) fallback error:`, err?.message || err);
      }
    }
  }

  const latencyMs = Date.now() - startTime;

  // 4. PROCESS RESULT
  if (!rawResultText) {
    console.error(`[AI Layer] All AI providers failed in ${latencyMs}ms.`);
    return {
      data: null,
      text: '',
      provider: 'fallback',
      latencyMs,
      cached: false,
      error: 'ai_unavailable',
    };
  }

  let parsedData: T | null = null;
  const cleanedText = json ? stripMarkdownFences(rawResultText) : rawResultText.trim();

  if (json) {
    try {
      parsedData = JSON.parse(cleanedText);
    } catch (parseErr) {
      console.error('[AI Layer] JSON Parse Error:', parseErr, 'Raw:', cleanedText.slice(0, 200));
    }
  }

  // Store in memory cache for immediate repeat requests
  if (!bypassCache) {
    memoryCache.set(finalCacheKey, {
      data: parsedData,
      text: cleanedText,
      hitCount: 1,
    });
  }

  console.log(`[AI Layer] Served by ${providerUsed.toUpperCase()} in ${latencyMs}ms | Route: ${route}`);

  return {
    data: parsedData,
    text: cleanedText,
    provider: providerUsed,
    latencyMs,
    cached: false,
  };
}
