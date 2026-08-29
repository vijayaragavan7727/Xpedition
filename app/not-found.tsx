import Link from "next/link";
import { Compass, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#0A0A1A] bg-grid-pattern text-white flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-x-hidden font-sans">
      {/* Ambient Orbs */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-[#7C3AED]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#00F0FF]/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-lg mx-auto bg-[#0D0D1A] border border-[#00F0FF]/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 glow-cyan text-center z-10">
        {/* Big 404 Visual Icon */}
        <div className="w-20 h-20 rounded-full bg-[#00F0FF]/20 border border-[#00F0FF]/40 flex items-center justify-center text-[#00F0FF] mx-auto animate-bounce shadow-xl">
          <Compass className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00F0FF]/20 border border-[#00F0FF]/40 text-[#00F0FF] text-xs font-mono font-bold">
            UNMAPPED SECTOR (404)
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white font-heading tracking-tight">
            Sector Not Found
          </h1>
          <p className="text-xs text-slate-300 font-sans leading-relaxed max-w-sm mx-auto">
            The skill realm or coordinate you requested does not exist in the XPedition universe.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/home"
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#00F0FF] via-[#7C3AED] to-[#00FF87] hover:opacity-95 text-black font-black text-xs uppercase tracking-wider font-heading transition-all shadow-xl shadow-[#00F0FF]/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4 text-black fill-current" />
            <span>Return to Home Base</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
