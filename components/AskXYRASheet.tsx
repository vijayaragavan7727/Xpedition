'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, X, Volume2, VolumeX, Bot, User, RefreshCw, AlertCircle } from 'lucide-react';

export interface ChatContext {
  scope: 'home' | 'tutor';
  concept?: string;
  chunk?: string;
  theta?: number;
  language?: string;
  name?: string;
  goal?: string;
  concepts?: any[];
  fadingConcepts?: any[];
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'xyra';
  text: string;
  timestamp: number;
}

interface AskXYRASheetProps {
  isOpen: boolean;
  onClose: () => void;
  context: ChatContext;
}

const MAX_MESSAGES_PER_SESSION = 5;

export default function AskXYRASheet({ isOpen, onClose, context }: AskXYRASheetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [robotImgPath, setRobotImgPath] = useState('/robot.png');

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const userName = context.name || 'Learner';
  const conceptName = context.concept || 'this concept';
  const goalText = context.goal || 'your goal';

  // Quick Chips based on Scope
  const quickChips =
    context.scope === 'tutor'
      ? ['Say that again', 'Give example', "I'm lost"]
      : ['What should I study today?', 'Which concept am I weakest at?', 'How is my progress?'];

  // Initialize initial welcoming message from XYRA
  useEffect(() => {
    if (!isOpen) return;

    if (messages.length === 0) {
      const welcomeText =
        context.scope === 'tutor'
          ? `Hey ${userName}! What would you like to clarify about ${conceptName}?`
          : `Hey ${userName}! I'm your learning guide for ${goalText}. Ask me anything about your progress or concepts.`;

      setMessages([
        {
          id: `msg_init_${Date.now()}`,
          sender: 'xyra',
          text: welcomeText,
          timestamp: Date.now(),
        },
      ]);
    }
  }, [isOpen, context.scope, userName, conceptName, goalText, messages.length]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeakingId(null);
  };

  const handleSpeakText = async (msgId: string, text: string) => {
    if (speakingId === msgId) {
      stopAudio();
      return;
    }

    stopAudio();
    setSpeakingId(msgId);

    // Try Sarvam TTS API Route first
    try {
      const res = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          language: context.language || 'english',
          speaker: 'ratan',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
          audioRef.current = audio;
          audio.onended = () => setSpeakingId(null);
          audio.onerror = () => {
            playBrowserFallback(text);
          };
          audio.play().catch(() => playBrowserFallback(text));
          return;
        }
      }
    } catch (e) {
      // fallback
    }

    playBrowserFallback(text);
  };

  const playBrowserFallback = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onend = () => setSpeakingId(null);
      utterance.onerror = () => setSpeakingId(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setSpeakingId(null);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputVal).trim();
    if (!query || loading) return;

    // Rate Limit Check
    const userMessageCount = messages.filter((m) => m.sender === 'user').length;
    if (userMessageCount >= MAX_MESSAGES_PER_SESSION) {
      return;
    }

    const userMsg: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          context,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const replyText = data.reply || "Let's keep learning together!";
        const xyraMsg: ChatMessage = {
          id: `msg_xyra_${Date.now()}`,
          sender: 'xyra',
          text: replyText,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, xyraMsg]);
        handleSpeakText(xyraMsg.id, replyText);
      } else {
        throw new Error('API failed');
      }
    } catch (err) {
      const fallbackReply =
        context.scope === 'tutor'
          ? `Focus on the main principle behind ${conceptName}. How would you describe it in your own words?`
          : `You are making steady progress toward ${goalText}. Ready to practice your next concept?`;

      const xyraMsg: ChatMessage = {
        id: `msg_xyra_${Date.now()}`,
        sender: 'xyra',
        text: fallbackReply,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, xyraMsg]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const userMessageCount = messages.filter((m) => m.sender === 'user').length;
  const isRateLimited = userMessageCount >= MAX_MESSAGES_PER_SESSION;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-2 sm:p-4 animate-fadeIn select-none font-sans">
      <div className="bg-[#0D0D1A] border border-[#00F0FF]/40 rounded-t-[28px] sm:rounded-[28px] w-full max-w-lg h-[82vh] sm:h-[620px] flex flex-col justify-between shadow-2xl overflow-hidden animate-slideUp">
        
        {/* 1. HEADER */}
        <header className="px-4 py-3 bg-[#120E22] border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-[#00F0FF]/15 border border-[#00F0FF] p-1 flex items-center justify-center shadow-[0_0_10px_rgba(0,240,255,0.4)]">
                <img
                  src={robotImgPath}
                  onError={() => {
                    if (robotImgPath === '/robot.png') setRobotImgPath('/images/robot.png');
                  }}
                  alt="XYRA"
                  className="w-7 h-7 object-contain"
                />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#00FF87] border-2 border-[#120E22] animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-xs font-bold text-[#00F0FF] tracking-wider">
                  Ask XYRA
                </span>
                <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-[#00F0FF]/10 text-cyan-300 font-medium">
                  AI Teacher
                </span>
              </div>
              <span className="font-sans text-[10px] text-slate-400 block truncate max-w-[220px]">
                {context.scope === 'tutor' ? `Classroom · ${conceptName}` : `Learning Guide · ${goalText}`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[10px] text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
              {userMessageCount} / {MAX_MESSAGES_PER_SESSION}
            </span>
            <button
              type="button"
              onClick={() => {
                stopAudio();
                onClose();
              }}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* 2. QUICK CHIP SUGGESTIONS AT TOP */}
        <div className="px-3.5 py-2 bg-[#090914] border-b border-white/5 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {quickChips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isRateLimited || loading}
              onClick={() => handleSendMessage(chip)}
              className="px-2.5 py-1 rounded-full bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 border border-[#00F0FF]/30 text-[#00F0FF] text-[11px] font-sans font-medium whitespace-nowrap transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              ✨ {chip}
            </button>
          ))}
        </div>

        {/* 3. MESSAGES SCROLL AREA */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const isMsgSpeaking = speakingId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-full bg-[#00F0FF]/20 border border-[#00F0FF]/50 flex items-center justify-center text-[10px] font-bold text-[#00F0FF] shrink-0 mt-1">
                    X
                  </div>
                )}

                <div
                  className={`max-w-[82%] sm:max-w-[75%] p-3 sm:p-3.5 rounded-2xl text-xs leading-relaxed transition-all ${
                    isUser
                      ? 'bg-[#00F0FF] text-black font-semibold rounded-tr-none shadow-lg'
                      : 'bg-[#151226] border border-[#00F0FF]/30 text-slate-100 rounded-tl-none shadow-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {!isUser && (
                    <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <button
                        type="button"
                        onClick={() => handleSpeakText(msg.id, msg.text)}
                        className="text-[#00F0FF] hover:underline flex items-center gap-1 cursor-pointer font-bold"
                      >
                        {isMsgSpeaking ? <VolumeX className="w-3 h-3 text-[#FF0055]" /> : <Volume2 className="w-3 h-3" />}
                        <span>{isMsgSpeaking ? 'Stop Speaking' : 'Read Aloud'}</span>
                      </button>
                      <span>XYRA</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#00F0FF]/20 border border-[#00F0FF]/50 flex items-center justify-center text-[10px] font-bold text-[#00F0FF] shrink-0 mt-1">
                X
              </div>
              <div className="p-3 rounded-2xl bg-[#151226] border border-[#00F0FF]/30 text-cyan-300 text-xs font-mono flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#00F0FF]" />
                <span>XYRA is thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 4. RATE LIMIT WARNING BANNER */}
        {isRateLimited && (
          <div className="px-4 py-2 bg-[#FF0055]/15 border-t border-[#FF0055]/40 text-[#FF7185] text-xs font-sans flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>XYRA is taking a break! Continue lesson or quest?</span>
            </div>
            <button
              type="button"
              onClick={() => {
                stopAudio();
                onClose();
              }}
              className="text-xs font-mono font-bold text-white underline cursor-pointer"
            >
              Continue &rarr;
            </button>
          </div>
        )}

        {/* 5. TEXT INPUT BAR */}
        <footer className="p-3 bg-[#120E22] border-t border-white/10 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              disabled={isRateLimited || loading}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder={
                isRateLimited
                  ? 'Message limit reached for this session.'
                  : context.scope === 'tutor'
                    ? `Ask XYRA about ${conceptName}...`
                    : `Ask about your progress, weak spots or concepts...`
              }
              className="flex-1 h-11 px-4 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00F0FF] transition-all disabled:opacity-40"
            />

            <button
              type="submit"
              disabled={!inputVal.trim() || isRateLimited || loading}
              className="h-11 px-4 rounded-xl bg-[#00F0FF] hover:bg-[#00C2FF] text-black font-mono font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </footer>

      </div>
    </div>
  );
}
