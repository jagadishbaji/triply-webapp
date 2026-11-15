import { SITE_URL } from "@/lib/site"

// Home-page-only structured data (FAQ + breadcrumbs). Kept out of the site-wide layout so
// route pages do not get a second, conflicting FAQPage.
export function HomeJsonLd() {
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
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumbs) }} />
    </>
  )
}
