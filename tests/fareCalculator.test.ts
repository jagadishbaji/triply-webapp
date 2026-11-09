import { describe, it } from "node:test"
import assert from "node:assert"
import {
  calculateFare,
  validateIndianPhone,
  calculateHaversineKm,
  FLEET_CONFIGS,
  fmtINR,
} from "../src/lib/fareCalculator.ts"

describe("Outstation Fare Calculation Engine", () => {
  const sedan = FLEET_CONFIGS.find((c) => c.id === "sedan")!
  const ertiga = FLEET_CONFIGS.find((c) => c.id === "ertiga")!
  const innova = FLEET_CONFIGS.find((c) => c.id === "innova")!
  const crysta = FLEET_CONFIGS.find((c) => c.id === "crysta")!

  it("should bill for 300 km package minimum when 1-day travel is under 300 km", () => {
    // Customer travels 180 km in 1 day
    const fare = calculateFare(sedan, 1, 180)
    assert.strictEqual(fare.packageMinKm, 300)
    assert.strictEqual(fare.billedKm, 300)
    assert.strictEqual(fare.extraKmBeyondPackage, 0)
    assert.strictEqual(fare.hasExceededPackage, false)
    // 300 km * ₹11 = 3300 + 1 day Bata ₹300 = ₹3600
    assert.strictEqual(fare.kmFare, 3300)
    assert.strictEqual(fare.totalDriverBata, 300)
    assert.strictEqual(fare.estimatedTotal, 3600)
  })

  it("should calculate extra km fare when 1-day travel exceeds 300 km", () => {
    // Customer travels 350 km in 1 day (50 km crossed)
    const fare = calculateFare(sedan, 1, 350)
    assert.strictEqual(fare.packageMinKm, 300)
    assert.strictEqual(fare.billedKm, 350)
    assert.strictEqual(fare.extraKmBeyondPackage, 50)
    assert.strictEqual(fare.hasExceededPackage, true)
    // 50 km * ₹11 = ₹550 extra
    assert.strictEqual(fare.extraKmCharge, 550)
    // 350 km * ₹11 = 3850 + ₹300 Bata = ₹4150
    assert.strictEqual(fare.kmFare, 3850)
    assert.strictEqual(fare.totalDriverBata, 300)
    assert.strictEqual(fare.estimatedTotal, 4150)
  })

  it("should calculate Ertiga 2-day Goa package (600 km minimum allowance)", () => {
    // Hubli to Goa round trip ~360 km across 2 days
    const fare = calculateFare(ertiga, 2, 360)
    assert.strictEqual(fare.packageMinKm, 600)
    assert.strictEqual(fare.billedKm, 600)
    assert.strictEqual(fare.extraKmBeyondPackage, 0)
    assert.strictEqual(fare.hasExceededPackage, false)
    // 600 km * ₹15 = 9000 + 2 days Bata (2 * ₹400 = ₹800) = ₹9800
    assert.strictEqual(fare.kmFare, 9000)
    assert.strictEqual(fare.totalDriverBata, 800)
    assert.strictEqual(fare.estimatedTotal, 9800)
  })

  it("should calculate extra km when 2-day trip crosses 600 km", () => {
    // Customer travels 700 km in 2 days (100 km extra)
    const fare = calculateFare(ertiga, 2, 700)
    assert.strictEqual(fare.packageMinKm, 600)
    assert.strictEqual(fare.billedKm, 700)
    assert.strictEqual(fare.extraKmBeyondPackage, 100)
    assert.strictEqual(fare.hasExceededPackage, true)
    // 100 km * ₹15 = ₹1500 extra km charge
    assert.strictEqual(fare.extraKmCharge, 1500)
    // 700 km * ₹15 = 10500 + 2 days Bata ₹800 = ₹11300
    assert.strictEqual(fare.kmFare, 10500)
    assert.strictEqual(fare.totalDriverBata, 800)
    assert.strictEqual(fare.estimatedTotal, 11300)
  })

  it("should calculate Toyota Innova (₹16/km, ₹400/day driver bata) correctly", () => {
    // 3 days trip with 900 km package allowance
    const fare = calculateFare(innova, 3, 900)
    assert.strictEqual(fare.packageMinKm, 900)
    assert.strictEqual(fare.billedKm, 900)
    // 900 * 16 = 14400 + 3 * 400 = 1200 => 15600
    assert.strictEqual(fare.kmFare, 14400)
    assert.strictEqual(fare.totalDriverBata, 1200)
    assert.strictEqual(fare.estimatedTotal, 15600)
  })

  it("should calculate Innova Crysta VIP (₹18/km, ₹400/day driver bata) with extra km", () => {
    // 2 days trip with 650 km travel (50 km extra crossed)
    const fare = calculateFare(crysta, 2, 650)
    assert.strictEqual(fare.packageMinKm, 600)
    assert.strictEqual(fare.billedKm, 650)
    assert.strictEqual(fare.extraKmBeyondPackage, 50)
    assert.strictEqual(fare.extraKmCharge, 50 * 18) // 900
    // 650 * 18 = 11700 + 800 = 12500
    assert.strictEqual(fare.estimatedTotal, 12500)
  })

  it("should guard against negative days or zero km gracefully", () => {
    const fare = calculateFare(sedan, 0, -50)
    assert.strictEqual(fare.packageMinKm, 300) // normalized to at least 1 day (300 km)
    assert.strictEqual(fare.billedKm, 300)
    assert.strictEqual(fare.estimatedTotal, 3600)
  })
})

describe("Indian Mobile Number Validation", () => {
  it("should accept valid 10-digit mobile numbers starting with 9, 8, 7, 6", () => {
    assert.strictEqual(validateIndianPhone("9876543210").isValid, true)
    assert.strictEqual(validateIndianPhone("8884856868").isValid, true)
    assert.strictEqual(validateIndianPhone("7012345678").isValid, true)
    assert.strictEqual(validateIndianPhone("6234567890").isValid, true)
  })

  it("should clean country code +91 and 0 prefixes", () => {
    const res1 = validateIndianPhone("+91 8884856868")
    assert.strictEqual(res1.isValid, true)
    assert.strictEqual(res1.cleanPhone, "8884856868")

    const res2 = validateIndianPhone("08884856868")
    assert.strictEqual(res2.isValid, true)
    assert.strictEqual(res2.cleanPhone, "8884856868")

    const res3 = validateIndianPhone("+91-98765-43210")
    assert.strictEqual(res3.isValid, true)
    assert.strictEqual(res3.cleanPhone, "9876543210")
  })

  it("should reject invalid mobile numbers", () => {
    assert.strictEqual(validateIndianPhone("1234567890").isValid, false) // starts with 1
    assert.strictEqual(validateIndianPhone("5555555555").isValid, false) // starts with 5
    assert.strictEqual(validateIndianPhone("98765").isValid, false) // too short
    assert.strictEqual(validateIndianPhone("9876543210999").isValid, false) // too long
    assert.strictEqual(validateIndianPhone("").isValid, false) // empty
  })
})

describe("Haversine Road Distance Approximation", () => {
  it("should estimate Hubli to Goa road distance close to 180 km", () => {
    // Hubli: 15.3647, 75.1240 | Panaji Goa: 15.4909, 73.8278
    const dist = calculateHaversineKm(15.3647, 75.124, 15.4909, 73.8278)
    assert.ok(dist >= 160 && dist <= 210, `Expected ~180 km, got ${dist}`)
  })

  it("should estimate Hubli to Hampi road distance close to 150 km", () => {
    // Hubli: 15.3647, 75.1240 | Hampi: 15.3350, 76.4600
    const dist = calculateHaversineKm(15.3647, 75.124, 15.335, 76.46)
    assert.ok(dist >= 140 && dist <= 190, `Expected ~150 km, got ${dist}`)
  })
})

describe("Currency Formatting", () => {
  it("should format INR without decimals", () => {
    const formatted = fmtINR(7200)
    assert.ok(formatted.includes("7,200"))
  })
})
