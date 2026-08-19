import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { QuestProvider } from "@/lib/QuestContext";
import AccessibilityWrapper from "@/components/AccessibilityWrapper";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
  variable: "--font-heading",
});

export const metadata: Metadata = {
  title: "XPedition — Adaptive Learning Game",
  description: "AI-powered gamified learning journeys tailored to your exact goal.",
  manifest: "/manifest.json",
  themeColor: "#0A0A1A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#0A0A1A] text-slate-100 font-sans selection:bg-[#7C3AED] selection:text-white">
        <QuestProvider>
          <AccessibilityWrapper>{children}</AccessibilityWrapper>
        </QuestProvider>
      </body>
    </html>
  );
}
