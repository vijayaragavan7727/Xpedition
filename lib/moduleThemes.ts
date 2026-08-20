import { SquidAssetName } from "@/components/SquidAsset";

export interface ModuleVisualTheme {
  moduleIndex: number;
  themeName: string;
  subtitle: string;
  assetName: SquidAssetName;
  badgeStyle: string;
  borderColor: string;
  glowClass: string;
  intensityLabel: string;
}

export const MODULE_THEMES: Record<number, ModuleVisualTheme> = {
  0: {
    moduleIndex: 0,
    themeName: "Red Light, Green Light",
    subtitle: "Core Syntax & Observation",
    assetName: "younghee",
    badgeStyle: "bg-[#FB7185]/20 text-[#FB7185] border-[#FB7185]/40",
    borderColor: "border-[#FB7185]/50",
    glowClass: "glow-box-red",
    intensityLabel: "STAGE 1 • OBSERVATION",
  },
  1: {
    moduleIndex: 1,
    themeName: "Guard Hierarchy & Structure",
    subtitle: "OOP & System Architecture",
    assetName: "guard_square",
    badgeStyle: "bg-rose-500/20 text-rose-400 border-rose-500/40",
    borderColor: "border-rose-500/50",
    glowClass: "glow-box-red",
    intensityLabel: "STAGE 2 • ORGANIZATION",
  },
  2: {
    moduleIndex: 2,
    themeName: "Dalgona Precision Challenge",
    subtitle: "Zoho Precision Problem Solving",
    assetName: "dalgona",
    badgeStyle: "bg-[#FBBF24]/20 text-[#FBBF24] border-[#FBBF24]/40",
    borderColor: "border-[#FBBF24]/50",
    glowClass: "glow-box-violet",
    intensityLabel: "STAGE 3 • PRECISION",
  },
  3: {
    moduleIndex: 3,
    themeName: "Glass Bridge Decision Challenge",
    subtitle: "Algorithms & Time Complexity",
    assetName: "glass_bridge",
    badgeStyle: "bg-[#22D3EE]/20 text-[#22D3EE] border-[#22D3EE]/40",
    borderColor: "border-[#22D3EE]/50",
    glowClass: "glow-box-cyan",
    intensityLabel: "STAGE 4 • HIGH STAKES",
  },
  4: {
    moduleIndex: 4,
    themeName: "Front Man Final Control Room",
    subtitle: "System Design & Live Practice",
    assetName: "frontman",
    badgeStyle: "bg-[#7C3AED]/20 text-[#7C3AED] border-[#7C3AED]/40",
    borderColor: "border-[#7C3AED]/60",
    glowClass: "glow-box-violet",
    intensityLabel: "STAGE 5 • FINAL BOSS",
  },
};

export function getModuleTheme(index: number): ModuleVisualTheme {
  const normalizedIndex = index % 5;
  return MODULE_THEMES[normalizedIndex] || MODULE_THEMES[0];
}
