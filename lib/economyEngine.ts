'use client';

export interface BaseResources {
  gold: number;
  crystals: number;
  techElixir: number;
}

export interface BuildingUpgradeCost {
  gold: number;
  crystals: number;
  requiredTownHallLevel: number;
}

const RESOURCES_STORAGE_KEY = 'xpedition_base_resources_v1';
const BUILDING_LEVELS_KEY = 'xpedition_building_levels_v1';

export function getBaseResources(): BaseResources {
  if (typeof window === 'undefined') {
    return { gold: 450, crystals: 85, techElixir: 120 };
  }
  try {
    const raw = localStorage.getItem(RESOURCES_STORAGE_KEY);
    if (!raw) {
      const init = { gold: 450, crystals: 85, techElixir: 120 };
      localStorage.setItem(RESOURCES_STORAGE_KEY, JSON.stringify(init));
      return init;
    }
    return JSON.parse(raw);
  } catch (e) {
    return { gold: 450, crystals: 85, techElixir: 120 };
  }
}

export function saveBaseResources(res: BaseResources): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(RESOURCES_STORAGE_KEY, JSON.stringify(res));
    window.dispatchEvent(new Event('xpedition_resources_updated'));
  } catch (e) {}
}

export function addRewards(goldGain: number, crystalGain: number, elixirGain: number = 0): BaseResources {
  const current = getBaseResources();
  const updated = {
    gold: Math.max(0, current.gold + goldGain),
    crystals: Math.max(0, current.crystals + crystalGain),
    techElixir: Math.max(0, current.techElixir + elixirGain),
  };
  saveBaseResources(updated);
  return updated;
}

export function getBuildingLevels(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(BUILDING_LEVELS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export function saveBuildingLevel(buildingId: string, level: number): void {
  if (typeof window === 'undefined') return;
  try {
    const levels = getBuildingLevels();
    levels[buildingId] = level;
    localStorage.setItem(BUILDING_LEVELS_KEY, JSON.stringify(levels));
    window.dispatchEvent(new Event('xpedition_buildings_updated'));
  } catch (e) {}
}

export function getUpgradeCost(currentLevel: number): BuildingUpgradeCost {
  const targetLevel = currentLevel + 1;
  switch (targetLevel) {
    case 2:
      return { gold: 200, crystals: 30, requiredTownHallLevel: 1 };
    case 3:
      return { gold: 500, crystals: 80, requiredTownHallLevel: 2 };
    case 4:
      return { gold: 1200, crystals: 200, requiredTownHallLevel: 3 };
    case 5:
      return { gold: 2500, crystals: 500, requiredTownHallLevel: 4 };
    default:
      return { gold: 9999, crystals: 999, requiredTownHallLevel: 5 };
  }
}
