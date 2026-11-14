import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Phone, MessageCircle, CheckCircle2, MapPin, ArrowRight } from "lucide-react"
import { RidevoLogo } from "@/components/RidevoLogo"
import { fmtINR } from "@/lib/fareCalculator"
import { CAB_ROUTES, getRoute, routeFares } from "@/lib/routes"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ridevo.in"
const PHONE_DISPLAY = "+91 8884856868"
const PHONE_DIGITS = "918884856868"

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return CAB_ROUTES.map((r) => ({ slug: r.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const route = getRoute(slug)
  if (!route) return {}
  const sedan = routeFares(route)[0]
  const title = `${route.title} | Fixed Rates from ₹${sedan.ratePerKm}/km`
  const description = `Book a verified cab from Hubli to ${route.destination}. About ${route.oneWayKm} km one way, fixed rates (Sedan ₹${sedan.ratePerKm}/km), driver details shared before pickup, zero advance payment. Call ${PHONE_DISPLAY}.`
  const url = `${SITE_URL}/routes/${route.slug}`
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", url, title, description, siteName: "RIDEVO Hubli", locale: "en_IN" },
  }
}

export default async function RoutePage({ params }: Props) {
  const { slug } = await params
  const route = getRoute(slug)
  if (!route) notFound()

  const fares = routeFares(route)
  const roundTripKm = route.oneWayKm * 2
  const oneDay = route.recommendedDays > 1 && roundTripKm <= 300 ? routeFares(route, 1) : null
  const sedan = fares[0]
  const url = `${SITE_URL}/routes/${route.slug}`

  const waText = `Hello RIDEVO Hubli, I want a cab from Hubli to ${route.destination}. Please share availability and the fare.`
  const waLink = `https://wa.me/${PHONE_DIGITS}?text=${encodeURIComponent(waText)}`

  const faqs = [
    {
      q: `How much is a cab from Hubli to ${route.destination}?`,
      a: `A Sedan for ${route.recommendedDays} day${route.recommendedDays > 1 ? "s" : ""} costs about ${fmtINR(sedan.total)} including driver bata, at ₹${sedan.ratePerKm}/km with a ${sedan.billedKm} km package. Ertiga, Innova and Innova Crysta rates are in the table above. Tolls and parking are extra, at actuals.`,
    },
    {
      q: "Do I need to pay in advance?",
      a: "No. There is no advance payment. You pay the driver after your trip by cash or UPI.",
    },
    {
      q: "What if my trip goes beyond the package kilometres?",
      a: "The package includes 300 km per day. If the car runs more than that, the extra kilometres are billed at the per-km rate of the car you chose, based on the odometer at drop-off.",
    },
    {
      q: "How will I know my booking is confirmed?",
      a: "Our Hubli coordinator calls you to confirm the pickup time and shares the driver's name, mobile number and car number.",
    },
  ]

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: route.title, item: url },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <RidevoLogo size="md" theme="dark" />
          <a
            href={`tel:+${PHONE_DIGITS}`}
            className="inline-flex items-center gap-2 text-sm font-bold text-green-400 hover:text-green-300"
          >
            <Phone className="w-4 h-4" /> {PHONE_DISPLAY}
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-12">
        <section>
          <nav aria-label="Breadcrumb" className="text-xs text-slate-400 mb-4">
            <Link href="/" className="hover:text-green-400">Home</Link> / <span>{route.title}</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">
            {route.title}: Fixed Rates, Pay After Your Trip
          </h1>
          <p className="mt-4 text-slate-300 max-w-3xl leading-relaxed">{route.intro}</p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 max-w-xl">
            <Link
              href="/#planner"
              className="w-full sm:w-auto sm:flex-1 h-12 rounded-xl bg-green-500 hover:bg-green-400 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2"
            >
              Get exact fare <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto sm:flex-1 h-12 rounded-xl border border-white/20 hover:border-green-400 text-white font-bold text-sm flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4 text-green-400" /> WhatsApp us
            </a>
          </div>
        </section>

        <section aria-labelledby="fares">
          <h2 id="fares" className="text-2xl font-bold text-white mb-1">
            Hubli to {route.destination} cab fare
          </h2>
          <p className="text-sm text-slate-400 mb-4">
            About {route.oneWayKm} km one way ({roundTripKm} km round trip). Estimate for {route.recommendedDays} day
            {route.recommendedDays > 1 ? "s" : ""}, includes driver bata. Tolls and parking extra.
          </p>
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-slate-300 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold">Car</th>
                  <th className="px-4 py-3 font-semibold">Seats</th>
                  <th className="px-4 py-3 font-semibold">Rate</th>
                  <th className="px-4 py-3 font-semibold text-right">Estimated fare</th>
                </tr>
              </thead>
              <tbody>
                {fares.map((f) => (
                  <tr key={f.carId} className="border-t border-white/10">
                    <td className="px-4 py-3">
                      <div className="font-bold text-white">{f.name}</div>
                      <div className="text-xs text-slate-400">{f.subtitle}</div>
                    </td>
                    <td className="px-4 py-3">{f.seats}</td>
                    <td className="px-4 py-3">
                      ₹{f.ratePerKm}/km
                      <div className="text-xs text-slate-400">Bata ₹{f.driverBataPerDay}/day</div>
                    </td>
                    <td className="px-4 py-3 text-right font-extrabold text-green-400">{fmtINR(f.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {oneDay && (
            <p className="mt-3 text-sm text-slate-300">
              Only need one day? A Sedan for 1 day (300 km) is about {fmtINR(oneDay[0].total)}.
            </p>
          )}
          <p className="mt-3 text-xs text-slate-500">
            Estimates use the standard 300 km per day package. Extra kilometres are billed at the per-km rate of the car.
          </p>
        </section>

        <section className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-white/10 p-5">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-400" /> Route details
            </h2>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-slate-400">Route</dt><dd>{route.via}</dd></div>
              <div><dt className="text-slate-400">Distance</dt><dd>About {route.oneWayKm} km one way</dd></div>
              <div><dt className="text-slate-400">Drive time</dt><dd>{route.driveTime}</dd></div>
              <div><dt className="text-slate-400">Best time</dt><dd>{route.bestTime}</dd></div>
            </dl>
          </div>
          <div className="rounded-2xl border border-white/10 p-5">
            <h2 className="text-lg font-bold text-white mb-3">What you can see and do</h2>
            <ul className="space-y-2 text-sm">
              {route.highlights.map((h) => (
                <li key={h} className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" /> {h}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-slate-400">{route.tip}</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Questions about this trip</h2>
          <div className="space-y-4">
            {faqs.map((f) => (
              <div key={f.q} className="rounded-2xl border border-white/10 p-5">
                <h3 className="font-bold text-white">{f.q}</h3>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-3">Other cab routes from Hubli</h2>
          <div className="flex flex-wrap gap-2">
            {CAB_ROUTES.filter((r) => r.slug !== route.slug).map((r) => (
              <Link
                key={r.slug}
                href={`/routes/${r.slug}`}
                className="px-3 py-2 rounded-full border border-white/15 hover:border-green-400 text-sm text-slate-200"
              >
                {r.title}
              </Link>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} RIDEVO Technologies. Hubli–Dharwad&apos;s outstation cab network. {" "}
        <Link href="/terms" className="hover:text-green-400">Terms</Link> · <Link href="/privacy" className="hover:text-green-400">Privacy</Link>
      </footer>
    </div>
  )
}
