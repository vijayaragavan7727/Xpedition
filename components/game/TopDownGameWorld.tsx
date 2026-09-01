'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { UserStoreData, getStoreData, calculateStreak } from '@/lib/store';
import { getBuildingLevels, addRewards } from '@/lib/economyEngine';
import { TopDownBuilding, WorldBuildingData } from './TopDownBuilding';
import { BuildingDetailModal } from './BuildingDetailModal';
import { BaseResourceHUD } from './BaseResourceHUD';
import { HeroSelectModal } from './HeroSelectModal';
import { BaseHeroCharacter } from './BaseHeroCharacter';
import { BaseActionTray } from './BaseActionTray';
import { SpiresDrawerModal } from './SpiresDrawerModal';
import AskXYRASheet from '@/components/AskXYRASheet';
import { soundFx } from '@/lib/soundEngine';
import {
  Compass,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Swords,
  Flame,
  Sparkles,
} from 'lucide-react';

interface FloatingLoot {
  id: string;
  type: 'gold' | 'crystal';
  amount: number;
  x: number;
  y: number;
  collected: boolean;
}

interface TopDownGameWorldProps {
  storeData?: UserStoreData | null;
}

export const TopDownGameWorld: React.FC<TopDownGameWorldProps> = ({
  storeData: initialStoreData,
}) => {
  const router = useRouter();
  const [store, setStore] = useState<UserStoreData | null>(initialStoreData || null);
  const [selectedBuilding, setSelectedBuilding] = useState<WorldBuildingData | null>(null);
  const [isHeroModalOpen, setIsHeroModalOpen] = useState(false);
  const [isSpiresDrawerOpen, setIsSpiresDrawerOpen] = useState(false);
  const [isXyraSheetOpen, setIsXyraSheetOpen] = useState(false);
  const [activeZone, setActiveZone] = useState<string>('core');

  // Camera Pan & Zoom state (Center at 1000, 750)
  const [zoomLevel, setZoomLevel] = useState(0.95);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Floating Loot Collectibles distributed across the map
  const [floatingLoots, setFloatingLoots] = useState<FloatingLoot[]>([
    { id: 'loot_1', type: 'gold', amount: 80, x: 680, y: 700, collected: false },
    { id: 'loot_2', type: 'crystal', amount: 30, x: 1280, y: 470, collected: false },
    { id: 'loot_3', type: 'gold', amount: 65, x: 980, y: 1040, collected: false },
    { id: 'loot_4', type: 'crystal', amount: 35, x: 650, y: 900, collected: false },
  ]);

  const loadData = useCallback(() => {
    const data = getStoreData();
    setStore(data);
  }, []);

  useEffect(() => {
    if (!initialStoreData) {
      loadData();
    } else {
      setStore(initialStoreData);
    }

    window.addEventListener('xpedition_buildings_updated', loadData);
    return () => {
      window.removeEventListener('xpedition_buildings_updated', loadData);
    };
  }, [initialStoreData, loadData]);

  // Generate top-down world locations distributed across the 2000x1500 game map
  const buildings: WorldBuildingData[] = useMemo(() => {
    if (!store) return [];
    const buildingLevels = getBuildingLevels();
    const concepts = store.concepts || [];

    const items: WorldBuildingData[] = [];

    // 1. Central Knowledge Citadel (Center: 1000, 750)
    const coreLevel = buildingLevels['building_core'] || 1;
    const avgMastery =
      concepts.length > 0
        ? Math.round(
            concepts.reduce((acc, c) => acc + (c.masteryPercentage || 0), 0) / concepts.length
          )
        : 50;

    items.push({
      id: 'building_core',
      name: `${store.goalText || 'Knowledge'} Citadel`,
      type: 'core',
      level: coreLevel,
      masteryPercent: avgMastery,
      x: 1000,
      y: 750,
      zoneName: 'Citadel Plaza',
    });

    // 2. Survivor Arena (South: 980, 1100)
    items.push({
      id: 'building_arena',
      name: 'Survivor Arena',
      type: 'arena',
      level: buildingLevels['building_arena'] || 1,
      masteryPercent: 100,
      x: 980,
      y: 1100,
      zoneName: 'Battle Warzone',
    });

    // 3. Reward & Loot Vault (West: 680, 750)
    items.push({
      id: 'building_vault',
      name: 'Quantum Loot Vault',
      type: 'rewards',
      level: buildingLevels['building_vault'] || 1,
      masteryPercent: 100,
      x: 680,
      y: 750,
      zoneName: 'Treasury Grounds',
    });

    // 4. Neural Skill Lab (South-West: 650, 950)
    items.push({
      id: 'building_lab',
      name: 'Neural Skill Lab',
      type: 'lab',
      level: buildingLevels['building_lab'] || 1,
      masteryPercent: 100,
      x: 650,
      y: 950,
      zoneName: 'Synthesis Observatory',
    });

    // 5. Career Hub & Industry Outpost (Far South-West: 420, 1150)
    items.push({
      id: 'building_career',
      name: 'Career Hub',
      type: 'career',
      level: buildingLevels['building_career'] || 1,
      masteryPercent: Math.min(100, Math.round(avgMastery * 1.1)),
      x: 420,
      y: 1150,
      zoneName: 'Industry Launchpad',
    });

    // 6. Course Concept Academies arranged naturally along East and North roads
    const coursePositions = [
      { x: 1280, y: 540, name: 'North-East Academy' },
      { x: 740, y: 520, name: 'North-West Academy' },
      { x: 1350, y: 760, name: 'East Archive Spire' },
      { x: 1260, y: 980, name: 'South-East Workshop' },
      { x: 1010, y: 440, name: 'North Tower' },
      { x: 1480, y: 620, name: 'Far East Guild' },
      { x: 1450, y: 880, name: 'Outer Foundry' },
      { x: 760, y: 360, name: 'North Sanctuary' },
    ];

    concepts.slice(0, 8).forEach((concept, index) => {
      const pos = coursePositions[index % coursePositions.length];
      items.push({
        id: `building_concept_${concept.id}`,
        name: concept.name,
        conceptId: concept.id,
        type: 'spire',
        level: buildingLevels[`building_concept_${concept.id}`] || 1,
        masteryPercent: concept.masteryPercentage || 0,
        retentionRisk: concept.retentionRisk || 0,
        x: pos.x,
        y: pos.y,
        zoneName: pos.name,
      });
    });

    // 7. Locked Frontier Zones
    items.push({
      id: 'building_locked_1',
      name: 'Ancient Frontier',
      type: 'locked',
      level: 1,
      masteryPercent: 0,
      x: 450,
      y: 500,
      isLocked: true,
      unlockRequirement: 'Requires Knowledge Citadel Lv. 2',
      zoneName: 'Locked Forest',
    });

    items.push({
      id: 'building_locked_2',
      name: 'Mist Ruins',
      type: 'locked',
      level: 1,
      masteryPercent: 0,
      x: 1540,
      y: 420,
      isLocked: true,
      unlockRequirement: 'Requires 75% Total Base Mastery',
      zoneName: 'Locked Peaks',
    });

    return items;
  }, [store]);

  const handleBuildingClick = (b: WorldBuildingData) => {
    soundFx.playTick();
    setSelectedBuilding(b);
  };

  // Collect floating loot
  const handleCollectLoot = (loot: FloatingLoot, e: React.MouseEvent) => {
    e.stopPropagation();
    soundFx.playUpgrade();

    if (loot.type === 'gold') {
      addRewards(loot.amount, 0, 5);
    } else {
      addRewards(0, loot.amount, 5);
    }

    setFloatingLoots((prev) =>
      prev.map((item) => (item.id === loot.id ? { ...item, collected: true } : item))
    );

    // Respawn after 10s
    setTimeout(() => {
      setFloatingLoots((prev) =>
        prev.map((item) => (item.id === loot.id ? { ...item, collected: false } : item))
      );
    }, 10000);
  };

  // Quick Pan to Zone
  const handlePanToZone = (zoneType: 'core' | 'spire' | 'arena' | 'rewards' | 'lab' | 'career') => {
    soundFx.playTick();
    setActiveZone(zoneType);

    const target = buildings.find((b) => b.type === zoneType);
    if (target && containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;

      // Pan target to screen center
      const targetPanX = containerWidth / 2 - target.x * zoomLevel;
      const targetPanY = containerHeight / 2 - target.y * zoomLevel;

      setPanOffset({ x: targetPanX, y: targetPanY });
    }
  };

  // Drag & Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Wheel Zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY * -0.0015;
    setZoomLevel((prev) => Math.min(1.4, Math.max(0.6, prev + zoomDelta)));
  };

  // Initial Center on mount
  useEffect(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      setPanOffset({
        x: containerWidth / 2 - 1000 * 0.95,
        y: containerHeight / 2 - 750 * 0.95,
      });
    }
  }, []);

  const coreBuilding = buildings.find((b) => b.type === 'core');
  const fadingCount = store ? store.concepts.filter((c) => (c.retentionRisk || 0) > 0.35).length : 0;
  const streakCount = store ? calculateStreak(store.attempts) : 0;
  const totalMastery = coreBuilding?.masteryPercent || 50;

  return (
    <div className="relative w-full h-full bg-[#1B381A] overflow-hidden select-none flex flex-col font-sans">
      {/* 1. TOP STRATEGY GAME HUD */}
      <div className="absolute top-0 left-0 right-0 z-30 pointer-events-auto">
        <BaseResourceHUD
          townHallLevel={coreBuilding?.level || 1}
          storeData={store}
          onOpenHeroModal={() => setIsHeroModalOpen(true)}
          onOpenTownHall={() => coreBuilding && setSelectedBuilding(coreBuilding)}
          onSelectZone={handlePanToZone}
          activeZone={activeZone}
        />
      </div>

      {/* 2. FULL-SCREEN GAME TERRAIN CANVAS */}
      <div
        ref={containerRef}
        className="w-full h-full relative flex items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* World Map Container (2000px × 1500px Continuous Game Landscape) */}
        <div
          className="absolute transition-transform duration-75 origin-top-left"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            width: '2000px',
            height: '1500px',
          }}
        >
          {/* ========================================================================= */}
          {/* FULL PROCEDURAL SVG GAME TERRAIN (Lush Grass, Pathways, Shore, Trees)    */}
          {/* ========================================================================= */}
          <svg
            viewBox="0 0 2000 1500"
            className="w-full h-full absolute inset-0 pointer-events-none"
          >
            <defs>
              {/* Rich Grass Pattern */}
              <pattern id="grassTiles" width="64" height="64" patternUnits="userSpaceOnUse">
                <rect width="64" height="64" fill="#3D7D28" />
                <rect width="32" height="32" fill="#468B2E" />
                <rect x="32" y="32" width="32" height="32" fill="#468B2E" />
                {/* Grass tufts */}
                <path d="M 12 18 L 14 12 L 16 18 M 44 50 L 46 44 L 48 50" stroke="#5EA43A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              </pattern>

              {/* Cobblestone Stone Pattern */}
              <pattern id="cobbleStone" width="40" height="40" patternUnits="userSpaceOnUse">
                <rect width="40" height="40" fill="#9CA3AF" />
                <rect x="2" y="2" width="16" height="16" rx="3" fill="#D1D5DB" />
                <rect x="22" y="2" width="16" height="16" rx="3" fill="#E5E7EB" />
                <rect x="2" y="22" width="16" height="16" rx="3" fill="#E5E7EB" />
                <rect x="22" y="22" width="16" height="16" rx="3" fill="#D1D5DB" />
              </pattern>

              {/* Dirt Road Pattern */}
              <pattern id="dirtRoad" width="40" height="40" patternUnits="userSpaceOnUse">
                <rect width="40" height="40" fill="#B45309" />
                <rect width="40" height="40" fill="#D97706" opacity="0.6" />
                <circle cx="10" cy="15" r="2" fill="#92400E" />
                <circle cx="30" cy="28" r="3" fill="#78350F" />
              </pattern>

              {/* Water Gradient */}
              <linearGradient id="oceanWater" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0284C7" />
                <stop offset="50%" stopColor="#0369A1" />
                <stop offset="100%" stopColor="#075985" />
              </linearGradient>

              {/* Sand Shore Gradient */}
              <linearGradient id="sandShore" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FDE68A" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
            </defs>

            {/* 1. LUSH BASE GRASSLAND TERRAIN */}
            <rect width="2000" height="1500" fill="url(#grassTiles)" />

            {/* 2. COASTAL WATER (Left & Bottom-Left Ocean Boundary) */}
            <path
              d="M 0 0 L 260 0 C 220 300, 320 600, 200 900 C 120 1100, 350 1350, 500 1500 L 0 1500 Z"
              fill="url(#oceanWater)"
            />
            {/* Sand Shore Buffer */}
            <path
              d="M 260 0 C 220 300, 320 600, 200 900 C 120 1100, 350 1350, 500 1500 L 520 1500 C 370 1350, 140 1100, 220 900 C 340 600, 240 300, 280 0 Z"
              fill="url(#sandShore)"
              opacity="0.8"
            />
            {/* Water Wave Lines */}
            <path d="M 60 200 Q 120 230 180 200 M 80 500 Q 140 530 200 500 M 50 900 Q 110 930 170 900" stroke="#BAE6FD" strokeWidth="2.5" fill="none" opacity="0.6" />

            {/* 3. COBBLESTONE PATHWAYS & STONE COURTYARDS */}
            {/* Central Citadel Plaza */}
            <rect x="850" y="600" width="300" height="300" rx="36" fill="url(#cobbleStone)" stroke="#4B5563" strokeWidth="4" />

            {/* Stone Road: Citadel to Arena */}
            <path d="M 970 880 L 970 1020 L 1000 1020 L 1000 880 Z" fill="url(#dirtRoad)" stroke="#78350F" strokeWidth="2" />
            <ellipse cx="980" cy="1100" rx="140" ry="85" fill="#7F1D1D" stroke="#991B1B" strokeWidth="4" />

            {/* Stone Road: Citadel to Loot Vault & Skill Lab */}
            <path d="M 870 730 L 730 730 L 730 770 L 870 770 Z" fill="url(#cobbleStone)" stroke="#6B7280" strokeWidth="2" />
            <rect x="610" y="680" width="140" height="140" rx="20" fill="url(#cobbleStone)" stroke="#D97706" strokeWidth="3" />
            
            <path d="M 680 810 L 680 910 L 710 910 L 710 810 Z" fill="url(#dirtRoad)" stroke="#78350F" strokeWidth="2" />
            <rect x="580" y="880" width="140" height="140" rx="20" fill="#065F46" stroke="#059669" strokeWidth="3" />

            {/* Road: Citadel to Career Hub */}
            <path d="M 620 980 L 450 1110 L 470 1140 L 650 1010 Z" fill="url(#dirtRoad)" stroke="#78350F" strokeWidth="2" />
            <rect x="350" y="1080" width="140" height="140" rx="20" fill="#4C1D95" stroke="#7C3AED" strokeWidth="3" />

            {/* Stone Road: Citadel to Course Academies */}
            <path d="M 1130 730 L 1300 730 L 1300 770 L 1130 770 Z" fill="url(#cobbleStone)" stroke="#6B7280" strokeWidth="2" />
            <path d="M 1030 620 L 1230 540 L 1250 580 L 1050 660 Z" fill="url(#cobbleStone)" stroke="#6B7280" strokeWidth="2" />
            <path d="M 970 620 L 780 540 L 800 500 L 990 580 Z" fill="url(#cobbleStone)" stroke="#6B7280" strokeWidth="2" />
            <path d="M 1000 620 L 1000 460 L 1040 460 L 1040 620 Z" fill="url(#dirtRoad)" stroke="#78350F" strokeWidth="2" />

            {/* Course Island Foundations */}
            <rect x="1210" y="470" width="140" height="140" rx="20" fill="url(#cobbleStone)" stroke="#14B8A6" strokeWidth="3" />
            <rect x="670" y="450" width="140" height="140" rx="20" fill="url(#cobbleStone)" stroke="#14B8A6" strokeWidth="3" />
            <rect x="1280" y="690" width="140" height="140" rx="20" fill="url(#cobbleStone)" stroke="#14B8A6" strokeWidth="3" />
            <rect x="1190" y="910" width="140" height="140" rx="20" fill="url(#cobbleStone)" stroke="#14B8A6" strokeWidth="3" />

            {/* 4. DEFENSIVE STONE WALLS & GATES */}
            {/* North-West Wall Segment */}
            <path d="M 830 550 L 580 550 L 580 840" stroke="#CBD5E1" strokeWidth="7" strokeDasharray="14 4" strokeLinecap="round" fill="none" />
            {/* South-East Wall Segment */}
            <path d="M 1170 910 L 1170 1180 L 880 1180" stroke="#CBD5E1" strokeWidth="7" strokeDasharray="14 4" strokeLinecap="round" fill="none" />
            {/* East Wall Segment */}
            <path d="M 1170 550 L 1450 550 L 1450 820" stroke="#CBD5E1" strokeWidth="7" strokeDasharray="14 4" strokeLinecap="round" fill="none" />

            {/* 5. DENSE FOREST BORDER TREES (Top & Right Edges) */}
            {/* Top Forest Border */}
            {Array.from({ length: 24 }).map((_, i) => (
              <g key={`top_tree_${i}`} transform={`translate(${280 + i * 70}, ${30 + (i % 3) * 25})`}>
                <ellipse cx="20" cy="45" rx="18" ry="8" fill="#14532D" opacity="0.6" />
                <polygon points="20,0 38,36 2,36" fill="#15803D" stroke="#14532D" strokeWidth="1.5" />
                <polygon points="20,10 34,42 6,42" fill="#16A34A" />
                <rect x="17" y="40" width="6" height="12" fill="#78350F" />
              </g>
            ))}

            {/* Right Forest Border */}
            {Array.from({ length: 18 }).map((_, i) => (
              <g key={`right_tree_${i}`} transform={`translate(${1700 + (i % 3) * 50}, ${100 + i * 75})`}>
                <ellipse cx="20" cy="45" rx="18" ry="8" fill="#14532D" opacity="0.6" />
                <polygon points="20,0 38,36 2,36" fill="#15803D" stroke="#14532D" strokeWidth="1.5" />
                <polygon points="20,10 34,42 6,42" fill="#16A34A" />
                <rect x="17" y="40" width="6" height="12" fill="#78350F" />
              </g>
            ))}

            {/* Ambient Trees & Flower Clusters Scattered Inside Village */}
            {[
              { x: 800, y: 640 },
              { x: 1160, y: 640 },
              { x: 1140, y: 840 },
              { x: 840, y: 840 },
              { x: 920, y: 480 },
              { x: 1100, y: 480 },
              { x: 880, y: 1040 },
              { x: 1080, y: 1040 },
              { x: 550, y: 740 },
              { x: 520, y: 920 },
              { x: 1380, y: 460 },
              { x: 1420, y: 720 },
              { x: 1360, y: 940 },
              { x: 740, y: 1120 },
              { x: 320, y: 1120 },
            ].map((prop, i) => (
              <g key={`tree_prop_${i}`} transform={`translate(${prop.x}, ${prop.y})`}>
                {/* Tree Shadow */}
                <ellipse cx="16" cy="32" rx="14" ry="6" fill="#000000" opacity="0.35" />
                {/* Tree Pine Layers */}
                <polygon points="16,0 30,24 2,24" fill="#166534" />
                <polygon points="16,8 28,30 4,30" fill="#15803D" />
                <rect x="14" y="28" width="4" height="8" fill="#78350F" />
              </g>
            ))}

            {/* Lantern Posts with Glowing Warm Light */}
            {[
              { x: 860, y: 610 },
              { x: 1140, y: 610 },
              { x: 860, y: 890 },
              { x: 1140, y: 890 },
              { x: 970, y: 1010 },
              { x: 670, y: 720 },
            ].map((lamp, i) => (
              <g key={`lamp_${i}`} transform={`translate(${lamp.x}, ${lamp.y})`}>
                <circle cx="0" cy="0" r="18" fill="#FDE047" opacity="0.25" className="animate-pulse" />
                <line x1="0" y1="-8" x2="0" y2="8" stroke="#1F2937" strokeWidth="2.5" />
                <circle cx="0" cy="-8" r="4" fill="#F59E0B" />
                <circle cx="0" cy="-8" r="2" fill="#FEF08A" />
              </g>
            ))}
          </svg>

          {/* RENDER HERO CHARACTER (Patrolling around Citadel) */}
          <div
            style={{
              position: 'absolute',
              left: '960px',
              top: '730px',
              zIndex: 35,
            }}
          >
            <BaseHeroCharacter
              activeGoal={store?.goalText || 'Learning'}
              fadingCount={fadingCount}
              onTap={() => setIsHeroModalOpen(true)}
            />
          </div>

          {/* RENDER INTERACTIVE FLOATING LOOT BUBBLES */}
          {floatingLoots
            .filter((loot) => !loot.collected)
            .map((loot) => (
              <div
                key={loot.id}
                onClick={(e) => handleCollectLoot(loot, e)}
                className="absolute cursor-pointer select-none animate-bounce z-40 transition-transform hover:scale-125"
                style={{
                  left: `${loot.x}px`,
                  top: `${loot.y}px`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/90 border-2 border-amber-400 text-amber-300 font-mono text-xs font-black shadow-[0_0_20px_rgba(251,191,36,0.7)]">
                  <span className="text-sm">{loot.type === 'gold' ? '🪙' : '💎'}</span>
                  <span>+{loot.amount}</span>
                </div>
              </div>
            ))}

          {/* RENDER ALL TOP-DOWN GAME BUILDINGS */}
          {buildings.map((building) => (
            <TopDownBuilding
              key={building.id}
              building={building}
              isSelected={selectedBuilding?.id === building.id}
              onClick={handleBuildingClick}
            />
          ))}
        </div>
      </div>

      {/* 3. FLOATING CAMERA CONTROLS (Top-Right) */}
      <div className="absolute top-20 right-3 sm:right-4 z-20 flex flex-col gap-1.5 bg-[#18181B]/95 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 shadow-xl">
        <button
          onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.15))}
          className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.15))}
          className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            if (containerRef.current) {
              const cw = containerRef.current.clientWidth;
              const ch = containerRef.current.clientHeight;
              setPanOffset({
                x: cw / 2 - 1000 * 0.95,
                y: ch / 2 - 750 * 0.95,
              });
              setZoomLevel(0.95);
            }
          }}
          className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-amber-400 transition-colors cursor-pointer"
          title="Recenter Map"
        >
          <Compass className="w-4 h-4" />
        </button>
      </div>

      {/* 4. CLASH-STYLE BOTTOM ACTION TRAY */}
      <div className="absolute bottom-16 md:bottom-3 left-0 right-0 z-30">
        <BaseActionTray
          onAttack={() => router.push('/quest?mode=arena')}
          onOpenXyra={() => setIsXyraSheetOpen(true)}
          onOpenHero={() => setIsHeroModalOpen(true)}
          onOpenUpgrades={() => coreBuilding && setSelectedBuilding(coreBuilding)}
          onOpenSyllabus={() => setIsSpiresDrawerOpen(true)}
          onOpenCareerHub={() => {
            const careerBldg = buildings.find((b) => b.type === 'career');
            if (careerBldg) setSelectedBuilding(careerBldg);
          }}
          fadingCount={fadingCount}
          streakCount={streakCount}
        />
      </div>

      {/* 5. MODALS & SHEETS */}
      {/* Hero Selection Modal */}
      <HeroSelectModal
        isOpen={isHeroModalOpen}
        onClose={() => setIsHeroModalOpen(false)}
      />

      {/* Building Detail Sheet */}
      <BuildingDetailModal
        building={selectedBuilding as any}
        onClose={() => setSelectedBuilding(null)}
        onBuildingUpdated={loadData}
        totalMastery={totalMastery}
      />

      {/* Course Spires Drawer */}
      <SpiresDrawerModal
        isOpen={isSpiresDrawerOpen}
        onClose={() => setIsSpiresDrawerOpen(false)}
        buildings={buildings as any}
        onSelectBuilding={(b) => setSelectedBuilding(b as any)}
      />

      {/* Ask XYRA AI Sheet */}
      <AskXYRASheet
        isOpen={isXyraSheetOpen}
        onClose={() => setIsXyraSheetOpen(false)}
        context={{
          scope: 'home',
          goal: store?.goalText || 'General Learning',
          concepts: store?.concepts || [],
        }}
      />
    </div>
  );
};
