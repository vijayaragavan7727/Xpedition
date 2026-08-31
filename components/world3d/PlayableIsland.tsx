'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface PlayableIslandProps {
  onGroundClick?: (point: [number, number, number]) => void;
  worldLevel: number;
}

// ---------------------------------------------------------------------------
// 1. DENSE PROCEDURAL PROPS: TREES, ROCKS, CRYSTALS, PROPS, FENCES, LIGHTS
// ---------------------------------------------------------------------------

// Varied Low-Poly Tree (Pine, Oak, Autumn, Mystic)
function DenseTree({
  position,
  scale = 1,
  variant = 'green',
}: {
  position: [number, number, number];
  scale?: number;
  variant?: 'green' | 'dark' | 'autumn' | 'mystic';
}) {
  const treeRef = useRef<THREE.Group>(null);
  const phase = position[0] * 1.7 + position[2] * 2.1;

  const colors = useMemo(() => {
    switch (variant) {
      case 'dark':
        return ['#14532D', '#166534'];
      case 'autumn':
        return ['#EA580C', '#F59E0B'];
      case 'mystic':
        return ['#9333EA', '#C084FC'];
      case 'green':
      default:
        return ['#15803D', '#22C55E'];
    }
  }, [variant]);

  useFrame(({ clock }) => {
    if (treeRef.current) {
      const t = clock.getElapsedTime();
      treeRef.current.rotation.z = Math.sin(t * 1.5 + phase) * 0.035;
      treeRef.current.rotation.x = Math.cos(t * 1.2 + phase) * 0.025;
    }
  });

  return (
    <group ref={treeRef} position={position} scale={scale}>
      {/* Wood Trunk */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.16, 0.9, 6]} />
        <meshStandardMaterial color="#78350F" roughness={0.9} />
      </mesh>
      {/* Foliage Layers */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <coneGeometry args={[0.65, 0.95, 6]} />
        <meshStandardMaterial color={colors[0]} roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.55, 0]} castShadow>
        <coneGeometry args={[0.5, 0.75, 6]} />
        <meshStandardMaterial color={colors[1]} roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.95, 0]} castShadow>
        <coneGeometry args={[0.35, 0.55, 6]} />
        <meshStandardMaterial color={colors[1]} roughness={0.7} />
      </mesh>
    </group>
  );
}

// Low-Poly Bush
function Bush({ position, scale = 1, color = '#22C55E' }: { position: [number, number, number]; scale?: number; color?: string }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.25, 0]} castShadow>
        <dodecahedronGeometry args={[0.3, 1]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[0.18, 0.2, 0.1]} castShadow>
        <dodecahedronGeometry args={[0.22, 1]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
    </group>
  );
}

// Glowing Crystal Geode
function GlowingCrystalCluster({ position, color = '#00F0FF' }: { position: [number, number, number]; color?: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.35, 0]} rotation={[0.15, 0.3, 0.2]}>
        <cylinderGeometry args={[0.08, 0.16, 0.7, 5]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.5} roughness={0.1} metalness={0.9} />
      </mesh>
      <mesh position={[0.22, 0.25, 0.1]} rotation={[-0.2, 0.6, -0.3]}>
        <cylinderGeometry args={[0.06, 0.12, 0.5, 5]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.0} roughness={0.1} metalness={0.9} />
      </mesh>
      <pointLight color={color} intensity={1.8} distance={3.5} />
    </group>
  );
}

// Rock Boulder
function RockBoulder({ position, scale = 1, rotation = [0, 0, 0] }: { position: [number, number, number]; scale?: number; rotation?: [number, number, number] }) {
  return (
    <mesh position={position} scale={scale} rotation={rotation} castShadow receiveShadow>
      <dodecahedronGeometry args={[0.45, 0]} />
      <meshStandardMaterial color="#475569" roughness={0.85} />
    </mesh>
  );
}

// Wooden Fence Segment
function FenceSegment({ position, rotation = [0, 0, 0] }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Posts */}
      <mesh position={[-0.4, 0.3, 0]} castShadow>
        <boxGeometry args={[0.08, 0.6, 0.08]} />
        <meshStandardMaterial color="#92400E" roughness={0.8} />
      </mesh>
      <mesh position={[0.4, 0.3, 0]} castShadow>
        <boxGeometry args={[0.08, 0.6, 0.08]} />
        <meshStandardMaterial color="#92400E" roughness={0.8} />
      </mesh>
      {/* Rails */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[0.88, 0.06, 0.04]} />
        <meshStandardMaterial color="#B45309" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[0.88, 0.06, 0.04]} />
        <meshStandardMaterial color="#B45309" roughness={0.8} />
      </mesh>
    </group>
  );
}

// Campfire with smoke
function Campfire({ position }: { position: [number, number, number] }) {
  const flameRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (flameRef.current) {
      const s = 0.9 + Math.sin(clock.getElapsedTime() * 10) * 0.15;
      flameRef.current.scale.set(s, s * 1.2, s);
    }
  });

  return (
    <group position={position}>
      {/* Log Ring */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i * Math.PI) / 3;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * 0.35, 0.08, Math.sin(angle) * 0.35]}
            rotation={[0, angle + Math.PI / 2, 0.2]}
            castShadow
          >
            <cylinderGeometry args={[0.05, 0.07, 0.35, 6]} />
            <meshStandardMaterial color="#451A03" />
          </mesh>
        );
      })}
      {/* Animated Flame */}
      <mesh ref={flameRef} position={[0, 0.3, 0]}>
        <coneGeometry args={[0.2, 0.45, 6]} />
        <meshStandardMaterial color="#F97316" emissive="#EF4444" emissiveIntensity={3} />
      </mesh>
      <pointLight position={[0, 0.4, 0]} color="#F59E0B" intensity={2.5} distance={5} />
    </group>
  );
}

// Flower Bed Cluster
function FlowerCluster({ position, color = '#F43F5E' }: { position: [number, number, number]; color?: string }) {
  return (
    <group position={position}>
      {[-0.15, 0, 0.15].map((x, i) =>
        [-0.15, 0, 0.15].map((z, j) => (
          <mesh key={`${i}_${j}`} position={[x + (Math.random() * 0.08 - 0.04), 0.1, z + (Math.random() * 0.08 - 0.04)]}>
            <sphereGeometry args={[0.05, 6, 6]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
          </mesh>
        ))
      )}
    </group>
  );
}

// ---------------------------------------------------------------------------
// 2. MAIN PLAYABLE STRATEGY ISLAND TERRAIN
// ---------------------------------------------------------------------------
export default function PlayableIsland({ onGroundClick, worldLevel }: PlayableIslandProps) {
  const waterRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (waterRef.current) {
      const mat = waterRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = 0.88 + Math.sin(clock.getElapsedTime() * 2) * 0.06;
    }
  });

  return (
    <group>
      {/* =================================================================== */}
      {/* 1. EXPANSIVE FULL-VIEWPORT LIVING ISLAND TERRAIN */}
      {/* =================================================================== */}
      
      {/* Main Ground Slab (Vibrant Lush Green Turf) */}
      <mesh
        position={[0, -0.25, 0]}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onGroundClick?.([e.point.x, 0, e.point.z]);
        }}
      >
        {/* Large 22x22 unit hex/cylinder island filling strategy camera */}
        <cylinderGeometry args={[11.5, 12.2, 0.5, 36]} />
        <meshStandardMaterial color="#166534" roughness={0.75} />
      </mesh>

      {/* Layer 2: Inner Settlement Lawn Plateau */}
      <mesh
        position={[0, 0.005, 0]}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onGroundClick?.([e.point.x, 0, e.point.z]);
        }}
      >
        <cylinderGeometry args={[10.2, 10.8, 0.12, 32]} />
        <meshStandardMaterial color="#15803D" roughness={0.8} />
      </mesh>

      {/* Island Underbed Cliff Rock Formations */}
      <mesh position={[0, -1.1, 0]}>
        <cylinderGeometry args={[11.8, 8.5, 1.2, 20]} />
        <meshStandardMaterial color="#1E293B" roughness={0.9} />
      </mesh>
      <mesh position={[0, -2.4, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[8.5, 2.0, 16]} />
        <meshStandardMaterial color="#0F172A" roughness={0.95} />
      </mesh>

      {/* =================================================================== */}
      {/* 2. NATURAL COBBLESTONE ROADS & CENTRAL STRATEGY PLAZA */}
      {/* =================================================================== */}
      
      {/* Central Town Plaza */}
      <mesh
        position={[0, 0.02, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onGroundClick?.([e.point.x, 0, e.point.z]);
        }}
      >
        <circleGeometry args={[2.5, 32]} />
        <meshStandardMaterial color="#E2E8F0" roughness={0.65} />
      </mesh>

      {/* Glowing Plaza Magic Rune Inscription */}
      <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.3, 2.48, 32]} />
        <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={2.2} />
      </mesh>
      <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.1, 1.2, 24]} />
        <meshStandardMaterial color="#A855F7" emissive="#A855F7" emissiveIntensity={2.0} />
      </mesh>

      {/* Roads connecting to all District Buildings */}
      {/* Road to HQ (North) */}
      <mesh position={[0, 0.02, -2.0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1.3, 2.8]} />
        <meshStandardMaterial color="#CBD5E1" roughness={0.7} />
      </mesh>
      {/* Road to Library (West Hill) */}
      <mesh position={[-2.4, 0.02, 0.5]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} receiveShadow>
        <planeGeometry args={[1.2, 3.2]} />
        <meshStandardMaterial color="#CBD5E1" roughness={0.7} />
      </mesh>
      {/* Road to Quest Board (East Market) */}
      <mesh position={[2.4, 0.02, 0.5]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} receiveShadow>
        <planeGeometry args={[1.2, 3.2]} />
        <meshStandardMaterial color="#CBD5E1" roughness={0.7} />
      </mesh>
      {/* Road to AI Lab (North-West) */}
      <mesh position={[-2.2, 0.02, -2.2]} rotation={[-Math.PI / 2, 0, Math.PI / 4]} receiveShadow>
        <planeGeometry args={[1.0, 2.8]} />
        <meshStandardMaterial color="#CBD5E1" roughness={0.7} />
      </mesh>
      {/* Road to Mystic Expansion Zone (South-East) */}
      <mesh position={[2.2, 0.02, 2.4]} rotation={[-Math.PI / 2, 0, Math.PI / 4]} receiveShadow>
        <planeGeometry args={[1.0, 2.6]} />
        <meshStandardMaterial color="#CBD5E1" roughness={0.7} />
      </mesh>

      {/* =================================================================== */}
      {/* 3. SHIMMERING RIVER / WATER POND & WOODEN ARCH BRIDGE */}
      {/* =================================================================== */}
      <group position={[-4.5, 0.03, -3.8]}>
        {/* River Pond Water */}
        <mesh ref={waterRef} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[2.0, 32]} />
          <meshStandardMaterial color="#06B6D4" roughness={0.1} metalness={0.8} transparent opacity={0.9} />
        </mesh>
        {/* Stone Bank Rim */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.9, 2.2, 32]} />
          <meshStandardMaterial color="#64748B" roughness={0.9} />
        </mesh>
        {/* River Pond Crystals */}
        <GlowingCrystalCluster position={[1.1, 0, 0.8]} color="#38BDF8" />
        <RockBoulder position={[-1.4, 0, -0.6]} scale={1.2} />
      </group>

      {/* Wooden Arch Bridge over stream */}
      <group position={[-2.7, 0.18, -3.2]} rotation={[0, 0.4, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.4, 0.1, 0.7]} />
          <meshStandardMaterial color="#92400E" roughness={0.8} />
        </mesh>
        {[-0.32, 0.32].map((z, i) => (
          <mesh key={i} position={[0, 0.18, z]} castShadow>
            <boxGeometry args={[1.4, 0.18, 0.05]} />
            <meshStandardMaterial color="#78350F" />
          </mesh>
        ))}
      </group>

      {/* =================================================================== */}
      {/* 4. DENSE VEGETATION: 20+ TREES, BUSHES, FLOWER BEDS */}
      {/* =================================================================== */}
      {/* North Forest Grove (behind HQ) */}
      <DenseTree position={[-2.2, 0, -6.5]} scale={1.2} variant="green" />
      <DenseTree position={[0, 0, -6.8]} scale={1.3} variant="dark" />
      <DenseTree position={[2.2, 0, -6.5]} scale={1.15} variant="green" />
      <DenseTree position={[-4.0, 0, -5.8]} scale={1.0} variant="autumn" />
      <DenseTree position={[4.0, 0, -5.8]} scale={1.05} variant="green" />

      {/* West Forest (behind Library) */}
      <DenseTree position={[-7.2, 0, -1.2]} scale={1.25} variant="green" />
      <DenseTree position={[-7.5, 0, 0.8]} scale={1.1} variant="dark" />
      <DenseTree position={[-6.8, 0, 2.6]} scale={1.2} variant="mystic" />
      <DenseTree position={[-5.8, 0, 4.2]} scale={1.0} variant="autumn" />

      {/* East Grove (behind Quest Board) */}
      <DenseTree position={[7.2, 0, -1.2]} scale={1.15} variant="green" />
      <DenseTree position={[7.6, 0, 0.8]} scale={1.3} variant="autumn" />
      <DenseTree position={[6.8, 0, 2.6]} scale={1.1} variant="green" />
      <DenseTree position={[5.8, 0, 4.2]} scale={1.2} variant="dark" />

      {/* South Border Trees */}
      <DenseTree position={[-3.8, 0, 6.2]} scale={1.1} variant="green" />
      <DenseTree position={[0, 0, 6.8]} scale={1.25} variant="green" />
      <DenseTree position={[3.8, 0, 6.2]} scale={1.1} variant="mystic" />

      {/* Scattered Bushes & Shrubs */}
      <Bush position={[-1.2, 0, 2.2]} scale={1.1} />
      <Bush position={[1.4, 0, 2.2]} scale={0.9} color="#16A34A" />
      <Bush position={[-3.2, 0, -1.2]} scale={1.2} />
      <Bush position={[3.2, 0, -1.2]} scale={1.0} />
      <Bush position={[-0.8, 0, -3.8]} scale={1.1} />
      <Bush position={[0.8, 0, -3.8]} scale={0.9} color="#16A34A" />

      {/* Vibrant Flower Patches */}
      <FlowerCluster position={[-1.6, 0, 1.8]} color="#F43F5E" />
      <FlowerCluster position={[1.8, 0, 1.6]} color="#FBBF24" />
      <FlowerCluster position={[-2.8, 0, 2.4]} color="#38BDF8" />
      <FlowerCluster position={[2.8, 0, 2.4]} color="#A855F7" />

      {/* =================================================================== */}
      {/* 5. SETTLEMENT DETAILS: FENCES, CAMPFIRE, CRATES, LANTERNS */}
      {/* =================================================================== */}
      {/* Market Fences near Quest Board */}
      <FenceSegment position={[4.6, 0, -1.2]} rotation={[0, 0.2, 0]} />
      <FenceSegment position={[5.4, 0, -1.0]} rotation={[0, 0.3, 0]} />

      {/* Library Garden Fences */}
      <FenceSegment position={[-4.6, 0, -1.2]} rotation={[0, -0.2, 0]} />
      <FenceSegment position={[-5.4, 0, -1.0]} rotation={[0, -0.3, 0]} />

      {/* Adventurer Campfire near South Plaza */}
      <Campfire position={[0, 0, 3.8]} />

      {/* Market Wooden Crates & Barrels near Quest Board */}
      <group position={[4.2, 0, 1.6]}>
        <mesh position={[0, 0.2, 0]} castShadow>
          <boxGeometry args={[0.4, 0.4, 0.4]} />
          <meshStandardMaterial color="#92400E" roughness={0.8} />
        </mesh>
        <mesh position={[0.42, 0.16, 0.05]} castShadow>
          <cylinderGeometry args={[0.18, 0.18, 0.35, 8]} />
          <meshStandardMaterial color="#78350F" />
        </mesh>
        <mesh position={[0.1, 0.52, 0.02]} castShadow>
          <boxGeometry args={[0.32, 0.32, 0.32]} />
          <meshStandardMaterial color="#B45309" roughness={0.8} />
        </mesh>
      </group>

      {/* =================================================================== */}
      {/* 6. GLOWING CRYSTAL FORMATIONS & AMBIENT LANTERNS */}
      {/* =================================================================== */}
      <GlowingCrystalCluster position={[-6.2, 0, -2.8]} color="#00F0FF" />
      <GlowingCrystalCluster position={[6.2, 0, -2.8]} color="#A855F7" />
      <GlowingCrystalCluster position={[-4.8, 0, 3.8]} color="#00FF87" />
      <GlowingCrystalCluster position={[4.8, 0, 3.8]} color="#F59E0B" />

      {/* Placed Rock Formations */}
      <RockBoulder position={[-6.0, 0, -3.2]} scale={1.4} />
      <RockBoulder position={[6.0, 0, -3.2]} scale={1.3} />
      <RockBoulder position={[-5.2, 0, 2.8]} scale={1.1} />
      <RockBoulder position={[5.2, 0, 2.8]} scale={1.2} />
      <RockBoulder position={[-1.8, 0, 5.2]} scale={1.0} />
      <RockBoulder position={[1.8, 0, 5.2]} scale={1.1} />

      {/* Glowing Pathway Lanterns */}
      {[-1.6, 1.6].map((x, i) => (
        <group key={`lantern_n_${i}`} position={[x, 0, -1.8]}>
          <mesh position={[0, 0.45, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.06, 0.9, 6]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
          <mesh position={[0, 0.95, 0]}>
            <octahedronGeometry args={[0.14, 0]} />
            <meshStandardMaterial color="#F59E0B" emissive="#F59E0B" emissiveIntensity={3.0} />
          </mesh>
          <pointLight position={[0, 0.95, 0]} color="#F59E0B" intensity={1.5} distance={4} />
        </group>
      ))}

      {[-1.6, 1.6].map((x, i) => (
        <group key={`lantern_s_${i}`} position={[x, 0, 1.8]}>
          <mesh position={[0, 0.45, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.06, 0.9, 6]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
          <mesh position={[0, 0.95, 0]}>
            <octahedronGeometry args={[0.14, 0]} />
            <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={3.0} />
          </mesh>
          <pointLight position={[0, 0.95, 0]} color="#00F0FF" intensity={1.5} distance={4} />
        </group>
      ))}
    </group>
  );
}
