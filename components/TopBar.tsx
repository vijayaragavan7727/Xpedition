"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface TopBarProps {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
  fallbackUrl?: string;
}

export default function TopBar({
  title,
  subtitle,
  rightAction,
  fallbackUrl = "/home",
}: TopBarProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackUrl);
    }
  };

  // Android Hardware Back Button & Browser Back Button Safe Trap
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      // Ensure back navigation lands safely on previous page or home, never kicking out to /
      const path = window.location.pathname;
      if (path === "/") {
        const storedEmail = localStorage.getItem("xpedition_email");
        if (storedEmail) {
          router.push("/home");
        }
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [router]);

  return (
    <header className="w-full max-w-xl mx-auto mb-4 bg-[#1B1B3A]/95 border border-white/10 rounded-2xl p-3 shadow-md flex items-center justify-between gap-3 z-20">
      {/* Left Back Arrow Button (44x44px tap target) */}
      <button
        onClick={handleBack}
        className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-[#0A0A1A] border border-white/10 hover:border-[#22D3EE] text-slate-300 hover:text-[#22D3EE] flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95"
        aria-label="Go Back to Previous Screen"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Center Title & Subtitle */}
      <div className="text-center flex-1 truncate px-2">
        <h1 className="text-base sm:text-lg font-bold text-white font-heading truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[11px] text-[#94A3B8] font-mono truncate">{subtitle}</p>
        )}
      </div>

      {/* Right Action Placeholder (44x44px container) */}
      <div className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-end shrink-0">
        {rightAction || <div className="w-8 h-8" />}
      </div>
    </header>
  );
}
