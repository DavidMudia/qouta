import type { Metadata, Viewport } from "next";
import {
  Instrument_Serif,
  IBM_Plex_Mono,
  IBM_Plex_Sans,
} from "next/font/google";
import "./globals.css";
import { SiteHeader, SiteFooter } from "@/components/site/Chrome";
import { OfflineSync } from "@/components/site/OfflineSync";

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mudia WebQuote — instant website estimates",
  description:
    "A rule-based pricing engine for Nigerian website projects. Answer in plain language; the engine derives the architecture, the line items and the estimate range.",
  manifest: "/manifest.json",
  applicationName: "Mudia WebQuote",
};

export const viewport: Viewport = {
  themeColor: "#f2ece1",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${instrument.variable} ${plexSans.variable} ${plexMono.variable}`}
    >
      <body className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <OfflineSync />
        <script
          dangerouslySetInnerHTML={{
            __html: `if("serviceWorker" in navigator){window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js").catch(()=>{})});}`,
          }}
        />
      </body>
    </html>
  );
}
