import type { Metadata,Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PWARegister } from "@/components/PWARegister";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
icons: { icon: "/nammacab-icon.svg" }
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "NammaCAB – Hubli-Dharwad Cab Marketplace",
    template: "%s | NammaCAB",
  },
  description:
    "Book intercity cabs from Hubli-Dharwad. Transparent pricing, verified operators, instant confirmation.",
  keywords: ["cab booking", "Hubli", "Dharwad", "intercity cab", "NammaCAB", "taxi"],
  authors: [{ name: "NammaCAB" }],
  creator: "NammaCAB",
  applicationName: "NammaCAB",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NammaCAB",
    startupImage: [
      {
        url: "/splash/apple-splash-2048-2732.png",
        media: "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)",
      },
    ],
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    siteName: "NammaCAB",
    title: "NammaCAB – Book Intercity Cabs",
    description: "Hubli-Dharwad's premier cab booking marketplace. Best prices, verified operators.",
  },
  twitter: {
    card: "summary_large_image",
    title: "NammaCAB",
    description: "Book intercity cabs instantly from Hubli-Dharwad",
  },
  icons: {
    icon: [
      { url: "/icons/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0f1e" },
    { media: "(prefers-color-scheme: light)", color: "#00c853" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/* PWA iOS meta tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="NammaCAB" />
        {/* MS Tile */}
        <meta name="msapplication-TileColor" content="#00c853" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className={`${geistSans .variable} ${geistSans .variable} antialiased`}>
        {children}
        <PWARegister />
      </body>
    </html>
  );
}
