import { UserStoreData, getStoreData, calculateStreak } from './store';
import { thetaToPercent } from './engine/mastery';
import { WorldThemeId, getThemeConfig } from './themes';
import { supabase, isSupabaseConfigured } from './supabase';
import { generateBuildingPrompt, getBuildingSeed } from './buildingImages';
import { calculateLPS, LPSResult, LPSInput } from './engine/lps';
import {
  evolveWorld,
  WorldBuilding3D,
  WorldEnvironment,
  Mission,
  ConceptMastery,
  BuildingStage,
} from './engine/worldEvolution';

export type BuildingState = 'empty' | 'partial' | 'complete';

export interface WorldBuilding {
  buildingId: string;
  conceptId: string;
  conceptName: string;
  buildingName: string;
  masteryPercent: number;
  state: BuildingState;
  imageUrl?: string;
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
  // Phase 1 LPS & 3D Evolution Extensions
  lps: LPSResult;
  buildings3D: WorldBuilding3D[];
  unlockedAreas: string[];
  environment: WorldEnvironment;
  resources: {
    wood: number;
    stone: number;
    crystal: number;
    gold: number;
  };
  activeMissions: Mission[];
  lastEvolvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function getBuildingState(masteryPercent: number): BuildingState {
  if (masteryPercent <= 0) return 'empty';
  if (masteryPercent < 30) return 'partial';
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

  // 1. Calculate Average Mastery & Concept Masteries
  let totalMasterySum = 0;
  const conceptMasteries: ConceptMastery[] = concepts.map((c) => {
    const masteryPct = c.thetaAssisted !== undefined ? thetaToPercent(c.thetaAssisted) : c.masteryPercentage || 0;
    totalMasterySum += masteryPct;
    return {
      id: c.id,
      name: c.name,
      masteryPercent: masteryPct,
    };
  });

  const totalConcepts = concepts.length;
  const avgMastery = totalConcepts > 0 ? Math.round(totalMasterySum / totalConcepts) : 0;

  // 2. Compute LPS (Learning Power Score)
  const streak = calculateStreak(store.attempts);
  const totalSessions = Math.max(1, Math.floor((store.attempts?.length || 0) / 4));
  const soloAttempts = store.attempts?.filter((a) => a.isSolo && !a.isVoid).length || 0;
  const soloSessions = Math.max(0, Math.floor(soloAttempts / 6));

  // Compute calibration / growth estimates
  const thetaSoloAvg = concepts.reduce((acc, c) => acc + (c.thetaSolo ?? 0), 0) / (totalConcepts || 1);
  const thetaAssistedAvg = concepts.reduce((acc, c) => acc + (c.thetaAssisted ?? 0), 0) / (totalConcepts || 1);
  const growthRate = Math.max(0.05, Math.min(1.0, (store.attempts?.length || 0) * 0.04));

  const lpsInput: LPSInput = {
    avgMasteryPercent: avgMastery,
    streak,
    thetaGrowthRate: growthRate,
    totalSessions,
    soloSessionCount: soloSessions,
    calibrationScore: (store as any).calibrationGap ?? 0.05,
    thetaSolo: thetaSoloAvg,
    thetaAssisted: thetaAssistedAvg,
  };

  const lps = calculateLPS(lpsInput);

  // 3. Evolve 3D World State & Missions
  const evolution = evolveWorld(lps, conceptMasteries);

  // 4. Generate 2D fallback buildings
  const buildings: WorldBuilding[] = concepts.map((c, idx) => {
    const masteryPct = c.thetaAssisted !== undefined ? thetaToPercent(c.thetaAssisted) : c.masteryPercentage || 0;
    const state = getBuildingState(masteryPct);
    const buildingName = deriveBuildingName(c.name, idx);
    const buildingId = `bldg_${c.id}`;

    const prompt = generateBuildingPrompt(c.name, activeTheme, state);
    const seed = getBuildingSeed(c.name, activeTheme);
    const resolvedImageUrl = `/api/worldimage?prompt=${encodeURIComponent(prompt)}&seed=${seed}`;

    return {
      buildingId,
      conceptId: c.id,
      conceptName: c.name,
      buildingName,
      masteryPercent: masteryPct,
      state,
      imageUrl: resolvedImageUrl,
      unlockedAt: state !== 'empty' ? new Date().toISOString() : undefined,
    };
  });

  return {
    skillGraphId: activeGraphId,
    worldTheme: activeTheme,
    totalMasteryPercent: avgMastery,
    tier: lps.tier,
    tierName: lps.tierName,
    buildings,
    lps,
    buildings3D: evolution.buildings,
    unlockedAreas: evolution.unlockedAreas,
    environment: evolution.environment,
    resources: evolution.resources,
    activeMissions: evolution.missions,
    lastEvolvedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function syncWorldState(storeData: UserStoreData): Promise<WorldState> {
  const world = computeWorldState(storeData);

  // Cache in localStorage for instant retrieval on reload
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`xpedition_world_${world.skillGraphId}`, JSON.stringify(world));
    } catch (e) {}
  }

  // Push to Supabase world_state table
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
            lps_score: world.lps.score,
            lps_tier: world.lps.tier,
            lps_profile: world.lps.profile,
            unlocked_areas: world.unlockedAreas,
            resources: world.resources,
            active_missions: world.activeMissions,
            last_evolved_at: world.lastEvolvedAt,
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
