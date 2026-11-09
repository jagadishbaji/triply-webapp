import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("accessToken")?.value;
  const role = req.cookies.get("role")?.value;
  const { pathname } = req.nextUrl;

  // ── STEP 0: Allow all API routes & static assets ─────────────────────
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // ── STEP 1: Always allow these paths — no logic, no redirect, ever ───
  const alwaysAllow = [
    "/robots.txt",          // ← Critical for Googlebot SEO crawling
    "/sitemap.xml",         // ← Critical for Googlebot search indexing
    "/manifest.json",       // ← PWA manifest
    "/offline.html",        // ← Offline fallback
    "/agent-signup",
    "/user-signup",
    "/forgot-password",
    "/reset-password",
    "/user/vehicles",
    "/admin/leads",         // ← Allow operator leads dashboard
    "/terms",               // ← Added Terms & Conditions
    "/privacy",             // ← Added Privacy Policy
    "/nammacab-banner.mp4", // ← Allow video asset
  ];

  // Pass-through Google Search Console verification files
  if (pathname.startsWith("/google") && pathname.endsWith(".html")) {
    return NextResponse.next();
  }

  if (alwaysAllow.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next(); // ← hard pass-through, nothing else runs
  }

  // ── STEP 2: Root "/" logic ────────────────────────────────────────────
  if (pathname === "/") {
    if (!token) return NextResponse.next(); // show landing page
    if (role === "admin") return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    if (role === "agent") return NextResponse.redirect(new URL("/agent/dashboard", req.url));
    return NextResponse.next(); // regular user — show landing
  }

  // ── STEP 3: Login page ────────────────────────────────────────────────
  if (pathname === "/login") {
    if (!token) return NextResponse.next();
    if (role === "admin") return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    if (role === "agent") return NextResponse.redirect(new URL("/agent/dashboard", req.url));
    return NextResponse.redirect(new URL("/user/dashboard", req.url));
  }

  // ── STEP 4: Protected routes — must have token ────────────────────────
  if (!token) {
    // If no token and not in the alwaysAllow list, redirect to home
    return NextResponse.redirect(new URL("/", req.url));
  }

  // ── STEP 5: Role guards ───────────────────────────────────────────────
  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (pathname.startsWith("/agent/") && role !== "agent") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|txt|xml|json|html)).*)",
  ],
};