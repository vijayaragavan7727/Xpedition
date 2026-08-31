'use client';

import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface MentorNPCProps {
  position?: [number, number, number];
  onClick?: () => void;
  hasQuestAvailable?: boolean;
}

export default function MentorNPC({
  position = [1.4, 0, 1.2],
  onClick,
  hasQuestAvailable = true,
}: MentorNPCProps) {
  const robotRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (robotRef.current) {
      robotRef.current.position.y = 0.65 + Math.sin(t * 2.5) * 0.08;
      robotRef.current.rotation.y = Math.sin(t * 0.8) * 0.25;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 1.5;
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
      {/* 1. Floating NPC Quest Exclamation Mark */}
      {hasQuestAvailable && (
        <Html position={[0, 1.4, 0]} center distanceFactor={14} zIndexRange={[100, 0]}>
          <div
            onClick={onClick}
            className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-black font-black text-xs flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.9)] animate-bounce cursor-pointer border-2 border-white select-none"
          >
            !
          </div>
        </Html>
      )}

      {/* 2. Floating Robot Mentor Geometry (XYRA) */}
      <group ref={robotRef}>
        {/* Sphere Head/Body */}
        <mesh castShadow>
          <sphereGeometry args={[0.32, 16, 16]} />
          <meshStandardMaterial color="#0F172A" roughness={0.2} metalness={0.8} />
        </mesh>

        {/* Visor Screen */}
        <mesh position={[0, 0.02, 0.22]}>
          <boxGeometry args={[0.34, 0.14, 0.12]} />
          <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={3} roughness={0.1} />
        </mesh>

        {/* Glowing Eyes */}
        <mesh position={[-0.08, 0.03, 0.29]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
        <mesh position={[0.08, 0.03, 0.29]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>

        {/* Orbiting Tech Ring */}
        <mesh ref={ringRef} rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[0.48, 0.025, 8, 24]} />
          <meshStandardMaterial color="#A855F7" emissive="#A855F7" emissiveIntensity={2.5} />
        </mesh>

        {/* Antenna Spire */}
        <mesh position={[0, 0.38, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.15, 6]} />
          <meshStandardMaterial color="#94A3B8" />
        </mesh>
        <mesh position={[0, 0.46, 0]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="#00FF87" emissive="#00FF87" emissiveIntensity={3.5} />
        </mesh>

        {/* Floating Thruster Glow */}
        <pointLight position={[0, -0.25, 0]} color="#00F0FF" intensity={2.0} distance={2.5} />
      </group>

      {/* 3. Ground Halo Indicator */}
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.45, 16]} />
        <meshBasicMaterial color={hovered ? '#00FF87' : '#F59E0B'} transparent opacity={0.6} />
      </mesh>
    </group>
  );
}
