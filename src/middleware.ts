import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  const token = req.cookies.get("accessToken")?.value
  const role = req.cookies.get("role")?.value
  const { pathname } = req.nextUrl

  // 🔹 If not logged in and not already on /login → go to login
  if (!token && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // 🔹 If logged in and trying to access /login → redirect to dashboard
  if (token && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  // 🔹 Role-based restriction: block "user" from accessing /agents
  // Only redirect if token exists and role is explicitly "user"
  if (token && role === "user" && pathname.startsWith("/agents")) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
}
