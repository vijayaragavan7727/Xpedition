export interface ModuleVisualTheme {
  moduleIndex: number;
  themeName: string;
  subtitle: string;
  iconName: string;
  badgeStyle: string;
  borderColor: string;
  glowClass: string;
  intensityLabel: string;
}

export const MODULE_THEMES: Record<number, ModuleVisualTheme> = {
  0: {
    moduleIndex: 0,
    themeName: "Core Syntax & Data Structures",
    subtitle: "Fundamentals & Memory Layout",
    iconName: "terminal",
    badgeStyle: "bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/40",
    borderColor: "border-[#00F0FF]/50",
    glowClass: "glow-cyan",
    intensityLabel: "STAGE 1 • CORE SYNTAX",
  },
  1: {
    moduleIndex: 1,
    themeName: "OOP & System Architecture",
    subtitle: "Encapsulation & Design Patterns",
    iconName: "cpu",
    badgeStyle: "bg-[#A855F7]/20 text-[#A855F7] border-[#A855F7]/40",
    borderColor: "border-[#A855F7]/50",
    glowClass: "glow-purple",
    intensityLabel: "STAGE 2 • ARCHITECTURE",
  },
  2: {
    moduleIndex: 2,
    themeName: "Algorithmic Problem Solving",
    subtitle: "Arrays, Strings & Matrices",
    iconName: "target",
    badgeStyle: "bg-[#FFB800]/20 text-[#FFB800] border-[#FFB800]/40",
    borderColor: "border-[#FFB800]/50",
    glowClass: "glow-gold",
    intensityLabel: "STAGE 3 • PROBLEM SOLVING",
  },
  3: {
    moduleIndex: 3,
    themeName: "Time Complexity & Recursion",
    subtitle: "Big-O & Algorithmic Optimization",
    iconName: "zap",
    badgeStyle: "bg-[#00FF87]/20 text-[#00FF87] border-[#00FF87]/40",
    borderColor: "border-[#00FF87]/50",
    glowClass: "glow-green",
    intensityLabel: "STAGE 4 • HIGH STAKES",
  },
  4: {
    moduleIndex: 4,
    themeName: "System Design & Live Challenge",
    subtitle: "Scalability, Caching & Live Practice",
    iconName: "crown",
    badgeStyle: "bg-[#FF0055]/20 text-[#FF0055] border-[#FF0055]/40",
    borderColor: "border-[#FF0055]/60",
    glowClass: "glow-magenta",
    intensityLabel: "STAGE 5 • FINAL BOSS",
  },
};

export function getModuleTheme(index: number): ModuleVisualTheme {
  const normalizedIndex = index % 5;
  return MODULE_THEMES[normalizedIndex] || MODULE_THEMES[0];
}
