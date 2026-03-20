"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, useInView } from "framer-motion"
import { DotLottieReact } from "@lottiefiles/dotlottie-react"
import { Car, MapPin, Calendar, Repeat, ArrowRight, Star, Shield, Clock, Users, CheckCircle, ChevronDown, Phone, Mail, Building2, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Navbar from "@/components/navbar"
import { gettripTypes } from "@/services/admin/tripTypesService"
import { getVehicleTypes } from "@/services/admin/vehicleTypesService"

// ─── Reusable fade-in wrapper ──────────────────────────────────────────────
function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── Static data ───────────────────────────────────────────────────────────
const VEHICLES = [
  { id: "mini", title: "Mini / Hatchback", desc: "Affordable city rides", seats: "4 seats", image: "/images/cars/mini-car.png", tag: "Best Value" },
  { id: "sedan", title: "Sedan", desc: "Comfortable everyday journeys", seats: "5 seats", image: "/images/cars/sedan-car.jpg", tag: "Most Popular" },
  { id: "suv", title: "SUV", desc: "Spacious long-distance trips", seats: "7 seats", image: "/images/cars/suv-car.png", tag: "Premium" },
  { id: "tempo", title: "Tempo Traveller", desc: "Perfect for group travel", seats: "12+ seats", image: "/images/cars/TT.jpg", tag: "Group Trips" },
]

const STATS = [
  { value: "50+", label: "Local Operators" },
  { value: "500+", label: "Trips Completed" },
  { value: "4.8★", label: "Average Rating" },
  { value: "24/7", label: "Support" },
]

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: Repeat,
    title: "Choose Your Trip",
    desc: "Select trip type — local, outstation, or airport. Pick your pickup point, drop location, date and vehicle.",
  },
  {
    step: "02",
    icon: Zap,
    title: "Compare & Book",
    desc: "See all available Hubli operators with transparent pricing. No hidden charges. Book in seconds.",
  },
  {
    step: "03",
    icon: Car,
    title: "Enjoy Your Ride",
    desc: "Operator confirms your booking and contacts you. Sit back and travel comfortably.",
  },
]

const WHY_US = [
  { icon: Shield, title: "Verified Operators", desc: "Every tours & travels on our platform is manually verified by our team." },
  { icon: CheckCircle, title: "Transparent Pricing", desc: "See the exact price before booking. Zero hidden fees or surprise charges." },
  { icon: Clock, title: "Instant Confirmation", desc: "Get booking confirmation within minutes, not hours of waiting on calls." },
  { icon: Users, title: "Local First", desc: "We support Hubli's local travel businesses — not outsider chains." },
]

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter()
  const today = new Date().toISOString().split("T")[0]

  const [tripTypes, setTripTypes] = useState<any[]>([])
  const [vehicleTypes, setVehicleTypes] = useState<any[]>([])
  const [tripTypeId, setTripTypeId] = useState("")
  const [tripTypeName, setTripTypeName] = useState("")
  const [vehicleTypeId, setVehicleTypeId] = useState("")
  const [vehicleTypeName, setVehicleTypeName] = useState("")
  const [pickup, setPickup] = useState("")
  const [destination, setDestination] = useState("")
  const [date, setDate] = useState("")
  const [formError, setFormError] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trips, vehicles] = await Promise.all([gettripTypes(), getVehicleTypes()])
        setTripTypes(trips || [])
        setVehicleTypes(vehicles || [])
      } catch (err) {
        console.error("Failed to fetch filters:", err)
      }
    }
    fetchData()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError("")
    const needsDest = tripTypeName !== "Airport"
    if (!tripTypeId || !vehicleTypeId || !pickup || !date || (needsDest && !destination)) {
      setFormError("Please fill in all required fields before searching.")
      return
    }
    router.push(
      `/user/vehicles?tripTypeId=${tripTypeId}&tripTypeName=${encodeURIComponent(tripTypeName)}&vehicleTypeId=${vehicleTypeId}&vehicleTypeName=${encodeURIComponent(vehicleTypeName)}&pickup=${encodeURIComponent(pickup)}&destination=${encodeURIComponent(destination)}&date=${encodeURIComponent(date)}`
    )
  }

  const isAirport = tripTypeName === "Airport"

  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-green-950 to-slate-900 pt-20">
        {/* Background texture */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, #16a34a 0%, transparent 50%),
                            radial-gradient(circle at 80% 20%, #15803d 0%, transparent 40%),
                            radial-gradient(circle at 60% 80%, #166534 0%, transparent 45%)`
        }} />
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2316a34a' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />

        <div className="max-w-7xl mx-auto px-6 md:px-12 w-full relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16 py-16">

            {/* Left — copy */}
            <motion.div
              className="flex-1 text-center lg:text-left"
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Now available in Hubli–Dharwad
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight mb-6">
                Every Cab in
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">
                  Hubli,
                </span>
                <br />
                One Platform.
              </h1>

              <p className="text-lg md:text-xl text-slate-300 max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
                Stop calling around. Compare all local tours &amp; travels operators, see real prices, and book your ride in under 60 seconds.
              </p>

              <div className="flex flex-wrap gap-6 justify-center lg:justify-start mb-10">
                {STATS.map((s) => (
                  <div key={s.label} className="text-center lg:text-left">
                    <div className="text-2xl font-black text-green-400">{s.value}</div>
                    <div className="text-sm text-slate-400">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 justify-center lg:justify-start">
                <a href="#search">
                  <Button className="h-12 px-8 bg-green-500 hover:bg-green-400 text-white font-bold rounded-xl text-base shadow-lg shadow-green-500/25 transition-all duration-200 hover:scale-105">
                    Book a Ride
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </a>
                <a href="/agent-signup">
                  <Button variant="outline" className="h-12 px-8 border-white/20 text-white hover:bg-white/10 rounded-xl text-base font-semibold">
                    List Your Cabs
                  </Button>
                </a>
              </div>
            </motion.div>

            {/* Right — lottie */}
            <motion.div
              className="flex-1 flex justify-center lg:justify-end"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-green-500/10 rounded-3xl blur-3xl scale-110" />
                <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-4">
                  <DotLottieReact
                    width={420}
                    height={360}
                    src="https://lottie.host/7e0a9dc3-fc78-4753-89a3-e882ddd5dfdc/MCnY92gelA.lottie"
                    loop
                    autoplay
                  />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Scroll cue */}
          <motion.div
            className="flex justify-center pb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            <a href="#search" className="flex flex-col items-center gap-1 text-slate-500 hover:text-green-400 transition-colors">
              <span className="text-xs tracking-widest uppercase">Search</span>
              <ChevronDown className="w-5 h-5 animate-bounce" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── SEARCH BAR ────────────────────────────────────────────────────── */}
      <section id="search" className="relative z-20 py-0">
        <div className="max-w-6xl mx-auto px-4 -mt-1">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
          >
            {/* Tab strip */}
            <div className="flex border-b border-slate-100 bg-slate-50 px-6 pt-4 gap-1">
              {tripTypes.length === 0 ? (
                <div className="flex gap-3 pb-3">
                  {["Local", "Outstation", "Airport"].map((t) => (
                    <div key={t} className="h-8 w-24 bg-slate-200 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : (
                tripTypes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setTripTypeId(t.id); setTripTypeName(t.name); setFormError("") }}
                    className={`px-5 py-2 rounded-t-lg text-sm font-semibold transition-all duration-150 border-b-2 ${
                      tripTypeId === t.id
                        ? "bg-white border-green-500 text-green-700 shadow-sm"
                        : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-white/60"
                    }`}
                  >
                    {t.name}
                  </button>
                ))
              )}
            </div>

            {/* Form fields */}
            <form onSubmit={handleSearch} className="p-5 md:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">

                {/* Pickup */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pickup Location</label>
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 h-12 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-100 transition-all">
                    <MapPin className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    <Input
                      type="text"
                      placeholder="e.g. Hubli Railway Station"
                      value={pickup}
                      onChange={(e) => setPickup(e.target.value)}
                      required
                      className="border-0 bg-transparent p-0 h-auto text-sm focus-visible:ring-0 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Drop — hidden for Airport */}
                {!isAirport ? (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Drop Location</label>
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 h-12 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-100 transition-all">
                      <MapPin className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
                      <Input
                        type="text"
                        placeholder="e.g. Dharwad, Bangalore"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        required={!isAirport}
                        className="border-0 bg-transparent p-0 h-auto text-sm focus-visible:ring-0 placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Airport</label>
                    <div className="flex items-center bg-green-50 border border-green-200 rounded-xl px-3 h-12">
                      <MapPin className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-sm text-green-700 font-medium">Hubli Airport (HBX)</span>
                    </div>
                  </div>
                )}

                {/* Date */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Travel Date</label>
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 h-12 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-100 transition-all">
                    <Calendar className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    <Input
                      type="date"
                      min={today}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className="border-0 bg-transparent p-0 h-auto text-sm focus-visible:ring-0"
                    />
                  </div>
                </div>

                {/* Vehicle */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Vehicle Type</label>
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 h-12 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-100 transition-all">
                    <Car className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    <Select
                      value={vehicleTypeId}
                      onValueChange={(val) => {
                        setVehicleTypeId(val)
                        setVehicleTypeName(vehicleTypes.find((v) => v.id === val)?.name || "")
                      }}
                    >
                      <SelectTrigger className="border-0 bg-transparent p-0 h-auto text-sm focus:ring-0 shadow-none">
                        <SelectValue placeholder="Select vehicle" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicleTypes.map((v) => (
                          <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {formError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 mb-4">
                  {formError}
                </p>
              )}

              {!tripTypeId && (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 mb-4">
                  Select a trip type above (Local / Outstation / Airport) to get started.
                </p>
              )}

              <Button
                type="submit"
                disabled={!tripTypeId}
                className="w-full h-12 bg-green-600 hover:bg-green-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-base rounded-xl shadow-lg shadow-green-500/20 transition-all duration-200 hover:scale-[1.01]"
              >
                Search Available Cabs
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* ── VEHICLES SHOWCASE ─────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <FadeIn className="text-center mb-14">
            <span className="text-green-600 font-semibold text-sm uppercase tracking-widest">Our Fleet</span>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mt-2 mb-4">
              Vehicle for Every Journey
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              From solo airport runs to family group trips — Hubli operators on our platform cover it all.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VEHICLES.map((v, i) => (
              <FadeIn key={v.id} delay={i * 0.08}>
                <div className="group relative bg-white border border-slate-100 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-green-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                  {/* Tag */}
                  <div className="absolute top-3 left-3 z-10 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                    {v.tag}
                  </div>
                  {/* Image */}
                  <div className="bg-gradient-to-br from-slate-50 to-green-50 h-48 flex items-center justify-center overflow-hidden">
                    <img
                      src={v.image}
                      alt={v.title}
                      className="h-36 w-auto object-contain transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  {/* Info */}
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-black text-slate-900 text-lg">{v.title}</h3>
                      <div className="flex items-center gap-1 text-slate-400 text-xs">
                        <Users className="w-3.5 h-3.5" />
                        {v.seats}
                      </div>
                    </div>
                    <p className="text-slate-500 text-sm mb-4">{v.desc}</p>
                    <a href="#search">
                      <Button variant="outline" className="w-full h-9 border-green-200 text-green-700 hover:bg-green-500 hover:text-white hover:border-green-500 rounded-xl text-sm font-semibold transition-all duration-200">
                        Book This Vehicle
                      </Button>
                    </a>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section className="py-24 bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `radial-gradient(circle at 10% 50%, #16a34a 0%, transparent 45%),
                            radial-gradient(circle at 90% 50%, #166534 0%, transparent 45%)`
        }} />
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <FadeIn className="text-center mb-16">
            <span className="text-green-400 font-semibold text-sm uppercase tracking-widest">Simple Process</span>
            <h2 className="text-4xl md:text-5xl font-black text-white mt-2 mb-4">
              Book in 3 Steps
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              No more calling 10 numbers. Find and book your cab in under a minute.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((step, i) => (
              <FadeIn key={step.step} delay={i * 0.12}>
                <div className="relative group">
                  {/* Connector line (desktop) */}
                  {i < 2 && (
                    <div className="hidden md:block absolute top-10 left-full w-full h-px bg-gradient-to-r from-green-500/40 to-transparent z-0 translate-x-4" />
                  )}
                  <div className="relative bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/8 hover:border-green-500/30 transition-all duration-300">
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center group-hover:bg-green-500 group-hover:border-green-500 transition-all duration-300">
                        <step.icon className="w-6 h-6 text-green-400 group-hover:text-white transition-colors duration-300" />
                      </div>
                      <span className="text-5xl font-black text-white/10 group-hover:text-green-500/20 transition-colors duration-300">{step.step}</span>
                    </div>
                    <h3 className="text-xl font-black text-white mb-3">{step.title}</h3>
                    <p className="text-slate-400 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE US ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <FadeIn>
              <span className="text-green-600 font-semibold text-sm uppercase tracking-widest">Why Triply Cars</span>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mt-3 mb-6 leading-tight">
                Hubli's First <br />
                <span className="text-green-600">Cab Marketplace</span>
              </h2>
              <p className="text-lg text-slate-500 mb-8 leading-relaxed">
                Before Triply Cars, finding a cab in Hubli meant calling friends or visiting multiple websites manually. We built the platform we always wished existed — one place for every operator, every vehicle, every trip.
              </p>
              <div className="flex flex-col gap-3">
                {["No more calling 10 operators", "Compare prices in one view", "Book at any time, from anywhere", "Review operators after your trip"].map((point) => (
                  <div key={point} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                    </div>
                    <span className="text-slate-700 font-medium">{point}</span>
                  </div>
                ))}
              </div>
            </FadeIn>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {WHY_US.map((item, i) => (
                <FadeIn key={item.title} delay={i * 0.08}>
                  <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl hover:border-green-200 hover:bg-green-50/50 transition-all duration-300 group">
                    <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center mb-4 group-hover:bg-green-500 transition-colors duration-300">
                      <item.icon className="w-5 h-5 text-green-600 group-hover:text-white transition-colors duration-300" />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOR OPERATORS CTA ─────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-emerald-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <FadeIn>
            <span className="inline-flex items-center gap-2 bg-white/20 border border-white/30 text-white px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <Building2 className="w-4 h-4" />
              For Tours & Travels Owners
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-5 leading-tight">
              Grow Your Business <br />With Triply Cars
            </h2>
            <p className="text-lg text-green-100 max-w-2xl mx-auto mb-10 leading-relaxed">
              List your vehicles for free. Get bookings directly from customers across Hubli–Dharwad. No commission for the first 3 months.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/agent-signup">
                <Button className="h-13 px-10 bg-white text-green-700 hover:bg-green-50 font-black text-base rounded-xl shadow-xl hover:scale-105 transition-all duration-200">
                  Register Your Business — Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </a>
              <a href="/login">
                <Button variant="outline" className="h-13 px-10 border-white/40 text-white hover:bg-white/10 font-semibold text-base rounded-xl">
                  Already Registered? Login
                </Button>
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="bg-slate-950 text-slate-400">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="text-2xl font-black text-white mb-3">Triply Cars</div>
              <p className="text-slate-400 text-sm leading-relaxed max-w-sm mb-5">
                Hubli's first cab marketplace. Connecting travellers with verified local operators for a seamless booking experience.
              </p>
              <div className="flex flex-col gap-2 text-sm">
                <a href="tel:+91-XXXXXXXXXX" className="flex items-center gap-2 hover:text-green-400 transition-colors">
                  <Phone className="w-4 h-4 text-green-500" />
                  +91-XXXXXXXXXX
                </a>
                <a href="mailto:hello@triplycars.in" className="flex items-center gap-2 hover:text-green-400 transition-colors">
                  <Mail className="w-4 h-4 text-green-500" />
                  hello@triplycars.in
                </a>
              </div>
            </div>

            {/* Quick links */}
            <div>
              <div className="text-white font-bold mb-4 text-sm uppercase tracking-wider">For Travellers</div>
              <ul className="space-y-2 text-sm">
                {[
                  ["Book a Cab", "#search"],
                  ["My Bookings", "/user/mybookings"],
                  ["Login", "/login"],
                  ["Sign Up", "/user-signup"],
                ].map(([label, href]) => (
                  <li key={label}>
                    <a href={href} className="hover:text-green-400 transition-colors">{label}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Operator links */}
            <div>
              <div className="text-white font-bold mb-4 text-sm uppercase tracking-wider">For Operators</div>
              <ul className="space-y-2 text-sm">
                {[
                  ["Register Business", "/agent-signup"],
                  ["Agent Login", "/login"],
                  ["Manage Bookings", "/agent/bookings"],
                  ["View Dashboard", "/agent/dashboard"],
                ].map(([label, href]) => (
                  <li key={label}>
                    <a href={href} className="hover:text-green-400 transition-colors">{label}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
            <p>© {new Date().getFullYear()} Triply Cars. Built for Hubli–Dharwad.</p>
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
