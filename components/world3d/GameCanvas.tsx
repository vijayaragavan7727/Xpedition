'use client';

import React, { useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import PlayableIsland from './PlayableIsland';
import PlayerCharacter from './PlayerCharacter';
import LearningHQ from './LearningHQ';
import LibraryBuilding from './LibraryBuilding';
import QuestBoardBuilding from './QuestBoardBuilding';
import AILabBuilding from './AILabBuilding';
import GoldVaultBuilding from './GoldVaultBuilding';
import ElixirCondenserBuilding from './ElixirCondenserBuilding';
import BuilderWorkshopBuilding from './BuilderWorkshopBuilding';
import MentorNPC from './MentorNPC';
import ArchivistNPC from './ArchivistNPC';
import XPParticleEmitter from './XPParticleEmitter';
import GameHUD from './GameHUD';
import { PlayableGameWorldData } from '@/lib/engine/gameWorldAdapter';

interface GameCanvasProps {
  worldData: PlayableGameWorldData;
  onUpgradeHQ?: () => void;
}

export default function GameCanvas({ worldData }: GameCanvasProps) {
  // Player target point on the 3D base
  const [characterTarget, setCharacterTarget] = useState<[number, number, number]>([0, 0, 0]);
  
  // Pending target interaction triggered when character reaches the building
  const [pendingModal, setPendingModal] = useState<'hq' | 'library' | 'quest_board' | 'ai_lab' | 'mentor' | 'archivist' | null>(null);
  const [activeModal, setActiveModal] = useState<'hq' | 'library' | 'quest_board' | 'ai_lab' | 'mentor' | 'archivist' | null>(null);
  
  // Dynamic HQ Building Level for 3D construction visual upgrades
  const [hqLevel, setHqLevel] = useState<number>(worldData.buildings.hq.level);
  
  // Celebration burst position
  const [burstPos, setBurstPos] = useState<[number, number, number] | null>(null);

  // Flying XP Orbs
  const [activeOrbs, setActiveOrbs] = useState<any[]>([]);

  // 1. Click on Ground -> Character walks to that point
  const handleGroundClick = useCallback((point: [number, number, number]) => {
    setCharacterTarget(point);
    setPendingModal(null);
  }, []);

  // 2. Click on Building or NPC -> Character walks to it, then opens modal
  const handleSelectBuilding = useCallback((type: 'hq' | 'library' | 'quest_board' | 'ai_lab') => {
    let target: [number, number, number] = [0, 0, -0.6]; // Town Hall courtyard entrance
    if (type === 'library') target = [-2.8, 0, -1.2];
    if (type === 'quest_board') target = [2.8, 0, -1.2];
    if (type === 'ai_lab') target = [2.6, 0, 1.8];

    setCharacterTarget(target);
    setPendingModal(type);
  }, []);

  const handleMentorClick = useCallback(() => {
    setCharacterTarget([0.8, 0, 0.6]);
    setPendingModal('mentor');
  }, []);

  const handleArchivistClick = useCallback(() => {
    setCharacterTarget([-1.2, 0, 0.6]);
    setPendingModal('archivist');
  }, []);

  // 3. Character reached target callback
  const handleCharacterReached = useCallback(() => {
    if (pendingModal) {
      setActiveModal(pendingModal);
      setPendingModal(null);
    }
  }, [pendingModal]);

  // 4. Trigger Real 3D Construction & Upgrade Sequence
  const handleUpgradeHQ = useCallback(() => {
    const nextLevel = hqLevel >= 3 ? 1 : hqLevel + 1;
    setHqLevel(nextLevel);

    // Trigger celebration particles at HQ position
    setBurstPos([0, 1.5, -1.8]);

    // Send flying XP orbs from character to HQ
    const newOrb = {
      id: `orb_${Date.now()}`,
      startPos: characterTarget,
      targetPos: [0, 2.0, -1.8],
      color: '#00FF87',
      progress: 0,
      speed: 1.5,
    };
    setActiveOrbs((prev) => [...prev, newOrb]);

    setTimeout(() => {
      setBurstPos(null);
      setActiveOrbs([]);
    }, 2500);
  }, [hqLevel, characterTarget]);

  return (
    <div className="relative w-full h-full min-h-[500px] select-none overflow-hidden bg-[#0A071B]">
      {/* 3D WebGL Canvas */}
      <Canvas
        camera={{ position: [13, 14, 13], fov: 38 }}
        style={{ width: '100%', height: '100%', touchAction: 'none' }}
        shadows
      >
        {/* Sky Background */}
        <color attach="background" args={['#0A071B']} />

        {/* Tactical Base Lighting */}
        <ambientLight intensity={0.85} />
        <directionalLight
          position={[14, 20, 12]}
          intensity={1.3}
          color="#FFFBEB"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight position={[0, 6, 0]} color="#00F0FF" intensity={0.8} distance={15} />

        {/* 1. Playable Tactical Base Checkerboard Terrain & Walls */}
        <PlayableIsland onGroundClick={handleGroundClick} worldLevel={worldData.worldLevel} />

        {/* 2. Low-Poly Learner Avatar */}
        <PlayerCharacter
          learnerName={worldData.learnerName}
          learnerLevel={worldData.learnerLevel}
          targetPosition={characterTarget}
          onReachedTarget={handleCharacterReached}
        />

        {/* 3. Real 3D Tactical Base Buildings */}
        {/* Town Hall / Sovereign Keep (North Center) */}
        <LearningHQ
          level={hqLevel}
          position={[0, 0, -1.8]}
          isSelected={activeModal === 'hq' || pendingModal === 'hq'}
          onClick={() => handleSelectBuilding('hq')}
        />

        {/* Grand Archives / Library (North-West Yard) */}
        <LibraryBuilding
          level={worldData.buildings.library.level}
          position={[-3.8, 0, -1.5]}
          isSelected={activeModal === 'library' || pendingModal === 'library'}
          onClick={() => handleSelectBuilding('library')}
          masteredCount={worldData.masteredTopicsCount}
        />

        {/* Quest Outpost (North-East Yard) */}
        <QuestBoardBuilding
          level={worldData.buildings.questBoard.level}
          position={[3.8, 0, -1.5]}
          isSelected={activeModal === 'quest_board' || pendingModal === 'quest_board'}
          onClick={() => handleSelectBuilding('quest_board')}
          availableQuestsCount={worldData.availableQuestsCount}
        />

        {/* Gold Vault (West Courtyard) */}
        <GoldVaultBuilding
          level={worldData.buildings.goldVault?.level || 1}
          position={[-3.6, 0, 2.2]}
          isSelected={false}
          onClick={() => handleGroundClick([-3.6, 0, 2.2])}
          goldCount={worldData.resources.gold}
        />

        {/* AI Research Spire (East Courtyard) */}
        <AILabBuilding
          position={[3.6, 0, 2.2]}
          isSelected={activeModal === 'ai_lab' || pendingModal === 'ai_lab'}
          onClick={() => handleSelectBuilding('ai_lab')}
          accuracyRate={worldData.accuracyRate}
        />

        {/* Mana Condenser (South-West Yard) */}
        <ElixirCondenserBuilding
          level={worldData.buildings.elixirCondenser?.level || 1}
          position={[-1.8, 0, 3.6]}
          isSelected={false}
          onClick={() => handleGroundClick([-1.8, 0, 3.6])}
          crystalCount={worldData.resources.crystal}
        />

        {/* Builder's Forge / Workshop (South-East Yard) */}
        <BuilderWorkshopBuilding
          level={worldData.buildings.workshop?.level || 1}
          position={[1.8, 0, 3.6]}
          isSelected={false}
          onClick={() => handleGroundClick([1.8, 0, 3.6])}
        />

        {/* 4. Interactive NPCs */}
        {/* Mentor NPC (XYRA) */}
        <MentorNPC
          position={[1.2, 0, 0.6]}
          onClick={handleMentorClick}
          hasQuestAvailable={true}
        />

        {/* Archivist NPC (Lexi) */}
        <ArchivistNPC
          position={[-1.4, 0, 0.6]}
          onClick={handleArchivistClick}
          masteredCount={worldData.masteredTopicsCount}
        />

        {/* 5. XP Particle Emitter & Flying Orbs */}
        <XPParticleEmitter burstPosition={burstPos} activeOrbs={activeOrbs} />

        {/* 6. Mobile & Desktop Strategy Controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          maxPolarAngle={Math.PI / 2.2}
          minDistance={6}
          maxDistance={24}
          makeDefault
        />
      </Canvas>

      {/* Strategy Game HUD Overlay */}
      <GameHUD
        worldData={worldData}
        activeModal={activeModal}
        onCloseModal={() => setActiveModal(null)}
        onUpgradeHQ={handleUpgradeHQ}
        onSelectBuilding={handleSelectBuilding}
      />
    </div>
  );
}
