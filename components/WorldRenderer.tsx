'use client';

import React, { useMemo } from 'react';
import { useWorldState } from '@/lib/hooks/world';
import { computeGameWorldData } from '@/lib/engine/gameWorldAdapter';
import TopDownGameWorld from '@/components/world/TopDownGameWorld';
import { WorldBuilding } from '@/lib/worldEngine';
import { WorldThemeId } from '@/lib/themes';

interface WorldRendererProps {
  theme?: WorldThemeId | string;
  buildings?: WorldBuilding[];
  height?: number | string;
  isMiniPreview?: boolean;
  isFullScreen?: boolean;
  onSelectBuilding?: (building: WorldBuilding) => void;
}

export default function WorldRenderer(props?: WorldRendererProps) {
  const { storeData } = useWorldState();

  const gameWorldData = useMemo(() => {
    if (!storeData) return null;
    return computeGameWorldData(storeData);
  }, [storeData]);

  if (!storeData || !gameWorldData) {
    return (
      <div className="w-full h-full min-h-[350px] flex items-center justify-center bg-[#14291B] font-mono text-xs text-[#38BDF8]">
        <div className="flex flex-col items-center gap-2.5">
          <div className="w-8 h-8 border-2 border-[#38BDF8] border-t-transparent rounded-full animate-spin" />
          <span>Loading Learning Village...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[350px] overflow-hidden select-none bg-[#14291B]">
      <TopDownGameWorld worldData={gameWorldData} />
    </div>
  );
}
