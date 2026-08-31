'use client';

import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface LibraryBuildingProps {
  level: number;
  position?: [number, number, number];
  isSelected?: boolean;
  onClick?: () => void;
  masteredCount?: number;
}

export default function LibraryBuilding({
  level = 1,
  position = [-3.5, 0, 0.5],
  isSelected = false,
  onClick,
  masteredCount = 3,
}: LibraryBuildingProps) {
  const domeRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.8;
      ringRef.current.rotation.x = Math.sin(t * 0.5) * 0.3;
    }
    if (domeRef.current) {
      domeRef.current.position.y = Math.sin(t * 1.8) * 0.03;
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
      {/* 1. Floating Name & Stats Badge */}
      <Html position={[0, 2.6, 0]} center distanceFactor={14} zIndexRange={[100, 0]}>
        <div
          onClick={onClick}
          className={`px-3 py-1 rounded-xl backdrop-blur-md border text-white font-mono text-[11px] font-bold shadow-2xl flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all select-none ${
            isSelected
              ? 'bg-[#C084FC]/30 border-[#C084FC] shadow-[0_0_20px_rgba(192,132,252,0.6)] scale-105'
              : 'bg-black/75 border-white/20 hover:border-[#C084FC]/70'
          }`}
        >
          <span className="text-sm">📚</span>
          <span>Library</span>
          <span className="px-1.5 py-0.2 rounded bg-purple-400/20 text-[#C084FC] text-[9px] uppercase font-mono">
            {masteredCount} Mastered
          </span>
        </div>
      </Html>

      {/* 2. Interactive Selection Ground Ring */}
      {(isSelected || hovered) && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.3, 1.45, 32]} />
          <meshBasicMaterial color={isSelected ? '#00FF87' : '#C084FC'} />
        </mesh>
      )}

      {/* 3. Real 3D Building Geometry */}
      <group ref={domeRef}>
        {/* Foundation Cylinder Base */}
        <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.3, 1.4, 0.3, 16]} />
          <meshStandardMaterial color="#334155" roughness={0.8} />
        </mesh>

        {/* Circular Tower Base */}
        <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.1, 1.15, 1.0, 16]} />
          <meshStandardMaterial color="#1E1B4B" roughness={0.5} />
        </mesh>

        {/* Glowing Arched Portals */}
        {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, i) => (
          <mesh
            key={`portal_${i}`}
            position={[Math.sin(angle) * 1.11, 0.65, Math.cos(angle) * 1.11]}
            rotation={[0, angle, 0]}
          >
            <boxGeometry args={[0.35, 0.55, 0.02]} />
            <meshStandardMaterial color="#C084FC" emissive="#C084FC" emissiveIntensity={2.5} />
          </mesh>
        ))}

        {/* Knowledge Dome Hemisphere Roof */}
        <mesh position={[0, 1.35, 0]} castShadow>
          <sphereGeometry args={[1.12, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#7C3AED" metalness={0.5} roughness={0.25} />
        </mesh>

        {/* Rotating Celestial Knowledge Ring */}
        <mesh ref={ringRef} position={[0, 1.5, 0]} rotation={[0.4, 0.2, 0]}>
          <torusGeometry args={[1.35, 0.035, 8, 32]} />
          <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={3} />
        </mesh>

        {/* Telescope Spire (Level 2+) */}
        {level >= 2 && (
          <group position={[0.2, 1.8, 0.3]} rotation={[0.3, 0.2, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.07, 0.09, 0.8, 8]} />
              <meshStandardMaterial color="#F8FAFC" metalness={0.8} />
            </mesh>
            <mesh position={[0, 0.45, 0]}>
              <sphereGeometry args={[0.1, 8, 8]} />
              <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={3} />
            </mesh>
          </group>
        )}

        {/* Internal Glow Light */}
        <pointLight position={[0, 1.3, 0]} color="#C084FC" intensity={2.5} distance={5} />
      </group>
    </group>
  );
}
