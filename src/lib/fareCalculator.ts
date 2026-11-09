// ── Outstation Fare & Validation Logic for Hubli Outstation Cabs ─────────────

export interface FleetCarConfig {
  id: string
  name: string
  subtitle: string
  badge: string
  ratePerKm: number
  driverBataPerDay: number
  minKmPerDay: number
  seats: number
  bags: number
  acType: string
  image: string
  description: string
  popularFor: string
  features: string[]
}

export const FLEET_CONFIGS: FleetCarConfig[] = [
  {
    id: "sedan",
    name: "Sedan",
    subtitle: "Swift Dzire / Etios / Aura",
    badge: "Most Popular & Budget",
    ratePerKm: 11,
    driverBataPerDay: 300,
    minKmPerDay: 300,
    seats: 4,
    bags: 2,
    acType: "Chilled AC",
    image: "/images/cars/sedan-nobg.png",
    description: "Compact & economical ride for small families, couples & business travelers.",
    popularFor: "Budget-friendly outstation & city-to-city trips",
    features: ["4+1 Seating", "2 Large Luggage", "₹11/km Rate", "₹300/day Driver Bata"],
  },
  {
    id: "ertiga",
    name: "Ertiga",
    subtitle: "Maruti Ertiga Smart Hybrid",
    badge: "Best for Family (6+1)",
    ratePerKm: 15,
    driverBataPerDay: 400,
    minKmPerDay: 300,
    seats: 6,
    bags: 3,
    acType: "Dual AC Vents",
    image: "/images/cars/ertiga-nobg.png",
    description: "Spacious 6-seater MPV with rear AC vents, ample headroom & smooth highway comfort.",
    popularFor: "Family vacations to Goa, Gokarna, Dandeli & Tirupati",
    features: ["6+1 Seating", "3 Suitcases", "₹15/km Rate", "₹400/day Driver Bata"],
  },
  {
    id: "innova",
    name: "Innova",
    subtitle: "Toyota Innova Classic",
    badge: "Spacious Comfort",
    ratePerKm: 16,
    driverBataPerDay: 400,
    minKmPerDay: 300,
    seats: 7,
    bags: 4,
    acType: "Triple Row AC",
    image: "/images/cars/innova-nobg.png",
    description: "The gold standard for long-distance Indian highways. Supreme reliability & legroom.",
    popularFor: "Group trips, elder family travel & long tours (500+ km)",
    features: ["7+1 Seating", "4 Suitcases", "₹16/km Rate", "₹400/day Driver Bata"],
  },
  {
    id: "crysta",
    name: "Innova Crysta",
    subtitle: "Toyota Innova Crysta Luxury",
    badge: "Executive VIP Luxury",
    ratePerKm: 18,
    driverBataPerDay: 400,
    minKmPerDay: 300,
    seats: 7,
    bags: 4,
    acType: "Climate Control AC",
    image: "/images/cars/crysta-nobg.png",
    description: "Plush leather captain seats, whisper-quiet cabin, top-tier suspension & unmatched luxury.",
    popularFor: "VIP delegates, weddings & premium vacation travel",
    features: ["7+1 Captain Seats", "4-5 Bags", "₹18/km Rate", "₹400/day Driver Bata"],
  },
]

export interface FareCalculationResult {
  packageMinKm: number
  billedKm: number
  extraKmBeyondPackage: number
  kmFare: number
  totalDriverBata: number
  estimatedTotal: number
  extraKmCharge: number
  extraKmRate: number
  hasExceededPackage: boolean
}

/**
 * Calculates Hubli outstation fare based on the commercial standard:
 * - Package Minimum: days * 300 km/day
 * - If travel is less than or equal to package: billed for days * 300 km
 * - If travel crosses package: billed for actual roundTripKm, with extra km charged at car.ratePerKm
 * - Total Driver Bata: days * car.driverBataPerDay
 */
export function calculateFare(
  car: Pick<FleetCarConfig, "ratePerKm" | "driverBataPerDay" | "minKmPerDay">,
  days: number,
  roundTripKm: number
): FareCalculationResult {
  const safeDays = Math.max(1, Math.round(days))
  const safeRoundTripKm = Math.max(0, Math.round(roundTripKm))

  const packageMinKm = safeDays * (car.minKmPerDay || 300)
  const billedKm = Math.max(packageMinKm, safeRoundTripKm)
  const extraKmBeyondPackage = Math.max(0, billedKm - packageMinKm)

  const kmFare = billedKm * car.ratePerKm
  const totalDriverBata = safeDays * car.driverBataPerDay
  const estimatedTotal = kmFare + totalDriverBata
  const extraKmCharge = extraKmBeyondPackage * car.ratePerKm

  return {
    packageMinKm,
    billedKm,
    extraKmBeyondPackage,
    kmFare,
    totalDriverBata,
    estimatedTotal,
    extraKmCharge,
    extraKmRate: car.ratePerKm,
    hasExceededPackage: extraKmBeyondPackage > 0,
  }
}

/**
 * Validates Indian 10-digit mobile number:
 * - Cleans non-digits, strips leading +91 or 0
 * - Checks for valid 10 digits starting with 6, 7, 8, 9
 */
export function validateIndianPhone(input: string): {
  isValid: boolean
  cleanPhone: string
  error?: string
} {
  if (!input || typeof input !== "string") {
    return { isValid: false, cleanPhone: "", error: "Phone number is required" }
  }

  let cleaned = input.replace(/\D/g, "")

  // Strip leading international country code 91 if 12 digits
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    cleaned = cleaned.substring(2)
  }
  // Strip leading 0 if 11 digits
  if (cleaned.length === 11 && cleaned.startsWith("0")) {
    cleaned = cleaned.substring(1)
  }

  if (cleaned.length !== 10) {
    return {
      isValid: false,
      cleanPhone: cleaned,
      error: "Phone number must be exactly 10 digits",
    }
  }

  if (!/^[6-9]\d{9}$/.test(cleaned)) {
    return {
      isValid: false,
      cleanPhone: cleaned,
      error: "Indian mobile numbers must start with 6, 7, 8, or 9",
    }
  }

  return { isValid: true, cleanPhone: cleaned }
}

/**
 * Haversine road distance approximation with 1.28 Western Ghats road winding factor
 */
export function calculateHaversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c * 1.28)
}

/**
 * Formats amount into Indian Rupee representation (e.g. ₹7,200)
 */
export function fmtINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}
