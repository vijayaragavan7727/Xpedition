'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import PlayableIsland from './PlayableIsland';
import PlayerCharacter from './PlayerCharacter';
import LearningHQ from './LearningHQ';
import LibraryBuilding from './LibraryBuilding';
import QuestBoardBuilding from './QuestBoardBuilding';
import MentorNPC from './MentorNPC';
import XPParticleEmitter from './XPParticleEmitter';
import GameHUD from './GameHUD';
import { PlayableGameWorldData } from '@/lib/engine/gameWorldAdapter';

interface GameCanvasProps {
  worldData: PlayableGameWorldData;
  onUpgradeHQ?: () => void;
}

export default function GameCanvas({ worldData }: GameCanvasProps) {
  // Player target point on the 3D island
  const [characterTarget, setCharacterTarget] = useState<[number, number, number]>([0, 0, 0]);
  
  // Pending target interaction triggered when character reaches the building
  const [pendingModal, setPendingModal] = useState<'hq' | 'library' | 'quest_board' | 'mentor' | null>(null);
  const [activeModal, setActiveModal] = useState<'hq' | 'library' | 'quest_board' | 'mentor' | null>(null);
  
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
  const handleSelectBuilding = useCallback((type: 'hq' | 'library' | 'quest_board') => {
    let target: [number, number, number] = [0, 0, -1.8]; // HQ entrance
    if (type === 'library') target = [-2.2, 0, 0.5];
    if (type === 'quest_board') target = [2.2, 0, 0.5];

    setCharacterTarget(target);
    setPendingModal(type);
  }, []);

  const handleMentorClick = useCallback(() => {
    setCharacterTarget([1.0, 0, 0.8]);
    setPendingModal('mentor');
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
    setBurstPos([0, 1.5, -3.2]);

    // Send flying XP orbs from character to HQ
    const newOrb = {
      id: `orb_${Date.now()}`,
      startPos: characterTarget,
      targetPos: [0, 2.0, -3.2],
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
    <div className="relative w-full h-full min-h-[500px] select-none overflow-hidden bg-[#080512]">
      {/* 3D WebGL Canvas */}
      <Canvas
        camera={{ position: [8, 8, 9], fov: 45 }}
        style={{ width: '100%', height: '100%', touchAction: 'none' }}
        shadows
      >
        {/* Deep Atmosphere Sky Color */}
        <color attach="background" args={['#080512']} />

        {/* Scene Lighting */}
        <ambientLight intensity={0.75} />
        <directionalLight
          position={[10, 16, 8]}
          intensity={1.1}
          color="#E0F2FE"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight position={[0, 4, 0]} color="#00F0FF" intensity={0.8} distance={10} />

        {/* 1. Playable Floating Island Terrain */}
        <PlayableIsland onGroundClick={handleGroundClick} worldLevel={worldData.worldLevel} />

        {/* 2. Low-Poly Learner Avatar */}
        <PlayerCharacter
          learnerName={worldData.learnerName}
          learnerLevel={worldData.learnerLevel}
          targetPosition={characterTarget}
          onReachedTarget={handleCharacterReached}
        />

        {/* 3. Real 3D Interactive Buildings */}
        {/* Learning HQ (North) */}
        <LearningHQ
          level={hqLevel}
          isSelected={activeModal === 'hq' || pendingModal === 'hq'}
          onClick={() => handleSelectBuilding('hq')}
        />

        {/* Library (West) */}
        <LibraryBuilding
          level={worldData.buildings.library.level}
          isSelected={activeModal === 'library' || pendingModal === 'library'}
          onClick={() => handleSelectBuilding('library')}
          masteredCount={worldData.masteredTopicsCount}
        />

        {/* Quest Board (East) */}
        <QuestBoardBuilding
          level={worldData.buildings.questBoard.level}
          isSelected={activeModal === 'quest_board' || pendingModal === 'quest_board'}
          onClick={() => handleSelectBuilding('quest_board')}
          availableQuestsCount={worldData.availableQuestsCount}
        />

        {/* 4. Interactive Mentor NPC (XYRA) */}
        <MentorNPC
          position={[1.4, 0, 1.2]}
          onClick={handleMentorClick}
          hasQuestAvailable={true}
        />

        {/* 5. XP Particle Emitter & Flying Orbs */}
        <XPParticleEmitter burstPosition={burstPos} activeOrbs={activeOrbs} />

        {/* 6. Orbit Controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          maxPolarAngle={Math.PI / 2.2}
          minDistance={4.5}
          maxDistance={22}
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
