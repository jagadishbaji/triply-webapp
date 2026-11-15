import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms and conditions for booking outstation cabs from Hubli with RIDEVO: fixed per-km rates, 300 km/day package, driver bata, tolls, cancellation and payment.",
  alternates: { canonical: "./" },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
