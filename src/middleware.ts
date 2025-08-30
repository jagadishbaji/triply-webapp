import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  const token = req.cookies.get("accessToken")?.value
  const role = req.cookies.get("role")?.value
  const { pathname } = req.nextUrl

  // 🔹 Allow home, login, signup without login
  if (!token && pathname !== "/" && pathname !== "/login" && pathname !== "/agentSignup") {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // 🔹 If logged in and trying to access /login or /agentsSignup → redirect to dashboard
  if (token && (pathname === "/login" || pathname === "/agentsSignup")) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  // 🔹 Role-based restriction: block "user" from accessing /agents
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
