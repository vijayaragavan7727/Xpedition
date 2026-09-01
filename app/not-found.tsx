'use client';

import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] bg-ink text-text flex items-center justify-center p-6 select-none relative overflow-hidden">
      <div className="w-full max-w-md bg-[#120E22]/90 border border-line rounded-[18px] p-8 text-center space-y-4 backdrop-blur-xl relative z-10">
        <div className="font-orbitron font-bold text-4xl text-gradient">404</div>

        <div className="space-y-1">
          <h1 className="font-sans font-semibold text-lg text-text">Page not found</h1>
          <p className="font-sans text-xs text-muted">
            The requested concept route or page does not exist on XPedition.
          </p>
        </div>

        <Link
          href="/home"
          className="inline-flex h-11 px-6 rounded-[10px] bg-signature-gradient text-white font-sans font-semibold text-xs items-center justify-center gap-2 hover:brightness-108 transition-all"
        >
          <span>Back to home</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  );
}
