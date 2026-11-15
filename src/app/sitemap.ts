import { MetadataRoute } from "next"
import { CAB_ROUTES } from "@/lib/routes"
import { CONTENT_UPDATED, SITE_URL } from "@/lib/site"

export default function sitemap(): MetadataRoute.Sitemap {
  const updated = new Date(CONTENT_UPDATED)

  return [
    { url: SITE_URL, lastModified: updated, changeFrequency: "weekly", priority: 1.0 },
    { url: `${SITE_URL}/routes`, lastModified: updated, changeFrequency: "weekly", priority: 0.9 },
    ...CAB_ROUTES.map((r) => ({
      url: `${SITE_URL}/routes/${r.slug}`,
      lastModified: updated,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    { url: `${SITE_URL}/terms`, lastModified: updated, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/privacy`, lastModified: updated, changeFrequency: "yearly", priority: 0.3 },
  ]
}
