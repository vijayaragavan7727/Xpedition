import { supabase, isSupabaseConfigured } from './supabase';

export type BuildingState = 'empty' | 'partial' | 'complete';

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getBuildingSeed(conceptName: string, theme: string): number {
  return Math.abs(hashCode(conceptName + theme)) % 9999;
}

export function generateBuildingPrompt(conceptName: string, theme: string, state: BuildingState): string {
  if (state === 'empty') {
    return `glowing plot marker, empty land, small flag, ${theme} style ground tile, awaiting construction, game asset style, 512x512, no text`;
  }

  const basePrompts: Record<string, string> = {
    cosmos: `stunning 3D isometric space station tower, ${conceptName} themed building, glowing cyan energy cores, dark purple nebula background, metallic silver panels, pulsing blue lights, cinematic volumetric lighting, game art style, hyperdetailed, 512x512, no text`,
    cyber_city: `stunning 3D isometric cyberpunk skyscraper, ${conceptName} themed building, neon pink and green holographic signs, rain-soaked dark grid streets below, futuristic LED windows, electric glow, cinematic game art, hyperdetailed, 512x512, no text`,
    enchanted_kingdom: `stunning 3D isometric fantasy castle tower, ${conceptName} themed building, glowing purple magical energy, ancient stone walls, floating crystals orbiting the spires, moonlit forest background, mystical particles, cinematic fantasy art, hyperdetailed, 512x512, no text`,
    ocean_world: `stunning 3D isometric underwater coral palace, ${conceptName} themed building, bioluminescent teal and blue glow, deep ocean background, exotic sea creatures swimming around, ancient sunken architecture, bubble particles, cinematic underwater art, hyperdetailed, 512x512, no text`,
    desert_empire: `stunning 3D isometric ancient desert temple, ${conceptName} themed building, warm golden sandstone, intricate hieroglyphic carvings, glowing orange sunset background, sand dunes, floating ancient artifacts, mystical fire torches, cinematic desert art, hyperdetailed, 512x512, no text`,
  };

  let prompt = basePrompts[theme] || basePrompts.cosmos;

  if (state === 'partial') {
    prompt += ', under construction, scaffolding visible, partially built, 50% complete, construction markers';
  }

  return prompt;
}

export function getPollinationsImageUrl(conceptName: string, theme: string, state: BuildingState): string {
  const prompt = generateBuildingPrompt(conceptName, theme, state);
  const seed = getBuildingSeed(conceptName, theme);
  return `/api/worldimage?prompt=${encodeURIComponent(prompt)}&seed=${seed}`;
}

export async function cacheBuildingImageToSupabase(
  conceptName: string,
  theme: string,
  state: BuildingState,
  imageUrl: string
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;

  try {
    const slug = slugify(conceptName);
    const path = `buildings/${theme}/${slug}_${state}.png`;

    const res = await fetch(imageUrl);
    if (!res.ok) return;
    const blob = await res.blob();

    await supabase.storage.from('worlds').upload(path, blob, {
      contentType: 'image/png',
      upsert: true,
    });
  } catch (e) {
    // Non-blocking best effort cache
  }
}
