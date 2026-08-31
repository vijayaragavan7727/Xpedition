'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface LearningHQProps {
  level: number; // 1 to 3
  isUpgrading?: boolean;
  position?: [number, number, number];
  isSelected?: boolean;
  onClick?: () => void;
}

export default function LearningHQ({
  level = 1,
  isUpgrading = false,
  position = [0, 0, -3.2],
  isSelected = false,
  onClick,
}: LearningHQProps) {
  const groupRef = useRef<THREE.Group>(null);
  const spireRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [animScale, setAnimScale] = useState(1);

  // Construction Upgrade Pop-In Animation
  useEffect(() => {
    setAnimScale(0.85);
    const timeout = setTimeout(() => setAnimScale(1), 350);
    return () => clearTimeout(timeout);
  }, [level]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      // Gentle breathing float
      groupRef.current.position.y = (Math.sin(t * 1.5) * 0.04);
    }
    if (spireRef.current) {
      spireRef.current.rotation.y = t * 0.8;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 1.2;
    }
  });

  return (
    <group
      position={position}
      scale={animScale}
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
      {/* 1. Floating Building Name & Level Badge */}
      <Html position={[0, level >= 3 ? 3.4 : level >= 2 ? 2.8 : 2.2, 0]} center distanceFactor={14} zIndexRange={[100, 0]}>
        <div
          onClick={onClick}
          className={`px-3 py-1 rounded-xl backdrop-blur-md border text-white font-mono text-[11px] font-bold shadow-2xl flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all select-none ${
            isSelected
              ? 'bg-[#00F0FF]/30 border-[#00F0FF] shadow-[0_0_20px_rgba(0,240,255,0.6)] scale-105'
              : 'bg-black/75 border-white/20 hover:border-[#00F0FF]/70'
          }`}
        >
          <span className="text-sm">🏠</span>
          <span>Learning HQ</span>
          <span className="px-1.5 py-0.2 rounded bg-cyan-400/20 text-[#00F0FF] text-[9px] uppercase font-mono">
            Lv.{level}
          </span>
        </div>
      </Html>

      {/* 2. Interactive Selection Ground Ring */}
      {(isSelected || hovered) && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.5, 1.7, 32]} />
          <meshBasicMaterial color={isSelected ? '#00FF87' : '#00F0FF'} />
        </mesh>
      )}

      {/* 3. Real 3D Building Geometry */}
      <group ref={groupRef}>
        {/* Foundation Slab */}
        <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.2, 0.3, 2.2]} />
          <meshStandardMaterial color="#334155" roughness={0.8} />
        </mesh>

        {/* Level 1: Core Ground Floor & Glowing Main Portal */}
        <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.7, 1.0, 1.7]} />
          <meshStandardMaterial color="#1E293B" roughness={0.4} />
        </mesh>

        {/* Glowing Front Door / Gateway */}
        <mesh position={[0, 0.65, 0.86]}>
          <boxGeometry args={[0.5, 0.7, 0.02]} />
          <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={3} />
        </mesh>

        {/* Corner Neon Pillars */}
        {[-0.8, 0.8].map((x, i) =>
          [-0.8, 0.8].map((z, j) => (
            <mesh key={`pillar_${i}_${j}`} position={[x, 0.8, z]}>
              <cylinderGeometry args={[0.08, 0.08, 1.0, 8]} />
              <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={1.5} />
            </mesh>
          ))
        )}

        {/* Level 1 Roof (if level === 1) */}
        {level === 1 && (
          <group position={[0, 1.7, 0]}>
            <mesh rotation={[0, Math.PI / 4, 0]} castShadow>
              <coneGeometry args={[1.4, 0.9, 4]} />
              <meshStandardMaterial color="#0284C7" roughness={0.3} metalness={0.4} />
            </mesh>
            <mesh position={[0, 0.6, 0]}>
              <cylinderGeometry args={[0.04, 0.04, 0.5, 6]} />
              <meshStandardMaterial color="#38BDF8" />
            </mesh>
            <mesh position={[0, 0.9, 0]}>
              <octahedronGeometry args={[0.15, 0]} />
              <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={2.5} />
            </mesh>
          </group>
        )}

        {/* Level 2+: Second Floor & Balcony */}
        {level >= 2 && (
          <group position={[0, 1.6, 0]}>
            {/* Balcony Ledge */}
            <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
              <boxGeometry args={[1.9, 0.15, 1.9]} />
              <meshStandardMaterial color="#0284C7" />
            </mesh>
            {/* Upper Tower Block */}
            <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
              <boxGeometry args={[1.3, 0.85, 1.3]} />
              <meshStandardMaterial color="#0F172A" roughness={0.4} />
            </mesh>
            {/* Upper Glowing Windows */}
            <mesh position={[0, 0.55, 0.66]}>
              <boxGeometry args={[0.4, 0.35, 0.02]} />
              <meshStandardMaterial color="#00FF87" emissive="#00FF87" emissiveIntensity={2.5} />
            </mesh>
          </group>
        )}

        {/* Level 2 Roof (if level === 2) */}
        {level === 2 && (
          <group position={[0, 2.3, 0]}>
            <mesh rotation={[0, Math.PI / 4, 0]} castShadow>
              <coneGeometry args={[1.1, 0.8, 4]} />
              <meshStandardMaterial color="#0369A1" roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.6, 0]}>
              <sphereGeometry args={[0.16, 12, 12]} />
              <meshStandardMaterial color="#00FF87" emissive="#00FF87" emissiveIntensity={3} />
            </mesh>
          </group>
        )}

        {/* Level 3+: Citadel Pinnacle & Rotating Crystal Energy */}
        {level >= 3 && (
          <group position={[0, 2.3, 0]}>
            {/* Crown Battlements */}
            <mesh position={[0, 0.1, 0]} castShadow>
              <boxGeometry args={[1.45, 0.2, 1.45]} />
              <meshStandardMaterial color="#0369A1" />
            </mesh>

            {/* Rotating Celestial Crystal Diamond */}
            <mesh ref={spireRef} position={[0, 0.7, 0]} castShadow>
              <octahedronGeometry args={[0.38, 0]} />
              <meshStandardMaterial
                color="#00F0FF"
                emissive="#00F0FF"
                emissiveIntensity={3.5}
                roughness={0.1}
                metalness={0.9}
              />
            </mesh>

            {/* Orbiting Energy Ring */}
            <mesh ref={ringRef} position={[0, 0.7, 0]} rotation={[Math.PI / 4, 0, 0]}>
              <torusGeometry args={[0.6, 0.03, 8, 24]} />
              <meshStandardMaterial color="#A855F7" emissive="#A855F7" emissiveIntensity={3} />
            </mesh>

            {/* Internal Citadel Core Light */}
            <pointLight color="#00F0FF" intensity={3.5} distance={6} />
          </group>
        )}
      </group>
    </group>
  );
}
