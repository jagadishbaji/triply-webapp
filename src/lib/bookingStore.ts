import fs from "fs/promises"
import path from "path"

// ─────────────────────────────────────────────────────────────────────────────
// Booking storage
//
//  • If Supabase is configured (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY), every
//    booking is a row in the `bookings` table. This is the preferred store.
//  • If Upstash / Vercel KV (Redis) is configured, EVERY booking is stored as its
//    own field of one Redis hash. Updating a status touches only that booking, so
//    nothing is lost and every server instance sees the same data.
//  • Without KV, bookings go to a JSON file (data/ locally, /tmp on Vercel).
//    On Vercel /tmp is private to each server instance and is wiped often, so this
//    mode is NOT reliable in production. The admin desk shows a warning for it.
// ─────────────────────────────────────────────────────────────────────────────

export type BookingStatus =
  | "pending_confirmation"
  | "called_confirmed"
  | "driver_allotted"
  | "completed"
  | "cancelled"

export const BOOKING_STATUSES: BookingStatus[] = [
  "pending_confirmation",
  "called_confirmed",
  "driver_allotted",
  "completed",
  "cancelled",
]

export interface StoredTripRequest {
  bookingRef: string
  createdAt: string
  updatedAt?: string
  customerName: string
  customerPhone: string
  pickupAddress: string
  source: string
  destination: string
  pickupDate: string
  pickupTime: string
  days: number
  carId: string
  carName: string
  ratePerKm: number
  driverBata: number
  packageMinKm: number
  billedKm: number
  extraKmBeyondPackage: number
  estimatedFare: number
  notes?: string
  status: BookingStatus
  agreedTerms: boolean
  channel: "website_direct"
}

export type StorageEngine = "supabase" | "vercel_kv_upstash" | "vercel_ephemeral" | "local_disk"

const SB_URL = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "")
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || ""
const USE_SUPABASE = Boolean(SB_URL && SB_KEY)
const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
const HASH_KEY = "ridevo:bookings"
const LEGACY_LIST_KEY = "ridevo_all_bookings" // older versions stored one big JSON list here
const IS_VERCEL = Boolean(process.env.VERCEL)

const RUNTIME_DIR = IS_VERCEL ? path.join("/tmp", "ridevo-data") : path.join(process.cwd(), "data")
const RUNTIME_FILE = path.join(RUNTIME_DIR, "trip-requests.json")

export function storageEngine(): StorageEngine {
  if (USE_SUPABASE) return "supabase"
  if (KV_URL && KV_TOKEN) return "vercel_kv_upstash"
  return IS_VERCEL ? "vercel_ephemeral" : "local_disk"
}

// ── Redis (Upstash REST) ─────────────────────────────────────────────────────
async function redis<T = unknown>(command: (string | number)[]): Promise<T> {
  const res = await fetch(KV_URL as string, {
    method: "POST",
    headers: { Authorization: `Bearer ${KV_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store",
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data?.error) {
    throw new Error(`Storage error: ${data?.error || res.status}`)
  }
  return data.result as T
}

// ── Make sure every field the admin page reads is present and the right type ──
export function normalizeBooking(raw: Partial<StoredTripRequest> & { bookingRef: string }): StoredTripRequest {
  const num = (v: unknown, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d)
  const days = Math.max(1, Math.floor(num(raw.days, 1)))
  const ratePerKm = num(raw.ratePerKm)
  const driverBata = num(raw.driverBata)
  const packageMinKm = num(raw.packageMinKm, days * 300)
  const billedKm = num(raw.billedKm, packageMinKm)
  const computedFare = billedKm * ratePerKm + days * driverBata
  const status = BOOKING_STATUSES.includes(raw.status as BookingStatus)
    ? (raw.status as BookingStatus)
    : "pending_confirmation"
  return {
    bookingRef: String(raw.bookingRef),
    createdAt: raw.createdAt && !isNaN(Date.parse(raw.createdAt)) ? raw.createdAt : new Date(0).toISOString(),
    updatedAt: raw.updatedAt,
    customerName: String(raw.customerName ?? ""),
    customerPhone: String(raw.customerPhone ?? ""),
    pickupAddress: String(raw.pickupAddress ?? ""),
    source: String(raw.source ?? "Hubli, Karnataka"),
    destination: String(raw.destination ?? ""),
    pickupDate: String(raw.pickupDate ?? ""),
    pickupTime: String(raw.pickupTime ?? ""),
    days,
    carId: String(raw.carId ?? ""),
    carName: String(raw.carName ?? raw.carId ?? ""),
    ratePerKm,
    driverBata,
    packageMinKm,
    billedKm,
    extraKmBeyondPackage: num(raw.extraKmBeyondPackage, Math.max(0, billedKm - packageMinKm)),
    estimatedFare: num(raw.estimatedFare, computedFare),
    notes: raw.notes ? String(raw.notes) : "",
    status,
    agreedTerms: Boolean(raw.agreedTerms),
    channel: "website_direct",
  }
}

function newestFirst(list: StoredTripRequest[]): StoredTripRequest[] {
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

// ── File mode (local dev, or Vercel without KV) ──────────────────────────────
declare global {
  // eslint-disable-next-line no-var
  var __ridevo_booking_cache: Map<string, StoredTripRequest> | undefined
  // eslint-disable-next-line no-var
  var __ridevo_booking_lock: Promise<unknown> | undefined
}

function cache(): Map<string, StoredTripRequest> {
  if (!globalThis.__ridevo_booking_cache) globalThis.__ridevo_booking_cache = new Map()
  return globalThis.__ridevo_booking_cache
}

async function readFileBookings(): Promise<Map<string, StoredTripRequest>> {
  const map = new Map<string, StoredTripRequest>()
  try {
    const parsed = JSON.parse(await fs.readFile(RUNTIME_FILE, "utf-8"))
    if (Array.isArray(parsed)) for (const b of parsed) if (b?.bookingRef) map.set(b.bookingRef, normalizeBooking(b))
  } catch {
    // no file yet
  }
  // Anything the file could not hold (read-only disk) is kept in memory
  for (const [k, v] of cache()) {
    const f = map.get(k)
    if (!f || new Date(v.updatedAt || v.createdAt) > new Date(f.updatedAt || f.createdAt)) map.set(k, v)
  }
  return map
}

async function writeFileBookings(map: Map<string, StoredTripRequest>): Promise<void> {
  globalThis.__ridevo_booking_cache = new Map(map)
  try {
    await fs.mkdir(RUNTIME_DIR, { recursive: true })
    await fs.writeFile(RUNTIME_FILE, JSON.stringify(newestFirst([...map.values()]), null, 2), "utf-8")
  } catch (err) {
    console.warn("Could not write bookings file (kept in memory only):", err)
  }
}

// One operation at a time inside a server instance, so two requests cannot overwrite each other
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = (globalThis.__ridevo_booking_lock ?? Promise.resolve()).then(fn, fn)
  globalThis.__ridevo_booking_lock = run.catch(() => undefined)
  return run
}


// ── Supabase (PostgREST over fetch; server-side only, uses the service role key) ──
type BookingRow = {
  booking_ref: string
  created_at: string
  updated_at: string | null
  customer_name: string
  customer_phone: string
  pickup_address: string
  source: string
  destination: string
  pickup_date: string
  pickup_time: string
  days: number
  car_id: string
  car_name: string
  rate_per_km: number | string
  driver_bata: number | string
  package_min_km: number
  billed_km: number
  extra_km_beyond_package: number
  estimated_fare: number | string
  notes: string | null
  status: string
  agreed_terms: boolean
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

function fromRow(r: BookingRow): StoredTripRequest {
  return normalizeBooking({
    bookingRef: r.booking_ref,
    createdAt: r.created_at,
    updatedAt: r.updated_at ?? undefined,
    customerName: r.customer_name,
    customerPhone: r.customer_phone,
    pickupAddress: r.pickup_address,
    source: r.source,
    destination: r.destination,
    pickupDate: r.pickup_date,
    pickupTime: r.pickup_time,
    days: r.days,
    carId: r.car_id,
    carName: r.car_name,
    ratePerKm: Number(r.rate_per_km),
    driverBata: Number(r.driver_bata),
    packageMinKm: r.package_min_km,
    billedKm: r.billed_km,
    extraKmBeyondPackage: r.extra_km_beyond_package,
    estimatedFare: Number(r.estimated_fare),
    notes: r.notes ?? "",
    status: r.status as BookingStatus,
    agreedTerms: r.agreed_terms,
  })
}

function toRow(b: StoredTripRequest): BookingRow {
  return {
    booking_ref: b.bookingRef,
    created_at: b.createdAt,
    updated_at: b.updatedAt ?? new Date().toISOString(),
    customer_name: b.customerName,
    customer_phone: b.customerPhone,
    pickup_address: b.pickupAddress,
    source: b.source,
    destination: b.destination,
    pickup_date: b.pickupDate,
    pickup_time: b.pickupTime,
    days: b.days,
    car_id: b.carId,
    car_name: b.carName,
    rate_per_km: b.ratePerKm,
    driver_bata: b.driverBata,
    package_min_km: b.packageMinKm,
    billed_km: b.billedKm,
    extra_km_beyond_package: b.extraKmBeyondPackage,
    estimated_fare: b.estimatedFare,
    notes: b.notes ?? "",
    status: b.status,
    agreed_terms: b.agreedTerms,
  }
}

// ── Public API ───────────────────────────────────────────────────────────────
export async function listBookings(): Promise<StoredTripRequest[]> {
  if (USE_SUPABASE) {
    const rows = await sb<BookingRow[]>("bookings?select=*&order=created_at.desc&limit=2000")
    return rows.map(fromRow)
  }
  if (KV_URL && KV_TOKEN) {
    let flat = await redis<string[]>(["HGETALL", HASH_KEY])
    if (!flat || flat.length === 0) {
      // One-time import of bookings saved by the older version
      const legacy = await redis<string | null>(["GET", LEGACY_LIST_KEY])
      if (legacy) {
        try {
          const list = JSON.parse(legacy)
          if (Array.isArray(list) && list.length) {
            const args: string[] = []
            for (const b of list) if (b?.bookingRef) args.push(b.bookingRef, JSON.stringify(normalizeBooking(b)))
            if (args.length) await redis(["HSET", HASH_KEY, ...args])
            flat = await redis<string[]>(["HGETALL", HASH_KEY])
          }
        } catch (err) {
          console.warn("Legacy booking import skipped:", err)
        }
      }
    }
    const out: StoredTripRequest[] = []
    for (let i = 0; i + 1 < (flat?.length ?? 0); i += 2) {
      try {
        const b = JSON.parse(flat[i + 1])
        out.push(normalizeBooking({ ...b, bookingRef: b?.bookingRef || flat[i] }))
      } catch {
        // skip a corrupt entry instead of failing the whole list
      }
    }
    return newestFirst(out)
  }
  return newestFirst([...(await readFileBookings()).values()])
}

export async function getBooking(ref: string): Promise<StoredTripRequest | null> {
  if (USE_SUPABASE) {
    const rows = await sb<BookingRow[]>(`bookings?select=*&booking_ref=eq.${encodeURIComponent(ref)}&limit=1`)
    return rows[0] ? fromRow(rows[0]) : null
  }
  if (KV_URL && KV_TOKEN) {
    const raw = await redis<string | null>(["HGET", HASH_KEY, ref])
    if (!raw) return null
    try {
      return normalizeBooking({ ...JSON.parse(raw), bookingRef: ref })
    } catch {
      return null
    }
  }
  return (await readFileBookings()).get(ref) ?? null
}

export async function saveBooking(booking: StoredTripRequest): Promise<void> {
  const b = normalizeBooking({ ...booking, updatedAt: new Date().toISOString() })
  if (USE_SUPABASE) {
    // Plain insert: a duplicate booking reference fails instead of overwriting someone else's booking
    await sb("bookings", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(toRow(b)) })
    return
  }
  if (KV_URL && KV_TOKEN) {
    await redis(["HSET", HASH_KEY, b.bookingRef, JSON.stringify(b)])
    return
  }
  await withLock(async () => {
    const map = await readFileBookings()
    map.set(b.bookingRef, b)
    await writeFileBookings(map)
  })
}

export async function updateBookingStatus(ref: string, status: BookingStatus): Promise<StoredTripRequest | null> {
  if (USE_SUPABASE) {
    const rows = await sb<BookingRow[]>(`bookings?booking_ref=eq.${encodeURIComponent(ref)}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ status, updated_at: new Date().toISOString() }),
    })
    return rows[0] ? fromRow(rows[0]) : null
  }
  if (KV_URL && KV_TOKEN) {
    const current = await getBooking(ref)
    if (!current) return null
    const updated = { ...current, status, updatedAt: new Date().toISOString() }
    await redis(["HSET", HASH_KEY, ref, JSON.stringify(updated)])
    return updated
  }
  return withLock(async () => {
    const map = await readFileBookings()
    const current = map.get(ref)
    if (!current) return null
    const updated = { ...current, status, updatedAt: new Date().toISOString() }
    map.set(ref, updated)
    await writeFileBookings(map)
    return updated
  })
}
