'use client';

import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { WorldBuilding3D, WorldEnvironment, BuildingStage, BuildingType } from '@/lib/engine/worldEvolution';
import { Sparkles, Maximize2, ChevronRight, Zap, Trophy } from 'lucide-react';
import Link from 'next/link';

interface World3DProps {
  buildings: WorldBuilding3D[];
  tier: number;
  environment: WorldEnvironment;
  theme?: string;
  onSelectBuilding?: (building: WorldBuilding3D) => void;
}

// ---------------------------------------------------------------------------
// 1. GROUND & ENVIRONMENT (Grid, Paths, Low-Poly Trees, Water Pond)
// ---------------------------------------------------------------------------
function LowPolyTree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Trunk */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 0.8, 6]} />
        <meshStandardMaterial color="#78350F" roughness={0.9} />
      </mesh>
      {/* Foliage Cones */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <coneGeometry args={[0.45, 0.7, 6]} />
        <meshStandardMaterial color="#22C55E" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.3, 0]} castShadow>
        <coneGeometry args={[0.35, 0.6, 6]} />
        <meshStandardMaterial color="#4ADE80" roughness={0.7} />
      </mesh>
    </group>
  );
}

function Ground({
  tier,
  groundColor,
  pathColor,
}: {
  tier: number;
  groundColor: string;
  pathColor: string;
}) {
  return (
    <group>
      {/* Main Island Slab */}
      <mesh position={[0, -0.3, 0]} receiveShadow>
        <cylinderGeometry args={[6.8, 7.4, 0.6, 32]} />
        <meshStandardMaterial color={groundColor} roughness={0.8} />
      </mesh>

      {/* Island Underbed Cliff */}
      <mesh position={[0, -1.0, 0]}>
        <cylinderGeometry args={[7.3, 5.5, 0.8, 16]} />
        <meshStandardMaterial color="#1E293B" roughness={0.9} />
      </mesh>

      {/* Central Plaza Ring */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[0.4, 1.8, 32]} />
        <meshStandardMaterial color={pathColor} opacity={0.65} transparent />
      </mesh>

      {/* Tier 2+ Paths to Cardinal Buildings */}
      {tier >= 2 && (
        <group>
          {/* North Path */}
          <mesh position={[0, 0.01, -1.6]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[0.6, 2.4]} />
            <meshStandardMaterial color={pathColor} opacity={0.5} transparent />
          </mesh>
          {/* East Path */}
          <mesh position={[1.6, 0.01, -0.5]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} receiveShadow>
            <planeGeometry args={[0.6, 2.4]} />
            <meshStandardMaterial color={pathColor} opacity={0.5} transparent />
          </mesh>
          {/* West Path */}
          <mesh position={[-1.6, 0.01, -0.5]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} receiveShadow>
            <planeGeometry args={[0.6, 2.4]} />
            <meshStandardMaterial color={pathColor} opacity={0.5} transparent />
          </mesh>
        </group>
      )}

      {/* Tier 3+ Decorative Low-Poly Trees */}
      {tier >= 3 && (
        <group>
          <LowPolyTree position={[-4.5, 0, 1.5]} />
          <LowPolyTree position={[-4.8, 0, 0.2]} />
          <LowPolyTree position={[4.5, 0, 1.8]} />
          <LowPolyTree position={[4.8, 0, -2.5]} />
          <LowPolyTree position={[-1.2, 0, -4.8]} />
          <LowPolyTree position={[1.2, 0, -4.8]} />
        </group>
      )}

      {/* Tier 4+ Crystal Water Pond / Oasis */}
      {tier >= 4 && (
        <mesh position={[-3.8, 0.02, -3.2]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.2, 24]} />
          <meshStandardMaterial color="#06B6D4" roughness={0.1} metalness={0.8} />
        </mesh>
      )}
    </group>
  );
}

// ---------------------------------------------------------------------------
// 2. 3D BUILDING COMPONENT (Low-Poly Pixar/Minecraft Aesthetic)
// ---------------------------------------------------------------------------
interface Building3DProps {
  building: WorldBuilding3D;
  isSelected: boolean;
  theme?: string;
  onClick: () => void;
}

function Building3D({ building, isSelected, onClick }: Building3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const spireRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const { stage, type, position } = building;

  // Theme Accent Palette
  const accentColor = useMemo(() => {
    switch (type) {
      case 'academy': return '#00F0FF';
      case 'workshop': return '#F59E0B';
      case 'observatory': return '#C084FC';
      case 'arena': return '#FF0055';
      case 'citadel': return '#00FF87';
    }
  }, [type]);

  // Float & Glow Animation in Three.js
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();

    if (stage === 'built' || stage === 'upgraded' || stage === 'mastered') {
      groupRef.current.position.y = position[1] + Math.sin(t * 2 + position[0]) * 0.06;
    }

    if (stage === 'mastered' && spireRef.current) {
      spireRef.current.rotation.y += 0.012;
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* 1. Selection & Hover Glowing Ground Ring */}
      {(isSelected || hovered) && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.1, 1.25, 24]} />
          <meshBasicMaterial color={isSelected ? '#00FF87' : '#00F0FF'} />
        </mesh>
      )}

      {/* 2. STAGE: EMPTY PLOT (Survey Flag) */}
      {stage === 'empty' && (
        <group>
          {/* Base Marker */}
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.5, 0.6, 0.1, 12]} />
            <meshStandardMaterial color="#334155" roughness={0.9} />
          </mesh>
          {/* Flag Pole */}
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.9, 8]} />
            <meshStandardMaterial color="#94A3B8" />
          </mesh>
          {/* Flag */}
          <mesh position={[0.18, 0.8, 0]}>
            <boxGeometry args={[0.32, 0.22, 0.02]} />
            <meshStandardMaterial color="#64748B" />
          </mesh>
        </group>
      )}

      {/* 3. STAGE: PARTIAL (Foundation & Scaffolding) */}
      {stage === 'partial' && (
        <group>
          {/* Concrete Foundation */}
          <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.5, 0.3, 1.5]} />
            <meshStandardMaterial color="#475569" roughness={0.9} />
          </mesh>
          {/* Lower Stone Walls */}
          <mesh position={[0, 0.5, 0]} castShadow>
            <boxGeometry args={[1.3, 0.45, 1.3]} />
            <meshStandardMaterial color="#64748B" roughness={0.7} />
          </mesh>
          {/* Wooden Scaffolding Columns */}
          {[-0.65, 0.65].map((x, i) =>
            [-0.65, 0.65].map((z, j) => (
              <mesh key={`scaffold_${i}_${j}`} position={[x, 0.65, z]}>
                <cylinderGeometry args={[0.03, 0.03, 1.1, 6]} />
                <meshStandardMaterial color="#D97706" />
              </mesh>
            ))
          )}
        </group>
      )}

      {/* 4. STAGES: BUILT / UPGRADED / MASTERED */}
      {(stage === 'built' || stage === 'upgraded' || stage === 'mastered') && (
        <group>
          {/* TYPE: ACADEMY (Tall Tower + Pointed Spire + Glowing Windows) */}
          {type === 'academy' && (
            <group>
              {/* Base Tower */}
              <mesh position={[0, 0.85, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.2, 1.6, 1.2]} />
                <meshStandardMaterial color="#1E293B" roughness={0.5} />
              </mesh>
              {/* Pointed Roof */}
              <mesh position={[0, 2.05, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
                <coneGeometry args={[1.0, 1.1, 4]} />
                <meshStandardMaterial color={accentColor} roughness={0.3} metalness={0.4} />
              </mesh>
              {/* Glowing Windows */}
              <mesh position={[0, 0.9, 0.61]}>
                <boxGeometry args={[0.3, 0.5, 0.02]} />
                <meshStandardMaterial emissive={accentColor} emissiveIntensity={2.5} color={accentColor} />
              </mesh>
              <mesh position={[0, 0.9, -0.61]}>
                <boxGeometry args={[0.3, 0.5, 0.02]} />
                <meshStandardMaterial emissive={accentColor} emissiveIntensity={2.5} color={accentColor} />
              </mesh>
            </group>
          )}

          {/* TYPE: WORKSHOP (Squat Wide Building + Chimney) */}
          {type === 'workshop' && (
            <group>
              {/* Main Workshop Hall */}
              <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.7, 1.1, 1.3]} />
                <meshStandardMaterial color="#334155" roughness={0.6} />
              </mesh>
              {/* Roof */}
              <mesh position={[0, 1.3, 0]} castShadow>
                <boxGeometry args={[1.8, 0.35, 1.4]} />
                <meshStandardMaterial color={accentColor} roughness={0.4} />
              </mesh>
              {/* Chimney */}
              <mesh position={[0.55, 1.65, -0.3]} castShadow>
                <cylinderGeometry args={[0.12, 0.15, 0.7, 8]} />
                <meshStandardMaterial color="#78350F" />
              </mesh>
            </group>
          )}

          {/* TYPE: OBSERVATORY (Cylinder + Dome Hemisphere + Telescope) */}
          {type === 'observatory' && (
            <group>
              {/* Round Base */}
              <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.8, 0.85, 1.3, 16]} />
                <meshStandardMaterial color="#1E1B4B" roughness={0.5} />
              </mesh>
              {/* Dome */}
              <mesh position={[0, 1.35, 0]} castShadow>
                <sphereGeometry args={[0.8, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color={accentColor} metalness={0.6} roughness={0.2} />
              </mesh>
              {/* Telescope Spire */}
              <mesh position={[0.2, 1.7, 0.3]} rotation={[0.4, 0.2, 0]}>
                <cylinderGeometry args={[0.06, 0.08, 0.7, 8]} />
                <meshStandardMaterial color="#F8FAFC" metalness={0.9} />
              </mesh>
            </group>
          )}

          {/* TYPE: ARENA (Open Colosseum with Stepped Stands) */}
          {type === 'arena' && (
            <group>
              {/* Outer Arena Wall */}
              <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[1.0, 1.1, 0.8, 12]} />
                <meshStandardMaterial color="#451A03" roughness={0.8} />
              </mesh>
              {/* Inner Pit Floor */}
              <mesh position={[0, 0.3, 0]}>
                <cylinderGeometry args={[0.7, 0.7, 0.6, 12]} />
                <meshStandardMaterial color="#FB923C" roughness={0.9} />
              </mesh>
              {/* Arena Crest Banners */}
              <mesh position={[0, 0.9, 0]}>
                <torusGeometry args={[0.9, 0.06, 8, 12]} />
                <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={1.5} />
              </mesh>
            </group>
          )}

          {/* TYPE: CITADEL (Castle Keep with Battlements) */}
          {type === 'citadel' && (
            <group>
              {/* Main Stone Keep */}
              <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.4, 1.7, 1.4]} />
                <meshStandardMaterial color="#064E3B" roughness={0.6} />
              </mesh>
              {/* Roof Battlements */}
              <mesh position={[0, 1.85, 0]} castShadow>
                <boxGeometry args={[1.5, 0.25, 1.5]} />
                <meshStandardMaterial color="#047857" />
              </mesh>
              {/* Spire Crest */}
              <mesh position={[0, 2.2, 0]} castShadow>
                <coneGeometry args={[0.4, 0.7, 6]} />
                <meshStandardMaterial color={accentColor} metalness={0.5} roughness={0.3} />
              </mesh>
            </group>
          )}

          {/* UPGRADED / MASTERED BONUS: Second Floor & Spire */}
          {(stage === 'upgraded' || stage === 'mastered') && (
            <group position={[0, 2.2, 0]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.25, 0.35, 0.5, 8]} />
                <meshStandardMaterial color={accentColor} metalness={0.6} />
              </mesh>
            </group>
          )}

          {/* MASTERED PINNACLE: Rotating Celestial Energy & Point Light */}
          {stage === 'mastered' && (
            <group ref={spireRef} position={[0, 2.7, 0]}>
              {/* Floating Crystal Diamond */}
              <mesh>
                <octahedronGeometry args={[0.45, 0]} />
                <meshStandardMaterial
                  color={accentColor}
                  emissive={accentColor}
                  emissiveIntensity={3.0}
                  roughness={0.1}
                  metalness={0.9}
                />
              </mesh>
              {/* Internal Glowing Light */}
              <pointLight color={accentColor} intensity={3.5} distance={5} />
            </group>
          )}
        </group>
      )}
    </group>
  );
}

// ---------------------------------------------------------------------------
// 3. MAIN WORLD 3D CANVAS & INSPECTION OVERLAY
// ---------------------------------------------------------------------------
export default function World3D({ buildings, tier, environment, theme = 'cosmos', onSelectBuilding }: World3DProps) {
  const [selectedBuilding, setSelectedBuilding] = useState<WorldBuilding3D | null>(buildings[0] || null);

  const handleSelect = (bldg: WorldBuilding3D) => {
    setSelectedBuilding(bldg);
    onSelectBuilding?.(bldg);
  };

  return (
    <div className="relative w-full h-full rounded-[24px] overflow-hidden border border-white/15 bg-[#080512] shadow-2xl flex flex-col">
      {/* Three.js Canvas Stage */}
      <div className="flex-1 w-full relative">
        <Canvas
          camera={{ position: [8, 7, 9], fov: 45 }}
          style={{ width: '100%', height: '100%', touchAction: 'none' }}
          shadows
        >
          {/* Background Sky Color */}
          <color attach="background" args={[environment.skyColor]} />

          {/* Scene Lighting */}
          <ambientLight intensity={environment.ambientIntensity} />
          <directionalLight
            position={[10, 15, 6]}
            intensity={1.0}
            color={environment.lightColor}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />

          {/* Ground Terrain & Features */}
          <Ground tier={tier} groundColor={environment.groundColor} pathColor={environment.pathColor} />

          {/* 3D Buildings */}
          {buildings.map((bldg) => (
            <Building3D
              key={bldg.id}
              building={bldg}
              isSelected={selectedBuilding?.id === bldg.id}
              theme={theme}
              onClick={() => handleSelect(bldg)}
            />
          ))}

          {/* User Orbit, Zoom, Pan Controls */}
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            maxPolarAngle={Math.PI / 2.15}
            minDistance={4.5}
            maxDistance={20}
            makeDefault
          />
        </Canvas>

        {/* Orbit Hint Pill */}
        <div className="absolute top-3 left-3 pointer-events-none px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[10px] font-mono text-slate-300">
          <span>Drag to rotate &middot; Pinch to zoom</span>
        </div>
      </div>

      {/* Interactive Building Info Panel */}
      {selectedBuilding && (
        <div className="p-3.5 bg-[#120E22]/95 border-t border-white/10 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-sans font-bold text-sm text-white truncate">
                {selectedBuilding.conceptName}
              </span>
              <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] font-bold uppercase">
                {selectedBuilding.stage}
              </span>
            </div>
            <p className="font-mono text-[11px] text-slate-400 truncate">
              {selectedBuilding.type.toUpperCase()} &middot; {selectedBuilding.masteryPercent}% Mastered &middot;{' '}
              <span className="text-slate-300">{selectedBuilding.nextRequirement}</span>
            </p>
          </div>

          <Link
            href={`/quest?concept=${encodeURIComponent(selectedBuilding.conceptId)}`}
            className="h-8 px-3.5 rounded-xl bg-signature-gradient text-white font-mono font-bold text-xs flex items-center gap-1 hover:brightness-110 transition-all cursor-pointer shrink-0 shadow-md"
          >
            <span>Practice</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
