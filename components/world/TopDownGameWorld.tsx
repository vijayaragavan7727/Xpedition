'use client';

import React, { useState, useRef, useCallback } from 'react';
import { PlayableGameWorldData, GameBuildingState } from '@/lib/engine/gameWorldAdapter';
import GameTopHud from './GameTopHud';
import WorldBuildingNode from './WorldBuildingNode';
import WorkerCharacter from './WorkerCharacter';
import BuildingDetailModal from './BuildingDetailModal';
import Link from 'next/link';
import { Swords, Compass, Sparkles, Trophy, Flame, Hammer, MapPin } from 'lucide-react';

interface TopDownGameWorldProps {
  worldData: PlayableGameWorldData;
}

export default function TopDownGameWorld({ worldData }: TopDownGameWorldProps) {
  // Pan & Zoom Camera State
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Selected Building for Inspection Modal
  const [selectedBuilding, setSelectedBuilding] = useState<GameBuildingState | null>(null);

  // Upgrade Burst Particle state
  const [upgradeBurst, setUpgradeBurst] = useState<string | null>(null);

  // Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Touch Handlers for Mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPan({
      x: e.touches[0].clientX - dragStartRef.current.x,
      y: e.touches[0].clientY - dragStartRef.current.y,
    });
  };

  const handleTouchEnd = () => setIsDragging(false);

  // Zoom Controls
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const newZoom = Math.min(1.4, Math.max(0.75, zoom - e.deltaY * 0.001));
    setZoom(newZoom);
  };

  const handleUpgradeBuilding = (buildingId: string) => {
    setUpgradeBurst(buildingId);
    setTimeout(() => setUpgradeBurst(null), 2500);
  };

  const { buildings } = worldData;

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none bg-[#14291B] font-sans"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {/* 1. TOP STRATEGY GAME HUD */}
      <GameTopHud
        worldData={worldData}
        onOpenHQ={() => setSelectedBuilding(buildings.knowledgeCore)}
      />

      {/* 2. CONTINUOUS TOP-DOWN GAME MAP CANVAS (Pannable & Zoomable) */}
      <div
        className="absolute inset-0 flex items-center justify-center transition-transform duration-75 ease-out"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
        }}
      >
        {/* World Map Plane (1200 x 1000 px) */}
        <div className="relative w-[1100px] h-[950px] shrink-0 rounded-3xl shadow-[0_20px_80px_rgba(0,0,0,0.8)] overflow-hidden border-4 border-[#1E3A24]">
          {/* =================================================================== */}
          {/* A. ORGANIC TERRAIN BASE: DENSE CHECKERBOARD GRASS & RIVER BANK */}
          {/* =================================================================== */}
          <div className="absolute inset-0 bg-[#2D6A4F]">
            {/* Checkerboard Lawn Grid Pattern */}
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage: `
                  linear-gradient(45deg, #1B4332 25%, transparent 25%), 
                  linear-gradient(-45deg, #1B4332 25%, transparent 25%), 
                  linear-gradient(45deg, transparent 75%, #1B4332 75%), 
                  linear-gradient(-45deg, transparent 75%, #1B4332 75%)
                `,
                backgroundSize: '48px 48px',
                backgroundPosition: '0 0, 0 24px, 24px -24px, -24px 0px',
              }}
            />

            {/* Left River Channel & Shoreline */}
            <div className="absolute top-0 bottom-0 left-0 w-28 bg-gradient-to-r from-[#0284C7] via-[#0369A1] to-[#0F766E] border-r-8 border-[#CA8A04] shadow-inner flex flex-col justify-around items-center">
              <div className="w-full h-8 bg-white/20 blur-[2px] animate-pulse" />
              <div className="w-full h-8 bg-white/10 blur-[2px] animate-pulse" />
              <div className="w-full h-8 bg-white/20 blur-[2px] animate-pulse" />
            </div>

            {/* Perimeter Dense Jungle Forest Canopy */}
            {/* North Border Trees */}
            <div className="absolute top-0 inset-x-0 h-16 bg-[#143621] flex justify-around items-center px-4 border-b-4 border-[#0D2416]">
              {Array.from({ length: 18 }).map((_, i) => (
                <span key={i} className="text-2xl drop-shadow-md">
                  {i % 3 === 0 ? '🌲' : i % 2 === 0 ? '🌳' : '🌴'}
                </span>
              ))}
            </div>

            {/* South Border Trees */}
            <div className="absolute bottom-0 inset-x-0 h-16 bg-[#143621] flex justify-around items-center px-4 border-t-4 border-[#0D2416]">
              {Array.from({ length: 18 }).map((_, i) => (
                <span key={i} className="text-2xl drop-shadow-md">
                  {i % 3 === 0 ? '🌳' : i % 2 === 0 ? '🌲' : '🌴'}
                </span>
              ))}
            </div>

            {/* East Border Trees */}
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-[#143621] flex flex-col justify-around items-center py-4 border-l-4 border-[#0D2416]">
              {Array.from({ length: 14 }).map((_, i) => (
                <span key={i} className="text-2xl drop-shadow-md">
                  {i % 2 === 0 ? '🌳' : '🌲'}
                </span>
              ))}
            </div>

            {/* =================================================================== */}
            {/* B. COBBLESTONE & DIRT PATHWAYS CONNECTING ALL LOCATIONS */}
            {/* =================================================================== */}
            {/* Center Plaza Circular Path */}
            <div className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full border-8 border-dashed border-[#A16207]/60 pointer-events-none" />

            {/* North-South Central Road */}
            <div className="absolute left-1/2 -translate-x-1/2 top-16 bottom-16 w-12 bg-[#854D0E]/60 border-x-2 border-[#713F12] shadow-inner pointer-events-none" />

            {/* East-West Cross Road */}
            <div className="absolute top-[46%] -translate-y-1/2 left-28 right-16 h-12 bg-[#854D0E]/60 border-y-2 border-[#713F12] shadow-inner pointer-events-none" />

            {/* Diagonal Paths to Course Academy and Challenge Arena */}
            <div className="absolute top-[38%] left-[34%] w-44 h-8 bg-[#854D0E]/50 rotate-[-30deg] pointer-events-none rounded-full" />
            <div className="absolute top-[38%] right-[34%] w-44 h-8 bg-[#854D0E]/50 rotate-[30deg] pointer-events-none rounded-full" />

            {/* =================================================================== */}
            {/* C. DEFENSIVE STONE WALL BARRICADES DIVIDING DISTRICTS */}
            {/* =================================================================== */}
            {/* Citadel North Wall */}
            <div className="absolute top-[36%] left-[38%] right-[38%] h-3.5 bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 rounded-sm border border-slate-600 shadow-md flex justify-between px-1">
              <span className="w-2 h-full bg-slate-700" />
              <span className="w-2 h-full bg-slate-700" />
              <span className="w-2 h-full bg-slate-700" />
            </div>

            {/* West Yard Wall */}
            <div className="absolute top-[26%] bottom-[42%] left-[18%] w-3.5 bg-gradient-to-b from-slate-400 via-slate-200 to-slate-400 rounded-sm border border-slate-600 shadow-md" />

            {/* East Yard Wall */}
            <div className="absolute top-[26%] bottom-[42%] right-[18%] w-3.5 bg-gradient-to-b from-slate-400 via-slate-200 to-slate-400 rounded-sm border border-slate-600 shadow-md" />

            {/* =================================================================== */}
            {/* D. NATURAL PROPS: FLOWERS, ROCK CLUSTERS, CAMPFIRE, LUMBER PILES */}
            {/* =================================================================== */}
            {/* Central Courtyard Campfire with Animated Flame */}
            <div className="absolute left-[50%] top-[56%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-amber-950 border-2 border-amber-800 flex items-center justify-center shadow-lg">
                <span className="text-base animate-bounce">🔥</span>
              </div>
              <span className="text-[10px] font-mono text-amber-200 font-bold">Campfire</span>
            </div>

            {/* Lumber Depot with Stacked Timber */}
            <div className="absolute left-[38%] top-[24%] flex items-center gap-1 p-1 bg-amber-950/40 rounded-lg border border-amber-800">
              <span className="text-lg">🪵</span>
              <span className="text-[10px] font-mono font-bold text-amber-300">Lumber</span>
            </div>

            {/* Gold Quarry Vein */}
            <div className="absolute right-[36%] top-[24%] flex items-center gap-1 p-1 bg-slate-900/60 rounded-lg border border-amber-500/40">
              <span className="text-lg">⛏️</span>
              <span className="text-[10px] font-mono font-bold text-yellow-300">Quarry</span>
            </div>

            {/* Flower Beds & Bushes scattered organically */}
            <div className="absolute top-[28%] left-[45%] text-sm animate-pulse">🌸🌼</div>
            <div className="absolute top-[64%] left-[36%] text-sm">🌺🌷</div>
            <div className="absolute top-[64%] right-[36%] text-sm">🌻🌹</div>
            <div className="absolute top-[32%] right-[44%] text-sm">🌿🪨</div>
          </div>

          {/* =================================================================== */}
          {/* E. 7 DATA-DRIVEN TOP-DOWN GAME BUILDING NODES */}
          {/* =================================================================== */}
          {/* 1. KNOWLEDGE CORE (Town Hall Citadel - Center) */}
          <WorldBuildingNode
            building={buildings.knowledgeCore}
            isSelected={selectedBuilding?.type === 'knowledge_core'}
            onClick={() => setSelectedBuilding(buildings.knowledgeCore)}
          />

          {/* 2. COURSE ACADEMY (Observatory & Library - North-West) */}
          <WorldBuildingNode
            building={buildings.courseAcademy}
            isSelected={selectedBuilding?.type === 'course_academy'}
            onClick={() => setSelectedBuilding(buildings.courseAcademy)}
          />

          {/* 3. SKILL LAB (Alchemical Mana Vat - West) */}
          <WorldBuildingNode
            building={buildings.skillLab}
            isSelected={selectedBuilding?.type === 'skill_lab'}
            onClick={() => setSelectedBuilding(buildings.skillLab)}
          />

          {/* 4. CHALLENGE ARENA (Battle Colosseum - North-East) */}
          <WorldBuildingNode
            building={buildings.challengeArena}
            isSelected={selectedBuilding?.type === 'challenge_arena'}
            onClick={() => setSelectedBuilding(buildings.challengeArena)}
          />

          {/* 5. REWARD VAULT (Treasury & Gold Reserves - East) */}
          <WorldBuildingNode
            building={buildings.rewardVault}
            isSelected={selectedBuilding?.type === 'reward_vault'}
            onClick={() => setSelectedBuilding(buildings.rewardVault)}
          />

          {/* 6. PRACTICE GROUNDS (Shader & Builder Forge - North-Center) */}
          <WorldBuildingNode
            building={buildings.practiceGrounds}
            isSelected={selectedBuilding?.type === 'practice_grounds'}
            onClick={() => setSelectedBuilding(buildings.practiceGrounds)}
          />

          {/* 7. CAREER HUB (Industry Learning Spire - South-Center) */}
          <WorldBuildingNode
            building={buildings.careerHub}
            isSelected={selectedBuilding?.type === 'career_hub'}
            onClick={() => setSelectedBuilding(buildings.careerHub)}
          />

          {/* =================================================================== */}
          {/* F. ANIMATED WORKERS WALKING BETWEEN BUILDING DISTRICTS */}
          {/* =================================================================== */}
          <WorkerCharacter
            startPos={{ x: 50, y: 46 }}
            endPos={{ x: 26, y: 30 }}
            speed={8}
            resource="wood"
            color="#38BDF8"
            name="Builder 1"
          />
          <WorkerCharacter
            startPos={{ x: 50, y: 46 }}
            endPos={{ x: 74, y: 30 }}
            speed={9}
            resource="gold"
            color="#F59E0B"
            name="Builder 2"
          />
          <WorkerCharacter
            startPos={{ x: 50, y: 46 }}
            endPos={{ x: 25, y: 62 }}
            speed={7}
            resource="crystal"
            color="#A855F7"
            name="Builder 3"
          />
          <WorkerCharacter
            startPos={{ x: 50, y: 46 }}
            endPos={{ x: 50, y: 22 }}
            speed={6}
            resource="hammer"
            color="#EF4444"
            name="Smith"
          />

          {/* Upgrade Starburst Celebration Effect */}
          {upgradeBurst && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-40">
              <div className="p-6 rounded-3xl bg-[#0F172A]/90 border-2 border-amber-400 shadow-[0_0_50px_rgba(250,204,21,0.9)] text-center space-y-2 animate-bounce">
                <span className="text-4xl">⭐</span>
                <h3 className="font-sans font-black text-xl text-amber-300">
                  STRUCTURE UPGRADED!
                </h3>
                <p className="font-mono text-xs text-white">
                  Village Power Increased! +150 XP
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. BOTTOM QUICK ACTION CONTROLS */}
      <div className="absolute bottom-4 inset-x-0 z-30 pointer-events-none flex justify-between items-end px-4 max-w-5xl mx-auto">
        {/* Left: Quest Attack Battle Button */}
        <Link
          href="/quest"
          className="pointer-events-auto h-13 px-4 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-mono font-black text-xs sm:text-sm flex items-center gap-2 border-2 border-amber-300 shadow-[0_10px_25px_rgba(220,38,38,0.7)] active:scale-95 transition-all cursor-pointer"
        >
          <Swords className="w-5 h-5 fill-white" />
          <span>ATTACK / QUEST</span>
        </Link>

        {/* Center: Zoom Controls */}
        <div className="pointer-events-auto hidden sm:flex items-center gap-1.5 p-1 rounded-xl bg-[#0F172A]/90 border border-white/20 backdrop-blur-md shadow-lg">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(1.4, z + 0.15))}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono font-bold text-sm flex items-center justify-center cursor-pointer"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="px-2.5 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono text-[11px] font-bold flex items-center justify-center cursor-pointer"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.75, z - 0.15))}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono font-bold text-sm flex items-center justify-center cursor-pointer"
          >
            -
          </button>
        </div>

        {/* Right: Quick Building Directory */}
        <button
          type="button"
          onClick={() => setSelectedBuilding(buildings.knowledgeCore)}
          className="pointer-events-auto h-13 px-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono font-black text-xs sm:text-sm flex items-center gap-2 border-2 border-cyan-300 shadow-[0_10px_25px_rgba(2,132,199,0.7)] active:scale-95 transition-all cursor-pointer"
        >
          <Hammer className="w-5 h-5 fill-white" />
          <span>VILLAGE HQ</span>
        </button>
      </div>

      {/* 4. BUILDING INSPECTION DETAIL MODAL */}
      <BuildingDetailModal
        building={selectedBuilding}
        onClose={() => setSelectedBuilding(null)}
        onUpgrade={handleUpgradeBuilding}
      />
    </div>
  );
}
