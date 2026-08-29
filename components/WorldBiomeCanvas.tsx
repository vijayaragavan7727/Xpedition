'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Globe, Eye, Volume2, VolumeX, ShieldCheck, Zap } from 'lucide-react';

export interface ConceptLandmark {
  id: string;
  name: string;
  masteryPercentage: number;
  isSoloVerified?: boolean;
}

interface WorldBiomeCanvasProps {
  masteryPercentage: number;
  goalText: string;
  learnerName: string;
  concepts: ConceptLandmark[];
  onSelectConcept?: (concept: ConceptLandmark) => void;
  interactive?: boolean;
}

export function getWorldTier(mastery: number) {
  if (mastery >= 80) {
    return {
      tier: 5,
      name: 'The Celestial Utopia',
      subtitle: 'Sovereign Domain of Mastery',
      color: '#00F0FF',
      accentColor: '#A855F7',
      bgGradients: ['#0A061E', '#180B3A', '#2D0A4E'],
      quote: 'Total mastery achieved. A sovereign domain of deep understanding.',
      unlockDesc: 'Ascended cosmos sphere, celestial halos & transcendent star core.',
    };
  }
  if (mastery >= 60) {
    return {
      tier: 4,
      name: 'Nebula Sanctuary',
      subtitle: 'Ascendant Megacity & Spires',
      color: '#A855F7',
      accentColor: '#00F0FF',
      bgGradients: ['#080417', '#120A2F', '#1F1042'],
      quote: 'High competence unlocked. A radiant beacon in the knowledge cosmos.',
      unlockDesc: 'Planetary rings, floating energy temples & guardian drones.',
    };
  }
  if (mastery >= 40) {
    return {
      tier: 3,
      name: 'Syntropy Archipelago',
      subtitle: 'Crystalline Sky Islands',
      color: '#00FF87',
      accentColor: '#00F0FF',
      bgGradients: ['#040B14', '#061D24', '#0A2E33'],
      quote: 'Your skills are crystallizing into solid monuments of capability.',
      unlockDesc: 'Interconnected floating islands with glowing energy bridges.',
    };
  }
  if (mastery >= 20) {
    return {
      tier: 2,
      name: 'Verdant Biosphere',
      subtitle: 'Sprouting Flora & Crystal Springs',
      color: '#38BDF8',
      accentColor: '#34D399',
      bgGradients: ['#070B19', '#0B172E', '#0E2344'],
      quote: 'Foundations rooted deep. The first ecosystem takes breath.',
      unlockDesc: 'Bioluminescent flora, crystal springs & floating monoliths.',
    };
  }
  return {
    tier: 1,
    name: 'The Awakening Core',
    subtitle: 'Primordial Terraforming Seed',
    color: '#F59E0B',
    accentColor: '#EC4899',
    bgGradients: ['#0B0814', '#150E24', '#1F1333'],
    quote: 'Every master was once a beginner. The core has sparked to life.',
    unlockDesc: 'Floating obsidian core with neon energy fissures and glowing saplings.',
  };
}

export default function WorldBiomeCanvas({
  masteryPercentage,
  goalText,
  learnerName,
  concepts,
  onSelectConcept,
  interactive = true,
}: WorldBiomeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedLandmark, setSelectedLandmark] = useState<ConceptLandmark | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const tierInfo = getWorldTier(masteryPercentage);

  const playChime = () => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.3); // C6
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {}
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    // Generate static stars
    const starCount = 75;
    const stars: Array<{ x: number; y: number; size: number; alpha: number; speed: number }> = [];
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 1.8 + 0.4,
        alpha: Math.random() * 0.7 + 0.3,
        speed: Math.random() * 0.02 + 0.005,
      });
    }

    // Particle motes
    const motesCount = 30;
    const motes: Array<{ x: number; y: number; vx: number; vy: number; size: number; alpha: number }> = [];
    for (let i = 0; i < motesCount; i++) {
      motes.push({
        x: Math.random(),
        y: Math.random(),
        vx: (Math.random() - 0.5) * 0.0015,
        vy: -Math.random() * 0.002 - 0.0005,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.6 + 0.2,
      });
    }

    const render = () => {
      time += 0.025;
      const width = canvas.width;
      const height = canvas.height;
      if (!width || !height) return;

      // 1. Background Cosmic Nebula Gradient
      const grad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.5,
        10,
        width * 0.5,
        height * 0.5,
        width * 0.65
      );
      grad.addColorStop(0, tierInfo.bgGradients[2]);
      grad.addColorStop(0.5, tierInfo.bgGradients[1]);
      grad.addColorStop(1, tierInfo.bgGradients[0]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // 2. Stars with subtle twinkle
      stars.forEach((star) => {
        const twinkle = Math.sin(time * star.speed * 20 + star.x * 100) * 0.25;
        const currentAlpha = Math.max(0.1, Math.min(1, star.alpha + twinkle));
        ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`;
        ctx.beginPath();
        ctx.arc(star.x * width, star.y * height, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Ambient Aurora Wave
      ctx.save();
      ctx.beginPath();
      const auroraGrad = ctx.createLinearGradient(0, height * 0.2, width, height * 0.8);
      auroraGrad.addColorStop(0, `${tierInfo.color}15`);
      auroraGrad.addColorStop(0.5, `${tierInfo.accentColor}25`);
      auroraGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = auroraGrad;
      ctx.moveTo(0, height * 0.4);
      for (let x = 0; x <= width; x += 20) {
        const wave = Math.sin((x / width) * 4 + time * 0.8) * 25 + Math.cos((x / width) * 2 - time * 0.5) * 15;
        ctx.lineTo(x, height * 0.4 + wave);
      }
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      const centerX = width * 0.5;
      const floatOffsetY = Math.sin(time * 0.8) * 8;
      const centerY = height * 0.52 + floatOffsetY;
      const worldRadius = Math.min(width, height) * 0.26;

      // 4. Floating World Atmosphere Glow Halo
      const haloGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        worldRadius * 0.8,
        centerX,
        centerY,
        worldRadius * 1.55
      );
      haloGrad.addColorStop(0, `${tierInfo.color}35`);
      haloGrad.addColorStop(0.5, `${tierInfo.accentColor}18`);
      haloGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, worldRadius * 1.55, 0, Math.PI * 2);
      ctx.fill();

      // 5. Planetary Rings (For Tier 4 and 5)
      if (tierInfo.tier >= 4) {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(-Math.PI / 8);
        ctx.beginPath();
        ctx.ellipse(0, 0, worldRadius * 1.7, worldRadius * 0.4, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `${tierInfo.accentColor}50`;
        ctx.lineWidth = tierInfo.tier === 5 ? 6 : 3.5;
        ctx.shadowColor = tierInfo.color;
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.restore();
      }

      // 6. Main Floating World Base Sphere / Island
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, worldRadius, 0, Math.PI * 2);
      const sphereGrad = ctx.createRadialGradient(
        centerX - worldRadius * 0.35,
        centerY - worldRadius * 0.35,
        worldRadius * 0.1,
        centerX,
        centerY,
        worldRadius
      );

      if (tierInfo.tier >= 4) {
        sphereGrad.addColorStop(0, '#261452');
        sphereGrad.addColorStop(0.4, '#150A30');
        sphereGrad.addColorStop(0.8, '#0B051D');
        sphereGrad.addColorStop(1, '#05020E');
      } else if (tierInfo.tier >= 2) {
        sphereGrad.addColorStop(0, '#0D333E');
        sphereGrad.addColorStop(0.4, '#081D26');
        sphereGrad.addColorStop(0.8, '#051119');
        sphereGrad.addColorStop(1, '#02070C');
      } else {
        sphereGrad.addColorStop(0, '#241328');
        sphereGrad.addColorStop(0.4, '#160B1C');
        sphereGrad.addColorStop(0.8, '#0F0614');
        sphereGrad.addColorStop(1, '#06020A');
      }

      ctx.fillStyle = sphereGrad;
      ctx.shadowColor = tierInfo.color;
      ctx.shadowBlur = 24;
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = `${tierInfo.color}80`;
      ctx.stroke();
      ctx.restore();

      // 7. Internal Energy Core Pulse (Terraform Growth Level)
      const corePulse = (Math.sin(time * 2) * 0.1 + 0.9) * (masteryPercentage / 100);
      const coreRadius = worldRadius * (0.2 + corePulse * 0.35);
      const coreGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        coreRadius
      );
      coreGrad.addColorStop(0, '#FFFFFF');
      coreGrad.addColorStop(0.3, tierInfo.color);
      coreGrad.addColorStop(0.7, `${tierInfo.accentColor}80`);
      coreGrad.addColorStop(1, 'transparent');

      ctx.save();
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 8. Dynamic Floating Landmass / Archipelago Islands
      const numIslands = Math.min(5, Math.max(1, tierInfo.tier));
      for (let i = 0; i < numIslands; i++) {
        const angle = (i / numIslands) * Math.PI * 2 + time * 0.2;
        const dist = worldRadius * (0.68 + (i % 2) * 0.15);
        const ix = centerX + Math.cos(angle) * dist;
        const iy = centerY + Math.sin(angle) * (dist * 0.55);
        const isize = worldRadius * 0.18;

        ctx.save();
        ctx.beginPath();
        ctx.ellipse(ix, iy, isize, isize * 0.6, 0, 0, Math.PI * 2);
        ctx.fillStyle = `${tierInfo.color}35`;
        ctx.strokeStyle = `${tierInfo.color}90`;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = tierInfo.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // 9. Concept Landmark Spires & Beacons
      const conceptList = concepts.slice(0, 8);
      conceptList.forEach((c, idx) => {
        const total = conceptList.length || 1;
        const angle = (idx / total) * Math.PI * 2 + time * 0.15;
        const dist = worldRadius * 0.95;
        const lx = centerX + Math.cos(angle) * dist;
        const ly = centerY + Math.sin(angle) * (dist * 0.65);

        const isHighMastery = c.masteryPercentage >= 70;
        const isMidMastery = c.masteryPercentage >= 35;
        const spireHeight = 16 + (c.masteryPercentage / 100) * 24;

        ctx.save();
        // Spire Beam
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(lx, ly - spireHeight);
        ctx.strokeStyle = isHighMastery
          ? '#00FF87'
          : isMidMastery
          ? '#00F0FF'
          : '#A855F7';
        ctx.lineWidth = isHighMastery ? 3 : 2;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = 12;
        ctx.stroke();

        // Beacon Crystal Crown
        ctx.beginPath();
        ctx.arc(lx, ly - spireHeight, isHighMastery ? 5 : 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();

        // Pulse ring around beacon
        const beaconPulse = (Math.sin(time * 3 + idx) + 1) * 3;
        ctx.beginPath();
        ctx.arc(lx, ly - spireHeight, 5 + beaconPulse, 0, Math.PI * 2);
        ctx.strokeStyle = isHighMastery ? '#00FF8780' : '#00F0FF80';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();
      });

      // 10. Floating Particle Motes
      motes.forEach((m) => {
        m.x += m.vx;
        m.y += m.vy;
        if (m.y < 0) m.y = 1;
        if (m.x < 0) m.x = 1;
        if (m.x > 1) m.x = 0;

        ctx.fillStyle = `${tierInfo.color}${Math.floor(m.alpha * 255).toString(16).padStart(2, '0')}`;
        ctx.beginPath();
        ctx.arc(m.x * width, m.y * height, m.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [masteryPercentage, concepts, tierInfo]);

  return (
    <div className="relative rounded-[24px] overflow-hidden border border-white/15 bg-[#0A0718] shadow-[0_20px_60px_rgba(0,0,0,0.8)] select-none">
      {/* Top Floating Badge Bar */}
      <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-10 pointer-events-none">
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-full shadow-lg pointer-events-auto">
          <div
            className="w-2.5 h-2.5 rounded-full animate-ping"
            style={{ backgroundColor: tierInfo.color }}
          />
          <span className="font-mono text-[10px] sm:text-xs font-bold text-white uppercase tracking-wider">
            Tier {tierInfo.tier} &middot; {tierInfo.name}
          </span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              playChime();
            }}
            className="w-8 h-8 rounded-full bg-black/60 border border-white/15 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md"
            title={soundEnabled ? 'Mute Ambient Chimes' : 'Enable Ambient Chimes'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#00F0FF]" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <span className="font-mono text-[11px] sm:text-xs font-bold px-3 py-1.5 rounded-full bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30 backdrop-blur-md shadow-sm">
            {masteryPercentage}% Terraformed
          </span>
        </div>
      </div>

      {/* Main Living Canvas */}
      <canvas
        ref={canvasRef}
        width={640}
        height={380}
        onClick={playChime}
        className="w-full h-[280px] sm:h-[360px] block cursor-pointer transition-transform active:scale-[0.995]"
      />

      {/* Bottom Floating Info Overlay */}
      <div className="absolute bottom-3.5 left-3.5 right-3.5 bg-black/75 backdrop-blur-xl border border-white/10 p-3 sm:p-4 rounded-2xl flex items-center justify-between gap-3 shadow-xl">
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span className="font-mono text-[11px] text-white font-bold truncate">
              {goalText}
            </span>
          </div>
          <p className="font-sans text-[11px] text-slate-300 italic truncate">
            &ldquo;{tierInfo.quote}&rdquo;
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
          <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300">
            {concepts.length} Biomes Planted
          </span>
        </div>
      </div>
    </div>
  );
}
