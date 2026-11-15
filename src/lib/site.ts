// One place for the public site address, so canonical links, sitemap, robots,
// Open Graph and structured data always agree. ridevo.in redirects to www.ridevo.in,
// so www is the canonical host. Set NEXT_PUBLIC_SITE_URL in Vercel to override.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.ridevo.in").replace(/\/+$/, "")

// Bump this date when page content really changes (used for sitemap lastmod).
export const CONTENT_UPDATED = "2026-11-14"
