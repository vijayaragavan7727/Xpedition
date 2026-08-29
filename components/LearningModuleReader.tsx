"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Code,
  Lightbulb,
  Compass,
  Download,
} from "lucide-react";
import XpAsset from "./XpAsset";

import { Question } from "@/lib/types";

import CyberSilhouette from "./CyberSilhouette";

export interface ModuleSection {
  sectionId: string;
  heading: string;
  paragraphs: string[];
  codeExample?: {
    code: string;
    explanation: string;
  } | null;
}

export interface ModuleSource {
  title: string;
  url: string;
}

export interface LearningModuleData {
  title: string;
  sections: ModuleSection[];
  takeaways: string[];
  sources: ModuleSource[];
  questions?: Question[];
}

interface LearningModuleReaderProps {
  skillName: string;
  currentLevel: number;
  learningStyle: string;
  moduleData: LearningModuleData;
  onStartTest: () => void;
}

export default function LearningModuleReader({
  skillName,
  currentLevel,
  learningStyle,
  moduleData,
  onStartTest,
}: LearningModuleReaderProps) {
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const levelTitles: Record<number, string> = {
    1: "Level 1: Basics & Foundations",
    2: "Level 2: Intermediate Concepts",
    3: "Level 3: Advanced Systems & Optimization",
  };

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const maxScroll = scrollHeight - clientHeight;
    if (maxScroll <= 0) {
      setScrollProgress(100);
      setHasScrolledToBottom(true);
      return;
    }
    const currentProgress = Math.min(100, Math.round((scrollTop / maxScroll) * 100));
    setScrollProgress(currentProgress);
    if (currentProgress >= 85) {
      setHasScrolledToBottom(true);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (containerRef.current) {
        const { scrollHeight, clientHeight } = containerRef.current;
        if (scrollHeight <= clientHeight + 50) {
          setScrollProgress(100);
          setHasScrolledToBottom(true);
        }
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [moduleData]);

  const academicSources = moduleData.sources?.filter(
    (src) => src.url?.includes("nptel.ac.in") || src.url?.includes("swayam.gov.in")
  ) || [];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 animate-fadeIn">
      {/* Top Header Card */}
      <div className="bg-[#0D0D1A] border border-[#00F0FF]/40 rounded-3xl p-5 shadow-2xl space-y-3 glow-cyan">
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/40 text-[#00F0FF] font-bold">
              {levelTitles[currentLevel] || `Level ${currentLevel}`}
            </span>
            <span className="text-white font-bold">{skillName}</span>
          </div>

          <span className="text-xs font-mono font-bold text-[#A855F7] uppercase">
            Style: {learningStyle}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white font-heading leading-tight">
          {moduleData.title || `Learning Module: ${skillName}`}
        </h1>

        {/* PROMINENT NPTEL / SWAYAM GROUNDING BANNER */}
        {academicSources.length > 0 && (
          <div className="p-3 rounded-2xl bg-[#00F0FF]/10 border border-[#00F0FF]/50 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-base">🎓</span>
              <span className="text-white font-semibold">
                This module is grounded in official NPTEL / SWAYAM course material
              </span>
            </div>
            <a
              href={academicSources[0].url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 rounded-xl bg-[#00F0FF] text-black font-bold font-mono text-[11px] shrink-0 hover:brightness-110 flex items-center gap-1 transition-all"
            >
              <span>View Course</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Scroll Progress & Light Meter ("The Calm Before") */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5 text-white font-bold">
              <BookOpen className="w-4 h-4 text-[#00F0FF]" /> Light Meter (Reading Progress)
            </span>
            <span className="text-[#00FF87] font-bold">{scrollProgress}%</span>
          </div>
          <div className="w-full h-2.5 bg-[#000000] border border-white/10 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-[#00F0FF] via-[#A855F7] to-[#00FF87] rounded-full transition-all duration-300"
              style={{ width: `${scrollProgress}%` }}
            />
          </div>

          {/* THE CALM BEFORE SHADOW WATCHING BANNER */}
          <div className="p-3 rounded-2xl bg-[#0A0A14] border border-white/10 flex items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2 truncate">
              <CyberSilhouette role="player" rimColor="#00F0FF" width={22} height={22} />
              <span className="text-slate-300 text-[11px] font-semibold truncate">
                Illuminating path ({scrollProgress}% read)
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0 opacity-60">
              <span className="text-[10px] text-[#FF7185] italic font-semibold tracking-wider">
                Your Shadow waits.
              </span>
              <CyberSilhouette role="shadow" rimColor="#FF0055" width={26} height={26} gapDistance={10} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Reading Module Body Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="max-h-[62vh] overflow-y-auto space-y-6 pr-2 p-5 sm:p-6 bg-[#0D0D1A]/95 border border-white/10 rounded-3xl shadow-2xl text-left font-sans custom-scrollbar"
      >
        {/* Sections Loop */}
        {moduleData.sections?.map((sec, idx) => (
          <section key={sec.sectionId || idx} id={sec.sectionId} className="space-y-3 border-b border-white/5 pb-5 last:border-b-0">
            <h2 className="text-lg sm:text-xl font-bold text-white font-heading flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#00F0FF]/20 border border-[#00F0FF]/40 text-[#00F0FF] font-mono text-xs flex items-center justify-center shrink-0">
                {idx + 1}
              </span>
              <span>{sec.heading}</span>
            </h2>

            {sec.paragraphs?.map((p, pIdx) => (
              <p key={pIdx} className="text-sm text-slate-300 leading-relaxed font-sans">
                {p}
              </p>
            ))}

            {/* Worked Code / Problem Example Box */}
            {sec.codeExample && (
              <div className="p-4 rounded-2xl bg-[#000000] border border-[#00F0FF]/40 space-y-2.5 my-3 shadow-xl">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#00F0FF]">
                  <Code className="w-4 h-4 text-[#00FF87]" />
                  <span>WORKED EXAMPLE</span>
                </div>

                <pre className="p-3 rounded-xl bg-[#0A0A1A] border border-white/10 text-xs font-mono text-[#00F0FF] overflow-x-auto">
                  <code>{sec.codeExample.code}</code>
                </pre>

                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  <span className="font-bold text-[#00FF87] block mb-0.5">Explanation:</span>
                  {sec.codeExample.explanation}
                </p>
              </div>
            )}
          </section>
        ))}

        {/* Key Takeaways Box */}
        {moduleData.takeaways && moduleData.takeaways.length > 0 && (
          <div className="p-5 rounded-2xl bg-[#000000] border border-[#A855F7]/50 space-y-3 shadow-xl">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#A855F7]">
              <Sparkles className="w-4 h-4 text-[#FFB800]" />
              <span>KEY TAKEAWAYS</span>
            </div>

            <ul className="space-y-2 text-xs text-slate-200 font-sans">
              {moduleData.takeaways.map((takeaway, tIdx) => (
                <li key={tIdx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00FF87] shrink-0 mt-0.5" />
                  <span>{takeaway}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* OFFICIAL COURSES SECTION (NPTEL & SWAYAM) */}
        {academicSources.length > 0 && (
          <div className="p-5 rounded-2xl bg-[#000000] border border-[#00F0FF]/40 space-y-3 shadow-xl">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-[#00F0FF]">
              <div className="flex items-center gap-2">
                <span>🎓 OFFICIAL ACADEMIC COURSES (NPTEL & SWAYAM)</span>
              </div>
              <span className="text-slate-400 text-[10px]">Deep Dive</span>
            </div>
            <p className="text-xs text-slate-300">
              Go deeper with official course curricula and syllabi from top institutions:
            </p>
            <div className="space-y-2">
              {academicSources.map((src, aIdx) => (
                <a
                  key={aIdx}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-[#0D0D1A] border border-white/10 hover:border-[#00F0FF] text-white flex items-center justify-between transition-all group"
                >
                  <div className="truncate pr-2">
                    <span className="text-xs font-bold font-heading group-hover:text-[#00F0FF] transition-colors truncate block">
                      {src.title}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 block truncate">
                      {src.url}
                    </span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-[#00F0FF] shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Grounded Tavily Sources */}
        {moduleData.sources && moduleData.sources.length > 0 && (
          <div className="p-4 rounded-2xl bg-[#000000]/60 border border-white/10 space-y-2 text-xs font-mono">
            <span className="text-slate-400 font-bold uppercase block text-[10px]">
              Grounded Web Sources (Tavily Search API):
            </span>
            <div className="flex flex-wrap gap-2">
              {moduleData.sources.map((src, sIdx) => (
                <a
                  key={sIdx}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-[#00F0FF] hover:border-[#00F0FF]/50 transition-all truncate max-w-xs"
                >
                  <span className="truncate">{src.title}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ACTION BUTTONS: DOWNLOAD NOTES + START TEST */}
      <div className="pt-1 space-y-2">
        {moduleData && moduleData.sections && moduleData.sections.length > 0 && (
          <button
            type="button"
            onClick={async () => {
              const { downloadModuleNotesPDF } = await import("@/lib/pdfExport");
              downloadModuleNotesPDF({
                skillName,
                level: currentLevel,
                moduleData,
              });
            }}
            className="w-full py-3 px-5 rounded-2xl bg-[#0D0D1A] border border-[#00F0FF]/40 text-[#00F0FF] hover:bg-[#00F0FF]/10 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer font-mono"
          >
            <Download className="w-4 h-4 text-[#00FF87]" />
            <span>Download Module Notes (.PDF)</span>
          </button>
        )}

        <button
          type="button"
          onClick={onStartTest}
          disabled={!hasScrolledToBottom}
          className={`w-full py-4 px-6 rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
            hasScrolledToBottom
              ? "bg-gradient-to-r from-[#00FF87] via-[#00F0FF] to-[#A855F7] text-black hover:brightness-110 glow-cyan"
              : "bg-white/10 text-slate-500 border border-white/10 cursor-not-allowed"
          }`}
        >
          <span>
            {hasScrolledToBottom
              ? "I'm ready — start the test →"
              : `Scroll through module to unlock test (${scrollProgress}%)`}
          </span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
