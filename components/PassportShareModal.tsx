'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Share2, Download, Copy, Check, Shield, CheckCircle2, Award } from 'lucide-react';

interface PassportShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  learnerName: string;
  goalText: string;
  assistedScore: number;
  soloScore: number;
  gapMetric: number;
  accuracyMargin: number;
  topConcepts: { name: string; masteryPercentage: number }[];
  passportId: string;
}

export default function PassportShareModal({
  isOpen,
  onClose,
  learnerName,
  goalText,
  assistedScore,
  soloScore,
  gapMetric,
  accuracyMargin,
  topConcepts,
  passportId,
}: PassportShareModalProps) {
  const [copied, setCopied] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/passport/${passportId}` : `https://xpedition-new.vercel.app/passport/${passportId}`;

  useEffect(() => {
    if (!isOpen) return;

    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw high-resolution learning credential card (800 x 500)
    const w = 800;
    const h = 500;
    canvas.width = w;
    canvas.height = h;

    // 1. Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, '#0B081E');
    bgGrad.addColorStop(0.5, '#140D2E');
    bgGrad.addColorStop(1, '#070514');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Cyan & Purple Ambient Glow
    ctx.save();
    const glow1 = ctx.createRadialGradient(150, 150, 10, 150, 150, 250);
    glow1.addColorStop(0, 'rgba(0, 240, 255, 0.15)');
    glow1.addColorStop(1, 'transparent');
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, w, h);

    const glow2 = ctx.createRadialGradient(650, 350, 10, 650, 350, 250);
    glow2.addColorStop(0, 'rgba(168, 85, 247, 0.15)');
    glow2.addColorStop(1, 'transparent');
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    // 3. Crisp Glass Border
    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 3;
    ctx.strokeRect(16, 16, w - 32, h - 32);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(24, 24, w - 48, h - 48);

    // 4. Header Bar
    ctx.font = 'bold 13px monospace';
    ctx.fillStyle = '#00F0FF';
    ctx.fillText('XPEDITION // VERIFIED SKILL PASSPORT', 50, 60);

    ctx.font = '11px monospace';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText(`CREDENTIAL ID: ${passportId}`, 50, 80);

    // Authenticated Badge Top-Right
    ctx.fillStyle = 'rgba(0, 255, 135, 0.15)';
    ctx.strokeStyle = 'rgba(0, 255, 135, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(w - 210, 45, 160, 32, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#00FF87';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('● AUTHENTICATED', w - 188, 65);

    // 5. Learner Name & Goal
    ctx.font = 'bold 32px sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(learnerName, 50, 135);

    ctx.font = '15px sans-serif';
    ctx.fillStyle = '#38BDF8';
    ctx.fillText(`Target Domain: ${goalText}`, 50, 165);

    // Divider
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, 185);
    ctx.lineTo(w - 50, 185);
    ctx.stroke();

    // 6. Three Core Learning Metrics (Assisted, Solo, GAP)
    const metrics = [
      { label: 'ASSISTED MASTERY', val: `${assistedScore}%`, color: '#00F0FF', x: 50 },
      { label: 'SOLO MASTERY', val: soloScore > 0 ? `${soloScore}%` : '—', color: '#00FF87', x: 280 },
      { label: 'ASSISTANCE GAP', val: `${gapMetric} pts`, color: '#A855F7', x: 510 },
    ];

    metrics.forEach((m) => {
      ctx.fillStyle = 'rgba(18, 14, 34, 0.8)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(m.x, 205, 200, 75, 12);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = '#94A3B8';
      ctx.fillText(m.label, m.x + 16, 228);

      ctx.font = 'bold 26px monospace';
      ctx.fillStyle = m.color;
      ctx.fillText(m.val, m.x + 16, 263);
    });

    // 7. Calibration Accuracy & Top Concepts
    ctx.fillStyle = 'rgba(18, 14, 34, 0.8)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(50, 295, w - 100, 115, 12);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#A855F7';
    ctx.fillText('METACOGNITIVE CALIBRATION VERDICT', 70, 322);

    ctx.font = '13px sans-serif';
    ctx.fillStyle = '#E2E8F0';
    ctx.fillText(`Calibration precision: ±${accuracyMargin}% accuracy margin without blind overconfidence.`, 70, 348);

    // Concept tags
    const displayConcepts = topConcepts.slice(0, 3);
    let tagX = 70;
    displayConcepts.forEach((c) => {
      const tagText = `${c.name} (${c.masteryPercentage}%)`;
      ctx.font = '11px monospace';
      const tagWidth = ctx.measureText(tagText).width + 20;

      ctx.fillStyle = 'rgba(0, 240, 255, 0.12)';
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
      ctx.beginPath();
      ctx.roundRect(tagX, 365, tagWidth, 26, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#00F0FF';
      ctx.fillText(tagText, tagX + 10, 382);
      tagX += tagWidth + 12;
    });

    // 8. Footer Link
    ctx.font = '10px monospace';
    ctx.fillStyle = '#64748B';
    ctx.fillText('xpedition-new.vercel.app &middot; Cryptographic Solo Verification System', 50, 460);

    ctx.fillStyle = '#00FF87';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('PROCTORED PROOF OF COMPETENCE', w - 270, 460);

  }, [isOpen, learnerName, goalText, assistedScore, soloScore, gapMetric, accuracyMargin, topConcepts, passportId]);

  const handleDownload = () => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    setDownloading(true);
    try {
      const link = document.createElement('a');
      link.download = `XPEDITION-PASSPORT-${learnerName.toUpperCase().replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setDownloading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none font-sans">
      <div className="bg-[#120E22] border border-[#00F0FF]/40 w-full max-w-xl rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl animate-scaleUp">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#00F0FF]" />
            <h2 className="font-sans font-bold text-lg text-white">
              Share Skill Passport
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Canvas Visual Card Preview */}
        <div className="rounded-2xl overflow-hidden border border-white/15 bg-black shadow-xl aspect-[800/500] w-full">
          <canvas ref={previewCanvasRef} className="w-full h-full block" />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 h-11 rounded-xl bg-signature-gradient text-white font-mono font-bold text-xs flex items-center justify-center gap-2 hover:brightness-110 shadow-lg transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? 'Exporting PNG...' : 'Download Passport'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="h-11 px-4 rounded-xl bg-raised border border-line text-white font-mono font-bold text-xs flex items-center gap-2 hover:border-[#00F0FF] transition-all cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-[#00FF87]" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Copy Link'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
