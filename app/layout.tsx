import type { Metadata, Viewport } from "next";
import { Inter_Tight, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SITE } from "@/data/site";
import { AppProviders } from "@/components/providers/AppProviders";

const display = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});
const sans = Geist({ variable: "--font-geist", subsets: ["latin"], display: "swap" });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const siteUrl = `${SITE.url}${BASE}/`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  alternates: { canonical: siteUrl },
  title: SITE.title,
  description: SITE.description,
  keywords: ["Ruturaj Jena", "Data Engineer", "Web Designer", "Creative Technologist", "Brand Motion Studios", "Macrova"],
  authors: [{ name: SITE.name }],
  openGraph: {
    type: "website",
    title: SITE.title,
    description: SITE.description,
    siteName: SITE.name,
    url: siteUrl,
    images: [{ url: `${siteUrl}og.png`, width: 1200, height: 630, alt: SITE.title }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.title,
    description: SITE.description,
    images: [`${siteUrl}og.png`],
  },
  icons: { icon: `${BASE}/icon.svg` },
};

export const viewport: Viewport = {
  themeColor: "#f6f4ef",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
