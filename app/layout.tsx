import type { Metadata } from 'next';
import { Inter, Orbitron, JetBrains_Mono, Caveat, Kalam } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-orbitron', display: 'swap' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono', display: 'swap' });
const caveat = Caveat({ subsets: ['latin'], variable: '--font-caveat', display: 'swap' });
const kalam = Kalam({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-kalam', display: 'swap' });

export const metadata: Metadata = {
  title: 'XPEDITION — Adaptive Learning',
  description: 'XPedition — adaptive learning that measures what you know without AI assistance. Your solo score vs your assisted score.',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${orbitron.variable} ${jetbrainsMono.variable} ${caveat.variable} ${kalam.variable}`}>
      <head>
        <link rel="preload" href="/art/hero-left.jpg" as="image" />
      </head>
      <body className="bg-ink text-text selection:bg-violet selection:text-white antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
