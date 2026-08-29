import { NextRequest, NextResponse } from 'next/server';
import { generateBuildingPrompt, getBuildingSeed } from '@/lib/buildingImages';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawPrompt = searchParams.get('prompt');
  const concept = searchParams.get('concept') || 'Core Foundations';
  const theme = searchParams.get('theme') || 'cosmos';
  const state = (searchParams.get('state') as any) || 'complete';

  try {
    let finalPrompt = rawPrompt;
    let seed = 42;

    if (!finalPrompt) {
      finalPrompt = generateBuildingPrompt(concept, theme, state);
      seed = getBuildingSeed(concept, theme);
    }

    const cleanPrompt = finalPrompt.replace(/\s+/g, ' ').trim();
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=256&height=256&nologo=true&seed=${seed}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const upstreamRes = await fetch(pollinationsUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
    });
    clearTimeout(timeout);

    if (!upstreamRes.ok) {
      return NextResponse.json({ error: `Upstream error ${upstreamRes.status}` }, { status: upstreamRes.status });
    }

    const contentType = upstreamRes.headers.get('content-type') || 'image/jpeg';
    const buffer = await upstreamRes.arrayBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=604800, s-maxage=2592000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    console.error('[API /api/worldimage] Proxy fetch failed:', error?.message || error);
    return NextResponse.json({ error: 'Image proxy generation failed' }, { status: 500 });
  }
}
