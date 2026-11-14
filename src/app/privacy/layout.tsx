import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How RIDEVO Hubli collects, uses and protects your name, phone number and trip details when you request an outstation cab.",
  alternates: { canonical: "./" },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
