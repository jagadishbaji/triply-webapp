import { NextResponse } from "next/server"
import { validateIndianPhone, FLEET_CONFIGS } from "@/lib/fareCalculator"
import { isOperator } from "@/lib/operatorAuth"
import {
  BOOKING_STATUSES,
  getBooking,
  listBookings,
  saveBooking,
  storageEngine,
  updateBookingStatus,
  type BookingStatus,
  type StoredTripRequest,
} from "@/lib/bookingStore"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const NO_STORE = { "Cache-Control": "no-store, max-age=0" }

// ── GET: List all saved trip requests ─────────────────────────────────────────
export async function GET(req: Request) {
  if (!isOperator(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }
  try {
    const list = await listBookings()
    return NextResponse.json(
      { success: true, count: list.length, bookings: list, storageEngine: storageEngine() },
      { headers: NO_STORE }
    )
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to retrieve bookings" },
      { status: 503, headers: NO_STORE }
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

    // Price is always calculated on the server from the official rate card,
    // never trusted from the browser.
    const car = FLEET_CONFIGS.find((c) => c.id === carId)
    if (!car) {
      return NextResponse.json({ success: false, error: "Unknown car type" }, { status: 400 })
    }
    const ratePerKm = car.ratePerKm
    const driverBata = car.driverBataPerDay
    const carName = car.name

    const numDays = Math.min(30, Math.max(1, Math.floor(Number(days) || 1)))
    const packageMinKm = numDays * 300
    const safeBilledKm = Math.min(6000, Math.max(packageMinKm, Number(billedKm) || packageMinKm))
    const extraKm = Math.max(0, safeBilledKm - packageMinKm)
    const kmFare = safeBilledKm * Number(ratePerKm)
    const bataTotal = numDays * Number(driverBata)
    const estimatedFare = kmFare + bataTotal

    // Use the browser's reference only if it looks valid and is not already taken;
    // otherwise create a fresh one. A customer can never overwrite someone else's booking.
    let bookingRef = ""
    if (typeof clientRef === "string" && /^[A-Za-z0-9-]{6,40}$/.test(clientRef) && !(await getBooking(clientRef))) {
      bookingRef = clientRef
    }
    while (!bookingRef) {
      const candidate = `RV-HBX-${Math.floor(100000 + Math.random() * 900000)}`
      if (!(await getBooking(candidate))) bookingRef = candidate
    }

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

    await saveBooking(newBooking)

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
  if (!isOperator(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }
  try {
    const { bookingRef, status } = await req.json()
    if (!bookingRef || !status || !BOOKING_STATUSES.includes(status as BookingStatus)) {
      return NextResponse.json(
        { success: false, error: "bookingRef and a valid status are required" },
        { status: 400 }
      )
    }

    const updated = await updateBookingStatus(String(bookingRef), status as BookingStatus)
    if (!updated) {
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, booking: updated }, { headers: NO_STORE })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update status" },
      { status: 503, headers: NO_STORE }
    )
  }
}

export type { StoredTripRequest }
