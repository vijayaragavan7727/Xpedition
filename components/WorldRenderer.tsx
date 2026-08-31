'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { WorldBuilding } from '@/lib/worldEngine';
import { WorldThemeId } from '@/lib/themes';
import { useWorldState } from '@/lib/hooks/world';
import { computeGameWorldData } from '@/lib/engine/gameWorldAdapter';

interface WorldRendererProps {
  theme?: WorldThemeId | string;
  buildings?: WorldBuilding[];
  height?: number | string;
  isMiniPreview?: boolean;
  isFullScreen?: boolean;
  onSelectBuilding?: (building: WorldBuilding) => void;
}

// Dynamic 3D WebGL Game Canvas (SSR disabled)
const GameCanvas = dynamic(() => import('@/components/world3d/GameCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[350px] flex items-center justify-center bg-[#0A071B] font-mono text-xs text-[#00F0FF]">
      <div className="flex flex-col items-center gap-2.5">
        <div className="w-8 h-8 border-2 border-[#00F0FF] border-t-transparent rounded-full animate-spin" />
        <span>Initializing 3D Game World...</span>
      </div>
    </div>
  ),
});

export default function WorldRenderer({
  height = '100%',
  isMiniPreview = false,
  isFullScreen = false,
}: WorldRendererProps) {
  const { storeData } = useWorldState();

  const gameWorldData = React.useMemo(() => {
    if (!storeData) return null;
    return computeGameWorldData(storeData);
  }, [storeData]);

  if (!storeData || !gameWorldData) {
    return (
      <div className="w-full h-full min-h-[350px] flex items-center justify-center bg-[#0A071B] font-mono text-xs text-[#00F0FF]">
        <div className="flex flex-col items-center gap-2.5">
          <div className="w-8 h-8 border-2 border-[#00F0FF] border-t-transparent rounded-full animate-spin" />
          <span>Synchronizing 3D Realm...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[350px] overflow-hidden select-none bg-[#0A071B]">
      <GameCanvas worldData={gameWorldData} />
    </div>
  );
}
