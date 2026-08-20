"use client";

import { useState, useEffect } from "react";
import { useQuest } from "@/lib/QuestContext";
import BottomNav from "@/components/BottomNav";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { QRCodeSVG } from "qrcode.react";
import {
  Compass,
  CheckCircle2,
  Share2,
  Sparkles,
  Trophy,
  PlusCircle,
  Check,
  Loader2,
  Copy,
  Briefcase,
  X,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

interface SkillMasteryItem {
  id: string;
  name: string;
  pKnow: number;
  difficulty: number;
}

interface CareerMapData {
  roleName: string;
  readinessPercent: number;
  matchedSkills: string[];
  gapSkills: { name: string; why: string }[];
}

export default function PassportPage() {
  const { user, course, goalText, addSkillToCourse, pKnow: currentPKnow, activeSkillIndex } = useQuest();

  const [skillsMastery, setSkillsMastery] = useState<SkillMasteryItem[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [careerMap, setCareerMap] = useState<CareerMapData | null>(null);
  const [loadingCareerMap, setLoadingCareerMap] = useState(false);
  const [addedGapSkills, setAddedGapSkills] = useState<Record<string, boolean>>({});

  // Share Modal & Toast
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareId = user.shareId || "demo-share-8842";
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const shareUrl = `${origin || "http://localhost:3000"}/p/${shareId}`;

  // Fetch real mastery data from Supabase or context
  useEffect(() => {
    async function loadPassportData() {
      setLoadingSkills(true);
      const courseSkills = course?.skills || [];

      let masteryItems: SkillMasteryItem[] = [];

      if (isSupabaseConfigured() && user?.id) {
        try {
          const { data: masteryRecords } = await supabase
            .from("mastery")
            .select("skill_id, p_know")
            .eq("user_id", user.id);

          const pKnowMap = new Map<string, number>();
          masteryRecords?.forEach((m) => pKnowMap.set(m.skill_id, m.p_know));

          masteryItems = courseSkills.map((s, idx) => {
            let pk = pKnowMap.get(s.id);
            if (pk === undefined) {
              pk = idx === activeSkillIndex ? currentPKnow : 0.0;
            }
            return {
              id: s.id,
              name: s.name,
              pKnow: pk,
              difficulty: s.difficulty,
            };
          });
        } catch (err) {
          console.warn("Passport Supabase fetch warning:", err);
        }
      }

      if (masteryItems.length === 0 && courseSkills.length > 0) {
        masteryItems = courseSkills.map((s, idx) => ({
          id: s.id,
          name: s.name,
          pKnow: idx === activeSkillIndex ? currentPKnow : 0.0,
          difficulty: s.difficulty,
        }));
      }

      setSkillsMastery(masteryItems);
      setLoadingSkills(false);

      // Fetch Career Outcome Mapping
      fetchCareerMap(masteryItems);
    }

    loadPassportData();
  }, [course, user, currentPKnow, activeSkillIndex]);

  const fetchCareerMap = async (items: SkillMasteryItem[]) => {
    setLoadingCareerMap(true);
    try {
      const res = await fetch("/api/career-map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goalText,
          userSkills: items.map((i) => ({ name: i.name, pKnow: i.pKnow })),
        }),
      });

      if (res.ok) {
        const data: CareerMapData = await res.json();
        setCareerMap(data);
      }
    } catch (err) {
      console.warn("Career map fetch notice:", err);
    } finally {
      setLoadingCareerMap(false);
    }
  };

  const [sharing, setSharing] = useState(false);
  const [snapshotShareUrl, setSnapshotShareUrl] = useState("");
  const [snapshotId, setSnapshotId] = useState("");

  const handleOpenShare = async () => {
    setSharing(true);
    try {
      const res = await fetch("/api/passport/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id || "demo-user-1",
          userName: user?.name || "Adventurer",
          goalTitle: course?.title || goalText,
          skills: skillsMastery,
          overallReadiness: avgPKnow,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSnapshotShareUrl(data.publicUrl);
        setSnapshotId(data.snapshotId);
        navigator.clipboard.writeText(data.publicUrl);
        setCopied(true);
        setShowShareModal(true);
        setTimeout(() => setCopied(false), 2500);
      } else {
        // Fallback share URL
        setSnapshotShareUrl(shareUrl);
        setShowShareModal(true);
      }
    } catch (err) {
      console.warn("Share snapshot API notice:", err);
      setSnapshotShareUrl(shareUrl);
      setShowShareModal(true);
    } finally {
      setSharing(false);
    }
  };

  const handleCopyLink = () => {
    const targetUrl = snapshotShareUrl || shareUrl;
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleAddGapSkill = async (gapName: string) => {
    await addSkillToCourse(gapName);
    setAddedGapSkills((prev) => ({ ...prev, [gapName]: true }));
  };

  // Compute Overall Readiness
  const avgPKnow =
    skillsMastery.length > 0
      ? skillsMastery.reduce((acc, s) => acc + s.pKnow, 0) / skillsMastery.length
      : 0.5;
  const overallReadiness = Math.round(avgPKnow * 100);

  return (
    <main className="min-h-screen bg-[#0A0A1A] bg-grid-pattern relative flex flex-col justify-between pb-24 p-4 sm:p-6">
      {/* Background Orbs */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-[#7C3AED]/15 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#22D3EE]/15 rounded-full blur-[130px] pointer-events-none" />

      <div className="w-full max-w-xl mx-auto space-y-6 z-10 my-auto">
        {/* Header */}
        <header className="bg-[#1B1B3A] border border-[#7C3AED]/40 rounded-3xl p-6 shadow-xl glow-box-violet text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/40 text-[#22D3EE] text-xs font-mono font-bold">
            <Compass className="w-3.5 h-3.5" />
            PORTABLE VERIFIED CREDENTIALS
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-heading">
            Your Skill Passport
          </h1>
          <p className="text-xs text-[#94A3B8]">
            Verifiable Bayesian Knowledge Tracing (BKT) mastery data — share with recruiters
          </p>
        </header>

        {/* Passport Credential Card */}
        <div className="bg-gradient-to-br from-[#1B1B3A] via-[#12122C] to-[#0A0A1A] border border-[#34D399]/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6 glow-box-green">
          {/* User Info Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#7C3AED] via-[#22D3EE] to-[#34D399] flex items-center justify-center text-black font-black text-xl font-heading shadow-xl ring-2 ring-[#22D3EE]/40 shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white font-heading">{user.name}</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#34D399]/20 text-[#34D399] border border-[#34D399]/40 text-[10px] font-mono font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified
                  </span>
                </div>
                <p className="text-xs text-[#94A3B8] mt-0.5 font-mono">
                  Goal: {course?.title || goalText}
                </p>
              </div>
            </div>

            {/* Readiness Score Chip */}
            <div className="bg-[#0A0A1A] border border-[#22D3EE]/40 px-3 py-2 rounded-2xl text-center shrink-0 hidden sm:block">
              <span className="text-[9px] font-mono text-slate-400 block">Overall Mastery</span>
              <span className="text-lg font-black text-[#22D3EE] font-mono">
                {overallReadiness}%
              </span>
            </div>
          </div>

          {/* Real Skill Mastery Bars */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#94A3B8] font-mono uppercase tracking-wider">
                BKT Mastery Modules ({skillsMastery.length})
              </h3>
              <span className="text-xs font-mono text-[#34D399] font-bold">
                Avg: {overallReadiness}% P(know)
              </span>
            </div>

            {loadingSkills ? (
              <div className="flex items-center justify-center py-6 text-xs text-[#22D3EE] font-mono gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading Supabase mastery data...</span>
              </div>
            ) : (
              skillsMastery.map((skill, idx) => {
                const pct = Math.round(skill.pKnow * 100);
                let colorClass = "from-[#7C3AED] to-[#22D3EE]";
                if (pct >= 75) colorClass = "from-[#22D3EE] to-[#34D399]";
                else if (pct <= 35) colorClass = "from-[#FBBF24] to-[#7C3AED]";

                return (
                  <div key={skill.id || idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-200 font-semibold">{skill.name}</span>
                      <span className="text-[#22D3EE] font-bold">{pct}% P(know)</span>
                    </div>
                    <div className="w-full h-3.5 bg-[#0A0A1A] rounded-full overflow-hidden border border-white/10 p-0.5">
                      <div
                        className={`h-full bg-gradient-to-r ${colorClass} rounded-full transition-all duration-500 shadow-md`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Share Passport Button */}
          <button
            onClick={handleOpenShare}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#7C3AED] via-[#22D3EE] to-[#34D399] hover:opacity-95 text-black font-black text-sm transition-all shadow-lg shadow-[#7C3AED]/30 flex items-center justify-center gap-2 cursor-pointer font-heading tracking-wide"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Passport & Get QR Code</span>
          </button>
        </div>

        {/* Career-Outcome Map Card */}
        <div className="bg-[#1B1B3A] border border-[#22D3EE]/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 relative glow-box-cyan">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-[#22D3EE]" />
              <h2 className="text-lg font-bold text-white font-heading">Career-Outcome Map</h2>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Live Tavily + Groq Analysis</span>
          </div>

          {loadingCareerMap ? (
            <div className="flex items-center justify-center py-8 text-xs font-mono text-[#22D3EE] gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Analyzing live job market requirements...</span>
            </div>
          ) : careerMap ? (
            <div className="space-y-5">
              {/* Big Readiness Banner */}
              <div className="bg-[#0A0A1A] border border-[#34D399]/40 rounded-2xl p-5 text-center space-y-1">
                <span className="text-xs text-slate-400 font-mono">Target Role Analysis</span>
                <p className="text-xl sm:text-2xl font-black text-white font-heading">
                  You're <span className="text-[#34D399]">{careerMap.readinessPercent}%</span> ready for a{" "}
                  <span className="text-[#22D3EE]">{careerMap.roleName}</span> role!
                </p>
                <p className="text-xs text-[#94A3B8]">
                  Based on live market requirements search for "{goalText}"
                </p>
              </div>

              {/* Matched Skills (Green Chips) */}
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold text-[#34D399] uppercase tracking-wider block">
                  ✓ Matched Industry Skills ({careerMap.matchedSkills.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {careerMap.matchedSkills.map((mSkill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-xl bg-[#34D399]/15 border border-[#34D399]/40 text-[#34D399] text-xs font-mono font-bold flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {mSkill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Gap Skills (Amber Chips + Add to Path) */}
              <div className="space-y-3">
                <span className="text-xs font-mono font-bold text-[#FBBF24] uppercase tracking-wider block">
                  ⚠ Recommended Gap Skills to Add ({careerMap.gapSkills.length})
                </span>

                <div className="space-y-2.5">
                  {careerMap.gapSkills.map((gap, i) => {
                    const isAdded = addedGapSkills[gap.name];

                    return (
                      <div
                        key={i}
                        className="bg-[#0A0A1A] border border-[#FBBF24]/30 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-lg bg-[#FBBF24]/20 border border-[#FBBF24]/40 text-[#FBBF24] font-mono text-xs font-bold">
                              {gap.name}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300">{gap.why}</p>
                        </div>

                        <button
                          onClick={() => handleAddGapSkill(gap.name)}
                          disabled={isAdded}
                          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                            isAdded
                              ? "bg-[#34D399]/20 border border-[#34D399] text-[#34D399]"
                              : "bg-[#FBBF24] hover:bg-[#F59E0B] text-black shadow-md shadow-[#FBBF24]/20"
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Added to Path ✓</span>
                            </>
                          ) : (
                            <>
                              <PlusCircle className="w-3.5 h-3.5" />
                              <span>Add to my path</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Share Passport & QR Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#1B1B3A] border border-[#34D399]/40 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl glow-box-green relative space-y-5 text-center">
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#34D399]/20 border border-[#34D399]/40 text-[#34D399] text-xs font-mono font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                PUBLIC CREDENTIAL LINK
              </div>
              <h3 className="text-xl font-bold text-white font-heading">Share Skill Passport</h3>
              <p className="text-xs text-[#94A3B8]">
                Recruiters can inspect your verified BKT mastery without logging in
              </p>
            </div>

            {/* QR Code Container */}
            <div className="bg-white p-4 rounded-2xl w-44 h-44 mx-auto flex items-center justify-center shadow-xl border border-slate-300">
              <QRCodeSVG value={shareUrl} size={150} fgColor="#0A0A1A" bgColor="#FFFFFF" />
            </div>

            {/* URL Box + Copy Button */}
            <div className="space-y-2">
              <div className="bg-[#0A0A1A] border border-white/10 rounded-2xl p-3 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 truncate max-w-[200px]">{shareUrl}</span>
                <button
                  onClick={handleCopyLink}
                  className="text-[#22D3EE] hover:underline font-bold flex items-center gap-1 cursor-pointer shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#34D399]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied!" : "Copy"}</span>
                </button>
              </div>

              {copied && (
                <p className="text-xs text-[#34D399] font-mono font-bold animate-fadeIn">
                  ✓ Public URL copied to clipboard!
                </p>
              )}
            </div>

            <button
              onClick={() => setShowShareModal(false)}
              className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
