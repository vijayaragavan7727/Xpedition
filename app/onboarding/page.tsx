"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuest } from "@/lib/QuestContext";
import { GoalEngineResponse, LearningStyle } from "@/lib/types";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { initUserArms, ArmType } from "@/lib/bandit";
import QuestModal from "@/components/QuestModal";
import {
  Compass,
  Sparkles,
  Send,
  Loader2,
  BookOpen,
  Play,
  Star,
  CheckCircle2,
  Award,
  ChevronLeft,
  Flame,
  Zap,
  Trophy,
  Swords,
  Shield,
  ArrowRight,
  Upload,
  Paperclip,
  FileText,
  X,
} from "lucide-react";

const POPULAR_QUICKSTART_GOALS = [
  { id: "python", title: "Python Basics", desc: "Syntax, data structures & functions", icon: "🐍", query: "Python Basics for Beginners" },
  { id: "dsa", title: "DSA for Interviews", desc: "Arrays, trees, graphs & Big-O", icon: "⚡", query: "Data Structures & Algorithms" },
  { id: "sql", title: "SQL & Databases", desc: "Queries, joins, indexing & schemas", icon: "🗄️", query: "SQL & Database Management" },
  { id: "ml", title: "Machine Learning Basics", desc: "Supervised ML, regression & scikit", icon: "🤖", query: "Machine Learning Fundamentals" },
  { id: "webdev", title: "Web Dev (React & Next.js)", desc: "Components, hooks, SSR & Tailwind", icon: "🌐", query: "React & Next.js Web Development" },
  { id: "aptitude", title: "Aptitude & Reasoning", desc: "Quantitative logic for placements", icon: "🧩", query: "Quantitative Aptitude & Logical Reasoning" },
  { id: "english", title: "Spoken English", desc: "Communication, fluency & vocabulary", icon: "🗣️", query: "Spoken English & Communication Skills" },
  { id: "systemdesign", title: "System Design", desc: "Scalability, caching & load balancing", icon: "🏗️", query: "System Design & Distributed Systems" },
];

const MOTIVATION_OPTIONS = [
  {
    id: "badge" as ArmType,
    label: "Trophy & Badges",
    desc: "Collecting rare credentials & badges on your Passport",
    icon: Trophy,
    color: "text-[#34D399] bg-[#34D399]/20 border-[#34D399]/40",
  },
  {
    id: "lore" as ArmType,
    label: "Hidden Lore & Story",
    desc: "Unlocking secret cyber lore & tech story chapters",
    icon: BookOpen,
    color: "text-[#22D3EE] bg-[#22D3EE]/20 border-[#22D3EE]/40",
  },
  {
    id: "guild_invite" as ArmType,
    label: "Squad & Co-op Raids",
    desc: "Teaming up with live matched peers to defeat bosses",
    icon: Swords,
    color: "text-red-400 bg-red-500/20 border-red-500/40",
  },
  {
    id: "leaderboard" as ArmType,
    label: "Rank & Leaderboards",
    desc: "Climbing global standings & earning XP multipliers",
    icon: Zap,
    color: "text-[#FBBF24] bg-[#FBBF24]/20 border-[#FBBF24]/40",
  },
];

const LEARNING_STYLE_OPTIONS = [
  {
    id: "story" as LearningStyle,
    label: "Story & Analogy",
    desc: "Learn through vivid real-world analogies, metaphors & narratives",
    icon: BookOpen,
    color: "text-[#22D3EE] bg-[#22D3EE]/20 border-[#22D3EE]/40",
  },
  {
    id: "theory" as LearningStyle,
    label: "Theory & Concepts",
    desc: "Master formal definitions, underlying principles & mechanics",
    icon: Shield,
    color: "text-[#7C3AED] bg-[#7C3AED]/20 border-[#7C3AED]/40",
  },
  {
    id: "code" as LearningStyle,
    label: "Code & Examples",
    desc: "Learn by analyzing clean code blocks, syntax comments & outputs",
    icon: Sparkles,
    color: "text-[#34D399] bg-[#34D399]/20 border-[#34D399]/40",
  },
  {
    id: "stepwise" as LearningStyle,
    label: "Step-by-Step Breakdown",
    desc: "Break complex concepts down into clear numbered 1-2-3 steps",
    icon: Compass,
    color: "text-[#FBBF24] bg-[#FBBF24]/20 border-[#FBBF24]/40",
  },
];

const LOADING_STEPS = [
  "Searching the web via Tavily API...",
  "Analyzing real-world curriculum & requirements...",
  "Generating skill path with Groq LLM (llama-3.3-70b)...",
  "Warm-starting Thompson Sampling Bandit with Alpha = 3...",
];

export default function OnboardingPage() {
  const { user, setCourseData, setMotivationType, setLearningStyle } = useQuest();
  const [userName, setUserName] = useState("Adventurer");
  const [step, setStep] = useState<"motivation" | "learning_style" | "goal">("motivation");
  const [motivatedArm, setMotivatedArm] = useState<ArmType>("badge");
  const [selectedStyle, setSelectedStyle] = useState<LearningStyle>("story");
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<GoalEngineResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nonsenseError, setNonsenseError] = useState<{ message: string; examples: string[] } | null>(null);

  // Syllabus File Upload State
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [extractingFile, setExtractingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [extractedTopics, setExtractedTopics] = useState<string[]>([]);
  const [newTopicInput, setNewTopicInput] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (user?.name) {
      setUserName(user.name);
    }
  }, [user]);

  const handleSelectMotivation = async (arm: ArmType) => {
    setMotivatedArm(arm);

    if (setMotivationType) {
      await setMotivationType(arm);
    }

    if (isSupabaseConfigured()) {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user?.id) {
          await initUserArms(userData.user.id, arm);
        }
      } catch (err) {
        console.warn("Supabase initUserArms notice:", err);
      }
    }

    setStep("learning_style");
  };

  const handleSelectLearningStyle = async (style: LearningStyle) => {
    setSelectedStyle(style);
    if (setLearningStyle) {
      await setLearningStyle(style);
    }
    setStep("goal");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 5MB Size Limit Validation
    if (file.size > 5 * 1024 * 1024) {
      setFileError("File is too large (max 5MB). Please upload a smaller file or type your goal manually.");
      return;
    }

    setExtractingFile(true);
    setFileError(null);
    const isPDF = file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";

    try {
      if (isPDF) {
        // PDF client-side text extraction via pdfjs-dist
        try {
          const pdfjs = await import("pdfjs-dist");
          pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

          let text = "";
          for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items.map((item: any) => item.str).join(" ");
            text += ` ${pageText}`;
          }

          if (!text || text.trim().length < 5) {
            throw new Error("PDF contains no readable text or scanned images.");
          }

          const res = await fetch("/api/extract-syllabus", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, fileName: file.name }),
          });

          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.topics) && data.topics.length > 0) {
              setExtractedTopics(data.topics);
            } else {
              throw new Error("Could not detect clear learning topics from PDF.");
            }
          } else {
            throw new Error("Failed to extract syllabus from PDF.");
          }
        } catch (pdfErr: any) {
          if (pdfErr?.name === "PasswordException" || pdfErr?.message?.includes("password")) {
            throw new Error("PDF is password-protected. Please unlock it or type your goal manually.");
          }
          throw pdfErr;
        }
      } else {
        // Image Vision extraction via /api/extract-syllabus (Gemini Vision API / Groq)
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const imageBase64 = await base64Promise;
        const res = await fetch("/api/extract-syllabus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64,
            mimeType: file.type || "image/png",
            fileName: file.name,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.topics) && data.topics.length > 0) {
            setExtractedTopics(data.topics);
          } else {
            throw new Error("Scanned/blurry image or unreadable text. Try typing your goal manually.");
          }
        } else {
          throw new Error("Could not extract topics from image.");
        }
      }
    } catch (err: any) {
      setFileError(err.message || "Could not extract text from this file. Try typing your goal manually.");
    } finally {
      setExtractingFile(false);
    }
  };

  const handleGenerateCourse = async (targetGoal: string) => {
    if (!targetGoal.trim()) return;

    setLoading(true);
    setError(null);
    setNonsenseError(null);
    setResult(null);
    setLoadingStep(0);

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 1100);

    try {
      const res = await fetch("/api/goal-engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: targetGoal }),
      });

      clearInterval(stepInterval);

      if (res.status === 400) {
        const errData = await res.json();
        if (errData.error === "nonsense") {
          setNonsenseError({
            message: errData.message || "Could not recognize a valid learning goal.",
            examples: errData.examples || [
              "Python Basics for Beginners",
              "Data Structures & Algorithms",
              "Machine Learning & AI",
              "Full Stack Web Development",
            ],
          });
          setLoading(false);
          return;
        }
      }

      if (!res.ok) {
        throw new Error("Failed to generate course from Goal Engine.");
      }

      const data: GoalEngineResponse = await res.json();
      setResult(data);
      setCourseData(data, data.normalizedTopic || targetGoal);

      // Save goal and skills to Supabase DB
      if (isSupabaseConfigured()) {
        try {
          const { data: userData } = await supabase.auth.getUser();
          const userId = userData?.user?.id;

          if (userId) {
            const { data: goalRecord } = await supabase
              .from("goals")
              .insert({
                user_id: userId,
                goal_text: targetGoal,
                title: data.title,
              })
              .select("id")
              .single();

            if (goalRecord?.id && Array.isArray(data.skills)) {
              const skillRecords = data.skills.map((s, idx) => ({
                goal_id: goalRecord.id,
                name: s.name,
                difficulty: s.difficulty,
                order_index: idx,
              }));

              await supabase.from("skills").insert(skillRecords);
            }

            // Also ensure arms initialized
            await initUserArms(userId, motivatedArm);
          }
        } catch (dbErr) {
          console.warn("Supabase database insert warning:", dbErr);
        }
      }
    } catch (err: any) {
      clearInterval(stepInterval);
      setError(err.message || "An error occurred while generating your goal path.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleGenerateCourse(goal);
  };

  const handleSelectSuggested = (suggested: string) => {
    setGoal(suggested);
    handleGenerateCourse(suggested);
  };

  return (
    <main className="min-h-screen bg-[#0A0A1A] bg-grid-pattern relative flex flex-col justify-between p-4 sm:p-8">
      {/* Background Orbs */}
      <div className="absolute top-10 right-10 w-96 h-96 bg-[#7C3AED]/15 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#22D3EE]/15 rounded-full blur-[130px] pointer-events-none" />

      {/* Top Bar */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between z-10 py-2">
        <button
          onClick={() => {
            if (step === "goal") setStep("learning_style");
            else if (step === "learning_style") setStep("motivation");
            else router.push("/home");
          }}
          className="flex items-center gap-2 text-xs text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>
            {step === "goal"
              ? "Change Learning Style"
              : step === "learning_style"
              ? "Change Motivation"
              : "Back to Home"}
          </span>
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1B1B3A] border border-white/10 text-xs">
            <Award className="w-4 h-4 text-[#FBBF24]" />
            <span className="text-slate-200 font-bold">{userName}</span>
            <span className="text-[#34D399] font-mono">{user.xp} XP</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="w-full max-w-3xl mx-auto z-10 my-auto py-8">
        {/* Step 1: Motivation Question Screen */}
        {step === "motivation" && !loading && (
          <div className="text-center space-y-6 animate-fadeIn">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1B1B3A] border border-[#7C3AED]/40 shadow-lg shadow-[#7C3AED]/10 text-xs text-[#22D3EE] font-mono">
              <Sparkles className="w-3.5 h-3.5 text-[#FBBF24]" />
              BANDIT COLD-START WARM PRIOR (ALPHA = 3)
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white font-heading tracking-tight">
              What motivates you most?
            </h1>
            <p className="text-sm sm:text-base text-[#94A3B8] max-w-lg mx-auto">
              Select your primary drive. Our Thompson Sampling Contextual Bandit uses this to initialize your reward arm priors.
            </p>

            {/* 4 Tappable Motivation Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto pt-2">
              {MOTIVATION_OPTIONS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectMotivation(item.id)}
                    className="bg-[#1B1B3A] border border-white/10 hover:border-[#22D3EE] p-5 rounded-3xl transition-all duration-200 hover:scale-[1.02] text-left cursor-pointer group glow-box-violet space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className={`p-3 rounded-2xl ${item.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 group-hover:text-[#22D3EE]">
                        α = 3 Prior
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white font-heading group-hover:text-[#22D3EE] transition-colors">
                        {item.label}
                      </h3>
                      <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 1.5: Learning Style Selection Screen */}
        {step === "learning_style" && !loading && (
          <div className="text-center space-y-6 animate-fadeIn">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1B1B3A] border border-[#7C3AED]/40 text-xs text-[#22D3EE] font-mono">
              <Sparkles className="w-3.5 h-3.5 text-[#FBBF24]" />
              PEDAGOGICAL ADAPTATION ENGINE
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white font-heading tracking-tight">
              How do you learn best?
            </h1>
            <p className="text-sm sm:text-base text-[#94A3B8] max-w-lg mx-auto">
              Select your preferred teaching style. Questions, concept primers, and explanations will adapt strictly to your style.
            </p>

            {/* 4 Tappable Learning Style Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto pt-2">
              {LEARNING_STYLE_OPTIONS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectLearningStyle(item.id)}
                    className="bg-[#1B1B3A] border border-white/10 hover:border-[#34D399] p-5 rounded-3xl transition-all duration-200 hover:scale-[1.02] text-left cursor-pointer group glow-box-violet space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className={`p-3 rounded-2xl ${item.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 group-hover:text-[#34D399]">
                        Pedagogical Mode
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white font-heading group-hover:text-[#34D399] transition-colors">
                        {item.label}
                      </h3>
                      <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Goal Prompt Screen */}
        {step === "goal" && !result && !loading && extractedTopics.length === 0 && (
          <div className="text-center space-y-6 animate-fadeIn">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1B1B3A] border border-[#7C3AED]/40 text-xs text-[#22D3EE] font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399]" />
              MOTIVATION PRIOR SET ({motivatedArm.toUpperCase()})
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white font-heading tracking-tight">
              What's your goal?
            </h1>
            <p className="text-sm sm:text-base text-[#94A3B8] max-w-lg mx-auto">
              State your target role, exam, or skill. Tavily & Groq AI will construct your adaptive curriculum.
            </p>

            <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto space-y-3">
              <div className="relative flex items-center bg-[#1B1B3A] border border-[#7C3AED]/40 rounded-2xl p-2 shadow-2xl focus-within:border-[#22D3EE] focus-within:ring-2 focus-within:ring-[#22D3EE]/30 transition-all glow-box-violet">
                <input
                  type="text"
                  required={!showFileUpload}
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="e.g. Python basics, or DSA for a FAANG interview"
                  className="w-full bg-transparent text-white placeholder:text-slate-500 px-4 py-3.5 text-sm sm:text-base focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!goal.trim()}
                  className="bg-gradient-to-r from-[#7C3AED] to-[#22D3EE] hover:from-[#6D28D9] hover:to-[#06B6D4] text-white p-3.5 rounded-xl font-bold transition-all shadow-md shadow-[#7C3AED]/30 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>

              {/* Optional Syllabus File Upload Link & Inline Input */}
              <div className="text-center pt-1">
                {!showFileUpload ? (
                  <button
                    type="button"
                    onClick={() => setShowFileUpload(true)}
                    className="inline-flex items-center gap-1.5 text-xs text-[#22D3EE] hover:underline font-mono font-bold cursor-pointer"
                  >
                    <Paperclip className="w-3.5 h-3.5 text-[#FBBF24]" />
                    <span>or upload your syllabus (PDF / Image max 5MB)</span>
                  </button>
                ) : (
                  <div className="bg-[#1B1B3A] border border-[#22D3EE]/40 rounded-2xl p-4 space-y-3 max-w-md mx-auto animate-fadeIn">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-[#22D3EE] font-bold flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5" /> Upload Syllabus File
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setShowFileUpload(false);
                          setFileError(null);
                        }}
                        className="text-slate-400 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>

                    <label className="block w-full border-2 border-dashed border-white/20 hover:border-[#22D3EE]/60 rounded-xl p-4 text-center cursor-pointer transition-all bg-[#0A0A1A]">
                      <FileText className="w-6 h-6 text-[#22D3EE] mx-auto mb-1" />
                      <span className="text-xs text-slate-300 font-bold block">Select PDF or Image (JPG / PNG)</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">Max file size 5MB</span>
                      <input
                        type="file"
                        accept=".pdf,image/png,image/jpeg,image/webp"
                        onChange={handleFileUpload}
                        disabled={extractingFile}
                        className="hidden"
                      />
                    </label>

                    {extractingFile && (
                      <div className="flex items-center justify-center gap-2 text-xs font-mono text-[#22D3EE]">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Parsing syllabus file & extracting topics...</span>
                      </div>
                    )}

                    {fileError && (
                      <p className="text-xs text-red-400 font-bold leading-relaxed">{fileError}</p>
                    )}
                  </div>
                )}
              </div>
            </form>

            {/* 8 Curated Quick-Start Tappable Cards */}
            <div className="pt-6 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-[#94A3B8]">
                <span className="uppercase tracking-wider font-bold">Curated Quick-Start Goals (Tap to Launch):</span>
                <span className="text-[#22D3EE] font-bold">8 Popular Tracks</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {POPULAR_QUICKSTART_GOALS.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => handleSelectSuggested(card.query)}
                    className="bg-[#1B1B3A] border border-white/10 hover:border-[#7C3AED] p-3.5 rounded-2xl transition-all duration-200 hover:scale-[1.03] text-left cursor-pointer group space-y-1.5 glow-box-violet"
                  >
                    <div className="text-xl">{card.icon}</div>
                    <h4 className="text-xs font-bold text-white group-hover:text-[#22D3EE] transition-colors line-clamp-1">
                      {card.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">{card.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Syllabus Extracted Topics Confirmation Screen */}
        {extractedTopics.length > 0 && !result && !loading && (
          <div className="bg-[#1B1B3A] border border-[#22D3EE]/40 rounded-3xl p-6 sm:p-8 text-center space-y-5 max-w-xl mx-auto shadow-2xl animate-fadeIn glow-box-cyan">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#22D3EE]/20 border border-[#22D3EE]/40 text-[#22D3EE] text-xs font-mono font-bold mb-2">
                <BookOpen className="w-3.5 h-3.5 text-[#FBBF24]" />
                Syllabus Topics Extracted ({extractedTopics.length})
              </div>
              <h3 className="text-xl font-bold text-white font-heading">
                We found these topics in your syllabus — look right?
              </h3>
              <p className="text-xs text-slate-300">
                Remove any unwanted topics or add extra ones before generating your course.
              </p>
            </div>

            {/* Extracted Topic Chips */}
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {extractedTopics.map((topic, idx) => (
                <div
                  key={idx}
                  className="px-3 py-1.5 rounded-xl bg-[#0A0A1A] border border-[#22D3EE]/40 text-xs font-bold text-slate-200 flex items-center gap-2"
                >
                  <span>{topic}</span>
                  <button
                    type="button"
                    onClick={() => setExtractedTopics(extractedTopics.filter((_, i) => i !== idx))}
                    className="text-slate-400 hover:text-red-400 text-xs font-mono font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Add Custom Topic Input */}
            <div className="flex items-center gap-2 max-w-md mx-auto pt-2">
              <input
                type="text"
                value={newTopicInput}
                onChange={(e) => setNewTopicInput(e.target.value)}
                placeholder="Add another topic..."
                className="w-full bg-[#0A0A1A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#22D3EE]"
              />
              <button
                type="button"
                onClick={() => {
                  if (newTopicInput.trim()) {
                    setExtractedTopics([...extractedTopics, newTopicInput.trim()]);
                    setNewTopicInput("");
                  }
                }}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer shrink-0"
              >
                + Add
              </button>
            </div>

            <div className="pt-3 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => setExtractedTopics([])}
                className="w-full sm:w-1/3 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const combinedGoal = extractedTopics.join(", ");
                  setGoal(combinedGoal);
                  handleGenerateCourse(combinedGoal);
                }}
                disabled={extractedTopics.length === 0}
                className="w-full sm:w-2/3 py-3 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#22D3EE] hover:from-[#6D28D9] hover:to-[#06B6D4] text-white font-black font-heading text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-[#7C3AED]/30"
              >
                Generate Course from Syllabus →
              </button>
            </div>
          </div>
        )}

        {/* Loading State - Streaming Real Open Web Sources */}
        {loading && (
          <div className="bg-[#1B1B3A]/90 border border-[#7C3AED]/40 rounded-3xl p-8 text-center space-y-6 shadow-2xl glow-box-violet max-w-xl mx-auto backdrop-blur-xl animate-fadeIn">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-[#7C3AED]/20 border-t-[#22D3EE] animate-spin" />
              <Compass className="w-8 h-8 text-[#7C3AED] animate-pulse" />
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-bold text-white font-heading">
                Building Your Quest Line...
              </h2>

              <div className="bg-[#0A0A1A] border border-white/10 p-4 rounded-2xl space-y-2 text-left text-xs font-mono">
                <span className="text-[#22D3EE] font-bold block mb-1">Live Web Research Progress:</span>
                {[
                  "Reading geeksforgeeks.org...",
                  "Reading developer.mozilla.org...",
                  "Reading freecodecamp.org...",
                  "Reading docs.python.org...",
                ].map((stepLabel, idx) => {
                  const isDone = loadingStep > idx;
                  const isCurrent = loadingStep === idx;

                  return (
                    <div key={idx} className="flex items-center gap-2">
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" />
                      ) : isCurrent ? (
                        <Loader2 className="w-4 h-4 text-[#22D3EE] animate-spin shrink-0" />
                      ) : (
                        <span className="w-4 h-4 rounded-full border border-white/20 shrink-0" />
                      )}
                      <span className={isDone ? "text-slate-300 font-bold" : isCurrent ? "text-[#22D3EE] font-bold" : "text-slate-500"}>
                        {stepLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Nonsense Error Display with 4 Tappable Example Chips */}
        {nonsenseError && !loading && (
          <div className="bg-[#1B1B3A] border border-red-500/40 rounded-3xl p-6 sm:p-8 text-center space-y-5 max-w-xl mx-auto shadow-2xl animate-fadeIn glow-box-violet">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center mx-auto text-red-400 text-xl font-bold">
              ❓
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white font-heading">Goal Not Recognized</h3>
              <p className="text-xs text-slate-300">{nonsenseError.message}</p>
            </div>
            <div className="pt-2 space-y-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Try one of these real topics:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {nonsenseError.examples.map((ex, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setNonsenseError(null);
                      setGoal(ex);
                      handleGenerateCourse(ex);
                    }}
                    className="p-3 rounded-xl bg-[#0A0A1A] hover:bg-[#22D3EE]/10 border border-white/10 hover:border-[#22D3EE]/50 text-xs font-bold text-slate-200 hover:text-[#22D3EE] transition-all text-left cursor-pointer flex items-center justify-between group"
                  >
                    <span>{ex}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#22D3EE] group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Generic Error Display */}
        {error && !loading && (
          <div className="bg-red-500/10 border border-red-500/40 rounded-2xl p-6 text-center space-y-4 max-w-xl mx-auto">
            <p className="text-red-400 text-sm font-semibold">{error}</p>
            <button
              onClick={() => setError(null)}
              className="px-4 py-2 rounded-xl bg-red-500/20 text-white text-xs font-bold hover:bg-red-500/30 transition-colors cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Generated Skill Tree View */}
        {result && !loading && (
          <div className="space-y-6 animate-fadeIn">
            {/* Interpreted Topic Header Banner */}
            {result.normalizedTopic && (
              <div className="bg-[#22D3EE]/10 border border-[#22D3EE]/40 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs shadow-lg">
                <span className="text-slate-200">
                  Building your course on: <strong className="text-[#22D3EE] font-bold">"{result.normalizedTopic}"</strong>
                </span>
                <button
                  onClick={() => {
                    setResult(null);
                    setGoal(result.normalizedTopic || goal);
                    setStep("goal");
                  }}
                  className="text-[11px] font-mono text-[#22D3EE] hover:underline font-bold shrink-0 cursor-pointer bg-[#22D3EE]/20 hover:bg-[#22D3EE]/30 px-3 py-1 rounded-lg transition-colors"
                >
                  Not what you meant? Edit
                </button>
              </div>
            )}

            <div className="bg-[#1B1B3A] border border-[#7C3AED]/40 rounded-3xl p-6 sm:p-8 shadow-2xl glow-box-violet relative overflow-hidden space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold mb-2 border ${
                      result.isWebGrounded !== false
                        ? "bg-[#34D399]/20 border-[#34D399]/40 text-[#34D399]"
                        : "bg-[#FBBF24]/20 border-[#FBBF24]/40 text-[#FBBF24]"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {result.isWebGrounded !== false
                      ? "CURRICULUM GROUNDED IN LIVE WEB RESEARCH"
                      : "GENERATED FROM AI KNOWLEDGE (WITHOUT WEB SOURCES)"}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white font-heading">
                    {result.title}
                  </h2>
                  <p className="text-xs text-[#94A3B8] mt-1">
                    Target Goal: <span className="text-slate-200 font-semibold">"{goal}"</span>
                  </p>
                </div>

                <button
                  onClick={() => router.push("/home")}
                  className="bg-gradient-to-r from-[#7C3AED] to-[#22D3EE] hover:from-[#6D28D9] hover:to-[#06B6D4] text-white font-bold px-6 py-3.5 rounded-2xl transition-all shadow-lg shadow-[#7C3AED]/30 flex items-center gap-2 cursor-pointer text-sm shrink-0 glow-box-cyan"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Enter Home Arena</span>
                </button>
              </div>

              {/* Skills Tree Preview */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#94A3B8] font-mono uppercase tracking-wider block">
                  Generated Mastery Skills ({result.skills.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {result.skills.map((s, idx) => (
                    <div key={s.id || idx} className="bg-[#0A0A1A] border border-white/10 p-3 rounded-2xl flex items-center justify-between text-xs">
                      <span className="font-bold text-white truncate">{s.name}</span>
                      <span className="text-[10px] font-mono text-[#FBBF24] bg-[#FBBF24]/20 px-2 py-0.5 rounded-full border border-[#FBBF24]/40 shrink-0">
                        Lvl {s.difficulty}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grounded in these sources section */}
              {result.sources && result.sources.length > 0 && (
                <div className="bg-[#0A0A1A] border border-[#22D3EE]/30 rounded-2xl p-4 space-y-3">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-[#22D3EE] font-mono uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-[#FBBF24]" />
                      Grounded in these sources
                    </h4>
                    <p className="text-[11px] text-[#94A3B8]">
                      Your course was built from these live sources, not from a fixed template.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {result.sources.map((src, idx) => (
                      <a
                        key={idx}
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#12122C] border border-white/10 hover:border-[#22D3EE]/50 p-2.5 rounded-xl transition-all flex items-center gap-2.5 text-xs text-slate-200 hover:text-white group cursor-pointer"
                      >
                        {/* Favicon */}
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${src.domain}&sz=32`}
                          alt={src.domain}
                          className="w-5 h-5 rounded shrink-0 bg-white/10 p-0.5"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                        <div className="overflow-hidden">
                          <p className="font-bold text-white text-[11px] truncate group-hover:text-[#22D3EE] transition-colors">
                            {src.title}
                          </p>
                          <span className="text-[10px] font-mono text-slate-400 block truncate">
                            {src.domain}
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <footer className="w-full max-w-5xl mx-auto text-center text-xs text-slate-500 z-10 py-2">
        XPedition Goal Engine • Thompson Sampling Bandit & Groq AI Active
      </footer>
    </main>
  );
}
