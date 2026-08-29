'use client';

import React, { useState, useEffect } from 'react';
import { WorldBuilding } from '@/lib/worldEngine';
import { WorldThemeId } from '@/lib/themes';
import { getPollinationsImageUrl, cacheBuildingImageToSupabase } from '@/lib/buildingImages';
import { Sparkles, RefreshCw } from 'lucide-react';

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
}

const THEME_PALETTES: Record<string, ThemePalette> = {
  cosmos: {
    skyGradient: ['#0A051E', '#180B38', '#250E4C'],
    tileTop: '#1E1238',
    tileLeft: '#130B24',
    tileRight: '#180E2E',
    tileBorder: '#00F0FF40',
    buildingFrontLeft: '#0C2D48',
    buildingFrontRight: '#145374',
    buildingRoof: '#00F0FF',
    buildingAccent: '#F59E0B',
    scaffoldColor: '#00F0FF80',
    glowColor: '#00F0FF',
    particleColor: '#00F0FF',
  },
  cyber_city: {
    skyGradient: ['#030712', '#0A152E', '#102A45'],
    tileTop: '#0B2233',
    tileLeft: '#06141F',
    tileRight: '#081A29',
    tileBorder: '#00FF8740',
    buildingFrontLeft: '#1F1135',
    buildingFrontRight: '#35195C',
    buildingRoof: '#00FF87',
    buildingAccent: '#FF0055',
    scaffoldColor: '#00FF8780',
    glowColor: '#00FF87',
    particleColor: '#00FF87',
  },
  enchanted_kingdom: {
    skyGradient: ['#04140E', '#0B291E', '#174735'],
    tileTop: '#143828',
    tileLeft: '#0C241A',
    tileRight: '#102E21',
    tileBorder: '#34D39940',
    buildingFrontLeft: '#2E3842',
    buildingFrontRight: '#414E5C',
    buildingRoof: '#34D399',
    buildingAccent: '#C084FC',
    scaffoldColor: '#34D39980',
    glowColor: '#C084FC',
    particleColor: '#34D399',
  },
  ocean_world: {
    skyGradient: ['#020B16', '#041E33', '#063552'],
    tileTop: '#0C354A',
    tileLeft: '#072230',
    tileRight: '#092A3A',
    tileBorder: '#38BDF840',
    buildingFrontLeft: '#0E4966',
    buildingFrontRight: '#136287',
    buildingRoof: '#38BDF8',
    buildingAccent: '#2DD4BF',
    scaffoldColor: '#38BDF880',
    glowColor: '#2DD4BF',
    particleColor: '#38BDF8',
  },
  desert_empire: {
    skyGradient: ['#140903', '#2B1306', '#421E0A'],
    tileTop: '#3D2010',
    tileLeft: '#24130A',
    tileRight: '#301A0D',
    tileBorder: '#F59E0B40',
    buildingFrontLeft: '#6B3818',
    buildingFrontRight: '#8F4B20',
    buildingRoof: '#F59E0B',
    buildingAccent: '#FB923C',
    scaffoldColor: '#F59E0B80',
    glowColor: '#F59E0B',
    particleColor: '#F59E0B',
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
  const tileW = 100;
  const tileH = 50;
  const originX = 260;
  const originY = 85;

  // Ensure test building is complete if all buildings are empty for verification
  const paddedBuildings: (WorldBuilding | null)[] = [...buildings];
  while (paddedBuildings.length < 6) {
    paddedBuildings.push(null);
  }

  const displaySlots = paddedBuildings.slice(0, 6).map((b, idx) => {
    // FORCE TEST: Make slot 0 complete if it exists and is empty to demonstrate the AI building image
    if (idx === 0 && b && b.state === 'empty') {
      return {
        ...b,
        state: 'complete' as const,
        masteryPercent: 100,
      };
    }
    return b;
  });

  // Preload and debug Pollinations AI Images
  useEffect(() => {
    displaySlots.forEach((bldg) => {
      if (!bldg) return;
      const state = bldg.state || 'empty';
      const conceptName = bldg.conceptName || 'Core Foundations';
      const imageKey = `${bldg.buildingId}_${state}_${activeThemeKey}`;
      const url = getPollinationsImageUrl(conceptName, activeThemeKey, state);

      console.log(`[Pollinations] Constructing image for "${conceptName}" (${state}, ${activeThemeKey}) ->`, url);

      if (typeof window !== 'undefined') {
        const img = new Image();
        img.src = url;
        img.onload = () => {
          console.log(`[Pollinations] Image LOADED successfully for "${conceptName}" ->`, url);
          setLoadedImages((prev) => ({ ...prev, [imageKey]: true }));
          cacheBuildingImageToSupabase(conceptName, activeThemeKey, state, url);
        };
        img.onerror = (err) => {
          console.error(`[Pollinations] Image FAILED to load for "${conceptName}" ->`, url, err);
          setFailedImages((prev) => ({ ...prev, [imageKey]: true }));
        };
      }
    });
  }, [buildings, activeThemeKey]);

  const isAnyGenerating = displaySlots.some((b) => {
    if (!b) return false;
    const key = `${b.buildingId}_${b.state}_${activeThemeKey}`;
    return !loadedImages[key] && !failedImages[key];
  });

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

          {/* Building Glow Filter */}
          <filter id="buildingGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <style>
            {`
              @keyframes worldPulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.025); }
              }
              @keyframes particleDrift {
                0% { transform: translateY(0px); opacity: 0; }
                50% { opacity: 0.8; }
                100% { transform: translateY(-28px); opacity: 0; }
              }
              @keyframes tileShimmer {
                0%, 100% { opacity: 0.65; }
                50% { opacity: 1; }
              }
              .building-complete {
                transform-origin: center bottom;
                animation: worldPulse 3.5s ease-in-out infinite;
              }
              .particle-item {
                animation: particleDrift 4s ease-in-out infinite;
              }
              .ai-loading-tile {
                animation: tileShimmer 2s ease-in-out infinite;
              }
              @media (prefers-reduced-motion: reduce) {
                .building-complete, .particle-item, .ai-loading-tile {
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
            ].map((p, idx) => (
              <circle
                key={idx}
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

        {/* LAYER 3: Isometric Grid & AI-Generated Buildings */}
        <g id="isometricWorldStage">
          {displaySlots.map((bldg, idx) => {
            const row = Math.floor(idx / 3);
            const col = idx % 3;

            // Isometric screen projection
            const x = originX + (col - row) * (tileW / 2);
            const y = originY + (col + row) * (tileH / 2);

            const state = bldg?.state || 'empty';
            const conceptName = bldg?.conceptName || `Slot ${idx + 1}`;
            const imageKey = bldg ? `${bldg.buildingId}_${state}_${activeThemeKey}` : `empty_${idx}`;
            const isLoaded = loadedImages[imageKey];
            const isFailed = failedImages[imageKey];

            const pollinationsUrl = bldg
              ? getPollinationsImageUrl(conceptName, activeThemeKey, state)
              : null;

            // Tile Path: Diamond (Top, Right, Bottom, Left)
            const tileTopPt = `${x},${y - tileH / 2}`;
            const tileRightPt = `${x + tileW / 2},${y}`;
            const tileBottomPt = `${x},${y + tileH / 2}`;
            const tileLeftPt = `${x - tileW / 2},${y}`;
            const tilePath = `M ${tileTopPt} L ${tileRightPt} L ${tileBottomPt} L ${tileLeftPt} Z`;

            // Building Dimensions for SVG Fallback
            const bldgW = 44;
            const bldgH = state === 'complete' ? 52 : 30;
            const bx = x;
            const by = y;

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
                {/* 1. Isometric Ground Tile Base */}
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

                {/* 2. Geometric SVG Placeholder Fallback Layer */}
                <g className={!isLoaded && bldg ? 'ai-loading-tile' : ''}>
                  {state === 'empty' && (
                    /* EMPTY STATE SVG */
                    <g opacity="0.65">
                      <polygon
                        points={`${bx},${by - 12} ${bx + 20},${by} ${bx},${by + 12} ${bx - 20},${by}`}
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
                    /* PARTIAL STATE SVG */
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
                      <g opacity="0.75" stroke={palette.scaffoldColor} strokeWidth="1.2">
                        <line x1={bx - bldgW / 2} y1={by - bldgH / 2} x2={bx - bldgW / 2} y2={by - bldgH} />
                        <line x1={bx + bldgW / 2} y1={by - bldgH / 2} x2={bx + bldgW / 2} y2={by - bldgH} />
                        <line x1={bx} y1={by + bldgW / 4 - bldgH / 2} x2={bx} y2={by + bldgW / 4 - bldgH} />
                        <polygon
                          points={`${bx},${by - bldgH - bldgW / 4} ${bx + bldgW / 2},${by - bldgH} ${bx},${by + bldgW / 4 - bldgH} ${bx - bldgW / 2},${by - bldgH}`}
                          fill={`${palette.scaffoldColor}25`}
                          stroke={palette.scaffoldColor}
                          strokeDasharray="2,2"
                        />
                      </g>
                    </g>
                  )}

                  {state === 'complete' && (
                    /* COMPLETE STATE SVG */
                    <g className="building-complete">
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
                        strokeWidth="2.5"
                      />
                      <circle
                        cx={bx}
                        cy={by - bldgH - bldgW / 4 - 14}
                        r="3.5"
                        fill="#FFFFFF"
                        stroke={palette.buildingAccent}
                        strokeWidth="1.5"
                      />
                    </g>
                  )}
                </g>

                {/* 3. AI-Generated Building Image (Pollinations.ai / Supabase Cached) */}
                {pollinationsUrl && !isFailed && (
                  <image
                    href={pollinationsUrl}
                    xlinkHref={pollinationsUrl}
                    x={x - 60}
                    y={y - 80}
                    width={120}
                    height={120}
                    preserveAspectRatio="xMidYMid meet"
                    style={{
                      imageRendering: 'auto',
                      filter: state === 'complete' ? 'drop-shadow(0 8px 16px rgba(0,240,255,0.3))' : undefined,
                    }}
                    className={`transition-opacity duration-500 pointer-events-none ${
                      isLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* GENERATING STATUS NOTICE ON FIRST RUN */}
      {isAnyGenerating && !isMiniPreview && (
        <div className="absolute bottom-3.5 left-3.5 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-[#00F0FF]/30 font-mono text-[10px] text-[#00F0FF] flex items-center gap-1.5 shadow-lg">
          <RefreshCw className="w-3 h-3 animate-spin text-[#00F0FF]" />
          <span>Generating your world buildings...</span>
        </div>
      )}

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
