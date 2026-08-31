'use client';

import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface ArchivistNPCProps {
  position?: [number, number, number];
  onClick?: () => void;
  masteredCount?: number;
}

export default function ArchivistNPC({
  position = [-2.2, 0, 1.4],
  onClick,
  masteredCount = 3,
}: ArchivistNPCProps) {
  const groupRef = useRef<THREE.Group>(null);
  const tabletRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(t * 2) * 0.025;
    }
    if (tabletRef.current) {
      tabletRef.current.rotation.z = Math.sin(t * 3) * 0.08;
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
      {/* 1. Floating NPC Prompt Badge */}
      <Html position={[0, 1.4, 0]} center distanceFactor={14} zIndexRange={[100, 0]}>
        <div
          onClick={onClick}
          className="px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-500 text-white font-mono text-[9px] font-bold shadow-lg flex items-center gap-1 cursor-pointer border border-white/40 select-none animate-pulse"
        >
          <span>📜</span>
          <span>Lexi</span>
        </div>
      </Html>

      {/* 2. Low-Poly Humanoid Scholar Body */}
      <group ref={groupRef}>
        {/* Robe / Torso */}
        <mesh position={[0, 0.52, 0]} castShadow>
          <coneGeometry args={[0.26, 0.65, 8]} />
          <meshStandardMaterial color="#6D28D9" roughness={0.6} />
        </mesh>

        {/* Head */}
        <mesh position={[0, 0.95, 0]} castShadow>
          <boxGeometry args={[0.22, 0.24, 0.22]} />
          <meshStandardMaterial color="#FDBA74" roughness={0.7} />
        </mesh>

        {/* Scholar Hat / Hood */}
        <mesh position={[0, 1.08, -0.02]} castShadow>
          <coneGeometry args={[0.24, 0.28, 6]} />
          <meshStandardMaterial color="#4C1D95" />
        </mesh>

        {/* Glowing Holographic Knowledge Tablet */}
        <mesh ref={tabletRef} position={[0, 0.55, 0.22]} rotation={[0.4, 0, 0]}>
          <boxGeometry args={[0.28, 0.2, 0.02]} />
          <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={2.5} />
        </mesh>

        {/* Arms */}
        <mesh position={[-0.18, 0.55, 0.08]} rotation={[0.4, -0.2, 0]}>
          <boxGeometry args={[0.08, 0.28, 0.08]} />
          <meshStandardMaterial color="#5B21B6" />
        </mesh>
        <mesh position={[0.18, 0.55, 0.08]} rotation={[0.4, 0.2, 0]}>
          <boxGeometry args={[0.08, 0.28, 0.08]} />
          <meshStandardMaterial color="#5B21B6" />
        </mesh>
      </group>

      {/* 3. Ground Halo */}
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.25, 0.38, 16]} />
        <meshBasicMaterial color={hovered ? '#00FF87' : '#C084FC'} transparent opacity={0.5} />
      </mesh>
    </group>
  );
}
