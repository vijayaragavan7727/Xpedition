'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface PlayableIslandProps {
  onGroundClick?: (point: [number, number, number]) => void;
  worldLevel: number;
}

// Low-poly Pine & Deciduous Trees with gentle wind sway
function WindTree({ position, scale = 1, foliageColor = '#22C55E' }: { position: [number, number, number]; scale?: number; foliageColor?: string }) {
  const treeRef = useRef<THREE.Group>(null);
  const phase = position[0] * 1.5 + position[2];

  useFrame(({ clock }) => {
    if (treeRef.current) {
      const t = clock.getElapsedTime();
      treeRef.current.rotation.z = Math.sin(t * 1.8 + phase) * 0.04;
      treeRef.current.rotation.x = Math.cos(t * 1.4 + phase) * 0.03;
    }
  });

  return (
    <group ref={treeRef} position={position} scale={scale}>
      {/* Wood Trunk */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.14, 0.9, 6]} />
        <meshStandardMaterial color="#78350F" roughness={0.9} />
      </mesh>
      {/* Foliage Cones */}
      <mesh position={[0, 1.0, 0]} castShadow>
        <coneGeometry args={[0.55, 0.8, 6]} />
        <meshStandardMaterial color={foliageColor} roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.45, 0]} castShadow>
        <coneGeometry args={[0.42, 0.65, 6]} />
        <meshStandardMaterial color="#4ADE80" roughness={0.7} />
      </mesh>
    </group>
  );
}

// Low-poly Crystal Cluster
function GlowingCrystals({ position, color = '#00F0FF' }: { position: [number, number, number]; color?: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.35, 0]} rotation={[0.1, 0.3, 0.2]}>
        <cylinderGeometry args={[0.08, 0.16, 0.7, 5]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.0} roughness={0.2} metalness={0.8} />
      </mesh>
      <mesh position={[0.2, 0.25, 0.1]} rotation={[-0.2, 0.5, -0.3]}>
        <cylinderGeometry args={[0.06, 0.12, 0.5, 5]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} roughness={0.2} metalness={0.8} />
      </mesh>
      <pointLight color={color} intensity={1.5} distance={3} />
    </group>
  );
}

// Low-poly Boulder Rock
function Rock({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <mesh position={position} scale={scale} castShadow receiveShadow>
      <dodecahedronGeometry args={[0.35, 0]} />
      <meshStandardMaterial color="#475569" roughness={0.85} />
    </mesh>
  );
}

export default function PlayableIsland({ onGroundClick, worldLevel }: PlayableIslandProps) {
  const waterRef = useRef<THREE.Mesh>(null);

  // Animate water pond shimmer
  useFrame(({ clock }) => {
    if (waterRef.current) {
      const mat = waterRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = 0.85 + Math.sin(clock.getElapsedTime() * 2) * 0.08;
    }
  });

  return (
    <group>
      {/* 1. Main Island Floating Base (Grass Top + Polygonal Rock Cliff) */}
      <mesh
        position={[0, -0.3, 0]}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          if (onGroundClick) {
            onGroundClick([e.point.x, 0, e.point.z]);
          }
        }}
      >
        <cylinderGeometry args={[7.2, 7.8, 0.6, 32]} />
        <meshStandardMaterial color="#15803D" roughness={0.8} />
      </mesh>

      {/* Floating Island Underground Bedrock */}
      <mesh position={[0, -1.1, 0]}>
        <cylinderGeometry args={[7.7, 4.8, 1.0, 16]} />
        <meshStandardMaterial color="#1E293B" roughness={0.9} />
      </mesh>

      {/* Island Bottom Point Spike */}
      <mesh position={[0, -2.0, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[4.8, 1.5, 12]} />
        <meshStandardMaterial color="#0F172A" roughness={0.95} />
      </mesh>

      {/* 2. Central Cobblestone Plaza & Rune Circle */}
      <mesh
        position={[0, 0.015, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          if (onGroundClick) {
            onGroundClick([e.point.x, 0, e.point.z]);
          }
        }}
      >
        <circleGeometry args={[2.0, 24]} />
        <meshStandardMaterial color="#E2E8F0" roughness={0.7} />
      </mesh>

      {/* Glowing Neon Rune Plaza Border */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.9, 2.05, 32]} />
        <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={1.5} />
      </mesh>

      {/* 3. Stone Pathways to Buildings */}
      {/* North Pathway to Learning HQ */}
      <mesh position={[0, 0.012, -1.6]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[0.9, 2.5]} />
        <meshStandardMaterial color="#CBD5E1" roughness={0.7} />
      </mesh>

      {/* West Pathway to Library */}
      <mesh position={[-1.8, 0.012, 0.25]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} receiveShadow>
        <planeGeometry args={[0.85, 2.6]} />
        <meshStandardMaterial color="#CBD5E1" roughness={0.7} />
      </mesh>

      {/* East Pathway to Quest Board */}
      <mesh position={[1.8, 0.012, 0.25]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} receiveShadow>
        <planeGeometry args={[0.85, 2.6]} />
        <meshStandardMaterial color="#CBD5E1" roughness={0.7} />
      </mesh>

      {/* 4. Animated Low-Poly Trees Around Island Edge */}
      <WindTree position={[-5.2, 0, -2.0]} scale={1.1} foliageColor="#16A34A" />
      <WindTree position={[-4.8, 0, 2.4]} scale={0.9} foliageColor="#22C55E" />
      <WindTree position={[-3.2, 0, 4.5]} scale={1.2} foliageColor="#15803D" />
      <WindTree position={[5.2, 0, -2.2]} scale={1.0} foliageColor="#16A34A" />
      <WindTree position={[4.6, 0, 2.5]} scale={1.15} foliageColor="#22C55E" />
      <WindTree position={[3.0, 0, 4.8]} scale={0.85} foliageColor="#15803D" />
      <WindTree position={[-1.6, 0, -5.2]} scale={1.1} foliageColor="#22C55E" />
      <WindTree position={[1.6, 0, -5.2]} scale={1.05} foliageColor="#16A34A" />

      {/* 5. Crystal Clusters & Rock Formations */}
      <GlowingCrystals position={[-4.8, 0, -0.6]} color="#00F0FF" />
      <GlowingCrystals position={[4.8, 0, -0.6]} color="#A855F7" />
      <GlowingCrystals position={[0, 0, 4.5]} color="#00FF87" />

      <Rock position={[-5.0, 0, 0.8]} scale={1.2} />
      <Rock position={[4.9, 0, 1.0]} scale={1.1} />
      <Rock position={[-2.2, 0, 3.8]} scale={0.8} />
      <Rock position={[2.2, 0, 3.8]} scale={0.9} />
      <Rock position={[0, 0, -5.4]} scale={1.3} />

      {/* 6. Crystalline Water Feature / Pond */}
      <group position={[-3.6, 0.02, -3.2]}>
        <mesh ref={waterRef} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.35, 24]} />
          <meshStandardMaterial color="#06B6D4" roughness={0.1} metalness={0.7} transparent opacity={0.9} />
        </mesh>
        {/* Pond Shore Stone Ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.3, 1.45, 24]} />
          <meshStandardMaterial color="#64748B" roughness={0.9} />
        </mesh>
        <GlowingCrystals position={[0.8, 0, 0.6]} color="#38BDF8" />
      </group>

      {/* 7. Plaza Ambient Lanterns */}
      {[-1.4, 1.4].map((x, i) => (
        <group key={`lantern_${i}`} position={[x, 0, -1.8]}>
          <mesh position={[0, 0.45, 0]}>
            <cylinderGeometry args={[0.04, 0.06, 0.9, 6]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
          <mesh position={[0, 0.95, 0]}>
            <octahedronGeometry args={[0.14, 0]} />
            <meshStandardMaterial color="#F59E0B" emissive="#F59E0B" emissiveIntensity={2.5} />
          </mesh>
          <pointLight position={[0, 0.95, 0]} color="#F59E0B" intensity={1.2} distance={3.5} />
        </group>
      ))}
    </group>
  );
}
