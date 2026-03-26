"use client"

import { useEffect, useState, useCallback, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  MapPin, Calendar, Car, Users, ChevronRight, Shield,
  ArrowRight, Loader2, AlertCircle, Search, X, Phone,
  User, Mail, MessageSquare, CheckCircle2,
} from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input }  from "@/components/ui/input"
import { Label }  from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Navbar from "@/components/navbar"
import VehicleIllustration from "@/components/VehicleIllustration"

import { getPricesByTripTypeId, PriceDetailsByTrip } from "@/services/prices/pricesService"
import { gettripTypes }    from "@/services/admin/tripTypesService"
import { getVehicleTypes, vehicleType } from "@/services/admin/vehicleTypesService"
import { createBooking, GuestBookingRequest, BookingResponse } from "@/services/bookingService"

// ── Helpers ────────────────────────────────────────────────────────────────
// This maps your database slugs to your uploaded filenames
const CAR_IMAGE_MAP: Record<string, string> = {
  "mini": "mini-nobg.png",
  "sedan": "sedan-nobg.png",
  "ertiga": "ertiga-nobg.png",
  "innova": "innova-nobg.png",
  "innova-crysta": "crysta-nobg.png",
  "suv": "Scorpio-nobg.png",
  "premium-suv": "Toyota-Innova--Crysta-MPV.png",
  "tempo-traveller": "tt-nobg.png",
  "coach-bus": "TT.jpg", // Fallback if coach bus image isn't separate yet
}
function fmtPrice(v: PriceDetailsByTrip) {
  const t = v.tripTypeName?.toLowerCase() ?? ""
  if (t.includes("airport") && v.airportPrice)
    return { label: `₹${v.airportPrice}`, sub: "fixed fare", isFixed: true }
  if (t.includes("local") && v.localPerKmPrice)
    return { label: `₹${v.localPerKmPrice}/km`, sub: `min ${v.localMinKm ?? "—"} km`, isFixed: false }
  if (v.outPerKmPrice)
    return { label: `₹${v.outPerKmPrice}/km`, sub: `min ${v.outMinKm ?? "—"} km`, isFixed: false }
  return { label: "Contact operator", sub: "", isFixed: false }
}
function getCarImage(slug: string) {
  const fileName = CAR_IMAGE_MAP[slug] || "sedan.png";
  return `/images/cars/${fileName}`;
}
function slugify(s: string) {
  return (s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "sedan"
}

// ── Skeleton ───────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
    <div className="h-44 bg-slate-100"/>
    <div className="p-4 space-y-3">
      <div className="h-5 bg-slate-100 rounded w-2/3"/>
      <div className="h-4 bg-slate-100 rounded w-1/2"/>
      <div className="h-14 bg-slate-100 rounded-xl"/>
      <div className="h-10 bg-slate-100 rounded-xl"/>
    </div>
  </div>
)

// ── Booking sheet ──────────────────────────────────────────────────────────
interface BookingSheetProps {
  vehicle:     PriceDetailsByTrip
  pickup:      string
  destination: string
  date:        string
  tripName:    string
  onClose:     () => void
  onDone:      (res: BookingResponse) => void
}

function BookingSheet({ vehicle, pickup, destination, date, tripName, onClose, onDone }: BookingSheetProps) {
  const pr = fmtPrice(vehicle)

  const [name,    setName]    = useState("")
  const [phone,   setPhone]   = useState("")
  const [email,   setEmail]   = useState("")
  const [notes,   setNotes]   = useState("")
  const [errors,  setErrors]  = useState<Record<string, string>>({})
  const [step,    setStep]    = useState<"form" | "loading" | "done" | "error">("form")
  const [errMsg,  setErrMsg]  = useState("")

  const validate = () => {
    const e: Record<string, string> = {}
    if (!name.trim() || name.trim().length < 2)    e.name  = "Enter your full name"
    if (!/^[6-9][0-9]{9}$/.test(phone.trim()))     e.phone = "Enter a valid 10-digit mobile number"
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setStep("loading")
    try {
      const payload: GuestBookingRequest = {
        customerName:   name.trim(),
        customerPhone:  phone.trim(),
        customerEmail:  email.trim() || undefined,
        notes:          notes.trim() || undefined,
        agentVehicleId: vehicle.agentVehicleId,
        tripTypeId:     vehicle.tripTypeId,
        priceId:        vehicle.id,
        pickupLocation: pickup,
        dropLocation:   destination || undefined,
        pickupDateTime: new Date(date).toISOString(),
      }
      const res = await createBooking(payload)
      setStep("done")
      setTimeout(() => onDone(res), 1600)
    } catch (e: any) {
      setErrMsg(e?.message || "Something went wrong. Please try again.")
      setStep("error")
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={step === "form" || step === "error" ? onClose : undefined}>

      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col"
        onClick={e => e.stopPropagation()}>

        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 sm:hidden flex-shrink-0">
          <div className="w-10 h-1 bg-slate-200 rounded-full"/>
        </div>

        {step === "form" && (
          <>
            {/* Header */}
            <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
              <div>
                <h2 className="text-lg font-black text-slate-900">Book your cab</h2>
                <p className="text-xs text-slate-500 mt-0.5">No account needed — just your contact details</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 flex-shrink-0 ml-2">
                <X className="w-4 h-4 text-slate-600"/>
              </button>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

              {/* Trip summary strip */}
              <div className="bg-slate-50 rounded-2xl p-4 flex gap-3 items-center">
                <div className="w-20 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-white border border-slate-100">
                   <img src={getCarImage(vehicle.vehicleName?.toLowerCase() || "sedan")} className="w-20 h-12 object-contain" alt=""/>
              <div>
                <div className="font-bold text-slate-900">{vehicle.vehicleName}</div>
                <div className="text-xs font-bold text-green-700 uppercase tracking-widest">{pr.label} {pr.sub}</div>
              </div>
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 text-sm truncate">{vehicle.vehicleName}</div>
                  <div className="text-xs text-slate-500">{vehicle.seatingCapacity} seats · {tripName}</div>
                  <div className="text-green-700 font-black text-sm mt-0.5">{pr.label} <span className="text-slate-400 font-normal text-xs">{pr.sub}</span></div>
                </div>
              </div>

              {/* Trip route */}
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-3.5 h-3.5 text-green-600"/>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Pickup</div>
                    <div className="text-sm font-semibold text-slate-900">{pickup}</div>
                  </div>
                </div>
                {destination && (
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-3.5 h-3.5 text-slate-400"/>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Drop</div>
                      <div className="text-sm font-semibold text-slate-900">{destination}</div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-3.5 h-3.5 text-blue-500"/>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Date</div>
                    <div className="text-sm font-semibold text-slate-900">
                      {new Date(date).toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"short", year:"numeric" })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100"/>

              {/* Customer details form */}
              <div className="space-y-4">
                <p className="text-sm font-semibold text-slate-700">Your contact details</p>

                {/* Name */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Full Name *</Label>
                  <div className={`flex items-center bg-slate-50 border rounded-xl px-3 h-11 transition-all focus-within:bg-white focus-within:ring-2 ${errors.name ? "border-red-400 focus-within:ring-red-100" : "border-slate-200 focus-within:border-green-500 focus-within:ring-green-100"}`}>
                    <User className={`w-4 h-4 mr-2 flex-shrink-0 ${errors.name ? "text-red-400" : "text-green-500"}`}/>
                    <Input value={name} onChange={e => { setName(e.target.value); setErrors(p => ({...p, name:""})) }}
                      placeholder="Rajesh Kumar"
                      className="border-0 bg-transparent p-0 h-auto text-sm focus-visible:ring-0 placeholder:text-slate-400"/>
                  </div>
                  {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Mobile Number *</Label>
                  <div className={`flex items-center bg-slate-50 border rounded-xl px-3 h-11 transition-all focus-within:bg-white focus-within:ring-2 ${errors.phone ? "border-red-400 focus-within:ring-red-100" : "border-slate-200 focus-within:border-green-500 focus-within:ring-green-100"}`}>
                    <Phone className={`w-4 h-4 mr-2 flex-shrink-0 ${errors.phone ? "text-red-400" : "text-green-500"}`}/>
                    <Input value={phone} onChange={e => { setPhone(e.target.value.replace(/\D/g,"")); setErrors(p => ({...p, phone:""})) }}
                      placeholder="9876543210" maxLength={10} inputMode="numeric"
                      className="border-0 bg-transparent p-0 h-auto text-sm focus-visible:ring-0 placeholder:text-slate-400"/>
                  </div>
                  {errors.phone && <p className="text-xs text-red-600">{errors.phone}</p>}
                </div>

                {/* Email (optional) */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Email <span className="text-slate-400 font-normal">(optional)</span></Label>
                  <div className={`flex items-center bg-slate-50 border rounded-xl px-3 h-11 transition-all focus-within:bg-white focus-within:ring-2 ${errors.email ? "border-red-400 focus-within:ring-red-100" : "border-slate-200 focus-within:border-green-500 focus-within:ring-green-100"}`}>
                    <Mail className={`w-4 h-4 mr-2 flex-shrink-0 ${errors.email ? "text-red-400" : "text-slate-400"}`}/>
                    <Input value={email} onChange={e => { setEmail(e.target.value); setErrors(p => ({...p, email:""})) }}
                      type="email" placeholder="you@example.com"
                      className="border-0 bg-transparent p-0 h-auto text-sm focus-visible:ring-0 placeholder:text-slate-400"/>
                  </div>
                  {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Special Instructions <span className="text-slate-400 font-normal">(optional)</span></Label>
                  <div className="flex items-start bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:bg-white focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-100 transition-all">
                    <MessageSquare className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0 mt-0.5"/>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)}
                      placeholder="e.g. Need a/c, have luggage, early morning pickup…"
                      rows={2}
                      className="w-full bg-transparent text-sm focus:outline-none placeholder:text-slate-400 resize-none"/>
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5"/>
                <p className="text-xs text-amber-700 leading-relaxed">
                  The operator will call you on <strong>{phone || "your number"}</strong> within a short time to confirm the booking. Final fare may vary based on actual distance.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex-shrink-0">
              <Button onClick={handleSubmit} className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-600/25 text-base">
                Confirm Booking <ArrowRight className="ml-2 w-5 h-5"/>
              </Button>
              <p className="text-xs text-slate-400 text-center mt-2">No payment required now · Operator confirms via call</p>
            </div>
          </>
        )}

        {step === "loading" && (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
              <Loader2 className="w-8 h-8 text-green-600 animate-spin"/>
            </div>
            <p className="font-bold text-slate-900">Sending your request…</p>
            <p className="text-sm text-slate-500 mt-1">Just a moment</p>
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-600"/>
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-1">Request Sent!</h3>
            <p className="text-sm text-slate-500">Redirecting to your booking confirmation…</p>
          </div>
        )}

        {step === "error" && (
          <>
            <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-500"/>
              </div>
              <h3 className="text-lg font-black text-slate-900">Booking Failed</h3>
              <p className="text-sm text-slate-500 mt-2 max-w-xs">{errMsg}</p>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1 h-11 rounded-xl">Cancel</Button>
              <Button onClick={() => setStep("form")} className="flex-1 h-11 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold">Try Again</Button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
function VehiclesPageInner() {
  const searchParams = useSearchParams()
  const router       = useRouter()

  const [tripTypes,    setTripTypes]    = useState<any[]>([])
  const [vehicleTypes, setVehicleTypes] = useState<vehicleType[]>([])
  const [results,      setResults]      = useState<PriceDetailsByTrip[]>([])
  const [loading,      setLoading]      = useState(false)
  const [searched,     setSearched]     = useState(false)
  const [confirmItem,  setConfirmItem]  = useState<PriceDetailsByTrip | null>(null)

  const [tripTypeId,   setTripTypeId]   = useState(searchParams.get("tripTypeId")    ?? "")
  const [vehicleTypeId,setVehicleTypeId]= useState(searchParams.get("vehicleTypeId") ?? "")
  const [pickup,       setPickup]       = useState(searchParams.get("pickup")        ?? "")
  const [destination,  setDestination]  = useState(searchParams.get("destination")   ?? "")
  const [date,         setDate]         = useState(searchParams.get("date")          ?? "")

  const today = new Date().toISOString().split("T")[0]

  useEffect(() => {
    Promise.all([gettripTypes(), getVehicleTypes()]).then(([t, v]) => {
      setTripTypes(t ?? [])
      setVehicleTypes(v ?? [])
    }).catch(console.error)
  }, [])

  const tripName  = tripTypes.find(t => t.id === tripTypeId)?.name ?? ""
  const isAirport = tripName.toLowerCase().includes("airport")

  const doSearch = useCallback(async (ttId: string, vtId: string) => {
  if (!ttId) return
  setLoading(true); setSearched(true)
  try {
    let data = await getPricesByTripTypeId(ttId)
    // Filter by vehicle type if specified
    if (vtId) {
      data = data.filter(v => v.vehicleTypeId === vtId)
    }
    setResults(data)
  } catch { setResults([]) }
  finally { setLoading(false) }
}, [])

  useEffect(() => {
    if (tripTypeId) doSearch(tripTypeId, vehicleTypeId)
  }, []) // eslint-disable-line

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!tripTypeId || !pickup || !date || (!isAirport && !destination)) return
    doSearch(tripTypeId, vehicleTypeId)
    const q = new URLSearchParams({ tripTypeId, vehicleTypeId, pickup, destination, date })
    router.replace(`/user/vehicles?${q}`)
  }

  const handleDone = (res: BookingResponse) => {
    setConfirmItem(null)
    router.push(`/booking/confirmation?ref=${res.bookingRef}&id=${res.id}`)
  }

  return (
    <div className="min-h-screen bg-slate-50">
     {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="bg-slate-900 text-white fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-600/30">
              <span className="text-white font-black text-lg leading-none" style={{fontFamily:"'Noto Sans Kannada',sans-serif"}}>ನ</span>
            </div>
            <div className="leading-none">
              <span className="font-black text-xl text-white tracking-tight">namma</span>
              <span className="font-black text-xl text-green-400 tracking-widest uppercase">CAB</span>
            </div>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex gap-8 font-semibold text-sm">
            <a href="#search" className="text-slate-300 hover:text-green-400 transition-colors">Book a Ride</a>
            <a href="#how-it-works" className="text-slate-300 hover:text-green-400 transition-colors">How it Works</a>
            <a href="#fleet" className="text-slate-300 hover:text-green-400 transition-colors">Our Fleet</a>
            <a href="#partner" className="text-slate-300 hover:text-green-400 transition-colors">List Your Cabs</a>
          </nav>

          {/* Desktop auth */}
          <div className="hidden md:flex gap-3 items-center">
            <Button className="text-slate-300 hover:text-white hover:bg-white/10 rounded-full px-5 font-semibold text-sm bg-transparent">
              Sign in
            </Button>
            <Button className="bg-green-600 hover:bg-green-500 text-white rounded-full px-6 font-bold text-sm shadow-lg shadow-green-600/30">
              Partner with us
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero Banner ────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-16 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-green-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-green-600/10 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8 md:py-10 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1.5 mb-4"
            >
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-green-400 text-xs font-semibold">Hubli's First Cab Marketplace</span>
            </motion.div>

            {/* Main heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-2xl md:text-3xl lg:text-4xl font-black text-white mb-3 leading-tight"
            >
              Find & Book Cabs{" "}
              <span className="text-green-400">Across Hubli-Dharwad</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-sm md:text-base text-slate-400 max-w-xl mx-auto"
            >
              Compare prices from 50+ operators. Book sedans, SUVs & more for local, outstation & airport trips.
            </motion.p>

            
          </div>
        </div>

        {/* Wave separator - smaller */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 20L48 18C96 16 192 12 288 11C384 10 480 12 576 15C672 18 768 22 864 23C960 24 1056 22 1152 19C1248 16 1344 12 1392 10L1440 8V40H0V20Z" fill="#f8fafc"/>
          </svg>
        </div>
      </section>


      {/* ── Search bar ─────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 sticky top-16 z-20 shadow-sm">
        <form onSubmit={handleSearch} className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-wrap gap-2 items-end">
            {/* Trip type pills */}
            <div className="flex gap-1 mr-1">
              {tripTypes.length === 0
                ? [1,2,3].map(i=><div key={i} className="h-10 w-24 bg-slate-100 rounded-xl animate-pulse"/>)
                : tripTypes.map(t=>(
                  <button key={t.id} type="button" onClick={()=>setTripTypeId(t.id)}
                    className={`h-10 px-4 rounded-xl text-sm font-semibold transition-all ${tripTypeId===t.id?"bg-green-600 text-white shadow-sm":"bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                    {t.name}
                  </button>
                ))
              }
            </div>

            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 h-10 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-100 min-w-[150px] flex-1">
              <MapPin className="w-4 h-4 text-green-500 mr-2 flex-shrink-0"/>
              <Input value={pickup} onChange={e=>setPickup(e.target.value)} placeholder="Pickup" required
                className="border-0 bg-transparent p-0 h-auto text-sm focus-visible:ring-0 w-full flex-1"/>
            </div>

            {!isAirport && (
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 h-10 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-100 min-w-[150px] flex-1">
                <MapPin className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0"/>
                <Input value={destination} onChange={e=>setDestination(e.target.value)} placeholder="Drop location"
                  required={!isAirport} className="border-0 bg-transparent p-0 h-auto text-sm focus-visible:ring-0"/>
              </div>
            )}

            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 h-10 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-100">
              <Calendar className="w-4 h-4 text-green-500 mr-2 flex-shrink-0"/>
              <Input type="date" min={today} value={date} onChange={e=>setDate(e.target.value)} required
                className="border-0 bg-transparent p-0 h-auto text-sm focus-visible:ring-0 w-32 w-full flex-1"/>
            </div>

            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 h-10 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-100 min-w-[140px]">
             
              <Select value={vehicleTypeId} onValueChange={v => setVehicleTypeId(v === "all" ? "" : v)}>
                <SelectTrigger className="border-0 bg-transparent p-0 h-auto text-sm focus:ring-0 shadow-none w-full flex-1">
                  <SelectValue placeholder="Any vehicle"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any vehicle</SelectItem>
                  {vehicleTypes.map(v=><SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={!tripTypeId||loading}
              className="h-10 px-5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-sm">
              <Search className="w-4 h-4 mr-1.5"/>Search
            </Button>
          </div>
        </form>
      </div>

      {/* ── Results ────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-8">

        {!searched && !loading && (
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Car className="w-8 h-8 text-green-600"/>
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-2">Find cabs in Hubli</h2>
            <p className="text-slate-500 text-sm">Pick trip type, enter pickup and date above</p>
          </div>
        )}

        {loading && (
          <div>
            <div className="flex items-center gap-2 mb-5">
              <Loader2 className="w-4 h-4 text-green-600 animate-spin"/>
              <span className="text-sm text-slate-600 font-medium">Finding available cabs…</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({length:8}).map((_,i)=><SkeletonCard key={i}/>)}
            </div>
          </div>
        )}

        {searched && !loading && results.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
            
            <h3 className="font-bold text-slate-900 mb-1">No Vehicles Available for this search</h3>
            <p className="text-sm text-slate-500">Try a different trip type or vehicle category</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-black text-slate-900">{results.length} cab{results.length!==1?"s":""} available</h2>
                <p className="text-xs text-slate-500 mt-0.5">{tripName} · {pickup}{destination?` → ${destination}`:""} · {date && new Date(date).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {results.map((v, i) => {
                const pr = fmtPrice(v)
                const carImage = getCarImage(v.vehicleName?.toLowerCase().replace(/ /g, "-") || "sedan");
                return (
                  <motion.div key={v.id}
                    initial={{ opacity:0, y:20 }}
                    animate={{ opacity:1, y:0 }}
                    transition={{ delay: i*0.05 }}>
                    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg hover:border-green-200 hover:-translate-y-0.5 transition-all duration-300 flex flex-col group h-full">

                      {/* Illustration */}
                      <div className="relative h-44 bg-gradient-to-b from-slate-50 to-slate-100 overflow-hidden">
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-4/5 h-3 bg-black/8 blur-sm rounded-full"/>
                        <div className="w-full h-full group-hover:scale-105 transition-transform duration-500">
                          <img src={carImage} alt={v.vehicleName} className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-2 relative z-10"/>
                  
                        </div>
                        <div className="absolute top-3 left-3 bg-green-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                          {v.tripTypeName}
                        </div>
                        <div className="absolute top-3 right-3 bg-white/90 border border-slate-200 text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
                          <Users className="w-3 h-3"/>{v.seatingCapacity}
                        </div>
                      </div>

                      <div className="p-4 flex flex-col flex-1 gap-3">
                        <div>
                          <h3 className="font-black text-slate-900 text-sm">{v.vehicleName}</h3>
                          <div className="flex items-center gap-1.5 mt-1">
                            <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-xs font-black">{v.agentName?.[0]?.toUpperCase()??"A"}</span>
                            </div>
                            <span className="text-xs text-slate-500 truncate">{v.agentName}</span>
                            <Shield className="w-3 h-3 text-green-500 ml-auto flex-shrink-0"/>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="bg-green-50 border border-green-100 rounded-xl px-3 py-2.5 flex-1">
                          <div className="text-xl font-black text-green-700">{pr.label}</div>
                          {pr.sub && <div className="text-xs text-slate-500 mt-0.5">{pr.sub}</div>}
                          {v.driverDayAllowance && (
                            <div className="text-xs text-slate-400 mt-1">+ driver bata ₹{v.driverDayAllowance}/day</div>
                          )}
                        </div>

                        <Button onClick={()=>setConfirmItem(v)}
                          className="w-full h-10 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm shadow-sm">
                          Book Now <ChevronRight className="ml-1 w-4 h-4"/>
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* ── Booking sheet ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {confirmItem && (
          <BookingSheet
            vehicle={confirmItem}
            pickup={pickup}
            destination={destination}
            date={date}
            tripName={tripName}
            onClose={()=>setConfirmItem(null)}
            onDone={handleDone}
          />
        )}
      </AnimatePresence>

       {/* ════════════════════════════════════════════════════════════════════
                FOOTER
            ════════════════════════════════════════════════════════════════════ */}
            <footer className="bg-slate-950 text-slate-400">
              <div className="max-w-7xl mx-auto px-6 py-16">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
      
                  {/* Brand */}
                  <div className="md:col-span-2">
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center">
                        <span className="text-white font-black text-lg" style={{fontFamily:"'Noto Sans Kannada',sans-serif"}}>ನ</span>
                      </div>
                      <div className="leading-none">
                        <span className="font-black text-xl text-white">namma</span>
                        <span className="font-black text-xl text-green-400 tracking-widest uppercase">CAB</span>
                      </div>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed max-w-sm mb-5">
                      Hubli's first cab marketplace. Connecting travellers with verified local operators for a seamless booking experience.
                    </p>
                    <div className="flex flex-col gap-2 text-sm">
                      <a href="tel:+91-884856868" className="flex items-center gap-2 hover:text-green-400 transition-colors">
                        <Phone className="w-4 h-4 text-green-500"/>+91-8884856868
                      </a>
                      <a href="mailto:hello@nammacab.in" className="flex items-center gap-2 hover:text-green-400 transition-colors">
                        <Mail className="w-4 h-4 text-green-500"/>hello@nammacab.in
                      </a>
                    </div>
                  </div>
      
                  {/* Travellers */}
                  <div>
                    <div className="text-white font-bold mb-4 text-sm uppercase tracking-wider">For Travellers</div>
                    <ul className="space-y-2 text-sm">
                      {[["Book a Cab","#search"]].map(([label, href]) => (
                        <li key={label}><a href={href} className="hover:text-green-400 transition-colors">{label}</a></li>
                      ))}
                    </ul>
                  </div>
      
                  {/* Operators */}
                  <div>
                    <div className="text-white font-bold mb-4 text-sm uppercase tracking-wider">For Operators</div>
                    <ul className="space-y-2 text-sm">
                      {[["Register Business","/agent-signup"],["Operator Login","/login"],["Manage Bookings","/agent/bookings"],["Dashboard","/agent/dashboard"]].map(([label, href]) => (
                        <li key={label}><a href={href} className="hover:text-green-400 transition-colors">{label}</a></li>
                      ))}
                    </ul>
                  </div>
                </div>
      
                <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
                  <p>© {new Date().getFullYear()} NammaCab. Built for Hubli–Dharwad. <span className="text-green-600">ನಮ್ಮ ಕ್ಯಾಬ್</span></p>
                  <div className="flex gap-6">
                    <a href="#" className="hover:text-green-400 transition-colors">Privacy Policy</a>
                    <a href="#" className="hover:text-green-400 transition-colors">Terms of Service</a>
                    <a href="#" className="hover:text-green-400 transition-colors">Contact</a>
                  </div>
                </div>
              </div>
            </footer>
    </div>
  )
}

export default function VehiclesPage() {
  return <Suspense><VehiclesPageInner/></Suspense>
}
