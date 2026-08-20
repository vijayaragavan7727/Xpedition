"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, Sparkles, X, Loader2, Send, Play, RefreshCw, AlertCircle } from "lucide-react";

interface TutorOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  questionPrompt: string;
  skillName: string;
  options?: string[];
  masteryLevel?: number;
  onHintRequested?: () => void;
}

export default function TutorOverlay({
  isOpen,
  onClose,
  questionPrompt,
  skillName,
  options,
  masteryLevel,
  onHintRequested,
}: TutorOverlayProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [userTranscript, setUserTranscript] = useState("");
  const [fallbackText, setFallbackText] = useState("");
  const [aiHint, setAiHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  // Cleanup speech synthesis on unmount / close
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!isOpen) return null;

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

  const fetchTutorHint = async (transcript: string) => {
    if (!transcript.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    setAiHint(null);
    if (onHintRequested) onHintRequested();

    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: { prompt: questionPrompt, options },
          userTranscript: transcript,
          skillName,
          masteryLevel,
        }),
      });

      const data = await res.json();

      if (res.ok && data.hint) {
        setAiHint(data.hint);
        speakText(data.hint);
      } else {
        throw new Error(data.error || "Couldn't reach the tutor, try again");
      }
    } catch (err: any) {
      console.warn("Tutor API error:", err);
      setErrorMsg(err.message || "Couldn't reach the tutor, try again");
      setAiHint(null);
    } finally {
      setLoading(false);
    }
  };

  const startListening = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMsg(null);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setUserTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error !== "no-speech") {
          setErrorMsg(`Voice input note: ${event.error}. You can also type below.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.warn("Error starting speech recognition:", e);
      setIsSupported(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      if (userTranscript) {
        fetchTutorHint(userTranscript);
      }
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleFallbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fallbackText.trim()) {
      setUserTranscript(fallbackText.trim());
      fetchTutorHint(fallbackText.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#1B1B3A] border border-[#22D3EE]/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl glow-box-cyan relative space-y-5 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={() => {
            if (typeof window !== "undefined" && window.speechSynthesis) {
              window.speechSynthesis.cancel();
            }
            onClose();
          }}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#22D3EE]/20 border border-[#22D3EE]/40 text-[#22D3EE] text-xs font-mono font-bold">
            <Sparkles className="w-3.5 h-3.5 text-[#FBBF24]" />
            VOICE AI TUTOR
          </div>
          <span className="text-xs font-mono text-slate-400 truncate max-w-[180px]">
            {skillName}
          </span>
        </div>

        {/* Question Context Preview */}
        <div className="bg-[#0A0A1A]/80 border border-white/10 rounded-2xl p-4 text-xs space-y-1">
          <span className="text-[10px] font-mono text-[#22D3EE] uppercase tracking-wider font-bold">
            Question Context
          </span>
          <p className="text-white font-medium line-clamp-2">{questionPrompt}</p>
        </div>

        {/* Voice Mic Section */}
        <div className="flex flex-col items-center justify-center py-2 space-y-3">
          {isSupported ? (
            <button
              onClick={toggleListening}
              className={`relative w-24 h-24 rounded-full border-2 flex items-center justify-center transition-all duration-300 shadow-2xl cursor-pointer ${
                isListening
                  ? "bg-[#22D3EE]/30 border-[#22D3EE] glow-box-cyan scale-110 ring-8 ring-[#22D3EE]/20"
                  : "bg-[#7C3AED]/20 border-[#7C3AED] hover:border-[#22D3EE] glow-box-violet"
              }`}
            >
              <Mic
                className={`w-10 h-10 transition-transform ${
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
              <span>Voice recognition not supported in this browser. Use text input below!</span>
            </div>
          )}

          {isSupported && (
            <div className="text-center space-y-1">
              <p
                className={`text-xs font-mono font-bold ${
                  isListening ? "text-[#22D3EE] animate-pulse" : "text-slate-400"
                }`}
              >
                {isListening ? "● LISTENING... SPEAK NOW" : "TAP MIC TO ASK FOR HINT"}
              </p>
              {userTranscript && isListening && (
                <p className="text-xs text-slate-300 italic max-w-xs truncate">
                  "{userTranscript}"
                </p>
              )}
            </div>
          )}
        </div>

        {/* Waveform Graphic when Listening */}
        {isListening && (
          <div className="flex items-center justify-center gap-1.5 h-10 bg-[#0A0A1A]/60 border border-[#22D3EE]/30 rounded-xl p-2 animate-fadeIn">
            {[14, 28, 38, 20, 44, 28, 36, 18, 30, 22, 40, 26].map((h, i) => (
              <div
                key={i}
                className="w-1 bg-[#22D3EE] rounded-full animate-pulse"
                style={{ height: `${h}px`, animationDelay: `${i * 0.08}s` }}
              />
            ))}
          </div>
        )}

        {/* Text Fallback Input / Direct Question Submit */}
        {(!isSupported || !isListening) && (
          <form onSubmit={handleFallbackSubmit} className="flex gap-2">
            <input
              type="text"
              value={fallbackText}
              onChange={(e) => setFallbackText(e.target.value)}
              placeholder='e.g., "I don&#39;t understand the base case"'
              className="flex-1 bg-[#0A0A1A] border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#22D3EE]"
            />
            <button
              type="submit"
              disabled={loading || !fallbackText.trim()}
              className="bg-[#22D3EE] hover:bg-[#06B6D4] disabled:opacity-50 text-[#0A0A1A] px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ask</span>
            </button>
          </form>
        )}

        {/* Error / Notice Display */}
        {errorMsg && (
          <p className="text-[11px] text-amber-400 bg-amber-400/10 p-2 rounded-lg text-center">
            {errorMsg}
          </p>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="flex items-center justify-center gap-2 py-4 text-xs font-mono text-[#22D3EE]">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Consulting Groq AI Tutor...</span>
          </div>
        )}

        {/* AI Hint Output Display */}
        {aiHint && !loading && (
          <div className="bg-[#0A0A1A] border border-[#34D399]/40 rounded-2xl p-4 text-xs sm:text-sm text-slate-200 space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#34D399] flex items-center gap-1.5 font-bold">
                <Volume2 className="w-3.5 h-3.5 animate-pulse text-[#34D399]" />
                AI TUTOR GUIDED HINT
              </span>
              <button
                onClick={() => speakText(aiHint)}
                className="text-[11px] font-mono text-[#22D3EE] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Play className="w-3 h-3" />
                <span>{isSpeaking ? "Speaking..." : "Read Aloud"}</span>
              </button>
            </div>

            <p className="text-white leading-relaxed font-medium">{aiHint}</p>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={() => {
              if (typeof window !== "undefined" && window.speechSynthesis) {
                window.speechSynthesis.cancel();
              }
              onClose();
            }}
            className="px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Got it, back to Quest
          </button>
        </div>
      </div>
    </div>
  );
}
