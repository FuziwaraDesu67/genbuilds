import type { Metadata } from "next";
import "../styles/globals.css";
import WebGLBackground from "@/components/background/WebGLBackground";
import { BackgroundProvider } from "@/components/background/BackgroundContext";

export const metadata: Metadata = {
  title: "AetherRank - Genshin Impact Build Leaderboard",
  description: "Showcase your Genshin Impact builds and compete on character damage leaderboards. Compare artifacts, weapons, and stats with players worldwide.",
  keywords: ["Genshin Impact", "builds", "leaderboard", "damage", "showcase", "artifacts"],
};

import { Inter, Playfair_Display } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased text-white bg-black">
        <BackgroundProvider>
          <WebGLBackground />
          {children}
        </BackgroundProvider>
      </body>
    </html>
  );
}
