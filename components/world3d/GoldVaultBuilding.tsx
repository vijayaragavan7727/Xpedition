'use client';

import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface GoldVaultBuildingProps {
  level?: number;
  position?: [number, number, number];
  isSelected?: boolean;
  onClick?: () => void;
  goldCount?: number;
}

export default function GoldVaultBuilding({
  level = 1,
  position = [-3.6, 0, 2.2],
  isSelected = false,
  onClick,
  goldCount = 450,
}: GoldVaultBuildingProps) {
  const [hovered, setHovered] = useState(false);
  const coinsRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (coinsRef.current) {
      coinsRef.current.position.y = Math.sin(clock.getElapsedTime() * 2) * 0.02;
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
      <Html position={[0, 2.0, 0]} center distanceFactor={14} zIndexRange={[100, 0]}>
        <div
          onClick={onClick}
          className={`px-2.5 py-0.5 rounded-lg backdrop-blur-md border text-white font-mono text-[10px] font-bold shadow-xl flex items-center gap-1 cursor-pointer transition-all select-none ${
            isSelected
              ? 'bg-[#EAB308]/40 border-[#EAB308] shadow-[0_0_15px_rgba(234,179,8,0.7)] scale-105'
              : 'bg-black/75 border-white/20 hover:border-[#EAB308]/70'
          }`}
        >
          <span>🪙</span>
          <span>Vault</span>
          <span className="text-[#FACC15] text-[9px]">Lv.{level}</span>
        </div>
      </Html>

      {/* 2. Selection Ring */}
      {(isSelected || hovered) && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.0, 1.15, 24]} />
          <meshBasicMaterial color={isSelected ? '#00FF87' : '#FACC15'} />
        </mesh>
      )}

      {/* 3. Real 3D Vault Geometry */}
      {/* Heavy Stone Foundation Basin */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.5, 1.5]} />
        <meshStandardMaterial color="#475569" roughness={0.8} />
      </mesh>

      {/* Iron Corner Rivets & Brackets */}
      {[-0.65, 0.65].map((x, i) =>
        [-0.65, 0.65].map((z, j) => (
          <mesh key={`${i}_${j}`} position={[x, 0.25, z]} castShadow>
            <boxGeometry args={[0.22, 0.52, 0.22]} />
            <meshStandardMaterial color="#1E293B" metalness={0.8} roughness={0.3} />
          </mesh>
        ))
      )}

      {/* Overflowing Gold Coins & Ingots */}
      <group ref={coinsRef} position={[0, 0.55, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.2, 0.35, 1.2]} />
          <meshStandardMaterial
            color="#EAB308"
            emissive="#CA8A04"
            emissiveIntensity={1.2}
            metalness={0.9}
            roughness={0.2}
          />
        </mesh>

        {/* Scattered Gold Nuggets on top */}
        {[-0.3, 0, 0.3].map((x, i) =>
          [-0.3, 0, 0.3].map((z, j) => (
            <mesh key={`coin_${i}_${j}`} position={[x, 0.22, z]} rotation={[0.2, i, 0.1]} castShadow>
              <cylinderGeometry args={[0.12, 0.12, 0.08, 8]} />
              <meshStandardMaterial
                color="#FACC15"
                emissive="#EAB308"
                emissiveIntensity={2.0}
                metalness={0.95}
                roughness={0.15}
              />
            </mesh>
          ))
        )}
      </group>

      <pointLight position={[0, 0.8, 0]} color="#FACC15" intensity={1.8} distance={3.5} />
    </group>
  );
}
