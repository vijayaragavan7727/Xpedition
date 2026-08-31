'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface PlayerCharacterProps {
  learnerName: string;
  learnerLevel: number;
  targetPosition: [number, number, number];
  onReachedTarget?: () => void;
}

export default function PlayerCharacter({
  learnerName,
  learnerLevel,
  targetPosition,
  onReachedTarget,
}: PlayerCharacterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const torsoRef = useRef<THREE.Mesh>(null);

  const [currentPos, setCurrentPos] = useState<[number, number, number]>([0, 0, 0]);
  const [isMoving, setIsMoving] = useState(false);

  // Speed and thresholds
  const walkSpeed = 3.5;

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;

    const current = groupRef.current.position;
    const target = new THREE.Vector3(targetPosition[0], 0, targetPosition[2]);
    const distance = current.distanceTo(target);

    if (distance > 0.08) {
      setIsMoving(true);

      // Move toward target
      const dir = new THREE.Vector3().subVectors(target, current).normalize();
      current.addScaledVector(dir, Math.min(distance, walkSpeed * delta));

      // Rotate toward target
      const targetAngle = Math.atan2(dir.x, dir.z);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetAngle, 0.2);

      // Walking Leg & Arm Swing Animation
      const t = clock.getElapsedTime() * 12;
      if (leftLegRef.current && rightLegRef.current) {
        leftLegRef.current.rotation.x = Math.sin(t) * 0.6;
        rightLegRef.current.rotation.x = -Math.sin(t) * 0.6;
      }
      if (leftArmRef.current && rightArmRef.current) {
        leftArmRef.current.rotation.x = -Math.sin(t) * 0.5;
        rightArmRef.current.rotation.x = Math.sin(t) * 0.5;
      }
      if (torsoRef.current) {
        torsoRef.current.position.y = 0.55 + Math.abs(Math.sin(t)) * 0.05;
      }
    } else {
      if (isMoving) {
        setIsMoving(false);
        onReachedTarget?.();
      }

      // Idle Breathing & Bobbing Animation
      const t = clock.getElapsedTime() * 3;
      if (leftLegRef.current && rightLegRef.current) {
        leftLegRef.current.rotation.x = 0;
        rightLegRef.current.rotation.x = 0;
      }
      if (leftArmRef.current && rightArmRef.current) {
        leftArmRef.current.rotation.x = Math.sin(t) * 0.08;
        rightArmRef.current.rotation.x = -Math.sin(t) * 0.08;
      }
      if (torsoRef.current) {
        torsoRef.current.position.y = 0.55 + Math.sin(t) * 0.03;
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* 1. Floating Learner Name & Level Badge */}
      <Html position={[0, 1.45, 0]} center distanceFactor={14} zIndexRange={[100, 0]}>
        <div className="px-2.5 py-0.5 rounded-full bg-black/80 backdrop-blur-md border border-[#00F0FF]/60 text-white font-mono text-[10px] font-bold shadow-lg flex items-center gap-1.5 whitespace-nowrap pointer-events-none select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00FF87] animate-pulse" />
          <span className="text-white">{learnerName}</span>
          <span className="text-[#00F0FF] bg-white/10 px-1 rounded text-[9px]">Lv.{learnerLevel}</span>
        </div>
      </Html>

      {/* 2. Low-Poly Humanoid Body Geometry */}
      {/* Torso */}
      <mesh ref={torsoRef} position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[0.36, 0.45, 0.22]} />
        <meshStandardMaterial color="#3B82F6" roughness={0.4} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.95, 0]} castShadow>
        <boxGeometry args={[0.26, 0.26, 0.24]} />
        <meshStandardMaterial color="#FDBA74" roughness={0.6} />
      </mesh>

      {/* Futuristic Glowing Headband / Visor */}
      <mesh position={[0, 0.98, 0.02]}>
        <boxGeometry args={[0.28, 0.07, 0.26]} />
        <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={2.5} />
      </mesh>

      {/* Hair / Cap */}
      <mesh position={[0, 1.1, -0.02]} castShadow>
        <boxGeometry args={[0.28, 0.1, 0.26]} />
        <meshStandardMaterial color="#1E1B4B" roughness={0.8} />
      </mesh>

      {/* Backpack / Tech Core */}
      <mesh position={[0, 0.58, -0.15]} castShadow>
        <boxGeometry args={[0.24, 0.32, 0.12]} />
        <meshStandardMaterial color="#0F172A" />
      </mesh>
      <mesh position={[0, 0.58, -0.22]}>
        <boxGeometry args={[0.1, 0.14, 0.04]} />
        <meshStandardMaterial color="#00FF87" emissive="#00FF87" emissiveIntensity={3} />
      </mesh>

      {/* Left Arm */}
      <mesh ref={leftArmRef} position={[-0.24, 0.55, 0]} castShadow>
        <boxGeometry args={[0.1, 0.36, 0.12]} />
        <meshStandardMaterial color="#2563EB" />
      </mesh>

      {/* Right Arm */}
      <mesh ref={rightArmRef} position={[0.24, 0.55, 0]} castShadow>
        <boxGeometry args={[0.1, 0.36, 0.12]} />
        <meshStandardMaterial color="#2563EB" />
      </mesh>

      {/* Left Leg */}
      <mesh ref={leftLegRef} position={[-0.1, 0.18, 0]} castShadow>
        <boxGeometry args={[0.12, 0.36, 0.14]} />
        <meshStandardMaterial color="#1E293B" />
      </mesh>

      {/* Right Leg */}
      <mesh ref={rightLegRef} position={[0.1, 0.18, 0]} castShadow>
        <boxGeometry args={[0.12, 0.36, 0.14]} />
        <meshStandardMaterial color="#1E293B" />
      </mesh>

      {/* Dynamic Player Shadow / Ground Glow */}
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.15, 0.35, 16]} />
        <meshBasicMaterial color="#00F0FF" transparent opacity={0.35} />
      </mesh>
    </group>
  );
}
