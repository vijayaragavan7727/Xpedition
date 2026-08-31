'use client';

import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface ElixirCondenserBuildingProps {
  level?: number;
  position?: [number, number, number];
  isSelected?: boolean;
  onClick?: () => void;
  crystalCount?: number;
}

export default function ElixirCondenserBuilding({
  level = 1,
  position = [-1.8, 0, 3.6],
  isSelected = false,
  onClick,
  crystalCount = 45,
}: ElixirCondenserBuildingProps) {
  const [hovered, setHovered] = useState(false);
  const liquidRef = useRef<THREE.Mesh>(null);
  const bubbleRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (liquidRef.current) {
      const s = 0.95 + Math.sin(t * 3) * 0.05;
      liquidRef.current.scale.set(1, s, 1);
    }
    if (bubbleRef.current) {
      bubbleRef.current.position.y = 0.6 + ((t * 0.8) % 0.8);
      bubbleRef.current.scale.setScalar(0.08 + Math.sin(t * 5) * 0.03);
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
      <Html position={[0, 2.4, 0]} center distanceFactor={14} zIndexRange={[100, 0]}>
        <div
          onClick={onClick}
          className={`px-2.5 py-0.5 rounded-lg backdrop-blur-md border text-white font-mono text-[10px] font-bold shadow-xl flex items-center gap-1 cursor-pointer transition-all select-none ${
            isSelected
              ? 'bg-[#A855F7]/40 border-[#A855F7] shadow-[0_0_15px_rgba(168,85,247,0.7)] scale-105'
              : 'bg-black/75 border-white/20 hover:border-[#A855F7]/70'
          }`}
        >
          <span>🔮</span>
          <span>Mana Vat</span>
          <span className="text-[#D8B4FE] text-[9px]">Lv.{level}</span>
        </div>
      </Html>

      {/* 2. Selection Ring */}
      {(isSelected || hovered) && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.0, 1.15, 24]} />
          <meshBasicMaterial color={isSelected ? '#00FF87' : '#C084FC'} />
        </mesh>
      )}

      {/* 3. Real 3D Elixir Condenser Geometry */}
      {/* Hexagonal Stone/Brass Base */}
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.0, 1.1, 0.3, 6]} />
        <meshStandardMaterial color="#334155" roughness={0.8} />
      </mesh>

      {/* Outer Glass Tank Cylinder */}
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.7, 0.7, 1.2, 16]} />
        <meshPhysicalMaterial
          color="#C084FC"
          transparent
          opacity={0.35}
          roughness={0.1}
          transmission={0.9}
          thickness={0.5}
        />
      </mesh>

      {/* Inner Glowing Mana Liquid */}
      <mesh ref={liquidRef} position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.62, 0.62, 1.0, 16]} />
        <meshStandardMaterial
          color="#A855F7"
          emissive="#A855F7"
          emissiveIntensity={3.0}
          roughness={0.1}
        />
      </mesh>

      {/* Bubbling Core Particle */}
      <mesh ref={bubbleRef} position={[0, 0.8, 0]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial color="#E9D5FF" emissive="#FFFFFF" emissiveIntensity={3} />
      </mesh>

      {/* Top Brass Condenser Cap & Curved Pipe */}
      <mesh position={[0, 1.55, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.75, 0.25, 12]} />
        <meshStandardMaterial color="#D97706" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.75, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
        <torusGeometry args={[0.25, 0.06, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#B45309" metalness={0.8} roughness={0.3} />
      </mesh>

      <pointLight position={[0, 0.9, 0]} color="#A855F7" intensity={2.5} distance={4.5} />
    </group>
  );
}
