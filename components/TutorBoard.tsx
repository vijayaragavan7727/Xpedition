'use client';

import React, { useState, useEffect } from 'react';

interface TutorBoardProps {
  code?: string;
  accumulatedPoints: string[];
  currentChunkText?: string;
  revealedWordCount?: number;
}

declare global {
  interface Window {
    loadPyodide?: any;
    pyodideInstance?: any;
  }
}

export const TutorBoard: React.FC<TutorBoardProps> = ({
  code,
  accumulatedPoints,
  currentChunkText,
  revealedWordCount = 999,
}) => {
  const [editableCode, setEditableCode] = useState<string>(code || '');
  const [output, setOutput] = useState<string | null>(null);
  const [isPyodideLoading, setIsPyodideLoading] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [pyodideReady, setPyodideReady] = useState<boolean>(false);

  useEffect(() => {
    setEditableCode(code || '');
    setOutput(null);
  }, [code]);

  // Lazy load Pyodide script when code chunk is active
  useEffect(() => {
    if (!code || pyodideReady || window.pyodideInstance) {
      if (window.pyodideInstance) setPyodideReady(true);
      return;
    }

    let isMounted = true;
    setIsPyodideLoading(true);

    const loadPyodideScript = async () => {
      try {
        if (!window.loadPyodide) {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js';
          script.async = true;
          document.head.appendChild(script);

          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
          });
        }

        if (window.loadPyodide && !window.pyodideInstance) {
          window.pyodideInstance = await window.loadPyodide();
        }

        if (isMounted) {
          setPyodideReady(true);
          setIsPyodideLoading(false);
        }
      } catch (e) {
        console.warn('Pyodide load failed:', e);
        if (isMounted) setIsPyodideLoading(false);
      }
    };

    loadPyodideScript();
    return () => {
      isMounted = false;
    };
  }, [code, pyodideReady]);

  const handleRunCode = async () => {
    if (!editableCode.trim()) return;
    setIsRunning(true);
    setOutput(null);

    try {
      if (!window.pyodideInstance && window.loadPyodide) {
        window.pyodideInstance = await window.loadPyodide();
      }

      if (window.pyodideInstance) {
        window.pyodideInstance.runPython(`
import sys
import io
sys.stdout = io.StringIO()
        `);

        await window.pyodideInstance.runPythonAsync(editableCode);

        const stdout = window.pyodideInstance.runPython(`sys.stdout.getvalue()`);
        setOutput(stdout.trim() || '✓ Code executed cleanly (no stdout output).');
      } else {
        const evalResult = String(eval(editableCode));
        setOutput(`Result: ${evalResult}`);
      }
    } catch (err: any) {
      setOutput(`Error: ${err?.message || String(err)}`);
    } finally {
      setIsRunning(false);
    }
  };

  // Compute active write-on text for current chunk synced to audio reveal count
  const currentChunkWords = (currentChunkText || '').split(/\s+/).filter(Boolean);
  const activeWritingText = currentChunkWords.slice(0, revealedWordCount).join(' ');

  return (
    /* REAL CLASSROOM BLACKBOARD SURFACE WITH WOODEN CHALK LEDGE */
    <div className="w-full relative rounded-[18px] bg-[#1A2B24] border-4 border-[#3D2918] shadow-[0_15px_40px_rgba(0,0,0,0.7)] overflow-hidden select-none">
      {/* LAYERED TEXTURED GRADIENT (REAL UNEVEN BLACKBOARD SURFACE) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(40,65,55,0.4),transparent_70%),radial-gradient(ellipse_at_bottom_right,rgba(15,25,20,0.8),transparent_60%)] pointer-events-none" />

      {/* FAINT CHALK SMUDGE LAYER */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(237,234,224,0.04),transparent_40%),radial-gradient(circle_at_70%_60%,rgba(237,234,224,0.03),transparent_35%)] pointer-events-none mix-blend-overlay" />

      {/* BLACKBOARD HEADER */}
      <div className="relative z-10 px-4 pt-3 pb-2 border-b border-white/10 flex items-center justify-between font-mono text-[10px] text-[#EDEAE0]/70">
        <span className="tracking-widest uppercase font-bold text-[#EDEAE0]/90">
          CLASSROOM BOARD • LESSON NOTES
        </span>
        <span className="text-[#EDEAE0]/50">
          {code ? (pyodideReady ? 'Python Enabled' : 'Code Mode') : 'Chalk Writing Active'}
        </span>
      </div>

      {/* BOARD CONTENT CONTAINER (CHALK TEXT ACCUMULATION & WRITE-ON) */}
      <div className="relative z-10 p-5 min-h-[220px] max-h-[380px] overflow-y-auto space-y-4 font-['Caveat','Kalam',cursive] text-[#EDEAE0] text-lg sm:text-xl leading-relaxed tracking-wide">
        
        {/* PREVIOUS CHUNKS ACCUMULATED BOARD NOTES */}
        {accumulatedPoints.length > 0 && (
          <div className="space-y-3">
            {accumulatedPoints.map((pt, idx) => (
              <div key={idx} className="flex items-start gap-2 text-[#EDEAE0]/85">
                <span className="text-amber-200/80 font-mono text-sm mt-1 select-none">✎</span>
                <p className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{pt}</p>
              </div>
            ))}
          </div>
        )}

        {/* CURRENT CHUNK WRITE-ON LINE (SYNCED TO AUDIO REVEAL) */}
        {activeWritingText && (
          <div className="flex items-start gap-2 text-[#EDEAE0] font-semibold animate-fadeIn">
            <span className="text-cyan-300 font-mono text-sm mt-1 select-none animate-pulse">✏</span>
            <p className="drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">{activeWritingText}</p>
          </div>
        )}

        {/* MONOSPACE CODE BLOCK (CHALK-OUTLINED BOX) */}
        {code && (
          <div className="my-3 space-y-2 font-mono text-xs font-normal">
            <div className="p-3.5 rounded-[12px] bg-[#0F1C17] border-2 border-dashed border-[#EDEAE0]/40 text-[#00E5FF] space-y-2">
              <div className="flex items-center justify-between text-[10px] text-[#EDEAE0]/60 pb-1 border-b border-white/10">
                <span>script.py</span>
                <span>Chalk Monospace Box</span>
              </div>
              <textarea
                value={editableCode}
                onChange={(e) => setEditableCode(e.target.value)}
                spellCheck={false}
                className="w-full h-32 bg-transparent font-mono text-xs text-cyan leading-relaxed focus:outline-none resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                disabled={isRunning || isPyodideLoading}
                onClick={handleRunCode}
                className="h-[36px] px-4 rounded-[8px] bg-[#3D2918] hover:bg-[#5C3A21] border border-amber-500/40 text-amber-200 font-sans font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <span>{isRunning ? 'Executing...' : '▶ Run Code'}</span>
              </button>
              {output !== null && (
                <div className="p-2.5 rounded-[8px] bg-[#0A120E] border border-cyan/40 text-xs font-mono text-white max-w-full overflow-x-auto">
                  <pre>{output}</pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* WOODEN CHALK LEDGE WITH CHALK STUBS (WARM BROWN) */}
      <div className="relative z-10 h-[16px] bg-[#5C3A21] border-t border-[#3D2918] flex items-center justify-end px-6 gap-3 shadow-inner">
        {/* Chalk Stubs */}
        <span className="w-5 h-2 bg-[#EDEAE0] rounded-sm transform -rotate-6 shadow-sm opacity-90" title="White chalk stub" />
        <span className="w-4 h-2 bg-amber-200 rounded-sm transform rotate-12 shadow-sm opacity-90" title="Yellow chalk stub" />
        <span className="w-6 h-2 bg-cyan-200 rounded-sm transform -rotate-3 shadow-sm opacity-90" title="Cyan chalk stub" />
      </div>
    </div>
  );
};
