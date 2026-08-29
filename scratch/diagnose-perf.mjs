import fs from 'fs';
import path from 'path';

// Parse .env.local manually
try {
  const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf-8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const k = trimmed.substring(0, idx).trim();
        const v = trimmed.substring(idx + 1).trim();
        process.env[k] = v;
      }
    }
  });
} catch (e) {}

async function runDiagnosis() {
  console.log('=== 1. DIAGNOSING TUTOR PERFORMANCE ===\n');

  const groqApiKey = process.env.GROQ_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const sarvamApiKey = process.env.SARVAM_API_KEY;

  console.log(`GROQ_API_KEY: ${groqApiKey ? 'configured' : 'missing'}`);
  console.log(`GEMINI_API_KEY: ${geminiApiKey ? 'configured' : 'missing'}`);
  console.log(`SARVAM_API_KEY: ${sarvamApiKey ? 'configured' : 'missing'}\n`);

  // Test 1: Groq Direct Lesson Generation Latency
  if (groqApiKey) {
    console.time('lesson-fetch');
    const start = Date.now();
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'Return minified JSON: { "chunks": [{ "say": "Hello world" }], "checkpoint": { "ask": "Q", "options": ["A","B"], "answerIndex": 0, "why": "W" } }'
            },
            {
              role: 'user',
              content: 'Concept Name: "Photosynthesis"'
            }
          ],
          response_format: { type: 'json_object' },
          max_tokens: 600,
        }),
      });
      const data = await res.json();
      const elapsed = Date.now() - start;
      console.timeEnd('lesson-fetch');
      console.log(`Groq Lesson Generation Latency: ${elapsed}ms`);
      console.log('Sample Payload:', data?.choices?.[0]?.message?.content?.slice(0, 100) + '...\n');
    } catch (e) {
      console.error('Groq test error:', e.message);
    }
  }

  // Test 2: Sarvam TTS Latency for First Chunk
  if (sarvamApiKey) {
    console.time('tts-fetch');
    const start = Date.now();
    try {
      const res = await fetch('https://api.sarvam.ai/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': sarvamApiKey,
        },
        body: JSON.stringify({
          text: 'Welcome to your lesson. Today we will explore photosynthesis and plant energy conversion.',
          target_language_code: 'en-IN',
          speaker: 'ratan',
          model: 'bulbul:v3',
        }),
      });
      const elapsed = Date.now() - start;
      console.timeEnd('tts-fetch');
      const data = await res.json();
      console.log(`Sarvam TTS Latency: ${elapsed}ms | Audio bytes: ${data?.audios?.[0]?.length || 0}`);
    } catch (e) {
      console.error('Sarvam TTS test error:', e.message);
    }
  }
}

runDiagnosis();
