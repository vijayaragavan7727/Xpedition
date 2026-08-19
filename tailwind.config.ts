import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        xp: {
          bg: "#0A0A1A",
          card: "#1B1B3A",
          border: "rgba(255, 255, 255, 0.08)",
          violet: "#7C3AED",
          cyan: "#22D3EE",
          amber: "#FBBF24",
          green: "#34D399",
          muted: "#94A3B8",
        },
      },
      fontFamily: {
        heading: ["var(--font-heading)", "Outfit", "sans-serif"],
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 25px rgba(124, 58, 237, 0.25)",
        cyan: "0 0 25px rgba(34, 211, 238, 0.25)",
        amber: "0 0 25px rgba(251, 191, 36, 0.25)",
        green: "0 0 25px rgba(52, 211, 153, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
