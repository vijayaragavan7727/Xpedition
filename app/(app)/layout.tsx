'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { DashBackdrop } from '@/components/DashBackdrop';
import { TopBar } from '@/components/TopBar';
import { TabBar } from '@/components/TabBar';
import { getStoreData, saveStoreData, UserStoreData } from '@/lib/store';
import { getNextStep, OnboardingStep } from '@/lib/onboarding';

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();
  const [storeData, setStoreData] = useState<UserStoreData | null>(null);
  const [step, setStep] = useState<OnboardingStep | null>(null);
  const [loopBrokenNotice, setLoopBrokenNotice] = useState<boolean>(false);

  useEffect(() => {
    let data = getStoreData();

    // TEMPORARY REVIEW MODE: Ensure demo profile & concepts are ready for guest
    if (!data.handle || data.handle === 'Learner' || !data.goalText || data.concepts.length === 0) {
      const demoConcepts = [
        { id: 'concept_blender_1', name: '3D Viewport & Navigation', masteryPercentage: 65, itemsNext: 3, retentionRisk: 0.1, ptsSinceCalibration: 4, baselineTheta: -0.2 },
        { id: 'concept_blender_2', name: 'Mesh Modeling & Extrusions', masteryPercentage: 40, itemsNext: 4, retentionRisk: 0.25, ptsSinceCalibration: 2, baselineTheta: -0.4 },
        { id: 'concept_blender_3', name: 'Modifiers & Subdivision Surface', masteryPercentage: 15, itemsNext: 5, retentionRisk: 0.45, ptsSinceCalibration: 1, baselineTheta: -0.5 },
        { id: 'concept_blender_4', name: 'Material Nodes & PBR Shading', masteryPercentage: 0, itemsNext: 5, retentionRisk: 0.0, ptsSinceCalibration: 0, baselineTheta: -0.6 },
        { id: 'concept_blender_5', name: 'Lighting & Cycles Rendering', masteryPercentage: 0, itemsNext: 5, retentionRisk: 0.0, ptsSinceCalibration: 0, baselineTheta: -0.6 },
      ];
      data = {
        ...data,
        handle: data.handle && data.handle !== 'Learner' ? data.handle : 'Demo User',
        goalText: data.goalText && data.goalText !== 'Initial Skill Goal' ? data.goalText : 'Blender designing',
        learnerProfile: {
          name: 'Demo User',
          pathType: 'goal',
          topic: 'Blender designing',
          language: 'english',
          startingLevel: 'Complete beginner',
          dailyMinutes: 60,
          learningMode: 'tutor',
        },
        concepts: data.concepts?.length > 0 ? data.concepts : demoConcepts,
        graphs: data.graphs?.length > 0 && data.graphs[0].concepts?.length > 0 ? data.graphs : [
          {
            id: data.activeGraphId || 'graph_demo',
            goalText: 'Blender designing',
            createdAt: Date.now(),
            concepts: demoConcepts,
            attempts: data.attempts || [],
          },
        ],
      };
      saveStoreData(data);
    }

    setStoreData(data);

    // TEMPORARY REVIEW MODE: Skip session check and gate redirects
    setStep('ready');

    /* ORIGINAL GATE LOGIC COMMENTED OUT FOR REVIEW MODE:
    // 1. Check Exit Override
    if (typeof window !== 'undefined') {
      const exitOverride = sessionStorage.getItem('xpedition_exit_override');
      if (exitOverride === 'true') {
        setStep('ready');
        return;
      }
    }

    const nextStep = getNextStep(data);
    setStep(nextStep);

    // 2. Loop Protection & Hard Stop
    if (typeof window !== 'undefined') {
      const redirectKey = 'xpedition_gate_redirect_count';
      const rawCount = sessionStorage.getItem(redirectKey);
      const count = parseInt(rawCount || '0', 10);

      if (count >= 2) {
        setLoopBrokenNotice(true);
        setStep('ready');
        return;
      }

      if (nextStep === 'goal' && pathname !== '/onboarding') {
        sessionStorage.setItem(redirectKey, String(count + 1));
        router.replace('/onboarding');
      } else if (nextStep === 'calibrate' && pathname !== '/calibrate') {
        sessionStorage.setItem(redirectKey, String(count + 1));
        router.replace('/calibrate');
      }
    }
    */
  }, [pathname, router]);

  // Render skeleton loader while resolving
  if (!storeData || step === null) {
    return (
      <div className="flex flex-col h-screen overflow-hidden bg-ink text-text relative">
        <DashBackdrop src="/art/hero-left.jpg" />
        <header className="flex-none h-14 border-b border-line/40 flex items-center z-50 bg-ink/90 backdrop-blur-md">
          <TopBar />
        </header>
        <main className="flex-1 overflow-y-auto min-h-0 relative z-10 lg:pl-[240px]">
          <div className="w-full max-w-[640px] lg:max-w-[1080px] mx-auto px-4 sm:px-6 pt-6 space-y-6">
            <div className="space-y-2 pt-2">
              <div className="h-6 w-48 bg-raised/80 rounded-md animate-pulse" />
              <div className="h-4 w-72 bg-raised/50 rounded-md animate-pulse" />
            </div>
            <div className="h-56 w-full bg-[#150F2A]/90 rounded-[16px] border border-line/40 p-6 space-y-4 animate-pulse">
              <div className="flex justify-between">
                <div className="h-4 w-24 bg-raised rounded" />
                <div className="h-4 w-32 bg-raised rounded" />
              </div>
              <div className="h-6 w-3/4 bg-raised rounded" />
              <div className="h-2 w-full bg-raised rounded-full" />
              <div className="h-11 w-full bg-raised rounded-[10px]" />
            </div>
          </div>
        </main>
        <nav className="flex-none z-50 md:hidden">
          <TabBar />
        </nav>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-ink text-text selection:bg-violet selection:text-white relative">
      <DashBackdrop src="/art/hero-left.jpg" />

      {/* Fixed Header */}
      <header className="flex-none h-14 border-b border-line/40 flex items-center z-50 bg-ink/90 backdrop-blur-md">
        <TopBar />
      </header>

      {loopBrokenNotice && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-300 font-mono text-xs px-4 py-2 text-center relative z-40 shrink-0">
          ?? Review Mode: Navigation state was restored to Home.
        </div>
      )}

      {/* Scrollable Main Content Area (Only this moves) */}
      <main className="flex-1 overflow-y-auto min-h-0 relative z-10 lg:pl-[240px]">
        <div className="w-full max-w-[640px] lg:max-w-[1080px] mx-auto px-4 sm:px-6 pt-4 pb-6">
          {children}
        </div>
      </main>

      {/* Fixed Bottom Nav (Hidden on Desktop md:) */}
      <nav className="flex-none z-50 md:hidden">
        <TabBar />
      </nav>
    </div>
  );
}
