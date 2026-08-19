"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Zap, Compass, User, Shield, BookOpen } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: "Home", href: "/home", icon: Home },
    { label: "Quests", href: "/quest", icon: Zap },
    { label: "Guild", href: "/guild", icon: Shield },
    { label: "Teach", href: "/teach", icon: BookOpen },
    { label: "Passport", href: "/passport", icon: Compass },
  ];

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-md bg-[#1B1B3A]/90 border border-white/10 backdrop-blur-xl rounded-full px-4 py-2.5 shadow-2xl glow-box-violet flex items-center justify-around">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all ${
              isActive
                ? "bg-[#7C3AED]/20 text-[#22D3EE] font-bold shadow-lg shadow-[#7C3AED]/20 scale-105"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? "text-[#22D3EE]" : ""}`} />
            <span className="text-[10px] tracking-wide font-mono">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
