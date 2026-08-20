"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useQuest } from "@/lib/QuestContext";
import { SourceItem } from "@/lib/types";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import BottomNav from "@/components/BottomNav";
import TopBar from "@/components/TopBar";
import {
  BookOpen,
  Compass,
  ExternalLink,
  ArrowLeft,
  GraduationCap,
  Sparkles,
  Search,
  BookmarkCheck,
  Loader2,
} from "lucide-react";

interface GoalSourceGroup {
  goalTitle: string;
  goalText: string;
  createdAt: string;
  sources: SourceItem[];
}

export default function PersonalReadingListSourcesPage() {
  const { user, isAuthLoading, course, goalText } = useQuest();
  const [sourceGroups, setSourceGroups] = useState<GoalSourceGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSources() {
      setLoading(true);

      const sampleGroups: GoalSourceGroup[] = [
        {
          goalTitle: course?.title || "Python Mastery for Zoho Interview Quest",
          goalText: goalText || "Python basics for a Zoho job interview",
          createdAt: new Date().toLocaleDateString(),
          sources: course?.sources || [
            { title: "GeeksforGeeks Python Programming Language", url: "https://www.geeksforgeeks.org/python-programming-language/", domain: "geeksforgeeks.org" },
            { title: "MDN Web Docs JavaScript & Python Reference", url: "https://developer.mozilla.org", domain: "developer.mozilla.org" },
            { title: "freeCodeCamp Python Curriculum Guide", url: "https://www.freecodecamp.org/news/python-code-examples/", domain: "freecodecamp.org" },
            { title: "Python 3 Official Standard Library Documentation", url: "https://docs.python.org/3/", domain: "docs.python.org" },
          ],
        },
        {
          goalTitle: "FAANG Data Structures & Algorithms Conquest",
          goalText: "DSA for a FAANG interview",
          createdAt: new Date(Date.now() - 3 * 86400000).toLocaleDateString(),
          sources: [
            { title: "GeeksforGeeks Top 10 Algorithms for Coding Interviews", url: "https://www.geeksforgeeks.org/top-10-algorithms-in-interview-questions/", domain: "geeksforgeeks.org" },
            { title: "LeetCode Pattern Recognition Guide", url: "https://leetcode.com", domain: "leetcode.com" },
            { title: "MIT OpenCourseWare Data Structures & Algorithms", url: "https://ocw.mit.edu", domain: "ocw.mit.edu" },
          ],
        },
      ];

      if (isSupabaseConfigured() && user?.id) {
        try {
          const { data: dbGoals } = await supabase
            .from("goals")
            .select("title, goal_text, sources, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (dbGoals && dbGoals.length > 0) {
            const fetchedGroups: GoalSourceGroup[] = dbGoals.map((g: any) => ({
              goalTitle: g.title,
              goalText: g.goal_text,
              createdAt: new Date(g.created_at).toLocaleDateString(),
              sources: (g.sources || []).length > 0 ? g.sources : sampleGroups[0].sources,
            }));

            setSourceGroups(fetchedGroups);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.warn("Supabase fetch goals sources error:", err);
        }
      }

      setSourceGroups(sampleGroups);
      setLoading(false);
    }

    loadSources();
  }, [user, course, goalText]);

  const totalSourcesCount = sourceGroups.reduce((acc, g) => acc + g.sources.length, 0);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A1A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#22D3EE] animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0A1A] bg-grid-pattern text-white relative flex flex-col justify-between pb-24 p-4 sm:p-8">
      {/* Background Glows */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-[#7C3AED]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#22D3EE]/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-3xl mx-auto space-y-4 z-10 my-auto">
        <TopBar
          title="Open Web Reading List"
          subtitle="Harvested Web Documentation & Grounded Sources"
        />
        {/* Top Header */}
        <header className="bg-[#1B1B3A] border border-[#7C3AED]/40 rounded-3xl p-6 shadow-2xl glow-box-violet flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/40 text-[#22D3EE] text-xs font-mono font-bold">
              <BookmarkCheck className="w-3.5 h-3.5 text-[#FBBF24]" />
              PERSONAL OPEN WEB READING LIST
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white font-heading">
              Grounded Web Sources
            </h1>
            <p className="text-xs text-[#94A3B8]">
              Every open web source harvested by Tavily & Groq AI to ground your personalized courses.
            </p>
          </div>

          <Link
            href="/profile"
            className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-xs font-mono text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Profile</span>
          </Link>
        </header>

        {/* Counter Banner */}
        <div className="bg-[#0A0A1A] border border border-white/10 p-4 rounded-2xl flex items-center justify-between text-xs font-mono">
          <span className="text-slate-300 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#22D3EE]" />
            <span>Harvested Web Sources ({totalSourcesCount} links across {sourceGroups.length} courses)</span>
          </span>
          <span className="text-[#34D399] font-bold">Updated Live</span>
        </div>

        {/* Sources Grouped by Category & Goal */}
        <div className="space-y-6">
          {sourceGroups.map((group, gIdx) => {
            const officialCourses = group.sources.filter((s) => {
              const u = (s.url || "").toLowerCase();
              return u.includes("nptel.ac.in") || u.includes("swayam.gov.in");
            });

            const documentationSources = group.sources.filter((s) => {
              const u = (s.url || "").toLowerCase();
              return (
                !u.includes("nptel.ac.in") &&
                !u.includes("swayam.gov.in") &&
                (u.includes("docs") || u.includes("mozilla") || u.includes("python.org") || u.includes("microsoft") || u.includes("w3.org"))
              );
            });

            const communitySources = group.sources.filter((s) => {
              const u = (s.url || "").toLowerCase();
              return (
                !u.includes("nptel.ac.in") &&
                !u.includes("swayam.gov.in") &&
                !u.includes("docs") &&
                !u.includes("mozilla") &&
                !u.includes("python.org") &&
                !u.includes("microsoft") &&
                !u.includes("w3.org")
              );
            });

            return (
              <div
                key={gIdx}
                className="bg-[#0D0D1A] border border-[#00F0FF]/30 rounded-3xl p-6 shadow-xl space-y-5 glow-cyan"
              >
                <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
                  <div>
                    <h2 className="text-lg font-bold text-white font-heading">{group.goalTitle}</h2>
                    <p className="text-xs text-[#94A3B8] font-mono mt-0.5">
                      Goal: <span className="text-slate-200">"{group.goalText}"</span>
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">{group.createdAt}</span>
                </div>

                {/* 1. Official Courses (NPTEL & SWAYAM) */}
                {officialCourses.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#00F0FF]">
                      <GraduationCap className="w-4 h-4 text-[#FFB800]" />
                      <span>🎓 OFFICIAL COURSES (NPTEL & SWAYAM)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {officialCourses.map((src, sIdx) => (
                        <a
                          key={sIdx}
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-[#000000] border border-[#00F0FF]/40 hover:border-[#00F0FF] p-3.5 rounded-2xl transition-all flex items-center gap-3 text-xs group cursor-pointer shadow-md"
                        >
                          <span className="text-lg shrink-0">🎓</span>
                          <div className="overflow-hidden space-y-0.5">
                            <p className="font-bold text-white text-xs truncate group-hover:text-[#00F0FF] transition-colors">
                              {src.title}
                            </p>
                            <span className="text-[10px] font-mono text-[#00FF87] block truncate flex items-center gap-1">
                              <span>{src.domain}</span>
                              <ExternalLink className="w-3 h-3 text-[#00F0FF]" />
                            </span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Official Documentation */}
                {documentationSources.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#A855F7]">
                      <BookOpen className="w-4 h-4 text-[#00FF87]" />
                      <span>📖 DOCUMENTATION & OFFICIAL GUIDES</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {documentationSources.map((src, sIdx) => (
                        <a
                          key={sIdx}
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-[#000000] border border-white/10 hover:border-[#A855F7] p-3.5 rounded-2xl transition-all flex items-center gap-3 text-xs group cursor-pointer shadow-md"
                        >
                          <img
                            src={`https://www.google.com/s2/favicons?domain=${src.domain}&sz=32`}
                            alt={src.domain}
                            className="w-6 h-6 rounded shrink-0 bg-white/10 p-0.5"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                          <div className="overflow-hidden space-y-0.5">
                            <p className="font-bold text-white text-xs truncate group-hover:text-[#A855F7] transition-colors">
                              {src.title}
                            </p>
                            <span className="text-[10px] font-mono text-[#00F0FF] block truncate flex items-center gap-1">
                              <span>{src.domain}</span>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Community & Practice */}
                {communitySources.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300">
                      <Sparkles className="w-4 h-4 text-[#FFB800]" />
                      <span>🌐 COMMUNITY & PRACTICE SOURCES</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {communitySources.map((src, sIdx) => (
                        <a
                          key={sIdx}
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-[#000000] border border-white/10 hover:border-white/30 p-3.5 rounded-2xl transition-all flex items-center gap-3 text-xs group cursor-pointer shadow-md"
                        >
                          <img
                            src={`https://www.google.com/s2/favicons?domain=${src.domain}&sz=32`}
                            alt={src.domain}
                            className="w-6 h-6 rounded shrink-0 bg-white/10 p-0.5"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                          <div className="overflow-hidden space-y-0.5">
                            <p className="font-bold text-white text-xs truncate group-hover:text-[#00F0FF] transition-colors">
                              {src.title}
                            </p>
                            <span className="text-[10px] font-mono text-slate-400 block truncate flex items-center gap-1">
                              <span>{src.domain}</span>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
