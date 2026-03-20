import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Providers } from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CivicPulse — Report & Track Civic Issues",
    template: "%s | CivicPulse",
  },
  description:
    "Report potholes, broken streetlights, water leaks and more on an interactive map. Track resolution and help improve your city.",
  keywords: ["civic issues", "pothole reporting", "municipal", "city issues", "community"],
  manifest: "/manifest.json",
  openGraph: {
    title: "CivicPulse — Report & Track Civic Issues",
    description: "Report civic issues on an interactive map. Track resolution and help improve your city.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#059669",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="h-full flex flex-col bg-gray-950 text-gray-100">
        <Providers>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
