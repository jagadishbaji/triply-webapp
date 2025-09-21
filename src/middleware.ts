import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("accessToken")?.value;
  const role = req.cookies.get("role")?.value;
  const { pathname } = req.nextUrl;

  // Public routes (no login required)
  const publicPaths = [
    "/login",
    "/agentSignup",
    "/userSignup",
    "/forgot-password",
    "/reset-password",
  ];

  if (!token && !publicPaths.includes(pathname) && pathname !== "/") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // If logged in and trying to access login/signup → redirect to respective dashboard
  if (token && publicPaths.includes(pathname)) {
    if (role === "admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
    if (role === "agent") {
      return NextResponse.redirect(new URL("/agent/dashboard", req.url));
    }
  }

  // Redirect `/` → role-specific dashboard
  if (pathname === "/" && token) {
    if (role === "admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
    if (role === "agent") {
      return NextResponse.redirect(new URL("/agent/dashboard", req.url));
    }
  }

  // Role-based protection
  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname.startsWith("/agent") && role !== "agent") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
     "/((?!_next/static|_next/image|favicon.ico|cars|.*\\.(?:svg|png|jpg|jpeg|gif|webp)).*)",
  ],
};
