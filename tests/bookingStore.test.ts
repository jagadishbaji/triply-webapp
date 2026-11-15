import { describe, it } from "node:test"
import assert from "node:assert"
import { normalizeBooking, BOOKING_STATUSES } from "../src/lib/bookingStore.ts"

describe("booking normalisation", () => {
  it("fills missing fields so the admin page never breaks", () => {
    const b = normalizeBooking({ bookingRef: "OLD-1", customerName: "Old Customer" })
    assert.strictEqual(b.status, "pending_confirmation")
    assert.strictEqual(b.days, 1)
    assert.strictEqual(typeof b.estimatedFare, "number")
    assert.strictEqual(b.channel, "website_direct")
  })
  it("computes the fare when it is missing", () => {
    const b = normalizeBooking({ bookingRef: "X", days: 2, ratePerKm: 11, driverBata: 300, billedKm: 600 })
    assert.strictEqual(b.estimatedFare, 600 * 11 + 2 * 300)
  })
  it("replaces an unknown status with pending", () => {
    // @ts-expect-error testing bad input
    assert.strictEqual(normalizeBooking({ bookingRef: "Y", status: "hacked" }).status, "pending_confirmation")
    assert.ok(BOOKING_STATUSES.includes("completed"))
  })
  it("keeps real values", () => {
    const b = normalizeBooking({ bookingRef: "Z", status: "completed", estimatedFare: 7200, days: 2 })
    assert.strictEqual(b.status, "completed")
    assert.strictEqual(b.estimatedFare, 7200)
  })
})
