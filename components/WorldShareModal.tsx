'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Share2, Download, Copy, Check, Sparkles, Shield, CheckCircle2 } from 'lucide-react';
import { getThemeConfig, getThemeTierInfo, WorldThemeId } from '@/lib/themes';

interface WorldShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  learnerName: string;
  goalText: string;
  masteryPercentage: number;
  passportId: string;
  conceptsCount: number;
  soloVerifiedCount: number;
  accuracyMargin: number;
  themeId?: string;
}

export default function WorldShareModal({
  isOpen,
  onClose,
  learnerName,
  goalText,
  masteryPercentage,
  passportId,
  conceptsCount,
  soloVerifiedCount,
  accuracyMargin,
  themeId = 'cosmos',
}: WorldShareModalProps) {
  const [copied, setCopied] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const tierInfo = getThemeTierInfo(themeId, masteryPercentage);
  const theme = getThemeConfig(themeId);
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/passport/${passportId}` : `https://xpedition-new.vercel.app/passport/${passportId}`;

  useEffect(() => {
    if (!isOpen) return;

    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw high-resolution share card (800 x 500)
    const w = 800;
    const h = 500;
    canvas.width = w;
    canvas.height = h;

    // 1. Background
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, tierInfo.bgGradients[0]);
    bgGrad.addColorStop(0.5, tierInfo.bgGradients[1]);
    bgGrad.addColorStop(1, tierInfo.bgGradients[2]);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Outer Neon Glass Border
    ctx.strokeStyle = tierInfo.color;
    ctx.lineWidth = 4;
    ctx.strokeRect(16, 16, w - 32, h - 32);

    // 3. Ambient Glow Circles
    const glow1 = ctx.createRadialGradient(200, 250, 20, 200, 250, 180);
    glow1.addColorStop(0, `${tierInfo.color}40`);
    glow1.addColorStop(1, 'transparent');
    ctx.fillStyle = glow1;
    ctx.beginPath();
    ctx.arc(200, 250, 180, 0, Math.PI * 2);
    ctx.fill();

    // 4. World Sphere
    ctx.save();
    ctx.beginPath();
    ctx.arc(200, 250, 100, 0, Math.PI * 2);
    const sphereGrad = ctx.createRadialGradient(170, 220, 10, 200, 250, 100);
    sphereGrad.addColorStop(0, tierInfo.sphereColors[0]);
    sphereGrad.addColorStop(0.5, tierInfo.sphereColors[1]);
    sphereGrad.addColorStop(1, tierInfo.sphereColors[3]);
    ctx.fillStyle = sphereGrad;
    ctx.shadowColor = tierInfo.color;
    ctx.shadowBlur = 30;
    ctx.fill();
    ctx.strokeStyle = `${tierInfo.color}90`;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Core Pulse
    ctx.beginPath();
    ctx.arc(200, 250, 35, 0, Math.PI * 2);
    ctx.fillStyle = tierInfo.color;
    ctx.shadowBlur = 20;
    ctx.fill();
    ctx.restore();

    // Planetary Rings if Tier >= 3
    if (tierInfo.tierNumber >= 3) {
      ctx.save();
      ctx.translate(200, 250);
      ctx.rotate(-Math.PI / 8);
      ctx.beginPath();
      ctx.ellipse(0, 0, 150, 35, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `${tierInfo.accentColor}70`;
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();
    }

    // 5. Header Branding
    ctx.fillStyle = tierInfo.color;
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`XPEDITION SKILL PASSPORT · ${theme.name.toUpperCase()} DOMAIN`, 350, 65);

    // 6. Learner Name & Goal
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(`${learnerName}'s World`, 350, 110);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '15px sans-serif';
    ctx.fillText(`Goal: ${goalText}`, 350, 140);

    // 7. World Tier Badge
    ctx.fillStyle = tierInfo.color;
    ctx.font = 'bold 18px monospace';
    ctx.fillText(`TIER ${tierInfo.tierNumber}: ${tierInfo.name.toUpperCase()}`, 350, 185);

    // 8. Mastery & Metacognitive Stats Bar
    ctx.fillStyle = '#1E163B';
    ctx.fillRect(350, 205, 400, 110);
    ctx.strokeStyle = '#FFFFFF15';
    ctx.strokeRect(350, 205, 400, 110);

    // Stat 1: Mastery %
    ctx.fillStyle = '#00FF87';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(`${masteryPercentage}%`, 370, 245);
    ctx.fillStyle = '#94A3B8';
    ctx.font = '11px monospace';
    ctx.fillText('TOTAL MASTERY', 370, 265);

    // Stat 2: Metacognitive Margin
    ctx.fillStyle = '#00F0FF';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(`±${accuracyMargin}%`, 510, 245);
    ctx.fillStyle = '#94A3B8';
    ctx.font = '11px monospace';
    ctx.fillText('CALIBRATION ACCURACY', 510, 265);

    // Stat 3: Solo Backing
    ctx.fillStyle = '#A855F7';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(`${soloVerifiedCount}`, 660, 245);
    ctx.fillStyle = '#94A3B8';
    ctx.font = '11px monospace';
    ctx.fillText('SOLO SESSIONS', 660, 265);

    // 9. Emotional Quote
    ctx.fillStyle = '#E2E8F0';
    ctx.font = 'italic 13px sans-serif';
    ctx.fillText(`"${tierInfo.quote}"`, 350, 350);

    // 10. Verification Footer
    ctx.fillStyle = '#64748B';
    ctx.font = '11px monospace';
    ctx.fillText(`Passport ID: ${passportId}  |  xpedition-new.vercel.app`, 350, 440);

    ctx.fillStyle = '#00FF87';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('🛡️ VERIFIED CRYPTOGRAPHIC RECORD', 350, 462);
  }, [isOpen, learnerName, goalText, masteryPercentage, passportId, tierInfo, theme, accuracyMargin, soloVerifiedCount]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    setDownloading(true);
    const link = document.createElement('a');
    link.download = `${learnerName.toLowerCase().replace(/\s+/g, '-')}-${theme.id}-world.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    setDownloading(false);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${learnerName}'s Verified ${theme.name} World - ${goalText}`,
          text: `Explore my personal living knowledge world on XPedition! Mastery: ${masteryPercentage}%, ${theme.name}: ${tierInfo.name}.`,
          url: shareUrl,
        });
      } catch (e) {}
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none font-sans animate-fadeIn">
      <div className="bg-[#0E0A1E] border border-[#00F0FF]/40 rounded-[28px] max-w-2xl w-full p-5 sm:p-7 space-y-5 shadow-2xl relative overflow-hidden animate-scaleUp">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
          <div className="flex items-center gap-2 font-mono text-sm font-bold text-[#00F0FF]">
            <Share2 className="w-4 h-4" />
            <span>Share Your {theme.name} World</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Canvas Preview Card */}
        <div className="rounded-2xl overflow-hidden border border-white/15 shadow-xl bg-black">
          <canvas ref={previewCanvasRef} className="w-full h-auto block" />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleCopyLink}
            className="h-11 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-white/15"
          >
            {copied ? <Check className="w-4 h-4 text-[#00FF87]" /> : <Copy className="w-4 h-4 text-[#00F0FF]" />}
            <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="h-11 rounded-xl bg-[#A855F7]/20 hover:bg-[#A855F7]/35 border border-[#A855F7]/40 text-[#A855F7] font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download PNG</span>
          </button>

          <button
            type="button"
            onClick={handleNativeShare}
            className="h-11 rounded-xl bg-signature-gradient text-white font-mono font-bold text-xs flex items-center justify-center gap-2 hover:brightness-110 transition-all cursor-pointer shadow-lg"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Share World</span>
          </button>
        </div>
      </div>
    </div>
  );
}
