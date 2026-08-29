import type { Metadata } from "next";
import { Inter, Outfit, Caveat } from "next/font/google";
import "./globals.css";
import { QuestProvider } from "@/lib/QuestContext";
import ErrorBoundary from "@/components/ErrorBoundary";
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

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-chalk",
});

export const metadata: Metadata = {
  title: "XPedition — Adaptive Learning Game",
  description: "AI-powered gamified learning journeys tailored to your exact goal.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} ${caveat.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#0A0A1A] text-slate-100 font-sans selection:bg-[#7C3AED] selection:text-white">
        <QuestProvider>
          <ErrorBoundary>
            <AccessibilityWrapper>{children}</AccessibilityWrapper>
          </ErrorBoundary>
        </QuestProvider>
      </body>
    </html>
  );
}
