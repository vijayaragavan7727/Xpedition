"use client";

import React, { useEffect, useState } from "react";
import { useQuest } from "@/lib/QuestContext";
import { WifiOff, RefreshCw, AlertTriangle } from "lucide-react";

export default function AccessibilityWrapper({ children }: { children: React.ReactNode }) {
  const { accessibilitySettings } = useQuest();
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Register Service Worker for PWA
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.warn("ServiceWorker registration notice:", err);
      });
    }

    // Monitor online/offline status
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }
    };
  }, []);

  const { focusMode, dyslexiaFriendly, reducedMotion } = accessibilitySettings;

  return (
    <div
      className={`min-h-full transition-all ${
        focusMode ? "text-lg max-w-2xl mx-auto tracking-wide border-x border-white/10 p-2" : ""
      } ${dyslexiaFriendly ? "font-dyslexic tracking-wider leading-relaxed" : ""} ${
        reducedMotion ? "no-animations" : ""
      }`}
    >
      {/* Offline Alert Banner */}
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-[#FB7185] text-black px-4 py-2.5 text-xs font-mono font-bold flex items-center justify-between shadow-xl animate-fadeIn">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>Offline Mode Active • Your progress is saved locally and will sync when reconnected.</span>
          </div>
          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                setIsOffline(!navigator.onLine);
              }
            }}
            className="bg-black/20 hover:bg-black/40 px-3 py-1 rounded-lg text-white font-mono text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Check Network</span>
          </button>
        </div>
      )}

      {children}
    </div>
  );
}
