'use client';

import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface QuestBoardBuildingProps {
  level: number;
  position?: [number, number, number];
  isSelected?: boolean;
  onClick?: () => void;
  availableQuestsCount?: number;
}

export default function QuestBoardBuilding({
  level = 1,
  position = [3.5, 0, 0.5],
  isSelected = false,
  onClick,
  availableQuestsCount = 3,
}: QuestBoardBuildingProps) {
  const boardRef = useRef<THREE.Group>(null);
  const lanternRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (boardRef.current) {
      boardRef.current.position.y = Math.sin(t * 1.6) * 0.025;
    }
    if (lanternRef.current) {
      lanternRef.current.rotation.y = t * 1.5;
    }
  });

  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* 1. Floating Building Name & Stats Badge */}
      <Html position={[0, 2.3, 0]} center distanceFactor={14} zIndexRange={[100, 0]}>
        <div
          onClick={onClick}
          className={`px-3 py-1 rounded-xl backdrop-blur-md border text-white font-mono text-[11px] font-bold shadow-2xl flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all select-none ${
            isSelected
              ? 'bg-[#F59E0B]/30 border-[#F59E0B] shadow-[0_0_20px_rgba(245,158,11,0.6)] scale-105'
              : 'bg-black/75 border-white/20 hover:border-[#F59E0B]/70'
          }`}
        >
          <span className="text-sm">🎯</span>
          <span>Quest Board</span>
          <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-[#F59E0B] text-[9px] uppercase font-mono">
            {availableQuestsCount} Quests
          </span>
        </div>
      </Html>

      {/* 2. Interactive Selection Ground Ring */}
      {(isSelected || hovered) && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.2, 1.35, 32]} />
          <meshBasicMaterial color={isSelected ? '#00FF87' : '#F59E0B'} />
        </mesh>
      )}

      {/* 3. Real 3D Quest Board Geometry */}
      <group ref={boardRef}>
        {/* Stone Foundation Base */}
        <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.9, 0.24, 1.2]} />
          <meshStandardMaterial color="#334155" roughness={0.9} />
        </mesh>

        {/* Wooden Support Posts */}
        {[-0.65, 0.65].map((x, i) => (
          <mesh key={`post_${i}`} position={[x, 0.85, 0]} castShadow>
            <boxGeometry args={[0.14, 1.4, 0.14]} />
            <meshStandardMaterial color="#78350F" roughness={0.8} />
          </mesh>
        ))}

        {/* Main Notice Board Plaque */}
        <mesh position={[0, 0.95, 0.02]} castShadow receiveShadow>
          <boxGeometry args={[1.35, 0.9, 0.08]} />
          <meshStandardMaterial color="#B45309" roughness={0.7} />
        </mesh>

        {/* Board Roof Canopy */}
        <mesh position={[0, 1.48, 0]} castShadow>
          <boxGeometry args={[1.55, 0.18, 0.35]} />
          <meshStandardMaterial color="#92400E" roughness={0.6} />
        </mesh>

        {/* Glowing Parchment Notice Cards */}
        <mesh position={[-0.32, 1.05, 0.07]}>
          <boxGeometry args={[0.36, 0.42, 0.02]} />
          <meshStandardMaterial color="#FEF08A" emissive="#FEF08A" emissiveIntensity={1.5} />
        </mesh>
        <mesh position={[0.32, 1.05, 0.07]}>
          <boxGeometry args={[0.36, 0.42, 0.02]} />
          <meshStandardMaterial color="#BAE6FD" emissive="#BAE6FD" emissiveIntensity={1.5} />
        </mesh>
        <mesh position={[0, 0.72, 0.07]}>
          <boxGeometry args={[0.8, 0.28, 0.02]} />
          <meshStandardMaterial color="#FED7AA" emissive="#FED7AA" emissiveIntensity={1.2} />
        </mesh>

        {/* Hanging Lantern (Level 2+) */}
        {level >= 2 && (
          <group position={[0.8, 1.3, 0]}>
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.3, 6]} />
              <meshStandardMaterial color="#334155" />
            </mesh>
            <mesh ref={lanternRef} position={[0, -0.22, 0]}>
              <octahedronGeometry args={[0.14, 0]} />
              <meshStandardMaterial color="#F59E0B" emissive="#F59E0B" emissiveIntensity={3} />
            </mesh>
            <pointLight position={[0, -0.22, 0]} color="#F59E0B" intensity={2.0} distance={3.5} />
          </group>
        )}
      </group>
    </group>
  );
}
