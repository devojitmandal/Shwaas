import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Devanagari, Noto_Sans_Kannada } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  variable: "--font-noto-devanagari",
  subsets: ["devanagari"],
  display: "swap",
});

const notoSansKannada = Noto_Sans_Kannada({
  variable: "--font-noto-kannada",
  subsets: ["kannada"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Shwaas (श्वास) — हर सांस का हिसाब | Urban Air Quality Assistant",
  description: "Shwaas (श्वास) — हर सांस का हिसाब. An AI-powered urban air quality assistant helping families navigate severe winter smog with personalized routines, indoor mass-balance air hacks, and breath budgets.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-text-scale="100"
      className={`${geistSans.variable} ${geistMono.variable} ${notoSansDevanagari.variable} ${notoSansKannada.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
