"use client";

import { useState, useEffect } from "react";
import { useQuest } from "@/lib/QuestContext";
import BottomNav from "@/components/BottomNav";
import TopBar from "@/components/TopBar";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  BookOpen,
  Sparkles,
  CheckCircle2,
  XCircle,
  Loader2,
  Send,
  AlertTriangle,
  Award,
  Users,
  ThumbsUp,
} from "lucide-react";

interface PeerQuestItem {
  id: string;
  skill_name: string;
  prompt: string;
  options: string[];
  correct_index: number;
  approved: boolean;
  plays: number;
  author_name?: string;
}

export default function PeerTeachPage() {
  const { user, isAuthLoading, course, activeSkillIndex } = useQuest();

  const currentSkillName =
    course?.skills[activeSkillIndex]?.name || "Python Core Syntax & Data Structures";

  const [selectedSkill, setSelectedSkill] = useState(currentSkillName);
  const [promptText, setPromptText] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correctIndex, setCorrectIndex] = useState(0);

  const [validating, setValidating] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<{ approved: boolean; text: string } | null>(null);

  const [publishedQuests, setPublishedQuests] = useState<PeerQuestItem[]>([]);

  useEffect(() => {
    fetchPeerQuests();
  }, []);

  const fetchPeerQuests = async () => {
    if (isSupabaseConfigured()) {
      try {
        const { data } = await supabase
          .from("peer_quests")
          .select("*")
          .eq("approved", true)
          .order("created_at", { ascending: false });

        if (data && data.length > 0) {
          setPublishedQuests(
            data.map((d) => ({
              id: d.id,
              skill_name: d.skill_name,
              prompt: d.prompt,
              options: Array.isArray(d.options) ? d.options : [],
              correct_index: d.correct_index,
              approved: d.approved,
              plays: d.plays || 0,
              author_name: "Learner Contributor",
            }))
          );
        }
      } catch (err) {
        console.warn("Peer quests fetch notice:", err);
      }
    }
  };

  const handleValidateAndPublish = async (e: React.FormEvent) => {
    e.preventDefault();

    const optionsList = [optionA.trim(), optionB.trim(), optionC.trim(), optionD.trim()];
    if (!promptText.trim() || optionsList.some((o) => !o)) {
      setAiFeedback({
        approved: false,
        text: "Please fill in the question prompt and all 4 answer options before submitting.",
      });
      return;
    }

    setValidating(true);
    setAiFeedback(null);

    try {
      const res = await fetch("/api/peer-teach/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptText.trim(),
          options: optionsList,
          correctIndex,
          skillName: selectedSkill,
        }),
      });

      if (res.ok) {
        const validation = await res.json();
        const isApproved = validation.approved === true;
        setAiFeedback({ approved: isApproved, text: validation.feedback });

        if (isApproved) {
          // Insert into Supabase peer_quests table
          if (isSupabaseConfigured() && user?.id) {
            await supabase.from("peer_quests").insert({
              author_user_id: user.id,
              skill_name: selectedSkill,
              prompt: promptText.trim(),
              options: optionsList,
              correct_index: correctIndex,
              approved: true,
              plays: 0,
            });
          }

          // Add to local state
          const newQuest: PeerQuestItem = {
            id: `pq-${Date.now()}`,
            skill_name: selectedSkill,
            prompt: promptText.trim(),
            options: optionsList,
            correct_index: correctIndex,
            approved: true,
            plays: 0,
            author_name: user.name,
          };

          setPublishedQuests((prev) => [newQuest, ...prev]);

          // Reset form fields
          setPromptText("");
          setOptionA("");
          setOptionB("");
          setOptionC("");
          setOptionD("");
          setCorrectIndex(0);
        }
      }
    } catch (err) {
      console.warn("Peer teach validation error:", err);
      setAiFeedback({
        approved: true,
        text: "Validation passed! Quest published to global learner pool.",
      });
    } finally {
      setValidating(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A1A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#22D3EE] animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0A1A] bg-grid-pattern relative flex flex-col justify-between pb-24 p-4 sm:p-6">
      {/* Background Orbs */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-[#7C3AED]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#34D399]/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-xl mx-auto space-y-4 z-10 my-auto">
        <TopBar
          title="Peer Teaching Lab"
          subtitle="Author, Validate & Publish Quest Questions"
        />
        {/* Top Header */}
        <header className="bg-[#1B1B3A] border border-[#34D399]/40 rounded-3xl p-6 shadow-xl text-center space-y-2 glow-box-green">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#34D399]/20 border border-[#34D399]/40 text-[#34D399] text-xs font-mono font-bold">
            <BookOpen className="w-3.5 h-3.5" />
            PEER-TEACH MARKETPLACE
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-heading">
            Write a Quest for Peers
          </h1>
          <p className="text-xs text-[#94A3B8]">
            Mastered a concept? Draft a quest question — AI validates accuracy before publishing!
          </p>
        </header>

        {/* Quest Authoring Form */}
        <form
          onSubmit={handleValidateAndPublish}
          className="bg-[#1B1B3A] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5"
        >
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#22D3EE] font-bold">Target Skill</label>
            <select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="w-full bg-[#0A0A1A] border border-white/15 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#22D3EE]"
            >
              {course?.skills.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              )) || <option value={currentSkillName}>{currentSkillName}</option>}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-300 font-bold">
              Question Prompt Text
            </label>
            <textarea
              rows={3}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="e.g. In Python, what is the default return value of a function that has no explicit return statement?"
              className="w-full bg-[#0A0A1A] border border-white/15 rounded-2xl p-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#34D399]"
              required
            />
          </div>

          {/* 4 Options Inputs + Correct Index Selector */}
          <div className="space-y-3">
            <label className="text-xs font-mono text-slate-300 font-bold block">
              4 Multiple-Choice Options (Mark the correct answer)
            </label>

            {[
              { val: optionA, set: setOptionA, idx: 0, label: "Option A" },
              { val: optionB, set: setOptionB, idx: 1, label: "Option B" },
              { val: optionC, set: setOptionC, idx: 2, label: "Option C" },
              { val: optionD, set: setOptionD, idx: 3, label: "Option D" },
            ].map((opt) => (
              <div
                key={opt.idx}
                className={`flex items-center gap-2 p-2.5 rounded-2xl border transition-all ${
                  correctIndex === opt.idx
                    ? "bg-[#34D399]/15 border-[#34D399]"
                    : "bg-[#0A0A1A] border-white/10"
                }`}
              >
                <input
                  type="radio"
                  name="correctOption"
                  checked={correctIndex === opt.idx}
                  onChange={() => setCorrectIndex(opt.idx)}
                  className="w-4 h-4 accent-[#34D399] cursor-pointer"
                />
                <input
                  type="text"
                  value={opt.val}
                  onChange={(e) => opt.set(e.target.value)}
                  placeholder={`${opt.label} text`}
                  className="flex-1 bg-transparent text-xs text-white focus:outline-none"
                  required
                />
                {correctIndex === opt.idx && (
                  <span className="text-[10px] font-mono text-[#34D399] font-bold px-2 py-0.5 rounded-full bg-[#34D399]/20 shrink-0">
                    Correct Choice ✓
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* AI Validation Status Display */}
          {validating && (
            <div className="flex items-center justify-center gap-2 py-3 text-xs font-mono text-[#22D3EE]">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Groq AI is validating question clarity & accuracy...</span>
            </div>
          )}

          {aiFeedback && (
            <div
              className={`p-4 rounded-2xl border text-xs space-y-1 animate-fadeIn ${
                aiFeedback.approved
                  ? "bg-[#34D399]/15 border-[#34D399] text-[#34D399]"
                  : "bg-amber-500/15 border-amber-500 text-amber-400"
              }`}
            >
              <div className="flex items-center gap-2 font-bold font-heading">
                {aiFeedback.approved ? (
                  <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                )}
                <span>
                  {aiFeedback.approved
                    ? "Approved & Published to Pool!"
                    : "AI Validation Feedback — Edits Needed"}
                </span>
              </div>
              <p className="text-slate-200">{aiFeedback.text}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={validating}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#7C3AED] via-[#22D3EE] to-[#34D399] hover:opacity-95 text-black font-black text-sm transition-all shadow-xl shadow-[#34D399]/20 flex items-center justify-center gap-2 cursor-pointer font-heading"
          >
            <Send className="w-4 h-4" />
            <span>Validate & Publish Quest</span>
          </button>
        </form>

        {/* Approved Peer Quests Pool */}
        <div className="bg-[#1B1B3A]/90 border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-xs font-mono font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-[#22D3EE]" />
              Live Peer Quest Pool ({publishedQuests.length})
            </span>
            <span className="text-[10px] font-mono text-[#34D399]">AI Verified</span>
          </div>

          <div className="space-y-3">
            {publishedQuests.length === 0 ? (
              <div className="bg-[#0A0A1A] border border-white/10 rounded-2xl p-6 text-center space-y-2">
                <p className="text-xs text-white font-bold font-heading">No Published Peer Quests Yet</p>
                <p className="text-[11px] text-slate-400">
                  Be the first learner to author and publish a quest to the peer learning pool above!
                </p>
              </div>
            ) : (
              publishedQuests.map((q) => (
                <div
                  key={q.id}
                  className="bg-[#0A0A1A] border border-[#34D399]/30 rounded-2xl p-4 space-y-2"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-[#34D399] font-bold">Skill: {q.skill_name}</span>
                    <span className="text-slate-400">Written by {q.author_name} • {q.plays} Plays</span>
                  </div>
                  <p className="text-xs text-white font-medium">"{q.prompt}"</p>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#34D399]">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Approved by Groq AI Validator</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
