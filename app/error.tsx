"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCcw, Home, Compass, ChevronDown } from "lucide-react";

export default function AppErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App-level error caught in app/error.tsx:", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-[#0A0A1A] bg-grid-pattern text-white flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-x-hidden font-sans">
      {/* Ambient Glows */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-[#FF0055]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#7C3AED]/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-lg mx-auto bg-[#0D0D1A] border border-[#FF0055]/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 glow-magenta text-center z-10">
        {/* Header Icon */}
        <div className="w-16 h-16 rounded-full bg-[#FF0055]/20 border border-[#FF0055]/40 flex items-center justify-center text-[#FF0055] mx-auto animate-pulse shadow-lg">
          <AlertTriangle className="w-8 h-8" />
        </div>

        {/* Friendly Explanation */}
        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-[#FF0055]/20 border border-[#FF0055]/40 text-[#FF7185] text-xs font-mono font-bold uppercase tracking-wider">
            SERVER / RENDER ANOMALY (500)
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-white font-heading">
            A temporary rift disrupted your quest
          </h1>
          <p className="text-xs text-slate-300 font-sans leading-relaxed max-w-sm mx-auto">
            Your progress and Bayesian Knowledge Tracing scores are saved. Try reloading or return to your base.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#FF0055] to-[#7C3AED] hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider font-heading transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCcw className="w-4 h-4" />
            <span>Try Again</span>
          </button>

          <Link
            href="/home"
            className="w-full py-3.5 px-5 rounded-2xl bg-[#1B1B3A] border border-white/15 hover:border-[#00F0FF] text-white font-bold text-xs uppercase tracking-wider font-heading transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4 text-[#00F0FF]" />
            <span>Go to Home</span>
          </Link>
        </div>

        {/* Collapsible Technical Detail Section */}
        {error && (
          <details className="text-left bg-[#0A0A1A] border border-white/10 rounded-2xl p-4 text-xs font-mono group cursor-pointer">
            <summary className="text-slate-400 font-bold hover:text-white flex items-center justify-between cursor-pointer list-none">
              <span className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-[#00F0FF]" />
                <span>Technical Details & Stack</span>
              </span>
              <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180 text-slate-500" />
            </summary>
            <div className="mt-3 pt-3 border-t border-white/10 space-y-2 text-[11px] text-red-300 overflow-x-auto">
              <p className="font-bold text-white">{error.name}: {error.message}</p>
              {error.digest && <p className="text-[10px] text-slate-500 font-mono">Digest: {error.digest}</p>}
              {error.stack && (
                <pre className="text-[10px] text-slate-400 whitespace-pre-wrap font-mono max-h-40 overflow-y-auto">
                  {error.stack}
                </pre>
              )}
            </div>
          </details>
        )}
      </div>
    </main>
  );
}
