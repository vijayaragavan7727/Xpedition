'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function AppGroupError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled App Group Error:', error);
  }, [error]);

  return (
    <div className="py-12 px-4 select-none">
      <div className="max-w-md mx-auto bg-[#150F2A] border border-line/60 rounded-[16px] p-6 text-center space-y-4">
        <div className="w-10 h-10 rounded-full bg-danger/15 text-danger flex items-center justify-center font-mono text-lg mx-auto">
          ⚠️
        </div>
        <div>
          <h2 className="font-sans font-semibold text-lg text-text">
            Something broke on our side
          </h2>
          <p className="font-sans text-xs text-muted mt-1">
            An error occurred rendering this dashboard section.
          </p>
        </div>
        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full h-10 rounded-[10px] bg-signature-gradient text-white font-sans font-semibold text-xs flex items-center justify-center cursor-pointer"
          >
            Try again
          </button>
          <Link
            href="/home"
            className="w-full h-10 rounded-[10px] border border-line text-muted hover:text-text font-sans text-xs flex items-center justify-center block text-center"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
