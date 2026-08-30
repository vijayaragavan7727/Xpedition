'use client';

import { useState, useEffect, useCallback } from 'react';
import { getStoreData, UserStoreData } from '@/lib/store';
import { computeWorldState, syncWorldState, WorldState } from '@/lib/worldEngine';

export function useWorldState() {
  const [storeData, setStoreData] = useState<UserStoreData | null>(null);
  const [worldState, setWorldState] = useState<WorldState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadWorld = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const store = getStoreData();
    setStoreData(store);
    const world = computeWorldState(store);
    setWorldState(world);
    setIsLoading(false);
    try {
      await syncWorldState(store);
    } catch (e) {
      // Non-blocking sync
    }
  }, []);

  useEffect(() => {
    loadWorld();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'xpedition_store' || e.key?.startsWith('xpedition_world_')) {
        loadWorld();
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [loadWorld]);

  return {
    storeData: storeData || (typeof window !== 'undefined' ? getStoreData() : null),
    worldState: worldState || (storeData ? computeWorldState(storeData) : null),
    isLoading,
    refreshWorld: loadWorld,
  };
}
