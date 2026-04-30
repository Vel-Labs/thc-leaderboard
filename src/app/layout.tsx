import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ModeShell } from "./mode-shell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "THC Leaderboard",
  description: "Automated public THC review reports for public GitHub repositories.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <ModeShell>{children}</ModeShell>
      </body>
    </html>
  );
}
