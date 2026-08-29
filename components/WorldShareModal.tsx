'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Share2, Download, Copy, Check, Sparkles, Globe } from 'lucide-react';
import { getThemeConfig, getThemeTierInfo, WorldThemeId } from '@/lib/themes';

interface WorldShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  learnerName: string;
  goalText: string;
  masteryPercentage: number;
  passportId: string;
  buildingsCount: number;
  themeId?: string;
}

export default function WorldShareModal({
  isOpen,
  onClose,
  learnerName,
  goalText,
  masteryPercentage,
  passportId,
  buildingsCount,
  themeId = 'cosmos',
}: WorldShareModalProps) {
  const [copied, setCopied] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const tierInfo = getThemeTierInfo(themeId, masteryPercentage);
  const theme = getThemeConfig(themeId);
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/world` : `https://xpedition-new.vercel.app/world`;

  useEffect(() => {
    if (!isOpen) return;

    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw high-resolution World Share Card (800 x 500)
    const w = 800;
    const h = 500;
    canvas.width = w;
    canvas.height = h;

    // 1. Background Gradient from Theme
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, tierInfo.bgGradients[0]);
    bgGrad.addColorStop(0.5, tierInfo.bgGradients[1]);
    bgGrad.addColorStop(1, tierInfo.bgGradients[2]);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Outer Neon Frame Border
    ctx.strokeStyle = tierInfo.color;
    ctx.lineWidth = 3;
    ctx.strokeRect(16, 16, w - 32, h - 32);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.strokeRect(24, 24, w - 48, h - 48);

    // 3. Ambient Glow Halo
    ctx.save();
    const glow1 = ctx.createRadialGradient(200, 250, 10, 200, 250, 220);
    glow1.addColorStop(0, `${tierInfo.color}35`);
    glow1.addColorStop(1, 'transparent');
    ctx.fillStyle = glow1;
    ctx.beginPath();
    ctx.arc(200, 250, 220, 0, Math.PI * 2);
    ctx.fill();

    // 4. World Sphere
    ctx.beginPath();
    ctx.arc(200, 250, 95, 0, Math.PI * 2);
    const sphereGrad = ctx.createRadialGradient(170, 220, 10, 200, 250, 95);
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

    // Inner Core Pulse
    ctx.beginPath();
    ctx.arc(200, 250, 32, 0, Math.PI * 2);
    ctx.fillStyle = tierInfo.color;
    ctx.shadowBlur = 20;
    ctx.fill();
    ctx.restore();

    // 5. Header Bar
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#00F0FF';
    ctx.fillText(`XPEDITION // ${theme.name.toUpperCase()} REALM`, 340, 60);

    ctx.font = '10px monospace';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText(`PASSPORT VERIFICATION ID: ${passportId}`, 340, 80);

    // 6. Learner Name & World Title
    ctx.font = 'bold 30px sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`${learnerName}'s Skill World`, 340, 130);

    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#38BDF8';
    ctx.fillText(`Goal: ${goalText}`, 340, 155);

    // 7. World Tier & Stats Cards
    ctx.fillStyle = 'rgba(18, 14, 34, 0.85)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(340, 175, 410, 85, 12);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = tierInfo.color;
    ctx.fillText(`TIER ${tierInfo.tierNumber} // ${tierInfo.name.toUpperCase()}`, 360, 202);

    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#E2E8F0';
    ctx.fillText(tierInfo.quote, 360, 224);

    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText(tierInfo.desc, 360, 245);

    // 8. Bottom Stats Row (Mastery % & Buildings Built)
    // Card 1: Terraformed Mastery %
    ctx.fillStyle = 'rgba(18, 14, 34, 0.85)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(340, 275, 195, 80, 12);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('TERRAFORM LEVEL', 355, 298);

    ctx.font = 'bold 26px monospace';
    ctx.fillStyle = '#00FF87';
    ctx.fillText(`${masteryPercentage}%`, 355, 335);

    // Card 2: Buildings Built
    ctx.beginPath();
    ctx.roundRect(555, 275, 195, 80, 12);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('BUILDINGS CONSTRUCTED', 570, 298);

    ctx.font = 'bold 26px monospace';
    ctx.fillStyle = '#00F0FF';
    ctx.fillText(`${buildingsCount} Buildings`, 570, 335);

    // 9. Footer
    ctx.font = '10px monospace';
    ctx.fillStyle = '#64748B';
    ctx.fillText('xpedition-new.vercel.app &middot; Learning-Driven World System', 340, 450);

  }, [isOpen, learnerName, goalText, masteryPercentage, passportId, buildingsCount, themeId, tierInfo, theme]);

  const handleDownload = () => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    setDownloading(true);
    try {
      const link = document.createElement('a');
      link.download = `XPEDITION-WORLD-${learnerName.toUpperCase().replace(/\s+/g, '-')}.png`;
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
            <Globe className="w-5 h-5 text-[#00F0FF]" />
            <h2 className="font-sans font-bold text-lg text-white">
              Share Skill World
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
            <span>{downloading ? 'Exporting PNG...' : 'Download World Card'}</span>
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
