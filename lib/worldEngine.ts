import { UserStoreData, getStoreData, saveStoreData } from './store';
import { thetaToPercent } from './engine/mastery';
import { WorldThemeId, getThemeConfig } from './themes';
import { supabase, isSupabaseConfigured } from './supabase';

export type BuildingState = 'empty' | 'partial' | 'complete';

export interface WorldBuilding {
  buildingId: string;
  conceptId: string;
  conceptName: string;
  buildingName: string;
  masteryPercent: number;
  state: BuildingState;
  unlockedAt?: string;
}

export interface WorldState {
  id?: string;
  userId?: string;
  skillGraphId: string;
  worldTheme: WorldThemeId;
  totalMasteryPercent: number;
  tier: number; // 1 to 5
  tierName: string;
  buildings: WorldBuilding[];
  createdAt?: string;
  updatedAt?: string;
}

export const WORLD_TIER_NAMES: Record<number, string> = {
  1: 'The Beginning',
  2: 'Taking Shape',
  3: 'Growing Strong',
  4: 'Thriving',
  5: 'Mastery Complete',
};

export function calculateWorldTier(masteryPercent: number): { tier: number; name: string } {
  if (masteryPercent >= 81) return { tier: 5, name: WORLD_TIER_NAMES[5] };
  if (masteryPercent >= 61) return { tier: 4, name: WORLD_TIER_NAMES[4] };
  if (masteryPercent >= 41) return { tier: 3, name: WORLD_TIER_NAMES[3] };
  if (masteryPercent >= 21) return { tier: 2, name: WORLD_TIER_NAMES[2] };
  return { tier: 1, name: WORLD_TIER_NAMES[1] };
}

export function getBuildingState(masteryPercent: number): BuildingState {
  if (masteryPercent <= 0) return 'empty';
  if (masteryPercent < 50) return 'partial';
  return 'complete';
}

const GENERIC_BUILDINGS = [
  'Central Library',
  'Research Lab',
  'Discovery Tower',
  'Knowledge Vault',
  'Mastery Citadel',
  'Quantum Spire',
  'Logic Foundry',
  'Archive Station',
];

export function deriveBuildingName(conceptName: string, index: number): string {
  const lower = conceptName.toLowerCase();
  
  if (lower.includes('uv') || lower.includes('unwrap')) return 'Material Studio';
  if (lower.includes('shader') || lower.includes('texture') || lower.includes('surface')) return 'Shader Lab';
  if (lower.includes('light') || lower.includes('shadow') || lower.includes('illum')) return 'Light Tower';
  if (lower.includes('rig') || lower.includes('animat') || lower.includes('bone') || lower.includes('armature')) return 'Animation Workshop';
  if (lower.includes('node') || lower.includes('modifier') || lower.includes('compositor')) return 'Circuit Hub';
  if (lower.includes('model') || lower.includes('mesh') || lower.includes('extru') || lower.includes('bevel')) return 'Geometry Foundry';
  if (lower.includes('render') || lower.includes('camera') || lower.includes('optic')) return 'Optics Chamber';
  if (lower.includes('sculpt') || lower.includes('brush') || lower.includes('clay')) return 'Forming Atelier';
  
  // Programming & CS
  if (lower.includes('python') || lower.includes('syntax') || lower.includes('variable') || lower.includes('func')) return 'Compiler Core';
  if (lower.includes('dsa') || lower.includes('tree') || lower.includes('graph') || lower.includes('algorithm')) return 'Algorithmic Spire';
  if (lower.includes('sql') || lower.includes('database') || lower.includes('query') || lower.includes('table')) return 'Data Matrix';
  if (lower.includes('ml') || lower.includes('neural') || lower.includes('learning') || lower.includes('ai')) return 'Neural Vault';
  if (lower.includes('web') || lower.includes('react') || lower.includes('next') || lower.includes('html')) return 'Network Grid';

  // Fallback to positional generic names
  return GENERIC_BUILDINGS[index % GENERIC_BUILDINGS.length];
}

export function computeWorldState(store: UserStoreData): WorldState {
  const activeGraphId = store.activeGraphId || 'default-graph';
  const activeTheme = (store.learnerProfile?.worldTheme as WorldThemeId) || 'cosmos';
  const concepts = store.concepts || [];

  let totalMasterySum = 0;
  const buildings: WorldBuilding[] = concepts.map((c, idx) => {
    const masteryPct = c.thetaAssisted !== undefined ? thetaToPercent(c.thetaAssisted) : c.masteryPercentage || 0;
    totalMasterySum += masteryPct;
    const state = getBuildingState(masteryPct);
    const buildingName = deriveBuildingName(c.name, idx);

    return {
      buildingId: `bldg_${c.id}`,
      conceptId: c.id,
      conceptName: c.name,
      buildingName,
      masteryPercent: masteryPct,
      state,
      unlockedAt: state !== 'empty' ? new Date().toISOString() : undefined,
    };
  });

  const totalConcepts = concepts.length;
  const avgMastery = totalConcepts > 0 ? Math.round(totalMasterySum / totalConcepts) : 0;
  const tierInfo = calculateWorldTier(avgMastery);

  return {
    skillGraphId: activeGraphId,
    worldTheme: activeTheme,
    totalMasteryPercent: avgMastery,
    tier: tierInfo.tier,
    tierName: tierInfo.name,
    buildings,
    updatedAt: new Date().toISOString(),
  };
}

export async function syncWorldState(storeData: UserStoreData): Promise<WorldState> {
  const world = computeWorldState(storeData);

  // Cache in localStorage for immediate fast rendering
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`xpedition_world_${world.skillGraphId}`, JSON.stringify(world));
    } catch (e) {}
  }

  // Best-effort push to Supabase world_state table
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (userId) {
        await supabase
          .from('world_state')
          .upsert({
            user_id: userId,
            skill_graph_id: world.skillGraphId,
            world_theme: world.worldTheme,
            total_mastery_percent: world.totalMasteryPercent,
            tier: world.tier,
            buildings: world.buildings,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,skill_graph_id' });
      }
    } catch (err) {
      console.warn('[WorldState] Supabase sync notice:', err);
    }
  }

  return world;
}

export function detectBuildingStateTransitions(
  previousBuildings: WorldBuilding[],
  currentBuildings: WorldBuilding[]
): WorldBuilding[] {
  const prevMap = new Map(previousBuildings.map((b) => [b.buildingId, b.state]));
  const unlocked: WorldBuilding[] = [];

  for (const b of currentBuildings) {
    const prevState = prevMap.get(b.buildingId) || 'empty';
    if (prevState !== b.state && b.state !== 'empty') {
      unlocked.push(b);
    }
  }

  return unlocked;
}
