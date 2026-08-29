"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0A0A1A] text-white flex flex-col items-center justify-center p-4 font-sans">
        <div className="w-full max-w-lg bg-[#0D0D1A] border border-[#FF0055]/40 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-[#FF0055]/20 border border-[#FF0055]/40 flex items-center justify-center text-[#FF0055] mx-auto animate-pulse">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-[#FF0055]/20 border border-[#FF0055]/40 text-[#FF7185] text-xs font-mono font-bold uppercase">
              GLOBAL SYSTEM ANOMALY
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white font-heading">
              A temporary rift disrupted your quest
            </h1>
            <p className="text-xs text-slate-300">
              The application encountered a critical exception. Reloading will restore your session.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => reset()}
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#FF0055] to-[#7C3AED] text-white font-bold text-xs uppercase tracking-wider font-heading cursor-pointer"
            >
              Try Again
            </button>

            <a
              href="/home"
              className="w-full py-3.5 px-5 rounded-2xl bg-[#1B1B3A] border border-white/15 text-white font-bold text-xs uppercase tracking-wider font-heading text-center"
            >
              Go to Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
