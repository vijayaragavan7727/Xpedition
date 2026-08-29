'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Lock, CheckCircle2, XCircle, Trash2, Mail, ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-[100dvh] w-full bg-[#0A0A1A] text-slate-100 p-4 sm:p-8 font-sans select-none flex flex-col justify-between">
      <div className="max-w-2xl w-full mx-auto space-y-6">
        
        {/* Header / Back Link */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#00F0FF]" />
            <span>Back to Login</span>
          </Link>
          <span className="font-mono text-[10px] uppercase text-[#00F0FF] font-bold tracking-widest">
            XPEDITION LEGAL & PRIVACY
          </span>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <h1 className="font-sans font-bold text-2xl sm:text-3xl text-white">
            Terms & Conditions
          </h1>
          <p className="font-sans text-xs text-slate-400">
            Last updated: August 2026 &middot; Transparent, learner-first privacy policy.
          </p>
        </div>

        {/* Content Cards */}
        <div className="space-y-4">
          
          {/* 1. WHAT WE COLLECT */}
          <div className="p-5 rounded-2xl bg-[#120E24] border border-[#00FF87]/30 space-y-2.5 shadow-lg">
            <div className="flex items-center gap-2 text-[#00FF87]">
              <CheckCircle2 className="w-5 h-5" />
              <h2 className="font-sans font-bold text-sm text-white">What We Collect</h2>
            </div>
            <p className="font-sans text-xs text-slate-300 leading-relaxed">
              We collect minimal learning telemetry essential for adaptive teaching:
            </p>
            <ul className="list-disc list-inside font-sans text-xs text-slate-300 space-y-1 pl-1">
              <li><strong>Learning behaviour & response latency</strong>: time taken to answer items.</li>
              <li><strong>Question attempts & confidence ratings</strong>: known vs unsure choices.</li>
              <li><strong>Mastery scores & progression</strong>: calibrated theta and concept retention risk.</li>
            </ul>
          </div>

          {/* 2. WHAT WE DO NOT COLLECT */}
          <div className="p-5 rounded-2xl bg-[#120E24] border border-[#FF0055]/30 space-y-2.5 shadow-lg">
            <div className="flex items-center gap-2 text-[#FF7185]">
              <XCircle className="w-5 h-5" />
              <h2 className="font-sans font-bold text-sm text-white">What We Do NOT Collect</h2>
            </div>
            <p className="font-sans text-xs text-slate-300 leading-relaxed">
              We do not store or process sensitive private information:
            </p>
            <ul className="list-disc list-inside font-sans text-xs text-slate-300 space-y-1 pl-1">
              <li>No raw passwords (all passwords managed via secure encrypted auth).</li>
              <li>No credit card or payment information.</li>
              <li>No biometric data or device tracking fingerprinting.</li>
            </ul>
          </div>

          {/* 3. HOW DATA IS USED */}
          <div className="p-5 rounded-2xl bg-[#120E24] border border-[#00F0FF]/30 space-y-2.5 shadow-lg">
            <div className="flex items-center gap-2 text-[#00F0FF]">
              <Shield className="w-5 h-5" />
              <h2 className="font-sans font-bold text-sm text-white">How Data is Used</h2>
            </div>
            <p className="font-sans text-xs text-slate-300 leading-relaxed">
              Your data is used strictly for personalizing your learning experience:
            </p>
            <ul className="list-disc list-inside font-sans text-xs text-slate-300 space-y-1 pl-1">
              <li>Selecting optimal difficulty questions matching your current flow state.</li>
              <li>Detecting blind spots and scheduling decay reminders before concepts fade.</li>
              <li>Powering XYRA&apos;s contextual explanations and recommendations.</li>
            </ul>
          </div>

          {/* 4. DATA DELETION & EXPORT */}
          <div className="p-5 rounded-2xl bg-[#120E24] border border-white/10 space-y-2 shadow-lg">
            <div className="flex items-center gap-2 text-amber-400">
              <Trash2 className="w-5 h-5" />
              <h2 className="font-sans font-bold text-sm text-white">Data Deletion & Control</h2>
            </div>
            <p className="font-sans text-xs text-slate-300 leading-relaxed">
              You own your data. You can reset your local store data anytime or request full account deletion directly from your <Link href="/profile" className="text-[#00F0FF] underline">Profile page</Link>.
            </p>
          </div>

          {/* 5. CONTACT */}
          <div className="p-5 rounded-2xl bg-[#120E24] border border-white/10 space-y-2 shadow-lg">
            <div className="flex items-center gap-2 text-cyan-400">
              <Mail className="w-5 h-5" />
              <h2 className="font-sans font-bold text-sm text-white">Contact Us</h2>
            </div>
            <p className="font-sans text-xs text-slate-300 leading-relaxed">
              Have questions about your privacy or terms? Reach out directly at{' '}
              <a href="mailto:vijayaragavan7727@gmail.com" className="text-[#00F0FF] underline font-mono">
                vijayaragavan7727@gmail.com
              </a>.
            </p>
          </div>

        </div>

      </div>

      {/* Footer */}
      <div className="text-center pt-8 font-mono text-[11px] text-slate-500">
        &copy; {new Date().getFullYear()} XPedition. All rights reserved.
      </div>
    </div>
  );
}
