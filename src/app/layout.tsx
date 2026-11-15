import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PWARegister } from "@/components/PWARegister";
import { SITE_URL } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});



export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Cabs in Hubli | Hubli to Goa & Hampi Outstation Cabs | RIDEVO",
    template: "%s | RIDEVO Hubli",
  },
  description:
    "Book verified outstation cabs in Hubli on RIDEVO. Fixed guaranteed rates: Cabs Hubli to Goa (₹11/km), Hubli to Hampi, Gokarna, Dandeli & Bangalore. Swift Dzire, Etios, Ertiga 6-seater, Innova Crysta. Verified tied-up cabs, zero advance payment. Call +91 8884856868.",
  keywords: [
    "ridevo",
    "ridevo hubli",
    "ridevo cabs",
    "ridevo outstation",
    "cabs in hubli",
    "cabs hubli to goa",
    "cabs hubli to hampi",
    "hubli to goa cab",
    "hubli to hampi cab",
    "hubli to goa taxi",
    "hubli to hampi taxi",
    "outstation cabs hubli",
    "hubli cab booking",
    "hubli car rental with driver",
    "hubli to gokarna cab",
    "hubli to dandeli cab",
    "hubli to bengaluru cab",
    "hubli to bangalore cab",
    "taxi service in hubli",
    "taxi in hubli",
    "best cabs in hubli",
    "hubli dharwad taxi service"
  ],
  alternates: {
    // "./" = each page's own address (home stays home, /terms stays /terms)
    canonical: "./",
  },
  authors: [{ name: "RIDEVO Hubli", url: SITE_URL }],
  creator: "RIDEVO Hubli",
  publisher: "RIDEVO",
  applicationName: "RIDEVO",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RIDEVO",
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
    locale: "en_IN",
    url: SITE_URL,
    siteName: "RIDEVO Hubli",
    title: "Cabs in Hubli | Hubli to Goa & Hampi Outstation Cabs | RIDEVO",
    description:
      "Fixed guaranteed rates for outstation cabs in Hubli on RIDEVO. Sedan ₹11/km, Ertiga ₹15/km, Innova ₹16/km, Crysta ₹18/km. Zero advance payment. Verified tied-up cabs.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Cabs in Hubli - RIDEVO Verified Outstation Taxi Service",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cabs in Hubli | Hubli to Goa & Hampi Outstation Cabs | RIDEVO",
    description:
      "Compare fixed rates for Hubli to Goa & Hampi outstation cabs on RIDEVO. Sedans from ₹11/km. Verified tied-up cabs, zero advance payment.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  verification: {
    google: "b4aa4a4a739202c6",
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
  const jsonLdTaxiService = {
    "@context": "https://schema.org",
    "@type": ["TaxiService", "LocalBusiness"],
    "@id": `${SITE_URL}/#taxiservice`,
    "name": "RIDEVO - Cabs in Hubli",
    "legalName": "RIDEVO Outstation Taxi Network Hubli",
    "url": SITE_URL,
    "logo": `${SITE_URL}/icons/icon-512x512.png`,
    "telephone": "+918884856868",
    "email": "support@ridevo.in",
    "description": "Verified outstation cab service in Hubli on RIDEVO. Compare guaranteed transparent rates for Cabs Hubli to Goa, Hubli to Hampi, Gokarna, Dandeli & Bangalore. Verified tied-up cabs, direct driver allotment, zero advance payment.",
    "priceRange": "₹11/km - ₹18/km",
    "currenciesAccepted": "INR",
    "paymentAccepted": "Cash, UPI, Google Pay, PhonePe, Paytm, Bank Transfer",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Station Road, Deshpande Nagar",
      "addressLocality": "Hubli",
      "addressRegion": "Karnataka",
      "postalCode": "580020",
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 15.3647,
      "longitude": 75.1240
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      "opens": "00:00",
      "closes": "23:59"
    },
    "areaServed": [
      { "@type": "City", "name": "Hubli" },
      { "@type": "City", "name": "Dharwad" },
      { "@type": "City", "name": "Goa" },
      { "@type": "City", "name": "Hampi" },
      { "@type": "City", "name": "Gokarna" },
      { "@type": "City", "name": "Dandeli" },
      { "@type": "City", "name": "Bengaluru" },
      { "@type": "City", "name": "Badami" },
      { "@type": "City", "name": "Belgaum" },
      { "@type": "City", "name": "Pune" }
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "RIDEVO Hubli Outstation Cab Tariffs",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Sedan Cab (Swift Dzire / Etios / Aura)",
            "description": "4-Seater AC Sedan. Fixed rate ₹11/km + ₹300 driver bata. 300 km/day package."
          },
          "price": "11",
          "priceCurrency": "INR"
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Ertiga Cab (Smart Hybrid)",
            "description": "6-Seater AC MUV. Fixed rate ₹15/km + ₹400 driver bata. 300 km/day package."
          },
          "price": "15",
          "priceCurrency": "INR"
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Toyota Innova Cab",
            "description": "7-Seater AC SUV. Fixed rate ₹16/km + ₹400 driver bata. 300 km/day package."
          },
          "price": "16",
          "priceCurrency": "INR"
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Innova Crysta VIP Cab",
            "description": "7-Seater Luxury AC SUV. Fixed rate ₹18/km + ₹400 driver bata. 300 km/day package."
          },
          "price": "18",
          "priceCurrency": "INR"
        }
      ]
    }
  };

  return (
    <html lang="en-IN" className="scroll-smooth">
      <head>
        {/* Geo-targeting for Hubli-Dharwad local search visibility */}
        <meta name="geo.region" content="IN-KA" />
        <meta name="geo.placename" content="Hubli-Dharwad, Karnataka, India" />
        <meta name="geo.position" content="15.3647;75.1240" />
        <meta name="ICBM" content="15.3647, 75.1240" />

        {/* PWA iOS meta tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="RIDEVO" />
        <meta name="msapplication-TileColor" content="#00c853" />
        <meta name="msapplication-tap-highlight" content="no" />

        {/* Schema.org Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdTaxiService) }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <PWARegister />
      </body>
    </html>
  );
}
