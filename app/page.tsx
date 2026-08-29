'use client';

import React from 'react';
import { ArtBackdrop } from '@/components/ArtBackdrop';
import { AuthCard } from '@/components/AuthCard';

export default function HomePage() {
  return (
    <div className="relative min-h-[100dvh] w-full overflow-x-hidden selection:bg-violet selection:text-white">
      {/* Full-bleed Neon Backdrop Layer Stack (L0-L4) */}
      <ArtBackdrop src="/art/hero-left.jpg" />

      {/* Main Centered Glass Card Viewport */}
      <main className="min-h-[100dvh] w-full grid place-items-center p-6 relative z-10">
        <AuthCard />
      </main>
    </div>
  );
}
