import * as webpush from "web-push"
import type { StoredTripRequest } from "@/lib/bookingStore"

// Phone alerts for the operator (the "Ridevo Admin" app). Web Push, no third-party app needed.
// Server env: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:you@example.com)
// plus the Supabase variables (subscriptions live in the `push_subscriptions` table).
// If anything is missing, alerts are skipped silently and bookings are never affected.

const SB_URL = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "")
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || ""
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || ""
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || ""
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:support@ridevo.in"

export const SEND_TIMEOUT_MS = 4000

export function pushConfigured(): boolean {
  return Boolean(SB_URL && SB_KEY && VAPID_PUBLIC && VAPID_PRIVATE)
}

export function vapidPublicKey(): string {
  return VAPID_PUBLIC
}

export type PushSubscriptionInput = { endpoint: string; keys: { p256dh: string; auth: string } }

const KNOWN_PUSH_HOSTS = [
  /(^|\.)googleapis\.com$/, // Chrome / Android (FCM)
  /(^|\.)push\.services\.mozilla\.com$/, // Firefox
  /(^|\.)push\.apple\.com$/, // Safari / iPhone
  /(^|\.)notify\.windows\.com$/, // Edge / Windows
]

// Only accept real browser push services (so nobody can make the server call an arbitrary address).
export function isAllowedEndpoint(endpoint: unknown): boolean {
  if (typeof endpoint !== "string" || endpoint.length > 2000) return false
  let u: URL
  try {
    u = new URL(endpoint)
  } catch {
    return false
  }
  if (process.env.NODE_ENV !== "production" && u.protocol === "https:" && u.hostname === "localhost") return true
  return u.protocol === "https:" && KNOWN_PUSH_HOSTS.some((re) => re.test(u.hostname))
}

export function parseSubscription(body: unknown): PushSubscriptionInput | null {
  const sub = (body as { subscription?: PushSubscriptionInput } | null)?.subscription
  if (!sub || typeof sub !== "object") return null
  const { endpoint, keys } = sub
  if (!isAllowedEndpoint(endpoint)) return null
  if (!keys || typeof keys.p256dh !== "string" || typeof keys.auth !== "string") return null
  if (keys.p256dh.length < 20 || keys.p256dh.length > 200 || keys.auth.length < 8 || keys.auth.length > 100) return null
  return { endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } }
}

async function sb<T = unknown>(pathAndQuery: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${SB_URL}/rest/v1/${pathAndQuery}`, {
    ...init,
    cache: "no-store",
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  })
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) throw new Error(`Storage error: ${data?.message || res.status}`)
  return data as T
}

type Row = { endpoint: string; p256dh: string; auth: string }

export async function saveSubscription(sub: PushSubscriptionInput, label = ""): Promise<void> {
  await sb("push_subscriptions?on_conflict=endpoint", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth, label: label.slice(0, 80) }),
  })
}

export async function removeSubscription(endpoint: string): Promise<void> {
  await sb(`push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`, { method: "DELETE", headers: { Prefer: "return=minimal" } })
}

export type PushPayload = { title: string; body: string; url: string; tag: string }

// Strong, repeating vibration (honoured on Android). Long-short-long pattern that is hard to miss.
export const VIBRATION_PATTERN = [800, 250, 800, 250, 800, 250, 1500]

function esc(s: unknown, max = 60): string {
  return String(s ?? "").replace(/\s+/g, " ").trim().slice(0, max)
}

export function buildBookingPush(b: StoredTripRequest): PushPayload {
  return {
    title: `🚖 New booking: ${esc(b.destination, 40)}`,
    body: `${esc(b.customerName)} · ${esc(b.carName, 30)} · ₹${Number(b.estimatedFare).toLocaleString("en-IN")} · ${esc(b.customerPhone, 20)}`,
    url: "/admin/leads",
    tag: `booking-${esc(b.bookingRef, 40)}`,
  }
}

export type SendResult = { sent: number; removed: number; failed: number }

export async function sendPushToOperators(payload: PushPayload): Promise<SendResult> {
  const result: SendResult = { sent: 0, removed: 0, failed: 0 }
  if (!pushConfigured()) return result
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE)
  let rows: Row[] = []
  try {
    rows = await sb<Row[]>("push_subscriptions?select=endpoint,p256dh,auth&limit=50")
  } catch (err) {
    console.error("Push: could not load subscriptions:", err instanceof Error ? err.message : "unknown")
    return result
  }
  const message = JSON.stringify({ ...payload, vibrate: VIBRATION_PATTERN })
  await Promise.all(
    rows.map(async (r) => {
      try {
        await webpush.sendNotification({ endpoint: r.endpoint, keys: { p256dh: r.p256dh, auth: r.auth } }, message, {
          TTL: 6 * 60 * 60, // keep trying for 6 hours if the phone is offline
          urgency: "high", // deliver immediately, even when the phone is dozing
          timeout: SEND_TIMEOUT_MS,
        })
        result.sent++
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) {
          // The phone un-registered (app removed / permission revoked): forget it
          result.removed++
          await removeSubscription(r.endpoint).catch(() => {})
        } else {
          result.failed++
          console.error("Push send failed, status:", status ?? "network")
        }
      }
    }),
  )
  return result
}

export async function sendBookingPush(b: StoredTripRequest): Promise<SendResult> {
  try {
    return await sendPushToOperators(buildBookingPush(b))
  } catch (err) {
    console.error("Push alert error:", err instanceof Error ? err.name : "unknown")
    return { sent: 0, removed: 0, failed: 0 }
  }
}
