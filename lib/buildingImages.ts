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

export function generateBuildingPrompt(conceptName: string, theme: string, state: BuildingState): string {
  const themeStyle: Record<string, string> = {
    cosmos: 'space station module, dark purple, cyan neon glow, sci-fi',
    cyber_city: 'cyberpunk neon building, dark grid, pink and cyan lights',
    enchanted_kingdom: 'fantasy stone castle tower, magical purple glow, forest',
    ocean_world: 'underwater coral structure, deep blue, bioluminescent teal',
    desert_empire: 'ancient sand temple, terracotta, gold trim, desert',
  };

  const stateDesc: Record<BuildingState, string> = {
    empty: 'empty plot foundation, construction markers',
    partial: 'building under construction, scaffold, half built',
    complete: 'fully built, glowing, complete, detailed',
  };

  const style = themeStyle[theme] || themeStyle.cosmos;
  const status = stateDesc[state] || stateDesc.complete;

  return `isometric 3D ${conceptName} ${status}, ${style}, game asset style, centered, no text, no background, professional, cinematic lighting`;
}

export function getBuildingSeed(conceptName: string, theme: string): number {
  const str = `${conceptName}_${theme}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getPollinationsImageUrl(conceptName: string, theme: string, state: BuildingState): string {
  // Use our local CORS-bypassing proxy API route
  return `/api/worldimage?concept=${encodeURIComponent(conceptName)}&theme=${encodeURIComponent(theme)}&state=${encodeURIComponent(state)}`;
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
