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
import WorkerNPC from './WorkerNPC';
import XPParticleEmitter from './XPParticleEmitter';
import GameHUD from './GameHUD';
import { PlayableGameWorldData, GameBuildingState } from '@/lib/engine/gameWorldAdapter';

interface GameCanvasProps {
  worldData: PlayableGameWorldData;
  onUpgradeHQ?: () => void;
}

export default function GameCanvas({ worldData }: GameCanvasProps) {
  // Player target point on the 3D base
  const [characterTarget, setCharacterTarget] = useState<[number, number, number]>([0, 0, 0]);
  
  // Pending target interaction triggered when character reaches the building
  const [pendingModal, setPendingModal] = useState<'building' | 'mentor' | 'archivist' | null>(null);
  const [activeModal, setActiveModal] = useState<'building' | 'mentor' | 'archivist' | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<GameBuildingState | null>(null);
  
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

  // 2. Click on Building -> Character walks to it, then opens detailed building dialog
  const handleSelectBuilding = useCallback(
    (buildingKey: keyof PlayableGameWorldData['buildings']) => {
      const bldg = worldData.buildings[buildingKey];
      if (!bldg) return;

      setSelectedBuilding(bldg);

      // Target position slightly in front of building
      let target: [number, number, number] = [bldg.position[0], 0, bldg.position[2] + 1.2];
      if (bldg.type === 'hq') target = [0, 0, -0.6];
      if (bldg.type === 'library') target = [-2.6, 0, -1.2];
      if (bldg.type === 'quest_board') target = [2.6, 0, -1.2];

      setCharacterTarget(target);
      setPendingModal('building');
    },
    [worldData.buildings]
  );

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

        {/* 3. Real 3D Tactical Base Buildings (Mapped to Learner Skills) */}
        {/* Town Hall (North Center) */}
        <LearningHQ
          level={hqLevel}
          position={[0, 0, -1.8]}
          isSelected={activeModal === 'building' && selectedBuilding?.type === 'hq'}
          onClick={() => handleSelectBuilding('hq')}
        />

        {/* Grand Archives / Library (North-West) */}
        <LibraryBuilding
          level={worldData.buildings.library.level}
          position={[-3.8, 0, -1.5]}
          isSelected={activeModal === 'building' && selectedBuilding?.type === 'library'}
          onClick={() => handleSelectBuilding('library')}
          masteredCount={worldData.masteredTopicsCount}
        />

        {/* Quest Outpost (North-East) */}
        <QuestBoardBuilding
          level={worldData.buildings.questBoard.level}
          position={[3.8, 0, -1.5]}
          isSelected={activeModal === 'building' && selectedBuilding?.type === 'quest_board'}
          onClick={() => handleSelectBuilding('questBoard')}
          availableQuestsCount={worldData.availableQuestsCount}
        />

        {/* Gold Vault (West Courtyard) */}
        <GoldVaultBuilding
          level={worldData.buildings.goldVault?.level || 1}
          position={[-3.6, 0, 2.2]}
          isSelected={activeModal === 'building' && selectedBuilding?.type === 'gold_vault'}
          onClick={() => handleSelectBuilding('goldVault')}
          goldCount={worldData.resources.gold}
        />

        {/* AI Research Spire (East Courtyard) */}
        <AILabBuilding
          position={[3.6, 0, 2.2]}
          isSelected={activeModal === 'building' && selectedBuilding?.type === 'ai_lab'}
          onClick={() => handleSelectBuilding('aiLab')}
          accuracyRate={worldData.accuracyRate}
        />

        {/* Mana Condenser (South-West) */}
        <ElixirCondenserBuilding
          level={worldData.buildings.elixirCondenser?.level || 1}
          position={[-1.8, 0, 3.6]}
          isSelected={activeModal === 'building' && selectedBuilding?.type === 'elixir_condenser'}
          onClick={() => handleSelectBuilding('elixirCondenser')}
          crystalCount={worldData.resources.crystal}
        />

        {/* Builder's Forge (South-East) */}
        <BuilderWorkshopBuilding
          level={worldData.buildings.workshop?.level || 1}
          position={[1.8, 0, 3.6]}
          isSelected={activeModal === 'building' && selectedBuilding?.type === 'workshop'}
          onClick={() => handleSelectBuilding('workshop')}
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

        {/* 5. Dynamic Base Workers Walking Around */}
        {worldData.workerCount >= 2 && (
          <WorkerNPC
            id="worker_1"
            startPos={[-3.0, 0, 2.2]}
            endPos={[0, 0, -1.0]}
            speed={1.1}
            color="#38BDF8"
            hasResource={true}
          />
        )}
        {worldData.workerCount >= 3 && (
          <WorkerNPC
            id="worker_2"
            startPos={[1.8, 0, 3.0]}
            endPos={[3.0, 0, -1.0]}
            speed={0.9}
            color="#F59E0B"
            hasResource={true}
          />
        )}
        {worldData.workerCount >= 4 && (
          <WorkerNPC
            id="worker_3"
            startPos={[-1.8, 0, 3.0]}
            endPos={[-3.0, 0, -1.0]}
            speed={1.3}
            color="#A855F7"
            hasResource={true}
          />
        )}
        {worldData.workerCount >= 5 && (
          <WorkerNPC
            id="worker_4"
            startPos={[3.0, 0, 1.8]}
            endPos={[0, 0, 1.5]}
            speed={1.0}
            color="#10B981"
            hasResource={false}
          />
        )}

        {/* 6. XP Particle Emitter & Flying Orbs */}
        <XPParticleEmitter burstPosition={burstPos} activeOrbs={activeOrbs} />

        {/* 7. Mobile & Desktop Strategy Controls */}
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
        activeBuilding={selectedBuilding}
        activeModal={activeModal}
        onCloseModal={() => {
          setActiveModal(null);
          setSelectedBuilding(null);
        }}
        onUpgradeHQ={handleUpgradeHQ}
        onSelectBuilding={handleSelectBuilding}
      />
    </div>
  );
}
