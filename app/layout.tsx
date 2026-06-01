import type { Metadata, Viewport } from "next";
import "./globals.css";

// Absolute base URL so Open Graph / Twitter images resolve for crawlers like
// Discord, Slack, iMessage, and X. Vercel injects VERCEL_PROJECT_PRODUCTION_URL
// at build/runtime; fall back to a public override or localhost in dev.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

const TITLE = "Hook Echo - Severe Weather Dashboard";
const DESCRIPTION =
  "Live NWS warnings, animated radar, and near-me severe weather notifications for any location in the US.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "Hook Echo",
  authors: [{ name: "Hook Echo" }],
  keywords: [
    "severe weather",
    "NWS",
    "tornado warning",
    "radar",
    "weather alerts",
    "storm tracker",
  ],
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    siteName: "Hook Echo",
    url: siteUrl,
    // og:image is picked up automatically from app/opengraph-image.tsx
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#05070d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  );
}
