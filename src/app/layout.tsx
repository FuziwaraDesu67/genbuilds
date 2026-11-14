import type { Metadata } from "next";
import "../styles/globals.css";
import WebGLBackground from "@/components/background/WebGLBackground";
import { BackgroundProvider } from "@/components/background/BackgroundContext";
import { AuthProvider } from "@/lib/auth/context";
import Navbar from "@/components/navbar/Navbar";
import AuthModal from "@/components/auth/AuthModal";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://genbuilds.vercel.app'),
  title: "GenBuilds - Genshin Impact Build Leaderboard",
  description: "Showcase your Genshin Impact builds and compete on character damage leaderboards. Compare artifacts, weapons, and stats with players worldwide.",
  keywords: ["Genshin Impact", "GenBuilds", "builds", "leaderboard", "damage", "showcase", "artifacts"],
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "GenBuilds - Genshin Impact Build Leaderboard",
    description: "Showcase your Genshin Impact builds and compete on character damage leaderboards.",
    images: [{ url: "/logo.png", width: 1024, height: 1024, alt: "GenBuilds" }],
  },
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
      <body className="font-sans antialiased text-white bg-black min-h-screen flex flex-col">
        <BackgroundProvider>
          <AuthProvider>
            <WebGLBackground />
            <Navbar />
            <main className="flex-1 w-full">{children}</main>
            <AuthModal />
          </AuthProvider>
        </BackgroundProvider>
      </body>
    </html>
  );
}
