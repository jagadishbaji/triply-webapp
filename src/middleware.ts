import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("accessToken")?.value;
  const role = req.cookies.get("role")?.value;
  const { pathname } = req.nextUrl;

  // ✅ Define public routes
  const publicPaths = [
    "/login",
    "/agent-signup",
    "/user-signup",
    "/forgot-password",
    "/reset-password",
    "/user/vehicles",
    "/",
  ];

  const isPublic = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );

  // 🚀 Debug log (optional)
  console.log("PATHNAME:", pathname, "TOKEN:", token, "IS_PUBLIC:", isPublic);
if(pathname=== "/agent-signup") {
  console.log("AGENT SIGNUP PAGE");
   return NextResponse.redirect(new URL("/agent-signup", req.url));
}
  // ✅ Allow public routes without token
  if (!token && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // ✅ If logged in and visiting a public route → send to dashboard
  if (token && isPublic) {
    if (role === "admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
    if (role === "agent") {
      return NextResponse.redirect(new URL("/agent/dashboard", req.url));
    }
  }

  // ✅ If logged in and on root `/` → send to dashboard
  if (pathname === "/" && token) {
    if (role === "admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
    if (role === "agent") {
      return NextResponse.redirect(new URL("/agent/dashboard", req.url));
    }
  }

  // ✅ Role-based protection
  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname.startsWith("/agent") && role !== "agent") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js)).*)"],
};
