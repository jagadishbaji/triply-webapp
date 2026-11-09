import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ridevo.in"

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/agent/", "/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
