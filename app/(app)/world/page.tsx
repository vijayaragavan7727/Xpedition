'use client';

import React, { useMemo } from 'react';
import { useWorldState } from '@/lib/hooks/world';
import { computeGameWorldData } from '@/lib/engine/gameWorldAdapter';
import TopDownGameWorld from '@/components/world/TopDownGameWorld';

export default function WorldPage() {
  const { storeData, isLoading } = useWorldState();

  const gameWorldData = useMemo(() => {
    if (!storeData) return null;
    return computeGameWorldData(storeData);
  }, [storeData]);

  if (!storeData || !gameWorldData) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#14291B] font-mono text-xs text-[#38BDF8]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#38BDF8] border-t-transparent rounded-full animate-spin" />
          <span>Synchronizing Strategy Village...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative select-none overflow-hidden bg-[#14291B]">
      <TopDownGameWorld worldData={gameWorldData} />
    </div>
  );
}
