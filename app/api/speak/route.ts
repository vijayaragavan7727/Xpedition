import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Server-side cache and telemetry tracking
const audioMemoryCache = new Map<string, { audioBase64: string; charLength: number }>();
let totalCharactersConsumed = 0;

function hashKey(text: string, language: string, speaker: string): string {
  return crypto
    .createHash('sha256')
    .update(`${text.trim()}:${language.toLowerCase().trim()}:${speaker.toLowerCase().trim()}`)
    .digest('hex');
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { text = '', language = 'english', speaker = 'ratan' } = body;

    const trimmedText = String(text).trim();
    if (!trimmedText) {
      return NextResponse.json({ error: true, message: 'Text required' }, { status: 400 });
    }

    const apiKey = process.env.SARVAM_API_KEY;
    if (!apiKey) {
      console.warn('[Sarvam TTS] SARVAM_API_KEY is not configured in .env.local.');
      return NextResponse.json({ error: true, fallbackBrowserTts: true }, { status: 503 });
    }

    // 1. Language mapping
    const normLang = String(language).toLowerCase().trim();
    let targetLanguageCode = 'en-IN';
    if (normLang === 'tamil') {
      targetLanguageCode = 'ta-IN';
    } else if (normLang === 'tanglish' || normLang === 'english') {
      targetLanguageCode = 'en-IN';
    }

    // 2. Cache Lookup (Text + Language + Speaker)
    const cacheHash = hashKey(trimmedText, targetLanguageCode, speaker);
    if (audioMemoryCache.has(cacheHash)) {
      const cached = audioMemoryCache.get(cacheHash)!;
      console.log(`[Sarvam TTS Cache Hit] Served from memory cache | Hash: ${cacheHash.substring(0, 8)}... | Chars: 0 (API skipped)`);
      return NextResponse.json({
        audioBase64: cached.audioBase64,
        cached: true,
        charLength: cached.charLength,
      });
    }

    // 3. Character Cap Guard (2,500 chars limit per call)
    let parts: string[] = [trimmedText];
    if (trimmedText.length > 2000) {
      const matchedSentences = trimmedText.match(/[^.!?]+[.!?]+/g);
      if (matchedSentences && matchedSentences.length > 0) {
        parts = matchedSentences;
      }
    }

    const base64Buffers: string[] = [];

    for (const part of parts) {
      const res = await fetch('https://api.sarvam.ai/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': apiKey,
        },
        body: JSON.stringify({
          text: part,
          target_language_code: targetLanguageCode,
          speaker,
          model: 'bulbul:v3',
        }),
      });

      if (!res.ok) {
        console.error(`[Sarvam TTS Error] HTTP ${res.status} ${res.statusText}`);
        return NextResponse.json({ error: true, fallbackBrowserTts: true }, { status: res.status });
      }

      const data = await res.json();
      if (data.audios && Array.isArray(data.audios) && data.audios[0]) {
        base64Buffers.push(data.audios[0]);
      } else {
        return NextResponse.json({ error: true, fallbackBrowserTts: true }, { status: 502 });
      }
    }

    // Combine base64 WAV parts if multiple
    let finalAudioBase64 = base64Buffers[0];
    if (base64Buffers.length > 1) {
      const buffers = base64Buffers.map((b64) => Buffer.from(b64, 'base64'));
      const combined = Buffer.concat(buffers);
      finalAudioBase64 = combined.toString('base64');
    }

    // Telemetry tracking
    const consumed = trimmedText.length;
    totalCharactersConsumed += consumed;
    console.log(`[Sarvam TTS Telemetry] Consumed: ${consumed} chars | Total Cumulative: ${totalCharactersConsumed} chars | Lang: ${targetLanguageCode}`);

    // Store in cache
    audioMemoryCache.set(cacheHash, {
      audioBase64: finalAudioBase64,
      charLength: consumed,
    });

    return NextResponse.json({
      audioBase64: finalAudioBase64,
      cached: false,
      charLength: consumed,
      totalCharactersConsumed,
    });
  } catch (err: any) {
    console.error('[Sarvam TTS Route Exception]:', err);
    return NextResponse.json({ error: true, fallbackBrowserTts: true }, { status: 500 });
  }
}
