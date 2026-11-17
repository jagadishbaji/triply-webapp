import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Operator Desk",
  manifest: "/admin-manifest.json", // installs as "RIDEVO Admin" and opens straight to the desk
  robots: { index: false, follow: false },
}

export default function LeadsLayout({ children }: { children: React.ReactNode }) {
  return children
}
