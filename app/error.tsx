'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-[100dvh] bg-ink text-text flex items-center justify-center p-6 select-none relative overflow-hidden">
      <div className="w-full max-w-md bg-[#120E22]/90 border border-line rounded-[18px] p-6 text-center space-y-4 backdrop-blur-xl relative z-10">
        <div className="w-12 h-12 rounded-full bg-danger/15 text-danger flex items-center justify-center font-mono text-xl mx-auto">
          ⚠️
        </div>

        <div className="space-y-1">
          <h1 className="font-sans font-semibold text-xl text-text">
            Something broke on our side
          </h1>
          <p className="font-sans text-xs text-muted">
            An unhandled runtime error occurred. We have logged the trace for investigation.
          </p>
        </div>

        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full h-11 rounded-[10px] bg-signature-gradient text-white font-sans font-semibold text-xs flex items-center justify-center cursor-pointer hover:brightness-108 transition-all"
          >
            Try again
          </button>

          <Link
            href="/home"
            className="w-full h-10 rounded-[10px] border border-line text-muted hover:text-text font-sans font-medium text-xs flex items-center justify-center block text-center transition-colors"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
