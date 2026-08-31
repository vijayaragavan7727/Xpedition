'use client';

import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface BuilderWorkshopBuildingProps {
  level?: number;
  position?: [number, number, number];
  isSelected?: boolean;
  onClick?: () => void;
}

export default function BuilderWorkshopBuilding({
  level = 1,
  position = [1.8, 0, 3.6],
  isSelected = false,
  onClick,
}: BuilderWorkshopBuildingProps) {
  const [hovered, setHovered] = useState(false);
  const smokeRef1 = useRef<THREE.Mesh>(null);
  const smokeRef2 = useRef<THREE.Mesh>(null);
  const hammerArmRef = useRef<THREE.Mesh>(null);
  const sparkRef = useRef<THREE.Points>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (smokeRef1.current) {
      smokeRef1.current.position.y = 1.9 + ((t * 0.7) % 0.8);
      smokeRef1.current.scale.setScalar(0.12 + ((t * 0.7) % 0.8) * 0.2);
    }
    if (smokeRef2.current) {
      smokeRef2.current.position.y = 1.9 + (((t + 0.5) * 0.7) % 0.8);
      smokeRef2.current.scale.setScalar(0.12 + (((t + 0.5) * 0.7) % 0.8) * 0.2);
    }
    // Hammering animation
    if (hammerArmRef.current) {
      hammerArmRef.current.rotation.z = -0.3 + Math.abs(Math.sin(t * 7)) * 0.8;
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
      {/* 1. Name Tag */}
      <Html position={[0, 2.3, 0]} center distanceFactor={14} zIndexRange={[100, 0]}>
        <div
          onClick={onClick}
          className={`px-2.5 py-0.5 rounded-lg backdrop-blur-md border text-white font-mono text-[10px] font-bold shadow-xl flex items-center gap-1 cursor-pointer transition-all select-none ${
            isSelected
              ? 'bg-[#F97316]/40 border-[#F97316] shadow-[0_0_15px_rgba(249,115,22,0.7)] scale-105'
              : 'bg-black/75 border-white/20 hover:border-[#F97316]/70'
          }`}
        >
          <span>⚒️</span>
          <span>Shader Forge</span>
          <span className="text-[#FDBA74] text-[9px]">Lv.{level}</span>
        </div>
      </Html>

      {/* 2. Selection Ring */}
      {(isSelected || hovered) && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.1, 1.25, 24]} />
          <meshBasicMaterial color={isSelected ? '#00FF87' : '#F97316'} />
        </mesh>
      )}

      {/* 3. Real 3D Builder Workshop Geometry */}
      {/* Stone Foundation */}
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.7, 0.3, 1.5]} />
        <meshStandardMaterial color="#475569" roughness={0.8} />
      </mesh>

      {/* Workshop Timber Walls */}
      <mesh position={[-0.15, 0.7, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.8, 1.3]} />
        <meshStandardMaterial color="#78350F" roughness={0.7} />
      </mesh>

      {/* Sloped Wooden Roof */}
      <mesh position={[-0.15, 1.3, 0]} rotation={[0, 0, 0]} castShadow>
        <coneGeometry args={[1.1, 0.65, 4]} />
        <meshStandardMaterial color="#B45309" roughness={0.6} />
      </mesh>

      {/* Stone Chimney */}
      <mesh position={[0.55, 1.1, -0.35]} castShadow>
        <boxGeometry args={[0.35, 1.4, 0.35]} />
        <meshStandardMaterial color="#334155" roughness={0.9} />
      </mesh>

      {/* Puffing Smoke Particles */}
      <mesh ref={smokeRef1} position={[0.55, 1.9, -0.35]}>
        <sphereGeometry args={[0.16, 6, 6]} />
        <meshStandardMaterial color="#94A3B8" transparent opacity={0.6} />
      </mesh>
      <mesh ref={smokeRef2} position={[0.55, 1.9, -0.35]}>
        <sphereGeometry args={[0.16, 6, 6]} />
        <meshStandardMaterial color="#94A3B8" transparent opacity={0.4} />
      </mesh>

      {/* Anvil & Workbench on Porch */}
      <mesh position={[0.55, 0.45, 0.35]} castShadow>
        <boxGeometry args={[0.3, 0.3, 0.5]} />
        <meshStandardMaterial color="#1E293B" metalness={0.9} roughness={0.3} />
      </mesh>

      {/* Blacksmith Apprentice NPC actively hammering at the Anvil */}
      <group position={[0.55, 0, 0.75]} rotation={[0, Math.PI, 0]}>
        {/* Torso */}
        <mesh position={[0, 0.4, 0]} castShadow>
          <boxGeometry args={[0.22, 0.3, 0.16]} />
          <meshStandardMaterial color="#B45309" />
        </mesh>
        {/* Head */}
        <mesh position={[0, 0.65, 0]} castShadow>
          <boxGeometry args={[0.18, 0.18, 0.18]} />
          <meshStandardMaterial color="#FDBA74" />
        </mesh>
        {/* Hammering Arm & Tool */}
        <mesh ref={hammerArmRef} position={[0.14, 0.45, 0.05]} castShadow>
          <boxGeometry args={[0.08, 0.28, 0.08]} />
          <meshStandardMaterial color="#78350F" />
        </mesh>
      </group>

      <pointLight position={[0.55, 0.6, 0.35]} color="#F97316" intensity={1.8} distance={3.5} />
    </group>
  );
}
