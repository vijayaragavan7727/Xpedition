'use client';

import React, { useState } from 'react';
import { WorldBuilding } from '@/lib/worldEngine';
import { WorldThemeId } from '@/lib/themes';
import { generateBuildingPrompt, getBuildingSeed } from '@/lib/buildingImages';
import { Sparkles } from 'lucide-react';

interface WorldRendererProps {
  theme?: WorldThemeId | string;
  buildings: WorldBuilding[];
  height?: number | string;
  isMiniPreview?: boolean;
  isFullScreen?: boolean;
  onSelectBuilding?: (building: WorldBuilding) => void;
}

interface ThemePalette {
  skyGradient: [string, string, string];
  tileTop: string;
  tileLeft: string;
  tileRight: string;
  tileBorder: string;
  buildingFrontLeft: string;
  buildingFrontRight: string;
  buildingRoof: string;
  buildingAccent: string;
  scaffoldColor: string;
  glowColor: string;
  particleColor: string;
  windowGlow: string;
}

const THEME_PALETTES: Record<string, ThemePalette> = {
  cosmos: {
    skyGradient: ['#0A051E', '#180B38', '#250E4C'],
    tileTop: '#1E1238',
    tileLeft: '#130B24',
    tileRight: '#180E2E',
    tileBorder: '#00F0FF50',
    buildingFrontLeft: '#081D33',
    buildingFrontRight: '#0E3B64',
    buildingRoof: '#00F0FF',
    buildingAccent: '#F59E0B',
    scaffoldColor: '#00F0FF80',
    glowColor: '#00F0FF',
    particleColor: '#00F0FF',
    windowGlow: '#00F0FF',
  },
  cyber_city: {
    skyGradient: ['#030712', '#0A152E', '#102A45'],
    tileTop: '#0B2233',
    tileLeft: '#06141F',
    tileRight: '#081A29',
    tileBorder: '#00FF8750',
    buildingFrontLeft: '#180B2B',
    buildingFrontRight: '#2E114F',
    buildingRoof: '#00FF87',
    buildingAccent: '#FF0055',
    scaffoldColor: '#00FF8780',
    glowColor: '#FF0055',
    particleColor: '#00FF87',
    windowGlow: '#00FF87',
  },
  enchanted_kingdom: {
    skyGradient: ['#04140E', '#0B291E', '#174735'],
    tileTop: '#143828',
    tileLeft: '#0C241A',
    tileRight: '#102E21',
    tileBorder: '#34D39950',
    buildingFrontLeft: '#1F2933',
    buildingFrontRight: '#3E4C59',
    buildingRoof: '#34D399',
    buildingAccent: '#C084FC',
    scaffoldColor: '#34D39980',
    glowColor: '#C084FC',
    particleColor: '#34D399',
    windowGlow: '#E9D5FF',
  },
  ocean_world: {
    skyGradient: ['#020B16', '#041E33', '#063552'],
    tileTop: '#0C354A',
    tileLeft: '#072230',
    tileRight: '#092A3A',
    tileBorder: '#38BDF850',
    buildingFrontLeft: '#083344',
    buildingFrontRight: '#0E7490',
    buildingRoof: '#38BDF8',
    buildingAccent: '#2DD4BF',
    scaffoldColor: '#38BDF880',
    glowColor: '#2DD4BF',
    particleColor: '#38BDF8',
    windowGlow: '#A5F3FC',
  },
  desert_empire: {
    skyGradient: ['#140903', '#2B1306', '#421E0A'],
    tileTop: '#3D2010',
    tileLeft: '#24130A',
    tileRight: '#301A0D',
    tileBorder: '#F59E0B50',
    buildingFrontLeft: '#451A03',
    buildingFrontRight: '#78350F',
    buildingRoof: '#F59E0B',
    buildingAccent: '#FB923C',
    scaffoldColor: '#F59E0B80',
    glowColor: '#F59E0B',
    particleColor: '#F59E0B',
    windowGlow: '#FEF08A',
  },
};

// Calibrated Diamond Isometric Layout Coordinates (No Overlap)
const DIAMOND_GRID_SLOTS = [
  { col: 1, row: 0, x: 200, y: 72, depth: 1 },  // Slot 0: Top
  { col: 2, row: 1, x: 295, y: 130, depth: 3 }, // Slot 1: Right
  { col: 0, row: 1, x: 105, y: 130, depth: 1 }, // Slot 2: Left
  { col: 1, row: 2, x: 200, y: 190, depth: 3 }, // Slot 3: Bottom / Center
  { col: 2, row: 2, x: 295, y: 220, depth: 4 }, // Slot 4: Bottom Right
  { col: 0, row: 2, x: 105, y: 220, depth: 2 }, // Slot 5: Bottom Left
];

export default function WorldRenderer({
  theme = 'cosmos',
  buildings,
  height = 300,
  isMiniPreview = false,
  isFullScreen = false,
  onSelectBuilding,
}: WorldRendererProps) {
  const [activeTooltip, setActiveTooltip] = useState<WorldBuilding | null>(null);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const activeThemeKey = theme in THEME_PALETTES ? theme : 'cosmos';
  const palette = THEME_PALETTES[activeThemeKey];

  // Tile Dimensions
  const tileW = 96;
  const tileH = 48;

  const paddedBuildings: (WorldBuilding | null)[] = [...buildings];
  while (paddedBuildings.length < 6) {
    paddedBuildings.push(null);
  }

  // Map each building to its distinct diamond grid position
  const slotsWithCoords = DIAMOND_GRID_SLOTS.map((slot, idx) => {
    const bldg = paddedBuildings[idx];
    return {
      building: bldg,
      slotIndex: idx,
      ...slot,
    };
  });

  // Sort back-to-front by depth
  slotsWithCoords.sort((a, b) => a.depth - b.depth);

  return (
    <div
      className="relative w-full h-full rounded-[24px] overflow-hidden select-none border border-white/15 bg-black shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    >
      <svg
        viewBox="0 0 400 300"
        className="w-full h-full block"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Background Sky Gradient */}
          <linearGradient id={`skyGrad_${activeThemeKey}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={palette.skyGradient[0]} />
            <stop offset="50%" stopColor={palette.skyGradient[1]} />
            <stop offset="100%" stopColor={palette.skyGradient[2]} />
          </linearGradient>

          {/* Shadow Filter */}
          <filter id="shadowBlur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
          </filter>

          {/* Theme Dynamic Drop-Shadow Glow Filter */}
          <filter id={`themeEdgeGlow_${activeThemeKey}`} x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor={palette.glowColor} floodOpacity="0.6" />
          </filter>

          <style>
            {`
              @keyframes buildingFloat {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-4px); }
              }
              @keyframes buildingGlowPulse {
                0%, 100% { filter: drop-shadow(0 4px 10px ${palette.glowColor}50); }
                50% { filter: drop-shadow(0 8px 20px ${palette.glowColor}95); }
              }
              @keyframes partialPulse {
                0%, 100% { opacity: 0.85; }
                50% { opacity: 1; }
              }
              @keyframes flagFlutter {
                0%, 100% { transform: rotate(0deg); }
                50% { transform: rotate(5deg); }
              }
              @keyframes particleDrift {
                0% { transform: translateY(0px); opacity: 0; }
                50% { opacity: 0.85; }
                100% { transform: translateY(-24px); opacity: 0; }
              }
              @keyframes windowBlink {
                0%, 100% { opacity: 0.8; }
                50% { opacity: 1; }
              }
              @keyframes antennaPulse {
                0%, 100% { fill: #FFFFFF; r: 3; }
                50% { fill: ${palette.glowColor}; r: 4; }
              }

              .anim-complete-image {
                transform-origin: center bottom;
                animation: buildingFloat 3s ease-in-out infinite, buildingGlowPulse 2.5s ease-in-out infinite;
              }
              .anim-partial-image {
                animation: partialPulse 2.5s ease-in-out infinite;
              }
              .anim-flag {
                transform-origin: left bottom;
                animation: flagFlutter 4s ease-in-out infinite;
              }
              .building-complete-svg {
                transform-origin: center bottom;
                animation: buildingFloat 3s ease-in-out infinite;
              }
              .particle-item {
                animation: particleDrift 4s ease-in-out infinite;
              }
              .window-glow {
                animation: windowBlink 2.5s ease-in-out infinite;
              }
              .antenna-tip {
                animation: antennaPulse 1.8s ease-in-out infinite;
              }

              @media (prefers-reduced-motion: reduce) {
                .anim-complete-image, .anim-partial-image, .anim-flag, .building-complete-svg, .particle-item, .window-glow, .antenna-tip {
                  animation: none !important;
                }
              }
            `}
          </style>
        </defs>

        {/* LAYER 1: Background Sky */}
        <rect width="400" height="300" fill={`url(#skyGrad_${activeThemeKey})`} />

        {/* LAYER 2: Floating Particle Motes */}
        {!isMiniPreview && (
          <g className="particles-layer">
            {[
              { cx: 50, cy: 50, delay: '0s', r: 1.8 },
              { cx: 130, cy: 30, delay: '1.2s', r: 1.5 },
              { cx: 220, cy: 35, delay: '2.4s', r: 2.0 },
              { cx: 340, cy: 60, delay: '0.8s', r: 1.4 },
              { cx: 370, cy: 110, delay: '1.9s', r: 1.8 },
              { cx: 90, cy: 220, delay: '3.1s', r: 1.5 },
              { cx: 310, cy: 250, delay: '2.7s', r: 2.0 },
            ].map((p, pIdx) => (
              <circle
                key={pIdx}
                cx={p.cx}
                cy={p.cy}
                r={p.r}
                fill={palette.particleColor}
                className="particle-item"
                style={{ animationDelay: p.delay }}
              />
            ))}
          </g>
        )}

        {/* LAYER 3: Isometric Grid & Buildings (Rendered Back-to-Front) */}
        <g id="isometricWorldStage">
          {slotsWithCoords.map(({ building: bldg, slotIndex: idx, x, y }) => {
            const state = bldg?.state || 'empty';
            const conceptName = bldg?.conceptName || `Plot ${idx + 1}`;
            const imageKey = bldg ? `${bldg.buildingId}_${state}_${activeThemeKey}` : `empty_${idx}`;
            const isImageLoaded = !!loadedImages[imageKey];
            const isFailed = !!failedImages[imageKey];

            // Build dynamic prompt and proxy image URL with seed
            const buildingPrompt = bldg ? generateBuildingPrompt(conceptName, activeThemeKey, state) : '';
            const seed = bldg ? getBuildingSeed(conceptName, activeThemeKey) : 42;
            const proxyImageUrl = bldg?.imageUrl || (bldg
              ? `/api/worldimage?prompt=${encodeURIComponent(buildingPrompt)}&seed=${seed}`
              : null);

            // Tile Path: Diamond (Top, Right, Bottom, Left)
            const tileTopPt = `${x},${y - tileH / 2}`;
            const tileRightPt = `${x + tileW / 2},${y}`;
            const tileBottomPt = `${x},${y + tileH / 2}`;
            const tileLeftPt = `${x - tileW / 2},${y}`;
            const tilePath = `M ${tileTopPt} L ${tileRightPt} L ${tileBottomPt} L ${tileLeftPt} Z`;

            // SVG Geometric Building Dimensions
            const bldgW = 44;
            const bldgH = state === 'complete' ? 54 : 32;
            const bx = x;
            const by = y;

            // AI Image Box (LARGE 120x120px, Centered on Tile, stands above tile)
            const imgBoxW = 120;
            const imgBoxH = 120;
            const imgX = x - 60;
            const imgY = y - 95;

            // Label text length truncation
            const displayLabel = conceptName.length > 14 ? `${conceptName.slice(0, 13)}…` : conceptName;
            const labelWidth = Math.max(50, displayLabel.length * 6.5 + 14);

            // Stagger animation delay
            const staggerDelay = `${idx * 0.5}s`;

            return (
              <g
                key={idx}
                className="transition-all cursor-pointer group"
                onClick={() => {
                  if (bldg) {
                    setActiveTooltip(bldg);
                    onSelectBuilding?.(bldg);
                  }
                }}
              >
                {/* 1. Ground Tile Base (Isometric Depth Faces) */}
                <polygon
                  points={`${x - tileW / 2},${y} ${x},${y + tileH / 2} ${x},${y + tileH / 2 + 10} ${x - tileW / 2},${y + 10}`}
                  fill={palette.tileLeft}
                />
                <polygon
                  points={`${x},${y + tileH / 2} ${x + tileW / 2},${y} ${x + tileW / 2},${y + 10} ${x},${y + tileH / 2 + 10}`}
                  fill={palette.tileRight}
                />

                {/* Flat Top Diamond Tile */}
                <polygon
                  points={tilePath.replace(/[MLZ]/g, '')}
                  fill={palette.tileTop}
                  stroke={palette.tileBorder}
                  strokeWidth="1.2"
                  className="group-hover:stroke-white transition-colors"
                />

                {/* Ground Shadow below building */}
                {state !== 'empty' && (
                  <ellipse
                    cx={bx}
                    cy={by + 4}
                    rx={26}
                    ry={9}
                    fill="rgba(0,0,0,0.6)"
                    filter="url(#shadowBlur)"
                  />
                )}

                {/* 2. RENDER ONLY ONE: IF IMAGE LOADED -> RENDER LARGE IMAGE ONLY; ELSE SVG */}
                {isImageLoaded && proxyImageUrl ? (
                  /* --- LARGE AI IMAGE ONLY (120x120px, Screen Blend & Float Animation) --- */
                  <image
                    href={proxyImageUrl}
                    xlinkHref={proxyImageUrl}
                    x={imgX}
                    y={imgY}
                    width={imgBoxW}
                    height={imgBoxH}
                    preserveAspectRatio="xMidYMid meet"
                    style={{
                      mixBlendMode: 'screen',
                      animationDelay: staggerDelay,
                    }}
                    className={`pointer-events-none ${
                      state === 'complete' ? 'anim-complete-image' : 'anim-partial-image'
                    }`}
                  />
                ) : (
                  /* --- SVG GEOMETRIC FALLBACK ONLY --- */
                  <g>
                    {state === 'empty' && (
                      /* EMPTY STATE: Marker & Gentle Flag Flutter */
                      <g opacity="0.7">
                        <polygon
                          points={`${bx},${by - 10} ${bx + 16},${by} ${bx},${by + 10} ${bx - 16},${by}`}
                          fill="none"
                          stroke={palette.scaffoldColor}
                          strokeWidth="1.2"
                          strokeDasharray="3,3"
                        />
                        <line
                          x1={bx}
                          y1={by}
                          x2={bx}
                          y2={by - 24}
                          stroke={palette.scaffoldColor}
                          strokeWidth="1.5"
                        />
                        <polygon
                          points={`${bx},${by - 24} ${bx + 12},${by - 20} ${bx},${by - 16}`}
                          fill={palette.scaffoldColor}
                          className="anim-flag"
                          style={{ animationDelay: staggerDelay }}
                        />
                        <text
                          x={bx + 3}
                          y={by - 19}
                          fill="#FFFFFF"
                          fontSize="7"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          ?
                        </text>
                      </g>
                    )}

                    {state === 'partial' && (
                      /* PARTIAL STATE: Solid foundation + scaffold lines */
                      <g className="building-partial">
                        <polygon
                          points={`${bx - bldgW / 2},${by} ${bx},${by + bldgW / 4} ${bx},${by + bldgW / 4 - bldgH / 2} ${bx - bldgW / 2},${by - bldgH / 2}`}
                          fill={palette.buildingFrontLeft}
                          stroke={palette.tileBorder}
                          strokeWidth="1"
                        />
                        <polygon
                          points={`${bx},${by + bldgW / 4} ${bx + bldgW / 2},${by} ${bx + bldgW / 2},${by - bldgH / 2} ${bx},${by + bldgW / 4 - bldgH / 2}`}
                          fill={palette.buildingFrontRight}
                          stroke={palette.tileBorder}
                          strokeWidth="1"
                        />
                        <g opacity="0.8" stroke={palette.scaffoldColor} strokeWidth="1.2">
                          <line x1={bx - bldgW / 2} y1={by - bldgH / 2} x2={bx - bldgW / 2} y2={by - bldgH} strokeDasharray="3,2" />
                          <line x1={bx + bldgW / 2} y1={by - bldgH / 2} x2={bx + bldgW / 2} y2={by - bldgH} strokeDasharray="3,2" />
                          <line x1={bx} y1={by + bldgW / 4 - bldgH / 2} x2={bx} y2={by + bldgW / 4 - bldgH} strokeDasharray="3,2" />
                          <polygon
                            points={`${bx},${by - bldgH - bldgW / 4} ${bx + bldgW / 2},${by - bldgH} ${bx},${by + bldgW / 4 - bldgH} ${bx - bldgW / 2},${by - bldgH}`}
                            fill={`${palette.scaffoldColor}20`}
                            stroke={palette.scaffoldColor}
                            strokeDasharray="2,2"
                          />
                        </g>
                      </g>
                    )}

                    {state === 'complete' && (
                      /* COMPLETE STATE: Solid 3D building + Windows + Antenna + Glow */
                      <g
                        className="building-complete-svg"
                        filter={`url(#themeEdgeGlow_${activeThemeKey})`}
                        style={{ animationDelay: staggerDelay }}
                      >
                        <polygon
                          points={`${bx - bldgW / 2},${by} ${bx},${by + bldgW / 4} ${bx},${by + bldgW / 4 - bldgH} ${bx - bldgW / 2},${by - bldgH}`}
                          fill={palette.buildingFrontLeft}
                          stroke={palette.glowColor}
                          strokeWidth="1.2"
                        />
                        <polygon
                          points={`${bx},${by + bldgW / 4} ${bx + bldgW / 2},${by} ${bx + bldgW / 2},${by - bldgH} ${bx},${by + bldgW / 4 - bldgH}`}
                          fill={palette.buildingFrontRight}
                          stroke={palette.glowColor}
                          strokeWidth="1.2"
                        />

                        {[14, 28, 42].map((offsetY, wIdx) => (
                          <polygon
                            key={`win_${wIdx}`}
                            points={`${bx - 14},${by - offsetY + 2} ${bx - 6},${by - offsetY + 6} ${bx - 6},${by - offsetY + 11} ${bx - 14},${by - offsetY + 7}`}
                            fill={palette.windowGlow}
                            stroke="#FFFFFF"
                            strokeWidth="0.5"
                            className="window-glow"
                          />
                        ))}

                        <polygon
                          points={`${bx},${by - bldgH - bldgW / 4} ${bx + bldgW / 2},${by - bldgH} ${bx},${by + bldgW / 4 - bldgH} ${bx - bldgW / 2},${by - bldgH}`}
                          fill={palette.buildingRoof}
                          stroke="#FFFFFF"
                          strokeWidth="1"
                        />

                        <line
                          x1={bx}
                          y1={by - bldgH - bldgW / 4}
                          x2={bx}
                          y2={by - bldgH - bldgW / 4 - 14}
                          stroke={palette.buildingAccent}
                          strokeWidth="2"
                        />
                        <circle
                          cx={bx}
                          cy={by - bldgH - bldgW / 4 - 14}
                          r="3"
                          className="antenna-tip"
                          stroke={palette.buildingAccent}
                          strokeWidth="1.5"
                        />
                      </g>
                    )}
                  </g>
                )}

                {/* 3. BUILDING LABEL (Centered below tile with translucent backdrop) */}
                {bldg && (
                  <g className="pointer-events-none">
                    <rect
                      x={x - labelWidth / 2}
                      y={y + tileH / 2 + 3}
                      width={labelWidth}
                      height={14}
                      rx="7"
                      fill="rgba(8, 5, 18, 0.85)"
                      stroke="rgba(255, 255, 255, 0.15)"
                      strokeWidth="0.6"
                    />
                    <text
                      x={x}
                      y={y + tileH / 2 + 13}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="9"
                      fontWeight="600"
                      className="font-sans"
                    >
                      {displayLabel}
                    </text>
                  </g>
                )}

                {/* Hidden Background Image Loader */}
                {proxyImageUrl && !isImageLoaded && !isFailed && (
                  <image
                    href={proxyImageUrl}
                    xlinkHref={proxyImageUrl}
                    x={imgX}
                    y={imgY}
                    width={1}
                    height={1}
                    // @ts-ignore
                    loading="eager"
                    opacity={0.01}
                    onLoad={() => setLoadedImages((prev) => ({ ...prev, [imageKey]: true }))}
                    onError={() => setFailedImages((prev) => ({ ...prev, [imageKey]: true }))}
                  />
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* TAPPED BUILDING TOOLTIP OVERLAY */}
      {activeTooltip && !isMiniPreview && (
        <div className="absolute top-3.5 left-3.5 right-3.5 bg-black/85 backdrop-blur-md border border-[#00F0FF]/40 p-3 rounded-2xl flex items-center justify-between gap-3 shadow-2xl animate-fadeIn z-30">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-1.5 font-sans font-bold text-xs text-white">
              <Sparkles className="w-3.5 h-3.5 text-[#00F0FF] shrink-0" />
              <span className="truncate">{activeTooltip.buildingName}</span>
              <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-slate-300 uppercase font-semibold">
                {activeTooltip.state}
              </span>
            </div>
            <p className="font-sans text-[11px] text-slate-300 truncate">
              {activeTooltip.conceptName} &middot;{' '}
              {activeTooltip.state === 'empty'
                ? 'Start learning to build plot'
                : `${activeTooltip.masteryPercent}% mastered`}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveTooltip(null)}
            className="w-7 h-7 rounded-full bg-white/10 text-slate-400 hover:text-white flex items-center justify-center text-xs font-bold transition-colors cursor-pointer shrink-0"
          >
            &times;
          </button>
        </div>
      )}
    </div>
  );
}
