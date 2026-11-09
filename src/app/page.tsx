"use client"

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { RidevoLogo } from "@/components/RidevoLogo"
import {
  Car, MapPin, Calendar, Clock, ArrowRight, Shield,
  Users, CheckCircle2, Phone, Mail, Building2,
  Check, Copy, Sparkles, Navigation, AlertCircle,
  HelpCircle, MessageCircle, ChevronDown, RefreshCw,
  Fuel, Luggage, ShieldCheck, Star, Award, Compass,
  ChevronRight, CheckSquare, Square, FileText, ArrowUpRight,
  Info
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Navbar from "@/components/navbar"
import { toast, Toaster } from "sonner"
import {
  calculateFare,
  validateIndianPhone,
  calculateHaversineKm,
  fmtINR,
  FLEET_CONFIGS,
  type FleetCarConfig,
  type FareCalculationResult
} from "@/lib/fareCalculator"

// ── Contact & Business Defaults ─────────────────────────────────────────────
const BOOKING_HELPLINE_PHONE = "+91 8884856868"
const BOOKING_HELPLINE_PHONE_DIGITS = "918884856868"
const DEFAULT_SOURCE = "Hubli, Karnataka"

// ── Popular Outstation Destinations from Hubli with Estimated 1-Way Km ──────
const POPULAR_DESTINATIONS = [
  { name: "Goa (Panaji)", km: 180, days: 2, label: "Top Holiday Route" },
  { name: "Hampi (UNESCO Tour)", km: 150, days: 2, label: "Heritage Circuit" },
  { name: "Gokarna & Murudeshwar", km: 155, days: 2, label: "Beaches & Temple" },
  { name: "Dandeli (Resorts)", km: 75, days: 1, label: "Adventure & Rafting" },
  { name: "Bengaluru (Bangalore)", km: 410, days: 2, label: "Highway Express" },
  { name: "Badami & Aihole", km: 105, days: 1, label: "Cave Temples" },
  { name: "Belgaum", km: 105, days: 1, label: "Business Travel" },
  { name: "Pune", km: 430, days: 2, label: "Intercity Highway" },
]

// ── Time Slots ──────────────────────────────────────────────────────────────
const TIME_SLOTS = [
  "04:00 AM", "05:00 AM", "06:00 AM", "07:00 AM", "08:00 AM", "09:00 AM",
  "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM",
  "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM",
  "10:00 PM", "11:00 PM"
]

// ── Photon Autocomplete Feature Type ─────────────────────────────────────────
interface PhotonSuggestion {
  name: string
  sub?: string
  lon?: number
  lat?: number
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export default function HomePage() {
  const [todayStr, setTodayStr] = useState("2026-11-08")
  const [pickupDate, setPickupDate] = useState("2026-11-09")
  const [source, setSource] = useState(DEFAULT_SOURCE)
  const [destination, setDestination] = useState("")

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0]
    setTodayStr(today)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    setPickupDate(tomorrow.toISOString().split("T")[0])
  }, [])
  const [pickupTime, setPickupTime] = useState("06:00 AM")
  const [days, setDays] = useState(2)

  // ── Coordinates for Distance Computation ──
  const [sourceCoords, setSourceCoords] = useState<{ lat: number; lon: number } | null>({
    lat: 15.3647,
    lon: 75.124,
  })
  const [destCoords, setDestCoords] = useState<{ lat: number; lon: number } | null>(null)

  // ── Autocomplete Dropdown States ──
  const [sourceSuggestions, setSourceSuggestions] = useState<PhotonSuggestion[]>([])
  const [destSuggestions, setDestSuggestions] = useState<PhotonSuggestion[]>([])
  const [showSourceMenu, setShowSourceMenu] = useState(false)
  const [showDestMenu, setShowDestMenu] = useState(false)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const abortCtrlRef = useRef<AbortController | null>(null)

  // ── Distance Calculation States ──
  const [calculatingDistance, setCalculatingDistance] = useState(false)
  const [roundTripKm, setRoundTripKm] = useState<number>(600) // Default fallback = 2 days * 300km
  const [isDistanceExact, setIsDistanceExact] = useState(false)

  // ── Booking Sheet / Modal States ──
  const [selectedCar, setSelectedCar] = useState<FleetCarConfig | null>(null)
  const [bookingModalOpen, setBookingModalOpen] = useState(false)
  const [bookingStep, setBookingStep] = useState<"form" | "submitting" | "confirmed">("form")
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [pickupAddress, setPickupAddress] = useState("")
  const [customerNotes, setCustomerNotes] = useState("")
  const [agreedTerms, setAgreedTerms] = useState(false)
  const [termsError, setTermsError] = useState(false)
  const [bookingRef, setBookingRef] = useState("")
  const [copiedRef, setCopiedRef] = useState(false)

  // ── Accordion FAQ State ──
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0)
  const [visitorCount, setVisitorCount] = useState<number>(1420)

  // ── Track & Fetch Page Visitors ──
  useEffect(() => {
    try {
      const recorded = sessionStorage.getItem("ridevo_visited_session")
      if (!recorded) {
        fetch("/api/visitor-count", { method: "POST" })
          .then((r) => r.json())
          .then((d) => {
            if (d?.totalVisits) setVisitorCount(d.totalVisits)
          })
          .catch(() => {})
        sessionStorage.setItem("ridevo_visited_session", "true")
      } else {
        fetch("/api/visitor-count")
          .then((r) => r.json())
          .then((d) => {
            if (d?.totalVisits) setVisitorCount(d.totalVisits)
          })
          .catch(() => {})
      }
    } catch {}
  }, [])

  const resultsRef = useRef<HTMLDivElement>(null)
  const dateInputRef = useRef<HTMLInputElement>(null)

  // ── Autocomplete Fetch via Photon (Biased around Hubli lat:15.3647, lon:75.1240) ──
  const fetchPhoton = async (query: string): Promise<PhotonSuggestion[]> => {
    if (!query || query.trim().length < 2) return []
    try {
      if (abortCtrlRef.current) abortCtrlRef.current.abort()
      abortCtrlRef.current = new AbortController()

      const res = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6&lat=15.3647&lon=75.1240`,
        { signal: abortCtrlRef.current.signal }
      )
      const data = await res.json()
      return (data.features || []).map((f: any) => {
        const p = f.properties || {}
        const sub = [p.city, p.state].filter(Boolean).join(", ")
        return {
          name: p.name || query,
          sub: sub && sub !== p.name ? sub : undefined,
          lon: f.geometry?.coordinates?.[0],
          lat: f.geometry?.coordinates?.[1],
        }
      })
    } catch (e: any) {
      if (e.name === "AbortError") return []
      return []
    }
  }

  // Handle source autocomplete typing
  useEffect(() => {
    if (!showSourceMenu || source.length < 2) return
    const timer = setTimeout(async () => {
      setLoadingSuggestions(true)
      const list = await fetchPhoton(source)
      setSourceSuggestions(list)
      setLoadingSuggestions(false)
    }, 250)
    return () => clearTimeout(timer)
  }, [source, showSourceMenu])

  // Handle destination autocomplete typing
  useEffect(() => {
    if (!showDestMenu || destination.length < 2) return
    const timer = setTimeout(async () => {
      setLoadingSuggestions(true)
      const list = await fetchPhoton(destination)
      setDestSuggestions(list)
      setLoadingSuggestions(false)
    }, 250)
    return () => clearTimeout(timer)
  }, [destination, showDestMenu])

  // ── Driving Distance Calculation (OSRM with Haversine Fallback) ──
  const calculateDrivingDistance = useCallback(
    async (sLat: number, sLon: number, dLat: number, dLon: number) => {
      setCalculatingDistance(true)
      try {
        const osrmController = new AbortController()
        const timeout = setTimeout(() => osrmController.abort(), 2500)

        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${sLon},${sLat};${dLon},${dLat}?overview=false`
        const res = await fetch(osrmUrl, { signal: osrmController.signal })
        clearTimeout(timeout)

        if (res.ok) {
          const data = await res.json()
          if (data.routes && data.routes[0]?.distance) {
            const oneWayKm = Math.round(data.routes[0].distance / 1000)
            const rt = oneWayKm * 2
            setRoundTripKm(rt)
            setIsDistanceExact(true)
            setCalculatingDistance(false)
            return
          }
        }
      } catch {
        // Fallback gracefully
      }

      // Fallback: Haversine with 1.28 Western Ghats road winding factor
      const approxOneWay = calculateHaversineKm(sLat, sLon, dLat, dLon)
      const approxRt = approxOneWay * 2
      setRoundTripKm(approxRt)
      setIsDistanceExact(false)
      setCalculatingDistance(false)
    },
    []
  )

  // Re-calculate distance whenever coordinates change
  useEffect(() => {
    if (sourceCoords && destCoords) {
      calculateDrivingDistance(sourceCoords.lat, sourceCoords.lon, destCoords.lat, destCoords.lon)
    } else {
      const matched = POPULAR_DESTINATIONS.find((p) =>
        destination.toLowerCase().includes(p.name.toLowerCase().split(" ")[0])
      )
      if (matched) {
        setRoundTripKm(matched.km * 2)
        setIsDistanceExact(true)
      } else {
        setRoundTripKm(days * 300)
      }
    }
  }, [sourceCoords, destCoords, destination, days, calculateDrivingDistance])

  // ── Pricing Computation Engine (Using verified calculateFare helper) ──
  const packageMinKm = days * 300
  const billedKm = Math.max(packageMinKm, roundTripKm)
  const extraKmBeyondPackage = Math.max(0, billedKm - packageMinKm)

  const computeCarFare = (car: FleetCarConfig): FareCalculationResult => {
    return calculateFare(car, days, roundTripKm)
  }

  // ── Handle Destination Quick Select ──
  const handleQuickDestinationSelect = (destName: string, destKm: number, defaultDays?: number) => {
    setDestination(destName)
    setShowDestMenu(false)
    if (defaultDays) {
      setDays(defaultDays)
    }
    setRoundTripKm(destKm * 2)
    setIsDistanceExact(true)
    toast.success(`Selected route: Hubli ➔ ${destName} (~${destKm * 2} km round trip)`)
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 150)
  }

  // ── Handle Main Search Submission ──
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!destination.trim()) {
      toast.error("Please enter a destination (e.g. Goa, Hampi, Bengaluru, Dandeli, Gokarna)")
      return
    }

    if (!destCoords) {
      try {
        const items = await fetchPhoton(destination)
        if (items[0]?.lat && items[0]?.lon && sourceCoords) {
          setDestCoords({ lat: items[0].lat, lon: items[0].lon })
          await calculateDrivingDistance(sourceCoords.lat, sourceCoords.lon, items[0].lat, items[0].lon)
        }
      } catch {
        // Fallback already handled
      }
    }

    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    toast.info(`Updated fleet rates for ${days} Day(s) trip to ${destination}`)
  }

  // ── Open Booking Modal ──
  const openBookingForCar = (car: FleetCarConfig) => {
    if (!destination.trim()) {
      toast.error("Please enter your destination first (e.g. Goa, Hampi, Gokarna)")
      return
    }
    setSelectedCar(car)
    setBookingStep("form")
    setAgreedTerms(false)
    setTermsError(false)
    setBookingModalOpen(true)
  }

  // ── Submit Booking Lead & Secure In Project Database ──
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!customerName.trim() || customerName.trim().length < 2) {
      toast.error("Please enter your full name")
      return
    }

    const phoneValidation = validateIndianPhone(customerPhone)
    if (!phoneValidation.isValid) {
      toast.error(phoneValidation.error || "Please enter a valid 10-digit Indian mobile number")
      return
    }

    if (!pickupAddress.trim()) {
      toast.error("Please provide your pickup address / landmark in Hubli")
      return
    }

    if (!agreedTerms) {
      setTermsError(true)
      toast.error("Please check the Terms & Conditions box to proceed with booking")
      return
    }

    setBookingStep("submitting")

    // Generate memorable reference ID: e.g. RV-HBX-748291
    const refCode = `RV-HBX-${Math.floor(100000 + Math.random() * 900000)}`
    setBookingRef(refCode)

    const fare = selectedCar ? computeCarFare(selectedCar) : null

    const leadData = {
      bookingRef: refCode,
      createdAt: new Date().toISOString(),
      customerName: customerName.trim(),
      customerPhone: phoneValidation.cleanPhone,
      pickupAddress: pickupAddress.trim(),
      source: source.trim(),
      destination: destination.trim(),
      pickupDate,
      pickupTime,
      days,
      carId: selectedCar?.id,
      carName: selectedCar?.name,
      ratePerKm: selectedCar?.ratePerKm,
      driverBata: selectedCar?.driverBataPerDay,
      billedKm,
      estimatedFare: fare?.estimatedTotal || 0,
      notes: customerNotes.trim(),
      agreedTerms: true,
      status: "pending_confirmation",
    }

    // 1. CRITICAL: Persist to local project database (data/trip-requests.json via /api/trip-requests)
    // This ensures WE NEVER LOSE A BOOKING even if customer doesn't send WhatsApp!
    try {
      const apiRes = await fetch("/api/trip-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leadData),
      })
      const apiData = await apiRes.json()
      if (apiData?.bookingRef) {
        setBookingRef(apiData.bookingRef)
      }
    } catch (err) {
      console.warn("API write warning (LocalStorage fallback active):", err)
    }

    // 2. Save to customer browser LocalStorage
    try {
      const existing = JSON.parse(localStorage.getItem("triply_my_trips") || "[]")
      existing.unshift(leadData)
      localStorage.setItem("triply_my_trips", JSON.stringify(existing.slice(0, 10)))
    } catch {
      // Non-fatal
    }

    setBookingStep("confirmed")
    toast.success("Trip plan received! Our RIDEVO Hubli Ride Coordinator will call you shortly.")
  }

  // ── Construct WhatsApp Deep Link ──
  const generateWhatsAppLink = (car: FleetCarConfig | null) => {
    if (!car) return "#"
    const fare = computeCarFare(car)
    const msg =
      `*🚖 NEW TRIP INQUIRY - RIDEVO HUBLI*\n` +
      `*Ref:* ${bookingRef || "Pending"}\n` +
      `---------------------------------------\n` +
      `*Trip:* ${source} ➔ ${destination}\n` +
      `*Duration:* ${days} Day(s)\n` +
      `*Pickup Date:* ${pickupDate} at ${pickupTime}\n` +
      `*Selected Car:* ${car.name} (${car.subtitle})\n` +
      `*Rate:* ₹${car.ratePerKm}/km | Driver Bata: ₹${car.driverBataPerDay}/day\n` +
      `*Included Package:* ${days * 300} km (${billedKm} km total)\n` +
      `*Estimated Fare:* ${fmtINR(fare.estimatedTotal)}\n` +
      `*Extra KM Policy:* If crossed, extra km charged @ ₹${car.ratePerKm}/km.\n` +
      `---------------------------------------\n` +
      (customerName ? `*Customer Name:* ${customerName}\n` : "") +
      (customerPhone ? `*Phone:* ${customerPhone}\n` : "") +
      (pickupAddress ? `*Pickup Landmark:* ${pickupAddress}\n` : "") +
      (customerNotes ? `*Special Notes:* ${customerNotes}\n` : "") +
      `\nPlease confirm vehicle availability & allot verified driver.`

    return `https://wa.me/${BOOKING_HELPLINE_PHONE_DIGITS}?text=${encodeURIComponent(msg)}`
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-green-500 selection:text-white">
      <Toaster position="top-right" richColors />
      <Navbar />

      {/* ═══════════════════════════════════════════════════════════════════════
          HERO SECTION (High-Converting Copy for Hubli, Goa, Hampi Searches)
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative flex items-center bg-gradient-to-br from-slate-950 via-green-950 to-slate-900 pt-16 pb-14 overflow-hidden">
        {/* Glow ambient background effects */}
        <div
          className="absolute inset-0 opacity-25 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 15% 45%, #16a34a 0%, transparent 45%),
                             radial-gradient(circle at 85% 25%, #15803d 0%, transparent 40%),
                             radial-gradient(circle at 60% 80%, #064e3b 0%, transparent 45%)`,
          }}
        />
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2316a34a' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12 w-full relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Left Hero Content */}
            <motion.div
              className="flex-1 text-center lg:text-left"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Trust Pill & Live Visitors Counter */}
              <div className="inline-flex items-center flex-wrap gap-2 sm:gap-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-4 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Hubli&apos;s Dedicated Outstation Fleet</span>
                <span className="text-emerald-500/60 hidden sm:inline">•</span>
                <span className="text-emerald-300 font-bold flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  <span suppressHydrationWarning>{visitorCount.toLocaleString("en-IN")}+ Travelers Visited</span>
                </span>
              </div>

              {/* High-Intent SEO Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-[1.14] tracking-tight mb-3">
                Cabs in <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">Hubli.</span><br />
                Hubli to Goa, Hampi &amp; Beyond at Fixed Rates.
              </h1>

              <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto lg:mx-0 mb-5 leading-relaxed">
                Tired of calling 10 different tours &amp; travels operators in Hubli to compare rates?
                Get guaranteed transparent pricing for <strong>Sedan (₹11/km)</strong>,{" "}
                <strong>Ertiga (₹15/km)</strong>, <strong>Innova (₹16/km)</strong> &amp;{" "}
                <strong>Crysta (₹18/km)</strong>. Book in 30 seconds with <strong>zero advance payment</strong>{" "}
                — our local Hubli coordinator confirms your ride in 15 minutes.
              </p>

              {/* Verified Badges Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-xl mx-auto lg:mx-0">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 sm:p-3 text-center backdrop-blur-sm hover:border-emerald-500/30 transition-colors">
                  <div className="text-xs text-emerald-400 font-bold flex items-center justify-center gap-1.5 mb-0.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Verified
                  </div>
                  <div className="text-[11px] text-slate-300 font-medium">Tied-up Hubli Cabs</div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 sm:p-3 text-center backdrop-blur-sm hover:border-emerald-500/30 transition-colors">
                  <div className="text-xs text-emerald-400 font-bold flex items-center justify-center gap-1.5 mb-0.5">
                    <Navigation className="w-4 h-4 text-emerald-400" /> 300 km/day
                  </div>
                  <div className="text-[11px] text-slate-300 font-medium">Standard Allowance</div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 sm:p-3 text-center backdrop-blur-sm hover:border-emerald-500/30 transition-colors">
                  <div className="text-xs text-emerald-400 font-bold flex items-center justify-center gap-1.5 mb-0.5">
                    <Award className="w-4 h-4 text-emerald-400" /> ₹0 Advance
                  </div>
                  <div className="text-[11px] text-slate-300 font-medium">Pay After Your Trip</div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 sm:p-3 text-center backdrop-blur-sm hover:border-emerald-500/30 transition-colors">
                  <div className="text-xs text-emerald-400 font-bold flex items-center justify-center gap-1.5 mb-0.5">
                    <Phone className="w-4 h-4 text-emerald-400" /> 15 Min
                  </div>
                  <div className="text-[11px] text-slate-300 font-medium">Phone Confirmation</div>
                </div>
              </div>
            </motion.div>

            {/* Right Hero Visual Card */}
            <motion.div
              className="flex-1 w-full max-w-md lg:max-w-none flex justify-center lg:justify-end"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              <div className="bg-gradient-to-b from-slate-900/95 to-slate-950/95 border border-green-500/20 rounded-2xl p-4 sm:p-5 backdrop-blur-xl shadow-2xl w-full max-w-sm sm:max-w-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-28 h-28 bg-green-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
                      Guaranteed Hubli Tariffs
                    </span>
                  </div>
                  <span className="text-[10px] bg-green-500/20 text-green-300 font-bold px-2 py-0.5 rounded-full border border-green-500/30">
                    Transparent Rate Card
                  </span>
                </div>

                {/* Quick Fleet Rate List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-green-500/40 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 font-black text-xs">
                        4S
                      </div>
                      <div>
                        <div className="text-white font-bold text-xs sm:text-sm">Sedan (Dzire / Etios)</div>
                        <div className="text-[11px] text-slate-400">Driver Bata ₹300/day</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-black text-sm sm:text-base">₹11 / km</div>
                      <div className="text-[10px] text-slate-400">300 km/day min</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-green-500/40 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 font-black text-xs">
                        6S
                      </div>
                      <div>
                        <div className="text-white font-bold text-xs sm:text-sm">Ertiga (Smart Hybrid)</div>
                        <div className="text-[11px] text-slate-400">Driver Bata ₹400/day</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-black text-sm sm:text-base">₹15 / km</div>
                      <div className="text-[10px] text-slate-400">300 km/day min</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-green-500/40 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 font-black text-xs">
                        7S
                      </div>
                      <div>
                        <div className="text-white font-bold text-xs sm:text-sm">Toyota Innova</div>
                        <div className="text-[11px] text-slate-400">Driver Bata ₹400/day</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-black text-sm sm:text-base">₹16 / km</div>
                      <div className="text-[10px] text-slate-400">300 km/day min</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-green-500/40 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 font-black text-xs">
                        7S
                      </div>
                      <div>
                        <div className="text-white font-bold text-xs sm:text-sm">Innova Crysta VIP</div>
                        <div className="text-[11px] text-slate-400">Driver Bata ₹400/day</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-black text-sm sm:text-base">₹18 / km</div>
                      <div className="text-[10px] text-slate-400">300 km/day min</div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 text-center">
                  <a
                    href="#planner"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-green-400 hover:text-green-300 transition-colors"
                  >
                    Calculate exact cost for your trip below
                    <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          TRIP PLANNER & CALCULATOR CARD (Overlapping Hero)
          ═══════════════════════════════════════════════════════════════════════ */}
      <section id="planner" className="relative z-30 -mt-6 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-visible"
          >
            {/* Card Header Banner */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-950 px-6 sm:px-8 py-5 rounded-t-3xl border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                    Outstation Cab Fare Calculator
                  </h2>
                  <p className="text-xs text-slate-400">
                    Guaranteed transparent rates for Cabs in Hubli, Hubli to Goa, Hampi, Gokarna &amp; more
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-slate-300 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full">
                <ShieldCheck className="w-4 h-4 text-green-400" />
                300 km/day Included • Zero Advance Payment
              </div>
            </div>

            {/* Main Search Form */}
            <form onSubmit={handleSearchSubmit} className="p-6 sm:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 sm:gap-5 mb-6">
                {/* 1. Source (Pickup) */}
                <div className="relative lg:col-span-3">
                  <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center h-4">
                    Pickup City / Area
                  </Label>
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 h-14 focus-within:bg-white focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 transition-all relative">
                    <MapPin className="w-5 h-5 text-emerald-600 mr-2.5 flex-shrink-0" />
                    <Input
                      type="text"
                      value={source}
                      placeholder="e.g. Hubli, Dharwad"
                      onChange={(e) => {
                        setSource(e.target.value)
                        setShowSourceMenu(true)
                      }}
                      onFocus={() => setShowSourceMenu(true)}
                      onBlur={() => setTimeout(() => setShowSourceMenu(false), 200)}
                      required
                      className="border-0 bg-transparent p-0 text-sm font-bold text-slate-900 focus-visible:ring-0 placeholder:font-medium placeholder:text-slate-400 w-full"
                    />
                  </div>

                  {/* Source Autocomplete Dropdown */}
                  <AnimatePresence>
                    {showSourceMenu && sourceSuggestions.length > 0 && (
                      <motion.ul
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute top-[105%] left-0 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 max-h-56 overflow-y-auto py-2"
                      >
                        {sourceSuggestions.map((item, idx) => (
                          <li
                            key={idx}
                            onMouseDown={() => {
                              setSource(item.name)
                              if (item.lat && item.lon) setSourceCoords({ lat: item.lat, lon: item.lon })
                              setShowSourceMenu(false)
                            }}
                            className="px-4 py-2.5 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer text-sm font-semibold text-slate-700 transition-colors"
                          >
                            <div className="font-bold text-slate-900">{item.name}</div>
                            {item.sub && <div className="text-[11px] text-slate-400 font-normal">{item.sub}</div>}
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>

                {/* 2. Destination (Drop) */}
                <div className="relative lg:col-span-3">
                  <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center h-4">
                    Destination City / Drop
                  </Label>
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 h-14 focus-within:bg-white focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 transition-all relative">
                    <Navigation className="w-5 h-5 text-emerald-500 mr-2.5 flex-shrink-0" />
                    <Input
                      type="text"
                      value={destination}
                      placeholder="e.g. Goa, Hampi, Gokarna"
                      onChange={(e) => {
                        setDestination(e.target.value)
                        setShowDestMenu(true)
                      }}
                      onFocus={() => setShowDestMenu(true)}
                      onBlur={() => setTimeout(() => setShowDestMenu(false), 200)}
                      required
                      className="border-0 bg-transparent p-0 text-sm font-bold text-slate-900 focus-visible:ring-0 placeholder:font-medium placeholder:text-slate-400 w-full"
                    />
                    {calculatingDistance && (
                      <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin flex-shrink-0 ml-1" />
                    )}
                  </div>

                  {/* Destination Autocomplete Dropdown */}
                  <AnimatePresence>
                    {showDestMenu && destSuggestions.length > 0 && (
                      <motion.ul
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute top-[105%] left-0 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 max-h-56 overflow-y-auto py-2"
                      >
                        {destSuggestions.map((item, idx) => (
                          <li
                            key={idx}
                            onMouseDown={() => {
                              setDestination(item.name)
                              if (item.lat && item.lon) setDestCoords({ lat: item.lat, lon: item.lon })
                              setShowDestMenu(false)
                            }}
                            className="px-4 py-2.5 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer text-sm font-semibold text-slate-700 transition-colors"
                          >
                            <div className="font-bold text-slate-900">{item.name}</div>
                            {item.sub && <div className="text-[11px] text-slate-400 font-normal">{item.sub}</div>}
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>

                {/* 3. Number of Days (Select / Stepper) */}
                <div className="lg:col-span-2">
                  <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center h-4">
                    Number of Days
                  </Label>
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-2.5 h-14 justify-between">
                    <button
                      type="button"
                      onClick={() => setDays((d) => Math.max(1, d - 1))}
                      className="w-9 h-9 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center font-black text-slate-700 transition-colors shadow-sm cursor-pointer flex-shrink-0"
                    >
                      -
                    </button>
                    <div className="text-center px-1">
                      <div className="text-sm font-black text-slate-900 leading-tight">
                        {days} {days === 1 ? "Day" : "Days"}
                      </div>
                      <div className="text-[10px] text-emerald-700 font-bold leading-tight mt-0.5 whitespace-nowrap">
                        {days * 300} km package
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDays((d) => Math.min(15, d + 1))}
                      className="w-9 h-9 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center font-black text-slate-700 transition-colors shadow-sm cursor-pointer flex-shrink-0"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* 4. Pickup Date */}
                <div className="lg:col-span-2">
                  <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center h-4">
                    Pickup Date
                  </Label>
                  <div
                    onClick={() => {
                      try {
                        dateInputRef.current?.showPicker()
                      } catch {
                        dateInputRef.current?.focus()
                      }
                    }}
                    className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 h-14 focus-within:bg-white focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 transition-all cursor-pointer"
                  >
                    <Calendar className="w-5 h-5 text-emerald-600 mr-2 flex-shrink-0 pointer-events-none" />
                    <Input
                      ref={dateInputRef}
                      type="date"
                      min={todayStr}
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      onClick={(e) => {
                        try {
                          (e.currentTarget as any).showPicker()
                        } catch {}
                      }}
                      required
                      className="border-0 bg-transparent p-0 text-sm font-bold text-slate-900 focus-visible:ring-0 w-full cursor-pointer"
                    />
                  </div>
                </div>

                {/* 5. Pickup Time */}
                <div className="lg:col-span-2">
                  <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center h-4">
                    Pickup Time
                  </Label>
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-3.5 h-14 focus-within:bg-white focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 transition-all relative">
                    <Clock className="w-5 h-5 text-slate-400 mr-2 flex-shrink-0 pointer-events-none" />
                    <select
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full bg-transparent border-0 text-sm font-bold text-slate-900 focus:outline-none cursor-pointer appearance-none pr-6"
                    >
                      {TIME_SLOTS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Quick Destination Chips */}
              <div className="flex flex-wrap items-center gap-2 mb-6 pt-1">
                <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Popular Routes:
                </span>
                {POPULAR_DESTINATIONS.map((dest) => (
                  <button
                    key={dest.name}
                    type="button"
                    onClick={() => handleQuickDestinationSelect(dest.name, dest.km, dest.days)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all duration-150 cursor-pointer ${
                      destination.toLowerCase().includes(dest.name.toLowerCase().split(" ")[0])
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                        : "bg-slate-100/80 text-slate-600 border-slate-200 hover:bg-slate-200 hover:text-slate-900"
                    }`}
                  >
                    {dest.name} <span className="opacity-70 text-[10px] ml-0.5">({dest.km} km)</span>
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 border-t border-slate-100">
                <div className="flex items-center gap-2.5 bg-emerald-50/90 border border-emerald-200/80 rounded-2xl px-4 py-3 text-xs text-emerald-900 font-medium w-full sm:w-auto">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span suppressHydrationWarning>
                    Package includes <strong>{days * 300} km</strong> ({days} {days === 1 ? "day" : "days"}). Extra km billed at per-km rate. <strong>Zero advance</strong>.
                  </span>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full sm:w-auto min-w-[270px] h-14 bg-slate-900 hover:bg-emerald-600 text-white font-black text-base rounded-2xl shadow-xl hover:shadow-emerald-600/25 transition-all hover:scale-[1.02] cursor-pointer flex-shrink-0"
                >
                  Calculate &amp; Compare Cabs
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          DYNAMIC FLEET PRICING COMPARISON SECTION
          ═══════════════════════════════════════════════════════════════════════ */}
      <section ref={resultsRef} id="fleet" className="py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Active Trip Route Summary Pill */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-green-600 mb-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                Guaranteed Tariff for Your Outstation Trip
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {source} ➔ {destination || "Select Your Destination Above"}
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Duration: <strong className="text-slate-800">{days} Day(s)</strong> • Starting:{" "}
                <strong className="text-slate-800">
                  {pickupDate} at {pickupTime}
                </strong>
              </p>
            </div>

            {/* Mileage Indicator Card */}
            <div className="flex items-center gap-4 bg-slate-50 border border-slate-200/80 rounded-2xl p-4 w-full md:w-auto">
              <div>
                <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                  Billed Distance
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {billedKm} km
                  <span className="text-xs font-normal text-slate-500 ml-1">
                    ({isDistanceExact ? "Est. Route" : "Package Min"})
                  </span>
                </div>
                <div className="text-[11px] text-green-700 font-semibold">
                  Includes {packageMinKm} km standard package allowance
                </div>
              </div>
            </div>
          </div>

          {/* CRITICAL TRANSPARENCY BANNER: 300 KM / DAY & EXTRA KM RULE */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 mb-8 flex items-start gap-3 text-xs text-amber-900">
            <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="font-black text-amber-950 block text-sm mb-0.5">
                How Outstation Billing Works (300 km/day Standard Package):
              </strong>
              Your booking comes with a guaranteed minimum allowance of <strong>300 km per day ({packageMinKm} km for {days} day{days > 1 ? "s" : ""})</strong>.
              If your actual travel stays within {packageMinKm} km, you only pay the package rate.
              <strong> If your journey crosses {packageMinKm} km, any extra kilometers will be calculated strictly at the vehicle&apos;s per-km rate</strong> (e.g. ₹11/km for Sedan, ₹15/km for Ertiga) based on car odometer readings upon trip drop-off.
            </div>
          </div>

          {/* 4 Fleet Car Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FLEET_CONFIGS.map((car) => {
              const fare = computeCarFare(car)
              return (
                <div
                  key={car.id}
                  className="bg-white border border-slate-200/90 hover:border-green-500/80 rounded-3xl p-6 shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
                >
                  {/* Card Header & Badge */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                        {car.badge}
                      </span>
                      <div className="flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg">
                        <Users className="w-3.5 h-3.5 text-green-600" />
                        {car.seats} Seats
                      </div>
                    </div>

                    <h4 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                      {car.name}
                    </h4>
                    <p className="text-xs text-slate-500 font-semibold mt-1">{car.subtitle}</p>

                    {/* Car Image with Drop Shadow */}
                    <div className="relative h-44 my-4 flex items-center justify-center">
                      <div className="absolute bottom-2 w-3/4 h-4 bg-black/10 blur-xl rounded-[100%] group-hover:bg-green-600/15 transition-all" />
                      <Image
                        src={car.image}
                        alt={`Cabs in Hubli - ${car.name}`}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        className="object-contain drop-shadow-xl transition-transform duration-500 group-hover:scale-105 group-hover:-translate-y-1 relative z-10"
                      />
                    </div>

                    {/* Features Badges */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-600 bg-slate-50 rounded-2xl p-3 mb-5 border border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <Fuel className="w-3.5 h-3.5 text-green-600" />
                        <span>₹{car.ratePerKm}/km Rate</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-green-600" />
                        <span>₹{car.driverBataPerDay}/day Bata</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Luggage className="w-3.5 h-3.5 text-green-600" />
                        <span>{car.bags} Luggage Bags</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                        <span>{car.acType}</span>
                      </div>
                    </div>

                    {/* Price Breakdown Box */}
                    <div className="bg-green-50/70 border border-green-200/80 rounded-2xl p-4 mb-5">
                      <div className="text-[10px] font-black uppercase tracking-wider text-green-800 mb-0.5">
                        Estimated Fare ({days} {days === 1 ? "Day" : "Days"})
                      </div>
                      <div className="text-3xl font-black text-slate-900 tracking-tight">
                        {fmtINR(fare.estimatedTotal)}
                      </div>
                      <div className="text-[11px] text-slate-600 font-medium mt-1 leading-snug">
                        Based on {fare.billedKm} km @ ₹{car.ratePerKm}/km + ₹{fare.totalDriverBata} driver bata.
                      </div>
                      {fare.extraKmBeyondPackage > 0 ? (
                        <div className="text-[10px] text-amber-800 font-bold mt-1.5 bg-amber-100/70 px-2 py-0.5 rounded-md inline-block">
                          Includes {fare.extraKmBeyondPackage} km extra beyond {fare.packageMinKm} km min
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-500 font-medium mt-1.5">
                          Extra km if crossed: ₹{car.ratePerKm}/km
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Booking Actions */}
                  <div className="space-y-2 pt-2">
                    <Button
                      onClick={() => openBookingForCar(car)}
                      className="w-full h-12 bg-slate-900 hover:bg-green-600 text-white font-bold text-sm rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer"
                    >
                      Book {car.name} <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>

                    <a
                      href={generateWhatsAppLink(car)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full h-10 border border-slate-200 hover:border-green-500 hover:bg-green-50 text-slate-700 hover:text-green-700 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4 text-green-600" />
                      Inquire on WhatsApp
                    </a>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pricing Policy & Transparency Notes */}
          <div className="mt-12 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
            <h4 className="font-black text-slate-900 text-lg mb-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-600" />
              Transparent Outstation Pricing Guarantee in Hubli
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600 leading-relaxed">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <strong className="block text-slate-900 text-sm mb-1">
                  1. Minimum 300 km / Day
                </strong>
                Standard outstation tariff across Hubli is based on 300 km daily running minimum. If you
                drive less, the 300 km package rate applies. If you cross 300 km/day, extra kilometers are billed
                strictly at the vehicle&apos;s standard per-km rate.
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <strong className="block text-slate-900 text-sm mb-1">
                  2. Driver Bata (Allowance)
                </strong>
                Driver bata is ₹300/day for Sedan and ₹400/day for Ertiga &amp; Innova. Covers driver meals
                and outstation night accommodation. No separate driver charge is added.
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <strong className="block text-slate-900 text-sm mb-1">
                  3. Tolls &amp; Parking at Actuals
                </strong>
                Tolls, state border permits, and parking charges are not included in the base fare and are to
                be paid directly as per actual FASTag receipts / tickets.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          TOP SEARCHED CAB ROUTES FROM HUBLI (SEO DRIVER: GOA, HAMPI, GOKARNA, DANDELI)
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-slate-100 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 text-green-700 bg-green-100/70 border border-green-200 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" /> High Demand Hubli Routes
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Top Searched Cab Routes from Hubli
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-2">
              Traveling to Goa beaches, Hampi UNESCO ruins, or Dandeli jungle resorts?
              Select your route for instant fixed rates with zero haggling.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Route 1: Hubli to Goa */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                    Most Popular
                  </span>
                  <span className="text-xs font-bold text-slate-500">~180 km (1-way)</span>
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-1">
                  Cabs Hubli to Goa
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Via Ramnagar &amp; Anmod Ghat • Panaji, Calangute, Baga, Margao
                </p>
                <div className="space-y-2 mb-5 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div className="flex justify-between">
                    <span>Recommended:</span>
                    <strong className="text-slate-900">2 - 3 Days</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Sedan (2 Days / 600 km):</span>
                    <strong className="text-green-700">₹7,200</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Ertiga 6S (2 Days):</span>
                    <strong className="text-green-700">₹9,800</strong>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
                  Scenic Ghats journey with vetted drivers experienced in mountain turns and tourist hotspots. Extra km @ vehicle per-km rate.
                </p>
              </div>
              <Button
                onClick={() => handleQuickDestinationSelect("Goa (Panaji)", 180, 2)}
                className="w-full bg-slate-900 hover:bg-green-600 text-white font-bold text-xs rounded-xl h-11 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                Plan Hubli to Goa Cab <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Route 2: Hubli to Hampi */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                    UNESCO Tour
                  </span>
                  <span className="text-xs font-bold text-slate-500">~150 km (1-way)</span>
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-1">
                  Cabs Hubli to Hampi
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Via Gadag &amp; Hosapete • Virupaksha Temple, Stone Chariot, Ruins
                </p>
                <div className="space-y-2 mb-5 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div className="flex justify-between">
                    <span>Recommended:</span>
                    <strong className="text-slate-900">1 - 2 Days</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Sedan (1 Day / 300 km):</span>
                    <strong className="text-green-700">₹3,600</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Sedan (2 Days / 600 km):</span>
                    <strong className="text-green-700">₹7,200</strong>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
                  Doorstep pickup in Hubli, complete Hampi sightseeing tour, and safe return journey. Extra km @ vehicle rate.
                </p>
              </div>
              <Button
                onClick={() => handleQuickDestinationSelect("Hampi (UNESCO Tour)", 150, 2)}
                className="w-full bg-slate-900 hover:bg-green-600 text-white font-bold text-xs rounded-xl h-11 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                Plan Hubli to Hampi Cab <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Route 3: Hubli to Gokarna */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                    Beach &amp; Temple
                  </span>
                  <span className="text-xs font-bold text-slate-500">~155 km (1-way)</span>
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-1">
                  Hubli to Gokarna
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Via Yellapur Ghats • Om Beach, Kudle, Murudeshwar Temple
                </p>
                <div className="space-y-2 mb-5 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div className="flex justify-between">
                    <span>Recommended:</span>
                    <strong className="text-slate-900">2 Days</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Sedan (2 Days / 600 km):</span>
                    <strong className="text-green-700">₹7,200</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Ertiga 6S (2 Days):</span>
                    <strong className="text-green-700">₹9,800</strong>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
                  Perfect coastal pilgrimage &amp; weekend beach getaway. Chilled AC and smooth ride.
                </p>
              </div>
              <Button
                onClick={() => handleQuickDestinationSelect("Gokarna & Murudeshwar", 155, 2)}
                className="w-full bg-slate-900 hover:bg-green-600 text-white font-bold text-xs rounded-xl h-11 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                Plan Gokarna Cab <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Route 4: Hubli to Dandeli */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-teal-100 text-teal-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                    Jungle Safari
                  </span>
                  <span className="text-xs font-bold text-slate-500">~75 km (1-way)</span>
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-1">
                  Hubli to Dandeli
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Via Haliyal • Kali River Rafting, Jungle Lodges &amp; Resorts
                </p>
                <div className="space-y-2 mb-5 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div className="flex justify-between">
                    <span>Recommended:</span>
                    <strong className="text-slate-900">1 - 2 Days</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Sedan (1 Day / 300 km):</span>
                    <strong className="text-green-700">₹3,600</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Innova 7S (1 Day):</span>
                    <strong className="text-green-700">₹5,200</strong>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
                  Quick weekend escape for adventure sports, water rafting, and family forest homestays.
                </p>
              </div>
              <Button
                onClick={() => handleQuickDestinationSelect("Dandeli (Resorts)", 75, 1)}
                className="w-full bg-slate-900 hover:bg-green-600 text-white font-bold text-xs rounded-xl h-11 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                Plan Dandeli Cab <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          WHAT HAPPENS AFTER YOU CONFIRM TRIP & REQUEST CAB?
          (Detailed 4-Step Visual Sequence answering customer query)
          ═══════════════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-green-600 font-bold text-xs uppercase tracking-widest bg-green-50 border border-green-200 px-3 py-1 rounded-full">
              Transparent &amp; Reliable
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 mt-3 mb-4 tracking-tight">
              What Happens After You Confirm Your Trip &amp; Request a Cab?
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              No endless waiting in the dark. Here is exactly how our Hubli desk allots and confirms your cab
              without any advance payment or hassle.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Step 1 */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-7 relative flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-green-400 font-black text-lg flex items-center justify-center mb-5 shadow-md">
                  01
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Instant Trip Ref Code
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Your trip details are immediately saved into our Hubli database under a unique Reference ID (e.g.{" "}
                  <code className="text-green-700 font-bold bg-green-50 px-1 rounded">NC-HBX-XXXXXX</code>). Even if you don&apos;t send WhatsApp, your booking is permanently stored!
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-200/80 text-[11px] text-green-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Logged in project database
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-7 relative flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-green-600 text-white font-black text-lg flex items-center justify-center mb-5 shadow-md shadow-green-600/30">
                  02
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Hubli Desk Allots Cab
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Instead of you calling 10 operators, our local Hubli coordinator directly matches your request with our verified tied-up fleet owners and assigns the nearest sanitized, AC car.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-200/80 text-[11px] text-green-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified commercial fleet
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-7 relative flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-green-400 font-black text-lg flex items-center justify-center mb-5 shadow-md">
                  03
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  15-Min Phone Call
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Our Hubli coordinator calls your mobile number from our helpline{" "}
                  <strong>{BOOKING_HELPLINE_PHONE}</strong> to confirm pickup timing and shares the driver&apos;s name, mobile number &amp; car plate number.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-200/80 text-[11px] text-green-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Full driver details shared
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-7 relative flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-green-600 text-white font-black text-lg flex items-center justify-center mb-5 shadow-md shadow-green-600/30">
                  04
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Pickup &amp; Pay Later
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Driver reaches your Hubli/Dharwad doorstep on time. Pay driver after your journey via Cash or UPI. If your journey crosses the 300 km/day package, extra km is simply charged as per vehicle rate.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-200/80 text-[11px] text-green-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% pay after trip
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          WHY RIDEVO VS CALLING 10 OPERATORS
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-slate-950 text-white relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 10% 50%, #16a34a 0%, transparent 40%),
                             radial-gradient(circle at 90% 50%, #064e3b 0%, transparent 40%)`,
          }}
        />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-green-400 font-bold text-xs uppercase tracking-widest">
              The Hubli Cab Problem Solved
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mt-2 mb-4 tracking-tight">
              Why Call 10 Taxi Operators When You Have One Fixed Platform?
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Hubli travelers waste 45 minutes calling different operators, haggling rates, and dealing with
              last-minute cancellations. We fix that permanently.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* The Old Way */}
            <div className="bg-red-950/20 border border-red-500/20 rounded-3xl p-8 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400 font-bold">
                  ✕
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">The Old Way in Hubli</h3>
                  <p className="text-xs text-red-300">Calling Multiple Numbers</p>
                </div>
              </div>

              <ul className="space-y-4 text-sm text-slate-300">
                <li className="flex items-start gap-3">
                  <span className="text-red-400 font-bold mt-0.5">•</span>
                  <span>Call 5 to 8 different travel agencies to ask for car availability and negotiate.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 font-bold mt-0.5">•</span>
                  <span>Surprise extra km charges and inflated driver bata quoted right before departure.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 font-bold mt-0.5">•</span>
                  <span>Operators demanding 50% advance upfront before confirming the vehicle.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 font-bold mt-0.5">•</span>
                  <span>No guarantee of clean, AC-functional cars or vetted highway drivers.</span>
                </li>
              </ul>
            </div>

            {/* The RIDEVO Way */}
            <div className="bg-green-950/30 border border-green-500/30 rounded-3xl p-8 backdrop-blur-sm relative shadow-2xl">
              <div className="absolute -top-3 right-6 bg-green-500 text-slate-950 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-lg">
                Recommended
              </div>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400 font-bold">
                  ✓
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">The RIDEVO Way</h3>
                  <p className="text-xs text-green-300">Direct Allotment in 1 Click</p>
                </div>
              </div>

              <ul className="space-y-4 text-sm text-slate-200">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Fixed, guaranteed tariffs: ₹11 Sedan, ₹15 Ertiga, ₹16 Innova, ₹18 Crysta.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Zero advance required. Pay your driver directly after your journey.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>We allot from our verified network of Hubli fleet owners within 15 minutes.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Verified highway commercial drivers with well-maintained, clean AC cars.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          FREQUENTLY ASKED QUESTIONS (SEO & GOOGLE CAPTURE FOR HUBLI CABS)
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-green-600 font-bold text-xs uppercase tracking-widest">
              Got Questions?
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-2 tracking-tight">
              Frequently Asked Questions About Cabs in Hubli
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Everything you need to know about tariffs, bookings, and outstation trips from Hubli.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Why should I book cabs on RIDEVO instead of calling 10 local operators?",
                a: "Traditionally in Hubli, travelers call 5 to 10 travel agents, get conflicting rates, negotiate for an hour, and face last-minute cancellations. RIDEVO sets guaranteed standardized rates across tied-up Hubli fleet owners. You feed your trip plan, see the exact cost, and we allot your car with a 15-minute phone confirmation."
              },
              {
                q: "What happens if our trip exceeds the 300 km daily package?",
                a: "All outstation cabs in Hubli have a 300 km/day standard package allowance. If your total travel exceeds (Days × 300 km), any crossed kilometers are simply calculated based on the car's standard per-km rate (₹11 for Sedan, ₹15 for Ertiga, ₹16 for Innova, ₹18 for Crysta) based on the starting and closing odometer readings."
              },
              {
                q: "What is the cab fare from Hubli to Goa?",
                a: "Hubli to Goa is approximately 180 km one way (360 km round trip). Under the Hubli standard outstation package of 300 km/day, a 2-day Goa trip includes 600 km allowance. For a Sedan (Swift Dzire / Etios), the fare is ₹11/km (₹6,600) + 2 days driver bata (₹600) = ₹7,200. For an Ertiga 6-seater, it is ₹15/km (₹9,000) + ₹800 bata = ₹9,800. Tolls and Goa border entry taxes are paid at actuals."
              },
              {
                q: "How much does a cab from Hubli to Hampi cost?",
                a: "Hubli to Hampi is ~150 km one way (300 km round trip). A 1-day trip is billed at the 300 km package allowance: ₹3,600 for a Sedan (₹3,300 km fare + ₹300 driver bata) or ₹4,900 for an Ertiga. For a 2-day heritage tour, the 600 km package applies."
              },
              {
                q: "Is there any advance payment required when booking?",
                a: "No! There is strictly zero advance payment required on RIDEVO. You pay nothing online. After completing your trip, you pay the driver directly via Cash or UPI (Google Pay, PhonePe, Paytm)."
              },
              {
                q: "What happens after I confirm my trip and request a cab?",
                a: "Your trip request is immediately assigned a reference ID and saved in our Hubli fleet system. Our coordination desk assigns a verified vehicle from our tied-up fleet and calls you within 15 minutes to confirm timing, pickup address, and driver details. On travel day, the driver arrives punctually at your doorstep."
              }
            ].map((faq, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between font-bold text-slate-900 text-sm sm:text-base hover:text-green-700 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
                      expandedFaq === idx ? "transform rotate-180 text-green-600" : ""
                    }`}
                  />
                </button>
                {expandedFaq === idx && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          BOOKING MODAL / BOTTOM SHEET WITH FIXED ALIGNMENTS & NO UNWANTED SCROLLBARS
          ═══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {bookingModalOpen && selectedCar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-auto"
            >
              {/* Modal Header */}
              <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-green-400">
                    Verified Hubli Fleet Allotment
                  </span>
                  <h3 className="text-lg sm:text-xl font-black tracking-tight">
                    Book {selectedCar.name} ({selectedCar.subtitle})
                  </h3>
                </div>
                <button
                  onClick={() => setBookingModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-5 sm:p-6">
                {bookingStep === "form" && (
                  <form onSubmit={handleBookingSubmit} className="space-y-4">
                    {/* Trip Summary Chip */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>Route:</span>
                        <span>
                          {source} ➔ {destination}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Duration &amp; Date:</span>
                        <span>
                          {days} Day(s) • {pickupDate} ({pickupTime})
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Package Allowance:</span>
                        <span>
                          {days * 300} km ({days} Days × 300 km/day)
                        </span>
                      </div>
                      <div className="flex justify-between text-green-800 font-black text-sm pt-2 border-t border-slate-200">
                        <span>Estimated Package Fare:</span>
                        <span>{fmtINR(computeCarFare(selectedCar).estimatedTotal)}</span>
                      </div>

                      {/* CLEAR EXTRA KM EXPLANATION */}
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-[11px] text-amber-900 leading-snug">
                        <strong>📌 Extra Km Policy:</strong> Trip includes {days * 300} km. If actual running crosses {days * 300} km, additional km will be billed at <strong>₹{selectedCar.ratePerKm}/km</strong> by the driver upon drop-off.
                      </div>
                    </div>

                    {/* Customer Inputs */}
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Your Full Name *
                      </Label>
                      <Input
                        type="text"
                        placeholder="e.g. Ramesh Patil"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        required
                        className="h-11 rounded-xl text-sm font-semibold"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        WhatsApp / Mobile Number *
                      </Label>
                      <div className="flex items-center border border-slate-200 rounded-xl px-3 h-11 focus-within:ring-2 focus-within:ring-green-100 focus-within:border-green-500">
                        <span className="text-sm font-bold text-slate-400 mr-2">+91</span>
                        <Input
                          type="tel"
                          maxLength={10}
                          placeholder="98765 43210"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          required
                          className="border-0 p-0 text-sm font-bold text-slate-900 focus-visible:ring-0"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400">Our Hubli coordinator will call on this number to confirm driver details</p>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Exact Pickup Address / Landmark in Hubli *
                      </Label>
                      <Input
                        type="text"
                        placeholder="e.g. Near Old Bus Stand / Keshwapur Circle, Hubli"
                        value={pickupAddress}
                        onChange={(e) => setPickupAddress(e.target.value)}
                        required
                        className="h-11 rounded-xl text-sm font-semibold"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Special Requests / Notes (Optional)
                      </Label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Early morning 4 AM pickup, need luggage carrier, senior citizen onboard..."
                        value={customerNotes}
                        onChange={(e) => setCustomerNotes(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 resize-none"
                      />
                    </div>

                    {/* Zero Advance Reassurance */}
                    <div className="flex items-center gap-2 p-2.5 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800">
                      <ShieldCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span>Zero advance payment needed. Pay directly to the cab driver after your trip.</span>
                    </div>

                    {/* TERMS AND CONDITIONS CHECKBOX */}
                    <div className="pt-1 pb-1">
                      <label className="flex items-start gap-2.5 cursor-pointer select-none group">
                        <input
                          type="checkbox"
                          checked={agreedTerms}
                          onChange={(e) => {
                            setAgreedTerms(e.target.checked)
                            if (e.target.checked) setTermsError(false)
                          }}
                          className="mt-0.5 w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500 cursor-pointer accent-green-600 flex-shrink-0"
                        />
                        <span className="text-xs text-slate-600 group-hover:text-slate-900 leading-snug">
                          I agree to the{" "}
                          <Link
                            href="/terms"
                            target="_blank"
                            className="font-bold text-green-700 underline hover:text-green-800"
                          >
                            Outstation Terms &amp; Conditions
                          </Link>{" "}
                          (300 km/day standard package; extra km crossed billed @ vehicle rate; toll/parking at actuals; zero advance).
                        </span>
                      </label>
                      {termsError && (
                        <p className="text-[11px] text-red-600 font-bold mt-1 flex items-center gap-1 pl-6">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Please check the box to agree to the Terms &amp; Conditions before requesting a cab.
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 bg-slate-900 hover:bg-green-600 text-white font-black text-sm rounded-xl shadow-lg transition-all cursor-pointer"
                    >
                      Confirm Trip &amp; Request Cab
                    </Button>
                  </form>
                )}

                {bookingStep === "submitting" && (
                  <div className="py-14 text-center space-y-4">
                    <RefreshCw className="w-10 h-10 text-green-600 animate-spin mx-auto" />
                    <h4 className="text-lg font-bold text-slate-900">Saving Trip Plan in Database...</h4>
                    <p className="text-xs text-slate-500">Connecting with Hubli Ride Coordinator to allot verified car.</p>
                  </div>
                )}

                {/* ═════════════════════════════════════════════════════════════
                    CONFIRMED STEP: FIXED ALIGNMENTS & NO UNWANTED SCROLLBAR
                    ═════════════════════════════════════════════════════════════ */}
                {bookingStep === "confirmed" && (
                  <div className="text-center space-y-3.5">
                    {/* Top Green Icon & Verified Badge */}
                    <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                      <Check className="w-7 h-7" />
                    </div>

                    <div>
                      <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold px-3 py-0.5 rounded-full mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Saved in Hubli Fleet Database
                      </div>
                      <h4 className="text-xl font-black text-slate-900">Trip Plan Received!</h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Thank you, <strong>{customerName}</strong>! Your request for{" "}
                        <strong>{selectedCar.name}</strong> to <strong>{destination}</strong> is secured.
                      </p>
                    </div>

                    {/* Booking Reference Box */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                        Booking Reference Code
                      </div>
                      <div className="text-2xl font-black text-slate-900 tracking-wider flex items-center justify-center gap-2">
                        {bookingRef}
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(bookingRef)
                            setCopiedRef(true)
                            setTimeout(() => setCopiedRef(false), 2000)
                            toast.success("Reference copied!")
                          }}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer"
                        >
                          {copiedRef ? (
                            <Check className="w-3.5 h-3.5 text-green-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* What Happens Next 4-Step Visual Timeline (Clear Callout of Caller vs Receiver & Extra KM) */}
                    <div className="bg-gradient-to-br from-green-50/70 to-emerald-50/30 border border-green-200/80 rounded-2xl p-3.5 text-left space-y-2">
                      <div className="text-[11px] font-black text-green-900 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-green-700" /> What Happens Next:
                      </div>

                      <div className="space-y-2 text-xs text-slate-700">
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-green-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                            ✓
                          </div>
                          <div>
                            <strong className="text-slate-900">Trip Registered:</strong> Saved under ref{" "}
                            <span className="font-mono text-green-800 font-bold">{bookingRef}</span> in our project database.
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-green-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                            2
                          </div>
                          <div>
                            <strong className="text-slate-900">Cab Allotment:</strong> Our coordinator is matching your trip with verified local {selectedCar.name} owners.
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                            3
                          </div>
                          <div>
                            <strong className="text-slate-900">15-Min Phone Call:</strong> Our Hubli coordinator ({BOOKING_HELPLINE_PHONE}) will call your mobile (<strong>+91 {customerPhone}</strong>) to confirm landmark and send driver details.
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                            4
                          </div>
                          <div>
                            <strong className="text-slate-900">Zero Advance &amp; Extra KM:</strong> Pay driver after trip. Includes {days * 300} km package. If actual travel crosses {days * 300} km, extra km is billed @ ₹{selectedCar.ratePerKm}/km.
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Reassurance Note */}
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Even if you don&apos;t send WhatsApp, your booking is safely stored. Our coordinator will call you within 15 minutes!
                    </p>

                    {/* WhatsApp Fast Confirmation Button & Close */}
                    <div className="space-y-2 pt-1">
                      <a
                        href={generateWhatsAppLink(selectedCar)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg transition-colors cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Send Booking Details on WhatsApp (Optional)
                      </a>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setBookingModalOpen(false)}
                        className="w-full h-10 rounded-xl text-xs font-bold text-slate-600 cursor-pointer"
                      >
                        Done &amp; Close
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════════════════════════════════ */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2">
              <div className="mb-4">
                <RidevoLogo size="lg" theme="dark" showTagline={true} />
              </div>
              <p className="text-slate-400 text-sm leading-relaxed max-w-sm mb-5">
                Hubli&apos;s direct outstation cab network. Connecting travelers with verified tied-up local operators with
                guaranteed, fixed per-km fleet rates.
              </p>
              <div className="flex flex-col gap-2 text-sm">
                <a
                  href={`tel:${BOOKING_HELPLINE_PHONE}`}
                  className="flex items-center gap-2 hover:text-green-400 transition-colors"
                >
                  <Phone className="w-4 h-4 text-green-500" />
                  Booking Helpline: {BOOKING_HELPLINE_PHONE}
                </a>
                <a
                  href="mailto:support@ridevo.in"
                  className="flex items-center gap-2 hover:text-green-400 transition-colors"
                >
                  <Mail className="w-4 h-4 text-green-500" />
                  support@ridevo.in
                </a>
              </div>
            </div>

            <div>
              <div className="text-white font-bold mb-4 text-sm uppercase tracking-wider">
                Fleet &amp; Rates
              </div>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#planner" className="hover:text-green-400 transition-colors">
                    Sedan (₹11/km + ₹300 Bata)
                  </a>
                </li>
                <li>
                  <a href="#planner" className="hover:text-green-400 transition-colors">
                    Ertiga (₹15/km + ₹400 Bata)
                  </a>
                </li>
                <li>
                  <a href="#planner" className="hover:text-green-400 transition-colors">
                    Toyota Innova (₹16/km + ₹400 Bata)
                  </a>
                </li>
                <li>
                  <a href="#planner" className="hover:text-green-400 transition-colors">
                    Innova Crysta (₹18/km + ₹400 Bata)
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <div className="text-white font-bold mb-4 text-sm uppercase tracking-wider">
                Support &amp; Desk
              </div>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href={`tel:${BOOKING_HELPLINE_PHONE}`} className="hover:text-green-400 transition-colors">
                    24/7 Helpline: {BOOKING_HELPLINE_PHONE}
                  </a>
                </li>
                <li>
                  <Link href="/admin/leads" className="text-green-400 hover:text-green-300 font-bold flex items-center gap-1">
                    Operator Live Desk <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-green-400 transition-colors">
                    Terms &amp; Conditions
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-green-400 transition-colors">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} RIDEVO Technologies. Hubli–Dharwad&apos;s Dedicated Outstation Cab Network.</p>
            <div className="flex gap-6">
              <Link href="/privacy" className="hover:text-green-400 transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-green-400 transition-colors">
                Terms &amp; Conditions
              </Link>
              <Link href="/admin/leads" className="text-green-400 hover:text-green-300 font-bold">
                Operator Inquiries Desk
              </Link>
            </div>
          </div>
        </div>
      </footer>
      {/* ═══════════════════════════════════════════════════════════════════════
          FLOATING QUICK CONTACT ACTION (WhatsApp)
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2.5">
        <a
          href={`https://wa.me/${BOOKING_HELPLINE_PHONE_DIGITS}?text=${encodeURIComponent(
            "Hello RIDEVO Hubli, I want to inquire about booking an outstation cab from Hubli."
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-600 hover:bg-green-500 text-white p-3.5 sm:px-4 sm:py-3 rounded-full shadow-2xl flex items-center gap-2 transition-all duration-300 hover:scale-105 active:scale-95 border-2 border-white/20"
          aria-label="Chat on WhatsApp"
        >
          <MessageCircle className="w-5 h-5 fill-current" />
          <span className="hidden sm:inline font-bold text-xs">Chat on WhatsApp</span>
        </a>
      </div>
    </div>
  )
}
