'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface PlayableIslandProps {
  onGroundClick?: (point: [number, number, number]) => void;
  worldLevel: number;
}

// ---------------------------------------------------------------------------
// 1. MODULAR DEFENSIVE STONE WALL SEGMENT
// ---------------------------------------------------------------------------
function StoneWall({
  start,
  end,
}: {
  start: [number, number, number];
  end: [number, number, number];
}) {
  const dx = end[0] - start[0];
  const dz = end[2] - start[2];
  const len = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dx, dz);
  const midX = (start[0] + end[0]) / 2;
  const midZ = (start[2] + end[2]) / 2;

  return (
    <group position={[midX, 0, midZ]} rotation={[0, angle, 0]}>
      {/* Wall Block Base */}
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.36, 0.7, len]} />
        <meshStandardMaterial color="#64748B" roughness={0.8} />
      </mesh>
      {/* Wall Top Stone Trim */}
      <mesh position={[0, 0.72, 0]} castShadow>
        <boxGeometry args={[0.42, 0.1, len]} />
        <meshStandardMaterial color="#94A3B8" roughness={0.7} />
      </mesh>
      {/* Battlements Posts along the wall */}
      {[-len / 2.5, 0, len / 2.5].map((zOffset, i) => (
        <mesh key={i} position={[0, 0.85, zOffset]} castShadow>
          <boxGeometry args={[0.38, 0.2, 0.24]} />
          <meshStandardMaterial color="#475569" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

// Wooden Palisade Fence Segment
function WoodPalisade({
  start,
  end,
}: {
  start: [number, number, number];
  end: [number, number, number];
}) {
  const dx = end[0] - start[0];
  const dz = end[2] - start[2];
  const len = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dx, dz);
  const midX = (start[0] + end[0]) / 2;
  const midZ = (start[2] + end[2]) / 2;
  const count = Math.max(2, Math.floor(len / 0.28));

  return (
    <group position={[midX, 0, midZ]} rotation={[0, angle, 0]}>
      {Array.from({ length: count }).map((_, i) => {
        const offset = -len / 2 + (i + 0.5) * (len / count);
        return (
          <group key={i} position={[0, 0, offset]}>
            <mesh position={[0, 0.3, 0]} castShadow>
              <cylinderGeometry args={[0.07, 0.09, 0.6, 6]} />
              <meshStandardMaterial color="#78350F" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.68, 0]} castShadow>
              <coneGeometry args={[0.08, 0.2, 6]} />
              <meshStandardMaterial color="#92400E" roughness={0.8} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// Tactical Defense Cannon Turret
function CannonTurret({ position }: { position: [number, number, number] }) {
  const barrelRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (barrelRef.current) {
      barrelRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.8) * 0.4;
    }
  });

  return (
    <group position={position}>
      {/* Stone Base */}
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.55, 0.3, 8]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      {/* Rotating Cannon Barrel */}
      <group ref={barrelRef} position={[0, 0.4, 0]}>
        <mesh position={[0, 0.1, 0]} rotation={[0.2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.18, 0.7, 8]} />
          <meshStandardMaterial color="#1E293B" metalness={0.9} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

// Low-Poly Perimeter Forest Tree
function StrategyTree({
  position,
  scale = 1,
  variant = 'green',
}: {
  position: [number, number, number];
  scale?: number;
  variant?: 'green' | 'dark' | 'autumn' | 'mystic';
}) {
  const treeRef = useRef<THREE.Group>(null);
  const phase = position[0] * 1.5 + position[2];

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
      treeRef.current.rotation.z = Math.sin(t * 1.5 + phase) * 0.03;
      treeRef.current.rotation.x = Math.cos(t * 1.2 + phase) * 0.02;
    }
  });

  return (
    <group ref={treeRef} position={position} scale={scale}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.16, 0.9, 6]} />
        <meshStandardMaterial color="#78350F" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.05, 0]} castShadow>
        <coneGeometry args={[0.65, 0.95, 6]} />
        <meshStandardMaterial color={colors[0]} roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.55, 0]} castShadow>
        <coneGeometry args={[0.48, 0.75, 6]} />
        <meshStandardMaterial color={colors[1]} roughness={0.7} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// 2. MAIN PLAYABLE STRATEGY BASE TERRAIN
// ---------------------------------------------------------------------------
export default function PlayableIsland({ onGroundClick, worldLevel }: PlayableIslandProps) {
  // Generate 14x14 Checkerboard Tactical Grass Grid
  const gridTiles = useMemo(() => {
    const tiles = [];
    const size = 14;
    const step = 0.95;
    const half = (size * step) / 2;

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const x = c * step - half + step / 2;
        const z = r * step - half + step / 2;
        const isEven = (r + c) % 2 === 0;
        tiles.push({
          id: `tile_${r}_${c}`,
          position: [x, 0.005, z] as [number, number, number],
          color: isEven ? '#2D6A4F' : '#3B8E5C', // Signature Strategy Checkerboard Green
        });
      }
    }
    return tiles;
  }, []);

  return (
    <group>
      {/* =================================================================== */}
      {/* 1. SOLID EXPANSIVE BASE PLATE */}
      {/* =================================================================== */}
      <mesh
        position={[0, -0.25, 0]}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onGroundClick?.([e.point.x, 0, e.point.z]);
        }}
      >
        <boxGeometry args={[16, 0.5, 16]} />
        <meshStandardMaterial color="#1B4332" roughness={0.8} />
      </mesh>

      {/* Bedrock Cliff Foundation */}
      <mesh position={[0, -1.2, 0]}>
        <boxGeometry args={[16.6, 1.4, 16.6]} />
        <meshStandardMaterial color="#1E293B" roughness={0.95} />
      </mesh>

      {/* =================================================================== */}
      {/* 2. DUAL-TONE CHECKERBOARD TACTICAL GRASS GRID */}
      {/* =================================================================== */}
      {gridTiles.map((tile) => (
        <mesh
          key={tile.id}
          position={tile.position}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
          onClick={(e) => {
            e.stopPropagation();
            onGroundClick?.([e.point.x, 0, e.point.z]);
          }}
        >
          <planeGeometry args={[0.92, 0.92]} />
          <meshStandardMaterial color={tile.color} roughness={0.75} />
        </mesh>
      ))}

      {/* =================================================================== */}
      {/* 3. MODULAR STONE WALLS & DEFENSIVE COMPARTMENTS */}
      {/* =================================================================== */}
      {/* Town Hall Inner Citadel Walls */}
      <StoneWall start={[-2.4, 0, -3.2]} end={[2.4, 0, -3.2]} />
      <StoneWall start={[-2.4, 0, -3.2]} end={[-2.4, 0, -0.4]} />
      <StoneWall start={[2.4, 0, -3.2]} end={[2.4, 0, -0.4]} />

      {/* West Library & Vault Yard Walls */}
      <StoneWall start={[-5.4, 0, -3.0]} end={[-2.6, 0, -3.0]} />
      <StoneWall start={[-5.4, 0, -3.0]} end={[-5.4, 0, 1.2]} />
      <StoneWall start={[-5.4, 0, 1.2]} end={[-2.6, 0, 1.2]} />

      {/* East Quest & AI Lab Yard Walls */}
      <StoneWall start={[2.6, 0, -3.0]} end={[5.4, 0, -3.0]} />
      <StoneWall start={[5.4, 0, -3.0]} end={[5.4, 0, 1.2]} />
      <StoneWall start={[5.4, 0, 1.2]} end={[2.6, 0, 1.2]} />

      {/* South Outer Wooden Palisade Enclosure */}
      <WoodPalisade start={[-4.8, 0, 4.8]} end={[4.8, 0, 4.8]} />
      <WoodPalisade start={[-4.8, 0, 1.8]} end={[-4.8, 0, 4.8]} />
      <WoodPalisade start={[4.8, 0, 1.8]} end={[4.8, 0, 4.8]} />

      {/* Defense Cannons guarding wall corners */}
      <CannonTurret position={[-2.5, 0, -3.3]} />
      <CannonTurret position={[2.5, 0, -3.3]} />
      <CannonTurret position={[-5.5, 0, 1.3]} />
      <CannonTurret position={[5.5, 0, 1.3]} />

      {/* =================================================================== */}
      {/* 4. STRATEGY PROPS: TIMBER LOGS, GRAVESTONES, BARRELS, TORCHES */}
      {/* =================================================================== */}
      {/* Scattered Timber Logs */}
      <group position={[-1.2, 0, 1.4]} rotation={[0, 0.4, 0]}>
        <mesh position={[0, 0.08, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.8, 6]} />
          <meshStandardMaterial color="#78350F" />
        </mesh>
        <mesh position={[0.15, 0.08, 0.1]} rotation={[0, 0.3, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.7, 6]} />
          <meshStandardMaterial color="#92400E" />
        </mesh>
      </group>

      {/* Rubble Stone Piles */}
      <mesh position={[1.4, 0.12, 1.4]} castShadow>
        <dodecahedronGeometry args={[0.22, 0]} />
        <meshStandardMaterial color="#64748B" />
      </mesh>
      <mesh position={[1.6, 0.08, 1.2]} castShadow>
        <dodecahedronGeometry args={[0.15, 0]} />
        <meshStandardMaterial color="#475569" />
      </mesh>

      {/* Campfire in Central Courtyard */}
      <group position={[0, 0, 1.5]}>
        {[0, 1, 2, 3, 4].map((i) => {
          const angle = (i * Math.PI * 2) / 5;
          return (
            <mesh key={i} position={[Math.cos(angle) * 0.3, 0.06, Math.sin(angle) * 0.3]} castShadow>
              <cylinderGeometry args={[0.04, 0.06, 0.28, 6]} />
              <meshStandardMaterial color="#451A03" />
            </mesh>
          );
        })}
        <mesh position={[0, 0.25, 0]}>
          <coneGeometry args={[0.18, 0.38, 6]} />
          <meshStandardMaterial color="#F97316" emissive="#EF4444" emissiveIntensity={3} />
        </mesh>
        <pointLight position={[0, 0.35, 0]} color="#F59E0B" intensity={2.2} distance={4.5} />
      </group>

      {/* Perimeter Forest Trees */}
      <StrategyTree position={[-6.8, 0, -5.2]} scale={1.2} variant="green" />
      <StrategyTree position={[-6.2, 0, -2.8]} scale={1.1} variant="dark" />
      <StrategyTree position={[-6.8, 0, 0]} scale={1.25} variant="green" />
      <StrategyTree position={[-6.5, 0, 3.2]} scale={1.05} variant="autumn" />
      <StrategyTree position={[-6.2, 0, 5.8]} scale={1.15} variant="green" />

      <StrategyTree position={[6.8, 0, -5.2]} scale={1.2} variant="green" />
      <StrategyTree position={[6.2, 0, -2.8]} scale={1.1} variant="autumn" />
      <StrategyTree position={[6.8, 0, 0]} scale={1.25} variant="dark" />
      <StrategyTree position={[6.5, 0, 3.2]} scale={1.05} variant="green" />
      <StrategyTree position={[6.2, 0, 5.8]} scale={1.15} variant="mystic" />

      <StrategyTree position={[-3.8, 0, -6.5]} scale={1.2} variant="green" />
      <StrategyTree position={[0, 0, -6.8]} scale={1.3} variant="dark" />
      <StrategyTree position={[3.8, 0, -6.5]} scale={1.2} variant="green" />
      <StrategyTree position={[-2.4, 0, 6.6]} scale={1.1} variant="green" />
      <StrategyTree position={[2.4, 0, 6.6]} scale={1.15} variant="autumn" />
    </group>
  );
}
