'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { UserStoreData, getStoreData, calculateStreak } from '@/lib/store';
import { getBuildingLevels, addRewards } from '@/lib/economyEngine';
import { IsometricBuilding, IsometricBuildingData } from './IsometricBuilding';
import { BuildingDetailModal } from './BuildingDetailModal';
import { BaseResourceHUD } from './BaseResourceHUD';
import { HeroSelectModal } from './HeroSelectModal';
import { BaseHeroCharacter } from './BaseHeroCharacter';
import { BaseActionTray } from './BaseActionTray';
import { SpiresDrawerModal } from './SpiresDrawerModal';
import AskXYRASheet from '@/components/AskXYRASheet';
import { soundFx } from '@/lib/soundEngine';
import { Sparkles, Compass, ZoomIn, ZoomOut, Maximize2, Shield, Swords, Briefcase, Zap } from 'lucide-react';

interface FloatingLoot {
  id: string;
  type: 'gold' | 'crystal';
  amount: number;
  gridX: number;
  gridY: number;
  collected: boolean;
}

interface IsometricLearningBaseProps {
  storeData?: UserStoreData | null;
}

export const IsometricLearningBase: React.FC<IsometricLearningBaseProps> = ({
  storeData: initialStoreData,
}) => {
  const router = useRouter();
  const [store, setStore] = useState<UserStoreData | null>(initialStoreData || null);
  const [selectedBuilding, setSelectedBuilding] = useState<IsometricBuildingData | null>(null);
  const [isHeroModalOpen, setIsHeroModalOpen] = useState(false);
  const [isSpiresDrawerOpen, setIsSpiresDrawerOpen] = useState(false);
  const [isXyraSheetOpen, setIsXyraSheetOpen] = useState(false);
  const [activeZone, setActiveZone] = useState<string>('core');

  // Camera Pan & Zoom state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Floating Loot Bubbles distributed around base
  const [floatingLoots, setFloatingLoots] = useState<FloatingLoot[]>([
    { id: 'loot_1', type: 'gold', amount: 75, gridX: -1, gridY: 1, collected: false },
    { id: 'loot_2', type: 'crystal', amount: 25, gridX: 2, gridY: -1, collected: false },
    { id: 'loot_3', type: 'gold', amount: 50, gridX: 1, gridY: 2, collected: false },
    { id: 'loot_4', type: 'crystal', amount: 30, gridX: -2, gridY: 0, collected: false },
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

  // Generate complete base buildings: Core, Arena, Rewards Vault, Lab, Career Hub, Course Spires, Locked Sectors
  const buildings: IsometricBuildingData[] = useMemo(() => {
    if (!store) return [];
    const buildingLevels = getBuildingLevels();
    const concepts = store.concepts || [];

    const items: IsometricBuildingData[] = [];

    // 1. Central Command / Knowledge Core (Town Hall at Center 0, 0)
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
      gridX: 0,
      gridY: 0,
      zoneName: 'Central Plaza',
    });

    // 2. Battle Spire / Survivor Arena at (1, 2)
    items.push({
      id: 'building_arena',
      name: 'Survivor Arena',
      type: 'arena',
      level: buildingLevels['building_arena'] || 1,
      masteryPercent: 100,
      gridX: 1,
      gridY: 2,
      zoneName: 'Battle Warzone',
    });

    // 3. Resource & Loot Vault at (-2, 1)
    items.push({
      id: 'building_vault',
      name: 'Quantum Loot Vault',
      type: 'rewards',
      level: buildingLevels['building_vault'] || 1,
      masteryPercent: 100,
      gridX: -2,
      gridY: 1,
      zoneName: 'Resource Oasis',
    });

    // 4. AI Synthesis Lab at (-2, -1)
    items.push({
      id: 'building_lab',
      name: 'Neural Skill Lab',
      type: 'lab',
      level: buildingLevels['building_lab'] || 1,
      masteryPercent: 100,
      gridX: -2,
      gridY: -1,
      zoneName: 'Synthesis Core',
    });

    // 5. Career Hub & Industry Launchpad at (-3, 0)
    items.push({
      id: 'building_career',
      name: 'Career Hub',
      type: 'career',
      level: buildingLevels['building_career'] || 1,
      masteryPercent: Math.min(100, Math.round(avgMastery * 1.1)),
      gridX: -3,
      gridY: 0,
      zoneName: 'Industry Launchpad',
    });

    // 6. Course Concept Spires arranged in dedicated North-East Archipelago
    const spireGridPositions = [
      { x: 1, y: -1 },
      { x: 2, y: -1 },
      { x: 2, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: -2 },
      { x: 3, y: 0 },
      { x: 2, y: 1 },
      { x: 3, y: -1 },
    ];

    concepts.slice(0, 8).forEach((concept, index) => {
      const pos = spireGridPositions[index % spireGridPositions.length];
      items.push({
        id: `building_concept_${concept.id}`,
        name: concept.name,
        conceptId: concept.id,
        type: 'spire',
        level: buildingLevels[`building_concept_${concept.id}`] || 1,
        masteryPercent: concept.masteryPercentage || 0,
        retentionRisk: concept.retentionRisk || 0,
        gridX: pos.x,
        gridY: pos.y,
        zoneName: 'Knowledge Spire District',
      });
    });

    // 7. Locked Outer Sectors
    items.push({
      id: 'building_locked_1',
      name: 'Frontier Alpha',
      type: 'locked',
      level: 1,
      masteryPercent: 0,
      gridX: 3,
      gridY: -2,
      isLocked: true,
      unlockRequirement: 'Requires Knowledge Citadel Lv. 2',
      zoneName: 'Outer Frontier',
    });

    items.push({
      id: 'building_locked_2',
      name: 'Frontier Beta',
      type: 'locked',
      level: 1,
      masteryPercent: 0,
      gridX: -3,
      gridY: -2,
      isLocked: true,
      unlockRequirement: 'Requires 75% Average Base Mastery',
      zoneName: 'Outer Frontier',
    });

    return items;
  }, [store]);

  const handleBuildingClick = (b: IsometricBuildingData) => {
    soundFx.playTick();
    setSelectedBuilding(b);
  };

  // Collect floating bubble loot
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

    // Respawn loot bubble after 10 seconds
    setTimeout(() => {
      setFloatingLoots((prev) =>
        prev.map((item) => (item.id === loot.id ? { ...item, collected: false } : item))
      );
    }, 10000);
  };

  // Pan to specific zone
  const handlePanToZone = (zoneType: 'core' | 'spire' | 'arena' | 'rewards' | 'lab' | 'career') => {
    soundFx.playTick();
    setActiveZone(zoneType);

    const targetBuilding = buildings.find((b) => b.type === zoneType);
    if (targetBuilding) {
      const tileW = 160;
      const tileH = 80;
      const targetPx = (targetBuilding.gridX - targetBuilding.gridY) * (tileW / 2);
      const targetPy = (targetBuilding.gridX + targetBuilding.gridY) * (tileH / 2);

      setPanOffset({
        x: -targetPx * zoomLevel * 0.7,
        y: -targetPy * zoomLevel * 0.7,
      });
    } else {
      setPanOffset({ x: 0, y: 0 });
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

  // Wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY * -0.0012;
    setZoomLevel((prev) => Math.min(1.5, Math.max(0.65, prev + zoomDelta)));
  };

  const coreBuilding = buildings.find((b) => b.type === 'core');
  const fadingCount = store ? store.concepts.filter((c) => (c.retentionRisk || 0) > 0.35).length : 0;
  const streakCount = store ? calculateStreak(store.attempts) : 0;
  const totalMastery = coreBuilding?.masteryPercent || 50;

  return (
    <div className="relative w-full h-full bg-[#080518] overflow-hidden select-none flex flex-col">
      {/* 1. TOP STRATEGY RESOURCE & HERO HUD */}
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

      {/* 2. EXPANSIVE FULL-SCREEN ISOMETRIC BASE CANVAS */}
      <div
        ref={containerRef}
        className="w-full h-full relative flex items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Animated Cyber Grid Floor, Radial Nebulas, and Star Particles */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            backgroundImage: `
              radial-gradient(circle at 50% 45%, rgba(121, 40, 202, 0.25) 0%, transparent 60%),
              radial-gradient(circle at 20% 70%, rgba(0, 240, 255, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 80% 25%, rgba(255, 46, 99, 0.15) 0%, transparent 50%),
              linear-gradient(rgba(0, 240, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 240, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '100% 100%, 100% 100%, 100% 100%, 54px 54px, 54px 54px',
          }}
        />

        {/* Ambient Glowing Energy Dust Particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/3 w-72 h-72 rounded-full bg-[#00F0FF]/5 blur-3xl animate-pulse" />
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-[#A855F7]/5 blur-3xl animate-pulse" />
          <div className="absolute top-1/2 left-1/6 w-60 h-60 rounded-full bg-[#FF2E63]/5 blur-3xl animate-pulse" />
        </div>

        {/* Isometric Grand Terrain World Map Container */}
        <div
          className="absolute transition-transform duration-75"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: 'center center',
          }}
        >
          {/* Base World Landscape SVG (1400px x 900px Expansive Isometric Realm) */}
          <div className="relative w-[1400px] h-[900px] flex items-center justify-center">
            <svg
              viewBox="0 0 1400 900"
              className="w-full h-full overflow-visible drop-shadow-[0_30px_60px_rgba(0,0,0,0.95)]"
            >
              <defs>
                {/* Terrain Gradients */}
                <linearGradient id="terrainCitadel" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#150B30" />
                  <stop offset="50%" stopColor="#0F0724" />
                  <stop offset="100%" stopColor="#080415" />
                </linearGradient>

                <linearGradient id="terrainCourses" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#180D38" />
                  <stop offset="100%" stopColor="#0B051B" />
                </linearGradient>

                <linearGradient id="terrainArena" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2D0A1B" />
                  <stop offset="100%" stopColor="#0E0308" />
                </linearGradient>

                <linearGradient id="terrainLab" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0A221C" />
                  <stop offset="100%" stopColor="#04120E" />
                </linearGradient>

                <linearGradient id="terrainCareer" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#220B2E" />
                  <stop offset="100%" stopColor="#0B0311" />
                </linearGradient>

                {/* Energy Conduit Glow */}
                <filter id="conduitGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* 1. OUTER DEFENSE PERIMETER SHIELD (Grand Diamond) */}
              <polygon
                points="700,40 1340,450 700,860 60,450"
                fill="#070312"
                stroke="#00F0FF"
                strokeWidth="2.5"
                strokeDasharray="8 5"
                opacity="0.8"
              />

              {/* 2. SECTOR 1: CITADEL CENTRAL PLAZA */}
              <polygon
                points="700,180 940,320 700,460 460,320"
                fill="url(#terrainCitadel)"
                stroke="#A855F7"
                strokeWidth="2"
              />
              {/* Inner Hex Command Pad */}
              <polygon
                points="700,240 790,290 790,350 700,400 610,350 610,290"
                fill="#1C0E3E"
                stroke="#00F0FF"
                strokeWidth="1.5"
                opacity="0.85"
              />

              {/* 3. SECTOR 2: COURSE ARCHIPELAGO (North-East Platform) */}
              <polygon
                points="950,160 1280,330 1060,470 780,340"
                fill="url(#terrainCourses)"
                stroke="#00F0FF"
                strokeWidth="1.8"
              />
              {/* Course Stepped Terrace Rings */}
              <polygon
                points="960,220 1180,330 1030,420 840,330"
                fill="#140A2C"
                stroke="#A855F7"
                strokeWidth="1.2"
                strokeDasharray="5 3"
              />

              {/* 4. SECTOR 3: SURVIVOR ARENA GROUNDS (South-East Platform) */}
              <polygon
                points="680,480 980,630 760,780 480,630"
                fill="url(#terrainArena)"
                stroke="#FF2E63"
                strokeWidth="2"
              />
              {/* Arena Hazard Inner Ring */}
              <polygon
                points="680,530 880,630 730,730 540,630"
                fill="#1F0612"
                stroke="#FFB800"
                strokeWidth="1.5"
              />

              {/* 5. SECTOR 4: NEURAL SKILL LAB (North-West Platform) */}
              <polygon
                points="420,160 700,310 490,440 210,300"
                fill="url(#terrainLab)"
                stroke="#00FF87"
                strokeWidth="1.8"
              />

              {/* 6. SECTOR 5 & 6: LOOT VAULT & CAREER HUB (West / South-West Platform) */}
              <polygon
                points="180,330 460,470 270,610 30,460"
                fill="url(#terrainCareer)"
                stroke="#F472F6"
                strokeWidth="1.8"
              />

              {/* ======================================================= */}
              {/* GLOWING ENERGY CONDUITS / DATA HIGHWAYS                 */}
              {/* ======================================================= */}
              {/* Conduit: Citadel to Course Archipelago */}
              <line x1="790" y1="320" x2="960" y2="280" stroke="#00F0FF" strokeWidth="4" filter="url(#conduitGlow)" strokeLinecap="round" />
              <line x1="790" y1="320" x2="960" y2="280" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="8 6" className="animate-pulse" />

              {/* Conduit: Citadel to Survivor Arena */}
              <line x1="700" y1="400" x2="700" y2="520" stroke="#FF2E63" strokeWidth="4" filter="url(#conduitGlow)" strokeLinecap="round" />
              <line x1="700" y1="400" x2="700" y2="520" stroke="#FFB800" strokeWidth="1.5" strokeDasharray="8 6" className="animate-pulse" />

              {/* Conduit: Citadel to Neural Skill Lab */}
              <line x1="610" y1="320" x2="460" y2="260" stroke="#00FF87" strokeWidth="4" filter="url(#conduitGlow)" strokeLinecap="round" />
              <line x1="610" y1="320" x2="460" y2="260" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="8 6" className="animate-pulse" />

              {/* Conduit: Citadel to Career Hub & Loot Vault */}
              <line x1="610" y1="350" x2="350" y2="460" stroke="#F472F6" strokeWidth="4" filter="url(#conduitGlow)" strokeLinecap="round" />
              <line x1="610" y1="350" x2="350" y2="460" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="8 6" className="animate-pulse" />

              {/* ======================================================= */}
              {/* DECORATIVE PROPS: CYBER TREES, PYLONS & CRYSTALS       */}
              {/* ======================================================= */}
              {/* Cyber Energy Trees (Hexagonal Luminescent Foliage) */}
              {[
                { x: 550, y: 220, color: '#00F0FF' },
                { x: 860, y: 220, color: '#A855F7' },
                { x: 1120, y: 240, color: '#00F0FF' },
                { x: 1040, y: 520, color: '#A855F7' },
                { x: 420, y: 540, color: '#FF2E63' },
                { x: 260, y: 240, color: '#00FF87' },
                { x: 140, y: 390, color: '#F472F6' },
                { x: 880, y: 720, color: '#FFB800' },
              ].map((tree, i) => (
                <g key={i} transform={`translate(${tree.x}, ${tree.y})`}>
                  {/* Trunk */}
                  <line x1="0" y1="0" x2="0" y2="16" stroke="#2D1A4A" strokeWidth="3" />
                  {/* Foliage Diamond */}
                  <polygon points="0,-16 10,-4 0,8 -10,-4" fill={tree.color} opacity="0.8" className="animate-pulse" />
                  <circle cx="0" cy="-4" r="2" fill="#FFFFFF" />
                </g>
              ))}

              {/* Energy Defense Pylons at Perimeter Corners */}
              {[
                { x: 700, y: 55, color: '#00F0FF' },
                { x: 1320, y: 450, color: '#00F0FF' },
                { x: 700, y: 845, color: '#FF2E63' },
                { x: 80, y: 450, color: '#F472F6' },
              ].map((pylon, i) => (
                <g key={`pylon_${i}`} transform={`translate(${pylon.x}, ${pylon.y})`}>
                  <polygon points="0,-25 8,0 0,8 -8,0" fill="#1A1035" stroke={pylon.color} strokeWidth="1.5" />
                  <circle cx="0" cy="-25" r="4" fill={pylon.color} className="animate-ping" opacity="0.8" />
                </g>
              ))}
            </svg>

            {/* RENDER LEARNER HERO AVATAR IN THE CITADEL COURTYARD */}
            <BaseHeroCharacter
              activeGoal={store?.goalText || 'Learning'}
              fadingCount={fadingCount}
              onTap={() => setIsHeroModalOpen(true)}
            />

            {/* RENDER INTERACTIVE FLOATING LOOT BUBBLES */}
            {floatingLoots
              .filter((loot) => !loot.collected)
              .map((loot) => {
                const tileW = 160;
                const tileH = 80;
                const px = (loot.gridX - loot.gridY) * (tileW / 2);
                const py = (loot.gridX + loot.gridY) * (tileH / 2);

                return (
                  <div
                    key={loot.id}
                    onClick={(e) => handleCollectLoot(loot, e)}
                    className="absolute cursor-pointer select-none animate-bounce z-40 transition-transform hover:scale-125"
                    style={{
                      left: `calc(50% + ${px}px)`,
                      top: `calc(48% + ${py - 70}px)`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/90 border border-amber-400 text-amber-300 font-mono text-xs font-black shadow-[0_0_20px_rgba(251,191,36,0.7)]">
                      <span>{loot.type === 'gold' ? '🪙' : '💎'}</span>
                      <span>+{loot.amount}</span>
                    </div>
                  </div>
                );
              })}

            {/* RENDER ALL ISOMETRIC BUILDINGS */}
            {buildings.map((building) => (
              <IsometricBuilding
                key={building.id}
                building={building}
                isSelected={selectedBuilding?.id === building.id}
                onClick={handleBuildingClick}
                tileWidth={160}
                tileHeight={80}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 3. FLOATING CAMERA & RECENTER CONTROLS */}
      <div className="absolute top-24 right-3 sm:right-4 z-20 flex flex-col gap-1.5 bg-[#100B24]/90 backdrop-blur-md p-1.5 rounded-2xl border border-white/15 shadow-xl">
        <button
          onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.15))}
          className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/15 flex items-center justify-center text-white transition-colors cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoomLevel((z) => Math.max(0.65, z - 0.15))}
          className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/15 flex items-center justify-center text-white transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setPanOffset({ x: 0, y: 0 });
            setZoomLevel(1);
          }}
          className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/15 flex items-center justify-center text-[#00F0FF] transition-colors cursor-pointer"
          title="Recenter World Map"
        >
          <Compass className="w-4 h-4" />
        </button>
      </div>

      {/* 4. CLASH-STYLE BOTTOM ACTION TRAY */}
      <div className="absolute bottom-16 md:bottom-2 left-0 right-0 z-30">
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
        building={selectedBuilding}
        onClose={() => setSelectedBuilding(null)}
        onBuildingUpdated={loadData}
        totalMastery={totalMastery}
      />

      {/* Course Spires Drawer */}
      <SpiresDrawerModal
        isOpen={isSpiresDrawerOpen}
        onClose={() => setIsSpiresDrawerOpen(false)}
        buildings={buildings}
        onSelectBuilding={(b) => setSelectedBuilding(b)}
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
