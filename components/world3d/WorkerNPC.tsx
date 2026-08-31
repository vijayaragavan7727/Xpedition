'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface WorkerNPCProps {
  id: string;
  startPos: [number, number, number];
  endPos: [number, number, number];
  speed?: number;
  color?: string;
  hasResource?: boolean;
}

export default function WorkerNPC({
  startPos,
  endPos,
  speed = 1.2,
  color = '#38BDF8',
  hasResource = true,
}: WorkerNPCProps) {
  const groupRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const crystalRef = useRef<THREE.Mesh>(null);

  const startV = new THREE.Vector3(...startPos);
  const endV = new THREE.Vector3(...endPos);
  const totalDist = startV.distanceTo(endV);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime() * speed;
    // Ping-pong progress between 0 and 1
    const rawProgress = (Math.sin(t * 0.8) + 1) / 2;
    const isReturning = Math.cos(t * 0.8) < 0;

    // Lerp position along the path
    const current = new THREE.Vector3().lerpVectors(startV, endV, rawProgress);
    groupRef.current.position.set(current.x, 0, current.z);

    // Rotate toward travel direction
    const forwardAngle = Math.atan2(endV.x - startV.x, endV.z - startV.z);
    groupRef.current.rotation.y = isReturning ? forwardAngle + Math.PI : forwardAngle;

    // Leg swing walking animation
    const swing = Math.sin(t * 8) * 0.55;
    if (leftLegRef.current && rightLegRef.current) {
      leftLegRef.current.rotation.x = swing;
      rightLegRef.current.rotation.x = -swing;
    }

    if (crystalRef.current) {
      crystalRef.current.position.y = 0.85 + Math.sin(t * 6) * 0.04;
    }
  });

  return (
    <group ref={groupRef} position={startPos}>
      {/* Mini Low-Poly Worker Body */}
      {/* Torso */}
      <mesh position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={[0.26, 0.32, 0.18]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[0.2, 0.2, 0.18]} />
        <meshStandardMaterial color="#FDBA74" roughness={0.7} />
      </mesh>

      {/* Hardhat / Headband */}
      <mesh position={[0, 0.81, 0]}>
        <boxGeometry args={[0.22, 0.08, 0.2]} />
        <meshStandardMaterial color="#F59E0B" emissive="#F59E0B" emissiveIntensity={0.8} />
      </mesh>

      {/* Carried Glowing Resource Crystal */}
      {hasResource && (
        <mesh ref={crystalRef} position={[0, 0.85, 0.16]}>
          <octahedronGeometry args={[0.1, 0]} />
          <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={2.5} />
        </mesh>
      )}

      {/* Left Leg */}
      <mesh ref={leftLegRef} position={[-0.08, 0.14, 0]} castShadow>
        <boxGeometry args={[0.09, 0.26, 0.1]} />
        <meshStandardMaterial color="#1E293B" />
      </mesh>

      {/* Right Leg */}
      <mesh ref={rightLegRef} position={[0.08, 0.14, 0]} castShadow>
        <boxGeometry args={[0.09, 0.26, 0.1]} />
        <meshStandardMaterial color="#1E293B" />
      </mesh>
    </group>
  );
}
