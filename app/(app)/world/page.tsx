'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useWorldState } from '@/lib/hooks/world';
import { computeGameWorldData } from '@/lib/engine/gameWorldAdapter';

// Dynamic WebGL Game Canvas with SSR disabled
const GameCanvas = dynamic(() => import('@/components/world3d/GameCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#0A071B] font-mono text-xs text-[#00F0FF]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-[#00F0FF] border-t-transparent rounded-full animate-spin" />
        <span>Loading XPedition 3D World...</span>
      </div>
    </div>
  ),
});

export default function WorldPage() {
  const { storeData, isLoading } = useWorldState();

  const gameWorldData = useMemo(() => {
    if (!storeData) return null;
    return computeGameWorldData(storeData);
  }, [storeData]);

  if (!storeData || !gameWorldData) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#0A071B] font-mono text-xs text-[#00F0FF]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#00F0FF] border-t-transparent rounded-full animate-spin" />
          <span>Synchronizing Realm Data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative select-none overflow-hidden bg-[#0A071B]">
      <GameCanvas worldData={gameWorldData} />
    </div>
  );
}
