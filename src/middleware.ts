import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("accessToken")?.value;
  const role = req.cookies.get("role")?.value;
  const { pathname } = req.nextUrl;

  // ── STEP 1: Always allow these paths — no logic, no redirect, ever ───
  const alwaysAllow = [
    "/agent-signup",
    "/user-signup",
    "/forgot-password",
    "/reset-password",
    "/user/vehicles",
  ];

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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js)).*)",
  ],
};