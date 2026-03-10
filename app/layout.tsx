// ============================================================
// layout.tsx — Root layout with metadata and fonts
// ============================================================
import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Breakout — Neon Edition',
  description:
    'A neon-themed Breakout arcade game built with Next.js, TypeScript, and Tailwind CSS. ' +
    'Break all the bricks, collect power-ups, and top the leaderboard!',
  keywords: ['breakout', 'arcade', 'game', 'neon', 'nextjs'],
};

export const viewport: Viewport = {
  themeColor: '#05050f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Inline SVG favicon — neon cyan theme */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="antialiased bg-[#02020a] overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
