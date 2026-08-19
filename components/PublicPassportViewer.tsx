"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, ShieldCheck, ShieldAlert, Sparkles, ExternalLink, RefreshCw, Lock } from "lucide-react";

interface SkillItem {
  name: string;
  pKnow: number;
}

interface PassportSnapshotData {
  snapshotId: string;
  shareId: string;
  userName: string;
  goalTitle: string;
  skills: SkillItem[];
  overallReadiness: number;
  issuedAt: string;
  signature: string;
}

export default function PublicPassportViewer({ snapshot }: { snapshot: PassportSnapshotData }) {
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    tested: boolean;
    valid: boolean;
    issuedAt?: string;
    message?: string;
  } | null>(null);

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const res = await fetch(`/api/verify/${snapshot.snapshotId}`);
      if (res.ok) {
        const data = await res.json();
        setVerificationResult({
          tested: true,
          valid: data.valid,
          issuedAt: data.issuedAt || snapshot.issuedAt,
          message: data.valid
            ? `Signature valid — issued by XPedition on ${new Date(data.issuedAt || snapshot.issuedAt).toLocaleDateString()}`
            : "⚠️ Invalid Credential Signature — snapshot payload has been tampered with or corrupted.",
        });
      } else {
        setVerificationResult({
          tested: true,
          valid: false,
          message: "⚠️ Verification Failed — signature mismatch or tampered data.",
        });
      }
    } catch (err: any) {
      setVerificationResult({
        tested: true,
        valid: false,
        message: `⚠️ Verification Error: ${err.message || "Network error"}`,
      });
    } finally {
      setVerifying(false);
    }
  };

  const formattedDate = new Date(snapshot.issuedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <main className="min-h-screen bg-[#0A0A1A] bg-grid-pattern text-white relative flex flex-col justify-between p-4 sm:p-8">
      {/* Background Orbs */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#7C3AED]/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-[#22D3EE]/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-xl mx-auto space-y-6 z-10 my-auto">
        {/* Top Header */}
        <header className="bg-[#1B1B3A] border border-[#34D399]/40 rounded-3xl p-6 shadow-2xl glow-box-green text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#34D399]/20 border border-[#34D399]/40 text-[#34D399] text-xs font-mono font-bold">
            <ShieldCheck className="w-4 h-4 text-[#34D399]" />
            CRYPTOGRAPHIC IMMUTABLE SNAPSHOT
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-heading">
            Verified Skill Passport
          </h1>
          <p className="text-xs text-[#94A3B8]">
            HMAC-SHA256 Signed Credential Record • Issued {formattedDate}
          </p>
        </header>

        {/* Public Credential Card */}
        <div className="bg-gradient-to-br from-[#1B1B3A] via-[#12122C] to-[#0A0A1A] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#7C3AED] via-[#22D3EE] to-[#34D399] flex items-center justify-center text-black font-black text-2xl font-heading shadow-xl ring-4 ring-[#22D3EE]/30 shrink-0">
                {snapshot.userName.charAt(0).toUpperCase()}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white font-heading">{snapshot.userName}</h2>
                  <span className="px-2 py-0.5 rounded-full bg-[#34D399]/20 text-[#34D399] border border-[#34D399]/40 text-[10px] font-mono font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified
                  </span>
                </div>
                <p className="text-xs text-[#94A3B8] mt-1 font-mono">{snapshot.goalTitle}</p>
              </div>
            </div>

            {/* Overall Score Badge */}
            <div className="bg-[#0A0A1A] border border-[#22D3EE]/40 p-3 rounded-2xl text-center shrink-0 hidden sm:block">
              <span className="text-[10px] font-mono text-slate-400 block">Snapshot Mastery</span>
              <span className="text-xl font-black text-[#22D3EE] font-mono">
                {Math.round(snapshot.overallReadiness * 100)}%
              </span>
            </div>
          </div>

          {/* Skill Progress Bars */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[#94A3B8] font-mono uppercase tracking-wider">
              BKT Verified Skill Mastery Vector (Immutable Snapshot)
            </h3>

            <div className="space-y-3">
              {snapshot.skills.map((skill, idx) => {
                const percent = Math.round(skill.pKnow * 100);
                return (
                  <div key={idx} className="space-y-1.5 bg-[#0A0A1A]/60 p-3 rounded-2xl border border-white/5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-200 font-bold">{skill.name}</span>
                      <span className="text-[#34D399] font-bold">{percent}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-[#0A0A1A] rounded-full overflow-hidden border border-white/10 p-0.5">
                      <div
                        className="h-full bg-gradient-to-r from-[#7C3AED] via-[#22D3EE] to-[#34D399] rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Verification Box & Button */}
          <div className="bg-[#0A0A1A] border border-[#22D3EE]/30 rounded-2xl p-5 space-y-3 text-center">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1 text-[#22D3EE] font-bold">
                <Lock className="w-3.5 h-3.5" />
                HMAC-SHA256 Server Signature
              </span>
              <span>Issued: {formattedDate}</span>
            </div>

            <p className="text-[11px] font-mono text-slate-400 truncate">
              Sig: <code className="text-[#22D3EE]">{snapshot.signature}</code>
            </p>

            <button
              onClick={handleVerify}
              disabled={verifying}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#22D3EE] hover:from-[#6D28D9] hover:to-[#06B6D4] text-white font-black text-xs font-heading shadow-lg shadow-[#7C3AED]/30 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {verifying ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-[#FBBF24]" />
              )}
              <span>{verifying ? "Recomputing HMAC Signature..." : "Verify Credential Signature"}</span>
            </button>

            {/* Verification Result Display */}
            {verificationResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs font-mono font-bold animate-fadeIn flex items-center gap-2 text-left ${
                  verificationResult.valid
                    ? "bg-[#34D399]/20 border-[#34D399] text-[#34D399] glow-box-green"
                    : "bg-red-500/20 border-red-500 text-red-400"
                }`}
              >
                {verificationResult.valid ? (
                  <CheckCircle2 className="w-5 h-5 text-[#34D399] shrink-0" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
                )}
                <span>{verificationResult.message}</span>
              </div>
            )}
          </div>

          {/* Honest Disclaimer Required by Spec */}
          <div className="bg-[#0A0A1A]/80 border border-white/10 rounded-2xl p-4 text-center">
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              "This credential certifies practice performance within XPedition. It is not an accredited academic qualification."
            </p>
          </div>

          {/* CTA Footer */}
          <div className="pt-2 text-center space-y-3 border-t border-white/10">
            <p className="text-xs text-slate-400">Want to build your own adaptive skill passport?</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs font-heading border border-white/10 transition-all cursor-pointer"
            >
              <span>Start Your XPedition Journey</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
