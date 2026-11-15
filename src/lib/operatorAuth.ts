import crypto from "crypto"

// Server-side operator authentication for the leads desk.
// Credentials live ONLY in environment variables (never in source code):
//   OPERATOR_USERNAME, OPERATOR_PASSWORD, OPERATOR_SESSION_SECRET
// If any of them is missing, every check fails closed (nobody gets in).

export const OPERATOR_COOKIE = "ridevo_operator"
const SESSION_HOURS = 12

function secret(): string | null {
  return process.env.OPERATOR_SESSION_SECRET || null
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) {
    // still do a comparison so timing does not reveal the length
    crypto.timingSafeEqual(ab, ab)
    return false
  }
  return crypto.timingSafeEqual(ab, bb)
}

function sign(payload: string, key: string): string {
  return crypto.createHmac("sha256", key).update(payload).digest("hex")
}

export function checkCredentials(username: string, password: string): boolean {
  const u = process.env.OPERATOR_USERNAME
  const p = process.env.OPERATOR_PASSWORD
  if (!u || !p || !secret()) return false
  const userOk = safeEqual(username.trim().toLowerCase(), u.trim().toLowerCase())
  const passOk = safeEqual(password, p)
  return userOk && passOk
}

export function createSessionToken(): string | null {
  const key = secret()
  if (!key) return null
  const expires = Date.now() + SESSION_HOURS * 60 * 60 * 1000
  const payload = String(expires)
  return `${payload}.${sign(payload, key)}`
}

export function verifySessionToken(token: string | undefined | null): boolean {
  const key = secret()
  if (!key || !token) return false
  const [payload, sig] = token.split(".")
  if (!payload || !sig) return false
  if (!safeEqual(sig, sign(payload, key))) return false
  const expires = Number(payload)
  return Number.isFinite(expires) && expires > Date.now()
}

export function readCookie(req: Request, name: string): string | null {
  const header = req.headers.get("cookie")
  if (!header) return null
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=")
    if (k === name) return decodeURIComponent(rest.join("="))
  }
  return null
}

export function isOperator(req: Request): boolean {
  return verifySessionToken(readCookie(req, OPERATOR_COOKIE))
}

export const SESSION_MAX_AGE_SECONDS = SESSION_HOURS * 60 * 60
