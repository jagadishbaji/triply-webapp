import { NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"
import { validateIndianPhone } from "@/lib/fareCalculator"

export interface StoredTripRequest {
  bookingRef: string
  createdAt: string
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
  status: "pending_confirmation" | "called_confirmed" | "driver_allotted" | "completed" | "cancelled"
  agreedTerms: boolean
  channel: "website_direct"
}

// ── In-Memory Cache (survives warm serverless invocations) ──────────────────
declare global {
  // eslint-disable-next-line no-var
  var __ridevo_memory_leads: StoredTripRequest[] | undefined
}

if (!globalThis.__ridevo_memory_leads) {
  globalThis.__ridevo_memory_leads = []
}

// ── Upstash / Vercel KV Config (Instant Cloud Database for Serverless) ─────
const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

// ── Vercel vs Local File System Resolution ──────────────────────────────────
const IS_VERCEL = Boolean(process.env.VERCEL)
const SEED_FILE = path.join(process.cwd(), "data", "trip-requests.json")
const RUNTIME_DIR = IS_VERCEL ? path.join("/tmp", "ridevo-data") : path.join(process.cwd(), "data")
const RUNTIME_FILE = path.join(RUNTIME_DIR, "trip-requests.json")

// ── Safe Seed Loader ────────────────────────────────────────────────────────
async function loadSeedBookings(): Promise<StoredTripRequest[]> {
  try {
    const raw = await fs.readFile(SEED_FILE, "utf-8")
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// ── Helper: Ensure storage & merge all bookings ─────────────────────────────
async function getAllBookings(): Promise<StoredTripRequest[]> {
  const mergedMap = new Map<string, StoredTripRequest>()

  // 1. Try Upstash / Vercel KV first (Live Cloud DB across all Vercel Lambdas)
  if (KV_URL && KV_TOKEN) {
    try {
      const res = await fetch(`${KV_URL}/get/ridevo_all_bookings`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` },
        cache: "no-store",
      })
      const data = await res.json()
      if (data?.result) {
        const parsed = typeof data.result === "string" ? JSON.parse(data.result) : data.result
        if (Array.isArray(parsed)) {
          for (const b of parsed) {
            if (b?.bookingRef) mergedMap.set(b.bookingRef, b)
          }
        }
      }
    } catch (err) {
      console.warn("KV bookings read failed, falling back to disk/seed:", err)
    }
  }

  // 2. Load bundled seed file
  const seedList = await loadSeedBookings()
  for (const b of seedList) {
    if (b?.bookingRef && !mergedMap.has(b.bookingRef)) mergedMap.set(b.bookingRef, b)
  }

  // 3. Load runtime file (/tmp or data/)
  try {
    const raw = await fs.readFile(RUNTIME_FILE, "utf-8")
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      for (const b of parsed) {
        if (b?.bookingRef) mergedMap.set(b.bookingRef, b)
      }
    }
  } catch {
    // File might not exist yet on fresh container
  }

  // 4. Load from global memory cache
  if (globalThis.__ridevo_memory_leads && Array.isArray(globalThis.__ridevo_memory_leads)) {
    for (const b of globalThis.__ridevo_memory_leads) {
      if (b?.bookingRef) mergedMap.set(b.bookingRef, b)
    }
  }

  const list = Array.from(mergedMap.values())
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return list
}

// ── Helper: Safely persist list to runtime disk & cloud KV ──────────────────
async function persistBookings(list: StoredTripRequest[]): Promise<void> {
  // Always update memory cache first
  globalThis.__ridevo_memory_leads = list

  // 1. Persist to Upstash / Vercel KV if available
  if (KV_URL && KV_TOKEN) {
    try {
      await fetch(`${KV_URL}/set/ridevo_all_bookings`, {
        method: "POST",
        headers: { Authorization: `Bearer ${KV_TOKEN}` },
        body: JSON.stringify(list),
      })
    } catch (err) {
      console.warn("KV bookings write failed:", err)
    }
  }

  // 2. Persist to runtime disk
  try {
    await fs.mkdir(RUNTIME_DIR, { recursive: true })
    await fs.writeFile(RUNTIME_FILE, JSON.stringify(list, null, 2), "utf-8")
  } catch (err) {
    console.warn("Storage write warning (Memory cache maintained):", err)
  }

  // In local dev, also keep data/trip-requests.json updated
  if (!IS_VERCEL) {
    try {
      await fs.writeFile(SEED_FILE, JSON.stringify(list, null, 2), "utf-8")
    } catch {
      // Non-fatal
    }
  }
}

// ── GET: List all saved trip requests ─────────────────────────────────────────
export async function GET() {
  try {
    const list = await getAllBookings()
    return NextResponse.json({
      success: true,
      count: list.length,
      bookings: list,
      storageEngine: KV_URL && KV_TOKEN ? "vercel_kv_upstash" : IS_VERCEL ? "vercel_ephemeral" : "local_disk",
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to retrieve bookings" },
      { status: 500 }
    )
  }
}

// ── POST: Receive & save customer trip request ────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      customerName,
      customerPhone,
      pickupAddress,
      source = "Hubli, Karnataka",
      destination,
      pickupDate,
      pickupTime = "06:00 AM",
      days = 1,
      carId = "sedan",
      carName = "Sedan",
      ratePerKm = 11,
      driverBata = 300,
      billedKm = 300,
      notes = "",
      agreedTerms = true,
      bookingRef: clientRef,
    } = body

    // Validation
    if (!customerName || typeof customerName !== "string" || customerName.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid full name (at least 2 characters)" },
        { status: 400 }
      )
    }

    const phoneValidation = validateIndianPhone(customerPhone)
    if (!phoneValidation.isValid) {
      return NextResponse.json(
        { success: false, error: phoneValidation.error || "Please provide a valid 10-digit mobile number" },
        { status: 400 }
      )
    }

    if (!pickupAddress || typeof pickupAddress !== "string" || pickupAddress.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid pickup landmark or address in Hubli" },
        { status: 400 }
      )
    }

    if (!destination || typeof destination !== "string" || destination.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Please provide a destination city" },
        { status: 400 }
      )
    }

    const numDays = Math.max(1, Number(days) || 1)
    const packageMinKm = numDays * 300
    const safeBilledKm = Math.max(packageMinKm, Number(billedKm) || packageMinKm)
    const extraKm = Math.max(0, safeBilledKm - packageMinKm)
    const kmFare = safeBilledKm * Number(ratePerKm)
    const bataTotal = numDays * Number(driverBata)
    const estimatedFare = kmFare + bataTotal

    const bookingRef =
      clientRef || `RV-HBX-${Math.floor(100000 + Math.random() * 900000)}`

    const newBooking: StoredTripRequest = {
      bookingRef,
      createdAt: new Date().toISOString(),
      customerName: customerName.trim(),
      customerPhone: phoneValidation.cleanPhone,
      pickupAddress: pickupAddress.trim(),
      source: source.trim(),
      destination: destination.trim(),
      pickupDate: pickupDate || new Date().toISOString().split("T")[0],
      pickupTime,
      days: numDays,
      carId,
      carName,
      ratePerKm: Number(ratePerKm),
      driverBata: Number(driverBata),
      packageMinKm,
      billedKm: safeBilledKm,
      extraKmBeyondPackage: extraKm,
      estimatedFare,
      notes: (notes || "").trim(),
      status: "pending_confirmation",
      agreedTerms: Boolean(agreedTerms),
      channel: "website_direct",
    }

    // Persist to safe storage (memory + disk)
    const existing = await getAllBookings()
    // Prepend new booking
    const updated = [newBooking, ...existing.filter((b) => b.bookingRef !== newBooking.bookingRef)]
    await persistBookings(updated)

    return NextResponse.json({
      success: true,
      message: "Trip plan received and saved securely in RIDEVO database",
      bookingRef: newBooking.bookingRef,
      booking: newBooking,
    })
  } catch (err: any) {
    console.error("Failed to save trip request:", err)
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process booking" },
      { status: 500 }
    )
  }
}

// ── PATCH: Update booking status ─────────────────────────────────────────────
export async function PATCH(req: Request) {
  try {
    const { bookingRef, status } = await req.json()
    if (!bookingRef || !status) {
      return NextResponse.json(
        { success: false, error: "bookingRef and status are required" },
        { status: 400 }
      )
    }

    const list = await getAllBookings()
    const target = list.find((b) => b.bookingRef === bookingRef)
    if (!target) {
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 })
    }

    target.status = status
    await persistBookings(list)

    return NextResponse.json({ success: true, booking: target })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update status" },
      { status: 500 }
    )
  }
}
