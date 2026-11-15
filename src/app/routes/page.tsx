import type { Metadata } from "next"
import Link from "next/link"
import { Phone, ArrowRight } from "lucide-react"
import { RidevoLogo } from "@/components/RidevoLogo"
import { fmtINR } from "@/lib/fareCalculator"
import { CAB_ROUTES, routeFares } from "@/lib/routes"
import { SITE_URL } from "@/lib/site"

export const metadata: Metadata = {
  title: "Outstation Cab Routes from Hubli | Goa, Hampi, Gokarna, Bengaluru",
  description:
    "Fixed-rate outstation cabs from Hubli to Goa, Hampi, Gokarna, Dandeli, Bengaluru, Badami, Belgaum and Pune. See distance and fare for Sedan, Ertiga, Innova and Crysta. Zero advance payment.",
  alternates: { canonical: `${SITE_URL}/routes` },
}

export default function RoutesIndex() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Outstation cab routes from Hubli",
    itemListElement: CAB_ROUTES.map((r, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: r.title,
      url: `${SITE_URL}/routes/${r.slug}`,
    })),
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <RidevoLogo size="md" theme="dark" />
          <a href="tel:+918884856868" className="inline-flex items-center gap-2 text-sm font-bold text-green-400">
            <Phone className="w-4 h-4" /> +91 8884856868
          </a>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-10">
        <nav aria-label="Breadcrumb" className="text-xs text-slate-400 mb-4">
          <Link href="/" className="hover:text-green-400">Home</Link> / <span>Routes</span>
        </nav>
        <h1 className="text-3xl sm:text-4xl font-black text-white">Outstation cab routes from Hubli</h1>
        <p className="mt-4 text-slate-300 max-w-3xl leading-relaxed">
          Pick your destination to see the distance and the fixed fare for a Sedan, Ertiga, Innova or Innova Crysta.
          There is no advance payment. You pay after your trip.
        </p>
        <div className="mt-8 grid sm:grid-cols-2 gap-4">
          {CAB_ROUTES.map((r) => {
            const sedan = routeFares(r)[0]
            return (
              <Link
                key={r.slug}
                href={`/routes/${r.slug}`}
                className="rounded-2xl border border-white/10 hover:border-green-400 p-5 transition-colors"
              >
                <h2 className="text-lg font-bold text-white">{r.title}</h2>
                <p className="mt-1 text-sm text-slate-400">
                  About {r.oneWayKm} km one way · Sedan from {fmtINR(sedan.total)} for {r.recommendedDays} day
                  {r.recommendedDays > 1 ? "s" : ""}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-green-400">
                  See fares <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}
