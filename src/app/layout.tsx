import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ScopeAI | Professional AI Project Planner",
  description:
    "Transform complex ideas into structured project roadmaps in seconds with ScopeAI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} h-full antialiased dark scroll-smooth`}
    >
      <body className="min-h-full bg-[#030303] text-slate-200 selection:bg-indigo-500/30 selection:text-indigo-200">
        {/* Immersive Background Layer */}
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-[1400px] bg-[radial-gradient(circle_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] blur-[80px]" />
          <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-[10%] left-[5%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px]" />

          {/* Grid Pattern Overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `radial-gradient(#ffffff 0.5px, transparent 0.5px)`,
              backgroundSize: "24px 24px",
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
