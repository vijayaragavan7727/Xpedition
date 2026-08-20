"use client";

import React from "react";
import {
  Terminal,
  Cpu,
  Target,
  Zap,
  Crown,
  Shield,
  Award,
  Sparkles,
  Lock,
  Code,
  Flame,
  CheckCircle2,
  BookOpen,
} from "lucide-react";

export type XpAssetName =
  | "terminal"
  | "cpu"
  | "target"
  | "zap"
  | "crown"
  | "shield"
  | "award"
  | "sparkles"
  | "lock"
  | "code"
  | "flame"
  | "check"
  | "book"
  // Legacy alias compatibility mapping
  | "piggybank"
  | "younghee"
  | "guard_circle"
  | "guard_triangle"
  | "guard_square"
  | "glass_bridge"
  | "dalgona"
  | "invitation"
  | "frontman"
  | "tug_of_war"
  | "vip_mask"
  | "player_avatar";

interface XpAssetProps {
  name: XpAssetName | string;
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

export default function XpAsset({
  name,
  alt = "RPG Icon",
  className = "",
  width = 24,
  height = 24,
}: XpAssetProps) {
  // Alias mapping to clean technical RPG icons
  const iconMap: Record<string, any> = {
    terminal: Terminal,
    cpu: Cpu,
    target: Target,
    zap: Zap,
    crown: Crown,
    shield: Shield,
    award: Award,
    sparkles: Sparkles,
    lock: Lock,
    code: Code,
    flame: Flame,
    check: CheckCircle2,
    book: BookOpen,

    // Purged legacy Squid Game visual aliases
    piggybank: Award,
    younghee: Terminal,
    guard_circle: Shield,
    guard_triangle: Cpu,
    guard_square: Target,
    glass_bridge: Zap,
    dalgona: Code,
    invitation: Sparkles,
    frontman: Crown,
    tug_of_war: Shield,
    vip_mask: Crown,
    player_avatar: Award,
  };

  const IconComponent = iconMap[name] || Terminal;

  return (
    <div className={`inline-flex items-center justify-center shrink-0 max-w-full ${className}`}>
      <IconComponent style={{ width: `${width}px`, height: `${height}px` }} className="w-full h-full" />
    </div>
  );
}
