import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PWARegister } from "@/components/PWARegister";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ridevo.in";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Cabs in Hubli | Hubli to Goa & Hampi Outstation Cabs | RIDEVO",
    template: "%s | RIDEVO Hubli",
  },
  description:
    "Book verified outstation cabs in Hubli on RIDEVO. Compare guaranteed lowest fixed rates: Cabs Hubli to Goa (₹11/km), Hubli to Hampi, Gokarna, Dandeli & Bangalore. Swift Dzire, Etios, Ertiga 6-seater, Innova Crysta. Verified tied-up cabs, zero advance payment. Call +91 8884856868.",
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
    canonical: SITE_URL,
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
      "Compare fixed guaranteed rates for outstation cabs in Hubli on RIDEVO. Sedan ₹11/km, Ertiga ₹15/km, Innova ₹16/km, Crysta ₹18/km. Zero advance payment. Verified tied-up cabs.",
    images: [
      {
        url: "/images/cars/sedan-nobg.png",
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
    images: ["/images/cars/sedan-nobg.png"],
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
  const jsonLdTaxiService = {
    "@context": "https://schema.org",
    "@type": ["TaxiService", "LocalBusiness"],
    "@id": `${SITE_URL}/#taxiservice`,
    "name": "RIDEVO - Cabs in Hubli",
    "legalName": "RIDEVO Outstation Taxi Network Hubli",
    "url": SITE_URL,
    "logo": `${SITE_URL}/icons/icon-512x512.png`,
    "telephone": "+918884856868",
    "email": "Jagadishbaji@gmail.com",
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
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "148",
      "bestRating": "5",
      "worstRating": "1"
    }
  };

  const jsonLdFaq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How do I book cabs in Hubli for outstation trips?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Simply enter your destination (such as Goa, Hampi, Gokarna, Dandeli or Bengaluru), choose your travel dates and duration, and select your preferred car (Sedan ₹11/km, Ertiga ₹15/km, Innova ₹16/km, or Crysta ₹18/km). Submit your request on RIDEVO. Our Hubli ride coordinator (+91 8884856868) will match your trip with a verified local cab owner and call you within 15 minutes to confirm. Zero advance payment required!"
        }
      },
      {
        "@type": "Question",
        "name": "What are the rates for Cabs Hubli to Goa?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Hubli to Goa is approximately 180 km one-way (~360 km round trip). Under Hubli's standard 300 km/day outstation package, a 2-day Goa trip includes 600 km allowance. Sedan (Swift Dzire/Etios) costs ₹11/km + ₹300/day driver bata (~₹7,200 total). Ertiga 6-seater is ₹15/km + ₹400/day driver bata (~₹9,800 total). Toyota Innova is ₹16/km (~₹10,400 total). If total running exceeds 600 km, extra km is billed at the standard per-km rate."
        }
      },
      {
        "@type": "Question",
        "name": "What are the rates for Cabs Hubli to Hampi?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Hubli to Hampi (UNESCO World Heritage Site) is approximately 150 km one-way (300 km round trip via Gadag/Hospet). A 1-day trip is billed at the 300 km package allowance: ₹3,600 for Sedan (₹11/km + ₹300 driver bata). A 2-day leisure tour is ₹7,200 for Sedan with 600 km allowance. Ertiga is ₹4,900 (1 day) or ₹9,800 (2 days)."
        }
      },
      {
        "@type": "Question",
        "name": "How is the outstation cab price calculated in Hubli?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Hubli outstation taxi pricing operates on a transparent minimum package of 300 km per day. The package ensures fair compensation for outstation vehicle utilization: Package Minimum = Number of Days × 300 km. Final fare is billed on whichever is higher between the package minimum or the actual round-trip odometer reading. Total Fare = (Billed Km × Per-Km Rate) + (Number of Days × Driver Bata). Tolls, parking, and state border permits are paid by the customer at actual toll booths."
        }
      },
      {
        "@type": "Question",
        "name": "Do I have to pay any advance booking amount?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No! RIDEVO requires zero advance payment. You pay your driver directly after your journey completes via Cash, UPI (Google Pay, PhonePe, Paytm), or net banking."
        }
      },
      {
        "@type": "Question",
        "name": "What happens after I confirm my trip and request a cab?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Your trip plan is instantly registered with our Hubli coordination desk and assigned a booking reference code (e.g., RV-HBX-XXXXXX). We allot a verified tied-up cab from our Hubli fleet. Within 15 minutes, our coordinator calls you to verify your pickup landmark and shares the driver contact details. Your driver arrives at your doorstep on time."
        }
      }
    ]
  };

  const jsonLdBreadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": SITE_URL
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Cabs in Hubli",
        "item": `${SITE_URL}/#fleet`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "Cabs Hubli to Goa",
        "item": `${SITE_URL}/#routes`
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": "Cabs Hubli to Hampi",
        "item": `${SITE_URL}/#routes`
      }
    ]
  };

  return (
    <html lang="en" className="scroll-smooth">
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumbs) }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <PWARegister />
      </body>
    </html>
  );
}
