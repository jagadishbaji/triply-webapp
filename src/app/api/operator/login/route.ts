import { NextResponse } from "next/server"
import {
  OPERATOR_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  checkCredentials,
  createSessionToken,
  isOperator,
} from "@/lib/operatorAuth"

export const runtime = "nodejs"

// Small in-memory throttle: max 8 attempts per 10 minutes per IP (per server instance)
const attempts = new Map<string, { count: number; first: number }>()
const WINDOW_MS = 10 * 60 * 1000
const MAX_ATTEMPTS = 8

function tooMany(ip: string): boolean {
  const now = Date.now()
  const entry = attempts.get(ip)
  if (!entry || now - entry.first > WINDOW_MS) {
    attempts.set(ip, { count: 1, first: now })
    return false
  }
  entry.count += 1
  return entry.count > MAX_ATTEMPTS
}

// GET: is the current browser signed in?
export async function GET(req: Request) {
  const ok = isOperator(req)
  return NextResponse.json({ authenticated: ok, username: ok ? process.env.OPERATOR_USERNAME || "" : "" })
}

// POST: sign in
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  if (tooMany(ip)) {
    return NextResponse.json(
      { success: false, error: "Too many attempts. Please try again in a few minutes." },
      { status: 429 }
    )
  }

  let body: { username?: string; password?: string } = {}
  try {
    body = await req.json()
  } catch {
    // fall through with empty body
  }

  const ok = checkCredentials(String(body.username || ""), String(body.password || ""))
  const token = ok ? createSessionToken() : null
  if (!ok || !token) {
    return NextResponse.json({ success: false, error: "Invalid operator credentials." }, { status: 401 })
  }

  const res = NextResponse.json({ success: true })
  res.cookies.set(OPERATOR_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  })
  return res
}

// DELETE: sign out
export async function DELETE() {
  const res = NextResponse.json({ success: true })
  res.cookies.set(OPERATOR_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 })
  return res
}
