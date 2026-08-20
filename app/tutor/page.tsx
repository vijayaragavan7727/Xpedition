"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import { useQuest } from "@/lib/QuestContext";
import {
  Mic,
  Volume2,
  ArrowLeft,
  Sparkles,
  Loader2,
  Send,
  Play,
  AlertCircle,
} from "lucide-react";

export default function TutorPage() {
  const { currentQuestion, course, activeSkillIndex, pKnow } = useQuest();

  const currentSkillName =
    course?.skills[activeSkillIndex]?.name || "Python Core Syntax & Data Structures";
  const questionPrompt =
    currentQuestion?.prompt ||
    "In Python, which data structure is defined using parentheses and is immutable?";

  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [activeSpeechText, setActiveSpeechText] = useState("I don't understand the base case");
  const [fallbackInput, setFallbackInput] = useState("");
  const [tutorHint, setTutorHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setIsSupported(false);
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakText = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const askTutor = async (transcript: string) => {
    if (!transcript.trim()) return;
    setLoading(true);
    setActiveSpeechText(transcript);
    setTutorHint(null);

    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: { prompt: questionPrompt, options: currentQuestion?.options },
          userTranscript: transcript,
          skillName: currentSkillName,
          masteryLevel: pKnow,
        }),
      });

      const data = await res.json();

      if (res.ok && data.hint) {
        setTutorHint(data.hint);
        speakText(data.hint);
      } else {
        throw new Error(data.error || "Couldn't reach the tutor, try again");
      }
    } catch (err: any) {
      console.warn("Tutor page API error:", err);
      const errMsg = err.message || "Couldn't reach the tutor, try again";
      setTutorHint(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const toggleMic = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (currentTranscript.trim()) {
            setActiveSpeechText(currentTranscript);
          }
        };

        recognition.onend = () => {
          setIsListening(false);
          if (activeSpeechText.trim()) {
            askTutor(activeSpeechText);
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.warn("Speech recognition error:", err);
        setIsSupported(false);
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fallbackInput.trim()) {
      askTutor(fallbackInput.trim());
      setFallbackInput("");
    }
  };

  return (
    <main className="min-h-screen bg-[#0A0A1A] bg-grid-pattern relative flex flex-col justify-between pb-24 p-4 sm:p-6">
      {/* Background Orbs */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#22D3EE]/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-xl mx-auto space-y-6 z-10 my-auto">
        {/* Top Header */}
        <header className="bg-[#1B1B3A] border border-[#22D3EE]/40 rounded-3xl p-6 shadow-xl text-center space-y-2 glow-box-cyan">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#22D3EE]/20 border border-[#22D3EE]/40 text-[#22D3EE] text-xs font-mono font-bold">
            <Sparkles className="w-3.5 h-3.5 text-[#FBBF24]" />
            VOICE AI TUTOR ACTIVE
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-heading">
            {isListening ? "Listening to your voice..." : "Ask me anything"}
          </h1>
          <p className="text-xs text-[#94A3B8]">
            Tap the mic button and speak out loud — your AI tutor answers in real time
          </p>
        </header>

        {/* Question Context Banner */}
        <div className="bg-[#1B1B3A]/80 border border-white/10 rounded-2xl p-4 text-xs space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-[#22D3EE]">
            <span className="font-bold">ACTIVE SKILL: {currentSkillName}</span>
          </div>
          <p className="text-slate-200 font-medium italic">"{questionPrompt}"</p>
        </div>

        {/* Big Mic Circle Button */}
        <div className="flex flex-col items-center justify-center my-4 space-y-3">
          {isSupported ? (
            <button
              onClick={toggleMic}
              className={`relative w-28 h-28 rounded-full border-2 flex items-center justify-center transition-all duration-300 shadow-2xl cursor-pointer ${
                isListening
                  ? "bg-[#22D3EE]/30 border-[#22D3EE] glow-box-cyan scale-110 ring-8 ring-[#22D3EE]/20"
                  : "bg-[#7C3AED]/20 border-[#7C3AED] hover:border-[#22D3EE] glow-box-violet"
              }`}
            >
              <Mic
                className={`w-12 h-12 transition-transform ${
                  isListening ? "text-[#22D3EE] animate-pulse scale-115" : "text-[#7C3AED]"
                }`}
              />
              {isListening && (
                <span className="absolute inset-0 rounded-full border-2 border-[#22D3EE] animate-ping pointer-events-none" />
              )}
            </button>
          ) : (
            <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-400/10 border border-amber-400/30 px-3 py-2 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>SpeechRecognition not supported in browser. Use text input below!</span>
            </div>
          )}

          <span
            className={`text-xs font-mono font-bold ${
              isListening ? "text-[#22D3EE] animate-pulse" : "text-slate-400"
            }`}
          >
            {isListening ? "● LISTENING LIVE... SPEAK NOW" : "TAP MIC TO TALK"}
          </span>
        </div>

        {/* Waveform Bar Graphic */}
        <div className="flex items-center justify-center gap-1.5 h-12 bg-[#1B1B3A]/60 border border-white/5 rounded-2xl p-4">
          {[16, 24, 38, 20, 44, 28, 36, 18, 30, 22, 40, 26].map((h, i) => (
            <div
              key={i}
              className={`w-1 bg-[#22D3EE] rounded-full transition-all duration-300 ${
                isListening ? "animate-pulse" : "opacity-40"
              }`}
              style={{ height: isListening ? `${Math.min(44, h * 1.2)}px` : `${h}px` }}
            />
          ))}
        </div>

        {/* Text Input Fallback */}
        <form onSubmit={handleFormSubmit} className="flex gap-2">
          <input
            type="text"
            value={fallbackInput}
            onChange={(e) => setFallbackInput(e.target.value)}
            placeholder="Type your question if you prefer text..."
            className="flex-1 bg-[#1B1B3A] border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#22D3EE]"
          />
          <button
            type="submit"
            disabled={loading || !fallbackInput.trim()}
            className="bg-[#22D3EE] hover:bg-[#06B6D4] disabled:opacity-50 text-[#0A0A1A] px-5 py-3 rounded-2xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shrink-0 font-heading"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-center justify-center gap-2 py-2 text-xs font-mono text-[#22D3EE]">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Groq AI Tutor is analyzing...</span>
          </div>
        )}

        {/* Chat Bubbles */}
        <div className="space-y-3 bg-[#1B1B3A]/90 border border-white/10 rounded-3xl p-5 shadow-xl">
          {/* User Bubble */}
          <div className="bg-[#7C3AED]/20 border border-[#7C3AED]/40 rounded-2xl p-4 text-xs sm:text-sm text-white space-y-1">
            <span className="text-[10px] font-mono text-[#22D3EE] block font-bold">
              YOU (PROMPT)
            </span>
            <p>"{activeSpeechText}"</p>
          </div>

          {/* AI Tutor Bubble */}
          {tutorHint && (
            <div className="bg-[#0A0A1A] border border-[#34D399]/40 rounded-2xl p-4 text-xs sm:text-sm text-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#34D399] flex items-center gap-1.5 font-bold">
                  <Volume2 className="w-3.5 h-3.5 text-[#34D399]" />
                  XPEDITION TUTOR RESPONSE
                </span>
                <button
                  onClick={() => speakText(tutorHint)}
                  className="text-[11px] font-mono text-[#22D3EE] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Play className="w-3 h-3" />
                  <span>{isSpeaking ? "Speaking..." : "Read Aloud"}</span>
                </button>
              </div>
              <p className="leading-relaxed font-medium text-white">{tutorHint}</p>
            </div>
          )}
        </div>

        {/* Back to Quest CTA */}
        <div className="text-center pt-2">
          <Link
            href="/quest"
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#22D3EE] hover:from-[#6D28D9] hover:to-[#06B6D4] text-white font-bold text-sm transition-all shadow-lg shadow-[#7C3AED]/30 flex items-center justify-center gap-2 cursor-pointer font-heading"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Quest</span>
          </Link>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
