import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ── ESLint & TypeScript Build Safety for Vercel ──────────────────────────
  eslint: {
    // Legacy pages contain @typescript-eslint/no-explicit-any; ignore during production build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // TypeScript type-checking is clean (passed via tsc --noEmit)
    ignoreBuildErrors: false,
  },

  // ── PWA & Performance ───────────────────────────────────────────────────
  compress: true,
  poweredByHeader: false,

  // ── Image optimization ──────────────────────────────────────────────────
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "**.onrender.com",
      },
    ],
  },

  // ── HTTP Headers ────────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Security
          { key: "X-Content-Type-Options",    value: "nosniff" },
          { key: "X-Frame-Options",           value: "DENY" },
          { key: "X-XSS-Protection",          value: "1; mode=block" },
          { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=(self)" },
          // PWA
          { key: "X-UA-Compatible",           value: "IE=edge" },
        ],
      },
      {
        // Long cache for static assets
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Cache public images
        source: "/icons/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
      {
        // Service worker must not be cached
        source: "/sw.js",
        headers: [
          { key: "Cache-Control",  value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        // Manifest
        source: "/manifest.json",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600" },
          { key: "Content-Type", value: "application/manifest+json" },
        ],
      },
    ];
  },

  // ── Redirects ────────────────────────────────────────────────────────────
  async redirects() {
    return [
      // Legacy URL cleanup
      {
        source: "/home",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
