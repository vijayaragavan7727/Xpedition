import { NextRequest, NextResponse } from 'next/server';
import { generateBuildingPrompt, getBuildingSeed } from '@/lib/buildingImages';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const concept = searchParams.get('concept') || 'Core Foundations';
  const theme = searchParams.get('theme') || 'cosmos';
  const state = (searchParams.get('state') as any) || 'complete';

  try {
    const prompt = generateBuildingPrompt(concept, theme, state);
    const seed = getBuildingSeed(concept, theme);
    const cleanPrompt = prompt.replace(/\s+/g, ' ').trim();
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=256&height=256&nologo=true&seed=${seed}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const upstreamRes = await fetch(pollinationsUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'XPedition-World/1.0',
        'Accept': 'image/*',
      },
    });
    clearTimeout(timeout);

    if (!upstreamRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch from upstream' }, { status: 502 });
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
  } catch (error) {
    console.error('[API /api/worldimage] Error fetching image:', error);
    return NextResponse.json({ error: 'Image proxy generation failed' }, { status: 500 });
  }
}
