"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuest } from "@/lib/QuestContext";
import { ClassroomCourse } from "@/app/api/classroom/courses/route";
import BottomNav from "@/components/BottomNav";
import Link from "next/link";
import {
  GraduationCap,
  BookOpen,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Loader2,
  AlertCircle,
  ExternalLink,
  Plus,
} from "lucide-react";

export default function ImportClassroomPage() {
  const { setCourseData } = useQuest();
  const router = useRouter();

  const [courses, setCourses] = useState<ClassroomCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRealApi, setIsRealApi] = useState(false);

  useEffect(() => {
    async function loadCourses() {
      setLoading(true);
      try {
        const token = localStorage.getItem("xpedition_classroom_token");
        const res = await fetch("/api/classroom/courses", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (res.ok) {
          const data = await res.json();
          setCourses(data.courses || []);
          setIsRealApi(data.isRealApi || false);
        }
      } catch (err: any) {
        setError("Could not connect to Google Classroom. Using sample course list.");
      } finally {
        setLoading(false);
      }
    }

    loadCourses();
  }, []);

  const handleImportCourse = async (course: ClassroomCourse) => {
    setImportingId(course.id);
    try {
      const courseworkText = course.courseWork && course.courseWork.length > 0
        ? ` Coursework modules: ${course.courseWork.join(", ")}`
        : "";
      const fullGoalPrompt = `Master syllabus for ${course.name}.${courseworkText}`;

      const res = await fetch("/api/goal-engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalText: fullGoalPrompt }),
      });

      if (res.ok) {
        const generatedData = await res.json();
        setCourseData(generatedData, course.name);
        router.push("/quest");
      } else {
        router.push("/onboarding");
      }
    } catch (e) {
      console.warn("Error importing classroom course:", e);
      router.push("/onboarding");
    } finally {
      setImportingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#0A0A1A] bg-grid-pattern text-white relative flex flex-col justify-between pb-24 p-4 sm:p-8">
      {/* Background Glows */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-[#7C3AED]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#22D3EE]/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-2xl mx-auto space-y-6 z-10 my-auto">
        {/* Header */}
        <header className="bg-[#1B1B3A] border border-[#7C3AED]/40 rounded-3xl p-6 shadow-2xl glow-box-violet text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/40 text-[#22D3EE] text-xs font-mono font-bold">
            <GraduationCap className="w-4 h-4 text-[#FBBF24]" />
            GOOGLE CLASSROOM INTEGRATION
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-heading">
            Import Real Coursework
          </h1>
          <p className="text-xs text-[#94A3B8]">
            Select an active course to ground your AI Skill Graph in your actual syllabus and assignments.
          </p>
        </header>

        {/* Status Indicator Banner */}
        <div className="bg-[#0A0A1A] border border-white/10 p-4 rounded-2xl flex items-center justify-between text-xs font-mono">
          <span className="flex items-center gap-2 text-slate-300">
            <BookOpen className="w-4 h-4 text-[#22D3EE]" />
            <span>Scope granted: <code className="text-[#34D399]">classroom.courses.readonly</code></span>
          </span>
          <span className="text-[10px] text-[#34D399] bg-[#34D399]/20 px-2.5 py-0.5 rounded-full border border-[#34D399]/40 font-bold">
            {isRealApi ? "Google OAuth Live" : "Connected"}
          </span>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="bg-[#1B1B3A] border border-white/10 rounded-3xl p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-[#22D3EE] animate-spin mx-auto" />
            <p className="text-xs font-mono text-slate-300">Fetching courses & coursework from Google Classroom API...</p>
          </div>
        ) : (
          /* Course List Grid */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-[#94A3B8] font-mono uppercase tracking-wider">
                Available Courses ({courses.length})
              </h2>
              <Link
                href="/onboarding"
                className="text-xs font-mono text-[#22D3EE] hover:underline flex items-center gap-1"
              >
                <span>Type Custom Goal Instead →</span>
              </Link>
            </div>

            <div className="space-y-3">
              {courses.map((c) => {
                const isImporting = importingId === c.id;
                return (
                  <div
                    key={c.id}
                    className="bg-[#1B1B3A] border border-white/10 hover:border-[#7C3AED]/60 rounded-3xl p-5 shadow-xl transition-all space-y-3 relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-bold text-white font-heading">{c.name}</h3>
                        {c.section && <p className="text-xs text-[#22D3EE] font-mono">{c.section}</p>}
                        {c.descriptionHeading && (
                          <p className="text-xs text-[#94A3B8] mt-1">{c.descriptionHeading}</p>
                        )}
                      </div>

                      <button
                        onClick={() => handleImportCourse(c)}
                        disabled={isImporting}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#22D3EE] hover:from-[#6D28D9] hover:to-[#06B6D4] text-white font-black text-xs font-heading shadow-md transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
                      >
                        {isImporting ? (
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                        ) : (
                          <Sparkles className="w-4 h-4 text-[#FBBF24]" />
                        )}
                        <span>{isImporting ? "Generating..." : "Import Syllabus"}</span>
                      </button>
                    </div>

                    {/* Coursework Titles List */}
                    {c.courseWork && c.courseWork.length > 0 && (
                      <div className="bg-[#0A0A1A]/80 border border-white/5 rounded-2xl p-3 space-y-1 text-xs">
                        <span className="text-[10px] font-mono text-[#34D399] font-bold block">
                          Syllabus Coursework Modules ({c.courseWork.length}):
                        </span>
                        <ul className="space-y-0.5 text-slate-300">
                          {c.courseWork.slice(0, 3).map((w, idx) => (
                            <li key={idx} className="flex items-center gap-1.5 text-[11px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE] shrink-0" />
                              <span className="truncate">{w}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Graceful Fallback Notice */}
        <div className="bg-[#0A0A1A]/60 border border-white/10 rounded-2xl p-4 text-center text-xs space-y-1">
          <p className="text-slate-400">
            Have a custom objective not listed in Google Classroom?
          </p>
          <Link href="/onboarding" className="text-[#34D399] font-bold hover:underline">
            Use Goal Engine with custom typed prompt →
          </Link>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
