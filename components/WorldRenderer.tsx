'use client';

import React, { useState } from 'react';
import { WorldBuilding } from '@/lib/worldEngine';
import { WorldThemeId } from '@/lib/themes';
import { generateBuildingPrompt } from '@/lib/buildingImages';
import { Sparkles } from 'lucide-react';

interface WorldRendererProps {
  theme?: WorldThemeId | string;
  buildings: WorldBuilding[];
  height?: number | string;
  isMiniPreview?: boolean;
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
    tileBorder: '#00F0FF40',
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
    tileBorder: '#00FF8740',
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
    tileBorder: '#34D39940',
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
    tileBorder: '#38BDF840',
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
    tileBorder: '#F59E0B40',
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

export default function WorldRenderer({
  theme = 'cosmos',
  buildings,
  height = 280,
  isMiniPreview = false,
  onSelectBuilding,
}: WorldRendererProps) {
  const [activeTooltip, setActiveTooltip] = useState<WorldBuilding | null>(null);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const activeThemeKey = theme in THEME_PALETTES ? theme : 'cosmos';
  const palette = THEME_PALETTES[activeThemeKey];

  // Isometric Grid Layout: 3 columns x 2 rows
  // Spacing calibrated to prevent building overlap
  const tileW = 120;
  const tileH = 60;
  const originX = 260;
  const originY = 95;

  const paddedBuildings: (WorldBuilding | null)[] = [...buildings];
  while (paddedBuildings.length < 6) {
    paddedBuildings.push(null);
  }

  // Map each building slot to distinct isometric coordinates
  // Sorted by isometric depth (row + col ascending) for proper painter's rendering
  const slotsWithCoords = paddedBuildings.slice(0, 6).map((b, idx) => {
    const row = Math.floor(idx / 3); // 0 or 1
    const col = idx % 3;             // 0, 1, 2

    // Distinct tile center coordinates
    const x = originX + (col - row) * (tileW / 2);
    const y = originY + (col + row) * (tileH / 2);
    const depth = row * 3 + col;

    return {
      building: b,
      slotIndex: idx,
      row,
      col,
      x,
      y,
      depth,
    };
  });

  // Sort back-to-front
  slotsWithCoords.sort((a, b) => a.depth - b.depth);

  return (
    <div
      className="relative w-full rounded-[24px] overflow-hidden select-none border border-white/15 bg-black shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    >
      <svg
        viewBox="0 0 520 290"
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
              @keyframes worldPulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.02); }
              }
              @keyframes particleDrift {
                0% { transform: translateY(0px); opacity: 0; }
                50% { opacity: 0.85; }
                100% { transform: translateY(-28px); opacity: 0; }
              }
              @keyframes windowBlink {
                0%, 100% { opacity: 0.8; }
                50% { opacity: 1; }
              }
              @keyframes antennaPulse {
                0%, 100% { fill: #FFFFFF; r: 3.5; }
                50% { fill: ${palette.glowColor}; r: 4.5; }
              }
              .building-complete {
                transform-origin: center bottom;
                animation: worldPulse 3.5s ease-in-out infinite;
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
                .building-complete, .particle-item, .window-glow, .antenna-tip {
                  animation: none !important;
                }
              }
            `}
          </style>
        </defs>

        {/* LAYER 1: Background Sky */}
        <rect width="520" height="290" fill={`url(#skyGrad_${activeThemeKey})`} />

        {/* LAYER 2: Floating Particle Motes */}
        {!isMiniPreview && (
          <g className="particles-layer">
            {[
              { cx: 70, cy: 60, delay: '0s', r: 2.2 },
              { cx: 160, cy: 30, delay: '1.2s', r: 1.8 },
              { cx: 280, cy: 45, delay: '2.4s', r: 2.5 },
              { cx: 420, cy: 75, delay: '0.8s', r: 1.5 },
              { cx: 480, cy: 120, delay: '1.9s', r: 2.0 },
              { cx: 120, cy: 220, delay: '3.1s', r: 1.6 },
              { cx: 390, cy: 240, delay: '2.7s', r: 2.3 },
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

            // Build dynamic prompt and proxy image URL
            const buildingPrompt = bldg ? generateBuildingPrompt(conceptName, activeThemeKey, state) : '';
            const proxyImageUrl = bldg?.imageUrl || (bldg
              ? `/api/worldimage?prompt=${encodeURIComponent(buildingPrompt)}`
              : null);

            // Tile Path: Diamond (Top, Right, Bottom, Left)
            const tileTopPt = `${x},${y - tileH / 2}`;
            const tileRightPt = `${x + tileW / 2},${y}`;
            const tileBottomPt = `${x},${y + tileH / 2}`;
            const tileLeftPt = `${x - tileW / 2},${y}`;
            const tilePath = `M ${tileTopPt} L ${tileRightPt} L ${tileBottomPt} L ${tileLeftPt} Z`;

            // SVG Building Dimensions
            const bldgW = 44;
            const bldgH = state === 'complete' ? 52 : 30;
            const bx = x;
            const by = y;

            // AI Image Box (Centered on Tile, max 90px)
            const imgBoxW = 90;
            const imgBoxH = 90;
            const imgX = x - imgBoxW / 2;
            const imgY = y - imgBoxH + 18;

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
                {/* 1. Ground Tile Base (Sides) */}
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
                    rx={24}
                    ry={9}
                    fill="rgba(0,0,0,0.55)"
                    filter="url(#shadowBlur)"
                  />
                )}

                {/* 2. RENDER ONLY ONE: IF IMAGE LOADED -> RENDER IMAGE ONLY; ELSE RENDER SVG */}
                {isImageLoaded && proxyImageUrl ? (
                  /* --- AI IMAGE ONLY (Clean, Non-Overlapping) --- */
                  <image
                    href={proxyImageUrl}
                    xlinkHref={proxyImageUrl}
                    x={imgX}
                    y={imgY}
                    width={imgBoxW}
                    height={imgBoxH}
                    preserveAspectRatio="xMidYMid meet"
                    style={{
                      imageRendering: 'auto',
                      filter: state === 'complete' ? `drop-shadow(0 8px 16px ${palette.glowColor}60)` : undefined,
                    }}
                    className="pointer-events-none opacity-100"
                  />
                ) : (
                  /* --- SVG GEOMETRIC FALLBACK ONLY --- */
                  <g>
                    {state === 'empty' && (
                      /* EMPTY STATE: Marker & Survey Flag */
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
                      <g className="building-complete" filter={`url(#themeEdgeGlow_${activeThemeKey})`}>
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

                {/* Hidden Background Image Loader (Triggers state when ready) */}
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
        <div className="absolute top-3.5 left-3.5 right-3.5 bg-black/85 backdrop-blur-md border border-[#00F0FF]/40 p-3 rounded-2xl flex items-center justify-between gap-3 shadow-2xl animate-fadeIn">
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
