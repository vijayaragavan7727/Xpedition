'use client';

import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface AILabBuildingProps {
  position?: [number, number, number];
  isSelected?: boolean;
  onClick?: () => void;
  accuracyRate?: number;
}

export default function AILabBuilding({
  position = [-3.8, 0, -2.8],
  isSelected = false,
  onClick,
  accuracyRate = 85,
}: AILabBuildingProps) {
  const coilRef = useRef<THREE.Mesh>(null);
  const generatorRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (coilRef.current) {
      coilRef.current.rotation.y = t * 2.2;
    }
    if (generatorRef.current) {
      generatorRef.current.position.y = Math.sin(t * 2) * 0.03;
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
      {/* 1. Floating Building Name & Stats Badge */}
      <Html position={[0, 2.4, 0]} center distanceFactor={14} zIndexRange={[100, 0]}>
        <div
          onClick={onClick}
          className={`px-3 py-1 rounded-xl backdrop-blur-md border text-white font-mono text-[11px] font-bold shadow-2xl flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all select-none ${
            isSelected
              ? 'bg-[#00FF87]/30 border-[#00FF87] shadow-[0_0_20px_rgba(0,255,135,0.6)] scale-105'
              : 'bg-black/75 border-white/20 hover:border-[#00FF87]/70'
          }`}
        >
          <span className="text-sm">🤖</span>
          <span>AI Lab</span>
          <span className="px-1.5 py-0.2 rounded bg-emerald-400/20 text-[#00FF87] text-[9px] uppercase font-mono">
            {accuracyRate}% Accuracy
          </span>
        </div>
      </Html>

      {/* 2. Interactive Selection Ground Ring */}
      {(isSelected || hovered) && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.3, 1.45, 32]} />
          <meshBasicMaterial color={isSelected ? '#00FF87' : '#00F0FF'} />
        </mesh>
      )}

      {/* 3. Real 3D Building Geometry */}
      <group ref={generatorRef}>
        {/* Stone Base */}
        <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.3, 1.4, 0.3, 6]} />
          <meshStandardMaterial color="#334155" roughness={0.8} />
        </mesh>

        {/* Main Lab Hexagon Base */}
        <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.1, 1.15, 0.9, 6]} />
          <meshStandardMaterial color="#0F172A" roughness={0.4} />
        </mesh>

        {/* Glowing Plasma Energy Coil */}
        <mesh ref={coilRef} position={[0, 1.4, 0]}>
          <torusGeometry args={[0.55, 0.08, 12, 24]} />
          <meshStandardMaterial color="#00FF87" emissive="#00FF87" emissiveIntensity={3.5} roughness={0.1} />
        </mesh>

        {/* Energy Core Sphere */}
        <mesh position={[0, 1.4, 0]}>
          <sphereGeometry args={[0.26, 16, 16]} />
          <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={3} />
        </mesh>

        {/* Tech Antenna Pylons */}
        {[-0.6, 0.6].map((x, i) => (
          <group key={i} position={[x, 0.8, 0.7]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.04, 0.04, 0.8, 6]} />
              <meshStandardMaterial color="#475569" />
            </mesh>
            <mesh position={[0, 0.45, 0]}>
              <octahedronGeometry args={[0.1, 0]} />
              <meshStandardMaterial color="#00FF87" emissive="#00FF87" emissiveIntensity={2.5} />
            </mesh>
          </group>
        ))}

        <pointLight position={[0, 1.4, 0]} color="#00FF87" intensity={2.5} distance={5} />
      </group>
    </group>
  );
}
