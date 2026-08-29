'use client';

import React from 'react';

export interface VisualSpec {
  type: 'cycle' | 'comparison' | 'list' | 'none';
  steps?: string[];
  left?: string;
  right?: string;
  points?: string[];
  items?: string[];
}

interface BoardVisualProps {
  visual?: VisualSpec;
}

export const BoardVisual: React.FC<BoardVisualProps> = ({ visual }) => {
  if (!visual || visual.type === 'none') return null;

  if (visual.type === 'cycle' && Array.isArray(visual.steps) && visual.steps.length > 0) {
    const steps = visual.steps.slice(0, 4);
    return (
      <div className="my-2.5 p-2 bg-[#14221C] border border-[#2B3D34] rounded-[10px] space-y-2 select-none animate-fadeIn">
        <span className="font-mono text-[9px] uppercase tracking-wider text-cyan-300 font-bold block text-center">
          🔄 PROCESS CYCLE DIAGRAM
        </span>
        <div className="flex items-center justify-around flex-wrap gap-1 font-['Caveat','Kalam',cursive] text-xs text-[#EDEAE0]">
          {steps.map((step, idx) => (
            <React.Fragment key={idx}>
              <div className="px-2 py-1 bg-white/10 rounded-md border border-white/20 text-center font-medium shadow-sm">
                {step}
              </div>
              {idx < steps.length - 1 && (
                <svg className="w-4 h-4 text-cyan-300 transform shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }

  if (visual.type === 'comparison') {
    const points = (visual.points || []).slice(0, 3);
    return (
      <div className="my-2.5 p-2 bg-[#14221C] border border-[#2B3D34] rounded-[10px] space-y-1.5 select-none animate-fadeIn">
        <div className="grid grid-cols-2 text-center font-mono text-[10px] font-bold pb-1 border-b border-white/15">
          <span className="text-amber-300">{visual.left || 'Concept A'}</span>
          <span className="text-cyan-300 border-l border-white/15">{visual.right || 'Concept B'}</span>
        </div>
        <div className="space-y-1 font-['Caveat','Kalam',cursive] text-xs text-[#EDEAE0]">
          {points.map((pt, idx) => (
            <div key={idx} className="flex items-center justify-between text-center gap-1">
              <span className="w-1/2 pr-1 truncate">{pt}</span>
              <span className="w-1/2 pl-1 border-l border-white/10 truncate">{pt}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (visual.type === 'list' && Array.isArray(visual.items) && visual.items.length > 0) {
    return (
      <div className="my-2.5 p-2 bg-[#14221C] border border-[#2B3D34] rounded-[10px] space-y-1 select-none animate-fadeIn">
        <span className="font-mono text-[9px] uppercase tracking-wider text-amber-300 font-bold block">
          📋 KEY STRUCTURE / MECHANICS
        </span>
        <div className="space-y-1 font-['Caveat','Kalam',cursive] text-xs text-[#EDEAE0]">
          {visual.items.slice(0, 4).map((item, idx) => (
            <div key={idx} className="flex items-start gap-1.5">
              <span className="font-mono text-[10px] text-cyan-300 font-bold">{idx + 1}.</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};
