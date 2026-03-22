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
    default: "interns.city — Report & Track Civic Issues in India",
    template: "%s | interns.city",
  },
  description:
    "Report potholes, broken streetlights, water leaks and more on an interactive map. AI-powered issue detection. Track resolution in real-time across Gurugram, Delhi, Bangalore, Mumbai, Chennai, Hyderabad, Pune, Kolkata and more.",
  keywords: [
    "civic issues India", "pothole reporting", "municipal complaint", "city issues tracker",
    "report pothole", "broken streetlight", "water leak complaint", "garbage complaint India",
    "smart city India", "civic tech", "interns city", "community reporting",
    "municipal corporation complaint", "BMC complaint", "MCG complaint", "BBMP complaint",
  ],
  manifest: "/manifest.json",
  metadataBase: new URL("https://interns.city"),
  alternates: { canonical: "/" },
  openGraph: {
    title: "interns.city — Report & Track Civic Issues in India",
    description: "Report potholes, streetlights, water leaks on an interactive map. AI analyzes photos. Communities vote on priority. Authorities notified automatically.",
    type: "website",
    url: "https://interns.city",
    siteName: "interns.city",
    locale: "en_IN",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "interns.city — Civic Issue Tracker for India",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "interns.city — Report & Track Civic Issues",
    description: "Report potholes, streetlights, water leaks on an interactive map. AI-powered. Community-driven.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  other: {
    "google-site-verification": "QMo3XWHxsoZeUvHsm5S7_-wHFworP_-2UehKsS7sR-Y",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "interns.city",
              url: "https://interns.city",
              description: "Report and track civic issues like potholes, broken streetlights, and water leaks on an interactive map across Indian cities.",
              applicationCategory: "UtilitiesApplication",
              operatingSystem: "Web",
              offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
              author: {
                "@type": "Organization",
                name: "interns.city",
                url: "https://interns.city",
                email: "admin@interns.city",
                contactPoint: {
                  "@type": "ContactPoint",
                  email: "admin@interns.city",
                  contactType: "customer support",
                  availableLanguage: ["English", "Hindi"],
                },
              },
              areaServed: {
                "@type": "Country",
                name: "India",
              },
            }),
          }}
        />
        <Providers>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
