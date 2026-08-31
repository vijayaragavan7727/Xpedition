'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface XPOrb {
  id: string;
  startPos: [number, number, number];
  targetPos: [number, number, number];
  color: string;
  progress: number; // 0 to 1
  speed: number;
}

interface XPParticleEmitterProps {
  burstPosition?: [number, number, number] | null;
  activeOrbs?: XPOrb[];
  onOrbComplete?: (id: string) => void;
}

export default function XPParticleEmitter({ burstPosition, activeOrbs = [], onOrbComplete }: XPParticleEmitterProps) {
  const particlesRef = useRef<THREE.Points>(null);

  // Procedural Celebration Sparkles
  const { positions, colors } = useMemo(() => {
    const count = 60;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const colorPalette = [
      new THREE.Color('#00F0FF'),
      new THREE.Color('#00FF87'),
      new THREE.Color('#F59E0B'),
      new THREE.Color('#A855F7'),
    ];

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 0.5 + Math.random() * 2.2;

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) + 1.2;
      pos[i * 3 + 2] = r * Math.cos(phi);

      const chosenColor = colorPalette[i % colorPalette.length];
      col[i * 3] = chosenColor.r;
      col[i * 3 + 1] = chosenColor.g;
      col[i * 3 + 2] = chosenColor.b;
    }

    return { positions: pos, colors: col };
  }, []);

  // Animate sparkles & orbs
  useFrame(({ clock }) => {
    if (particlesRef.current && burstPosition) {
      particlesRef.current.rotation.y = clock.getElapsedTime() * 0.8;
      particlesRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.5) * 0.2;
    }
  });

  return (
    <group>
      {/* 1. Burst Celebration Sparkles */}
      {burstPosition && (
        <group position={burstPosition}>
          <points ref={particlesRef}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[positions, 3]}
              />
              <bufferAttribute
                attach="attributes-color"
                args={[colors, 3]}
              />
            </bufferGeometry>
            <pointsMaterial
              size={0.18}
              vertexColors
              transparent
              opacity={0.9}
              blending={THREE.AdditiveBlending}
            />
          </points>

          {/* Flash Light at burst center */}
          <pointLight color="#00FF87" intensity={5} distance={8} />
        </group>
      )}

      {/* 2. Flying XP Energy Orbs */}
      {activeOrbs.map((orb) => {
        // Quadratic bezier arc trajectory
        const t = orb.progress;
        const midY = Math.max(orb.startPos[1], orb.targetPos[1]) + 2.5;
        const x = (1 - t) * (1 - t) * orb.startPos[0] + 2 * (1 - t) * t * ((orb.startPos[0] + orb.targetPos[0]) / 2) + t * t * orb.targetPos[0];
        const y = (1 - t) * (1 - t) * orb.startPos[1] + 2 * (1 - t) * t * midY + t * t * orb.targetPos[1];
        const z = (1 - t) * (1 - t) * orb.startPos[2] + 2 * (1 - t) * t * ((orb.startPos[2] + orb.targetPos[2]) / 2) + t * t * orb.targetPos[2];

        return (
          <group key={orb.id} position={[x, y, z]}>
            <mesh>
              <sphereGeometry args={[0.22, 16, 16]} />
              <meshStandardMaterial
                color={orb.color}
                emissive={orb.color}
                emissiveIntensity={3.5}
                roughness={0.1}
              />
            </mesh>
            <pointLight color={orb.color} intensity={2.5} distance={4} />
          </group>
        );
      })}
    </group>
  );
}
