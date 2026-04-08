"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { motion, useInView, AnimatePresence } from "framer-motion"
import {
  Car, MapPin, Calendar, ArrowRight, Shield, Clock,
  Users, CheckCircle, ChevronDown, Phone, Mail, Building2,
  Zap, Repeat, PlaneTakeoff, PlaneLanding,
  ArrowRightLeft, Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Navbar from "@/components/navbar"
import { gettripTypes } from "@/services/admin/tripTypesService"
import { getVehicleTypes, vehicleType } from "@/services/admin/vehicleTypesService"

// ── Fade-in wrapper ────────────────────────────────────────────────────────
function FadeIn({ children, delay = 0, className = "" }: {
  children: React.ReactNode; delay?: number; className?: string
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}>
      {children}
    </motion.div>
  )
}

// ── Helpers & Static Data ──────────────────────────────────────────────────
const CAR_IMAGE_MAP: Record<string, string> = {
  "mini": "mini-nobg.png",
  "sedan": "sedan-nobg.png",
  "ertiga": "ertiga-nobg.png",
  "innova": "innova-nobg.png",
  "innova-crysta": "crysta-nobg.png",
  "suv": "Scorpio-nobg.png",
  "premium-suv": "Toyota-Innova--Crysta-MPV.png",
  "tempo-traveller": "tt-nobg.png",
  "bus": "Bus-nobg.png",
}

const TIME_OPTIONS = Array.from({ length: 48 }).map((_, i) => {
  const hour = Math.floor(i / 2);
  const min = i % 2 === 0 ? "00" : "30";
  const ampm = hour < 12 ? "AM" : "PM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${min} ${ampm}`;
});

const STATS = [
  { value: "50+", label: "Local Operators" },
  { value: "24/7", label: "Support" },
]

const HOW_IT_WORKS = [
  { step: "01", icon: Repeat, title: "Choose Your Trip", desc: "Select trip type — local, outstation, or airport. Pick your route, date, and pickup time." },
  { step: "02", icon: Zap, title: "Compare & Book", desc: "See all available Hubli operators with transparent pricing. No hidden charges. Select your car and book." },
  { step: "03", icon: Car, title: "Enjoy Your Ride", desc: "Operator confirms your booking and contacts you. Sit back and travel comfortably." },
]

const WHY_US = [
  { icon: Shield, title: "Verified Operators", desc: "Every tours & travels on our platform is manually verified by our team." },
  { icon: CheckCircle, title: "Transparent Pricing", desc: "See the exact price before booking. Zero hidden fees or surprise charges." },
  { icon: Clock, title: "Instant Confirmation", desc: "Get booking confirmation within minutes, not hours of waiting on calls." },
  { icon: Users, title: "Local First", desc: "We support Hubli's local travel businesses — not outsider chains." },
]

// ── Photon API Helper (With AbortController support) ──────────────────────
interface Suggestion {
  name: string;
  sub?: string;
}

const fetchPhoton = async (query: string, signal?: AbortSignal): Promise<Suggestion[]> => {
  try {
    const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lat=15.3647&lon=75.1240`, { signal });
    const data = await res.json();
    return (data.features || []).map((f: any) => {
      const p = f.properties;
      const subArr = [p.city, p.state].filter(Boolean);
      const sub = subArr.join(", ");
      return { name: p.name, sub: sub !== p.name ? sub : undefined };
    });
  } catch (e: any) {
    if (e.name === 'AbortError') return [];
    console.error("Photon API error:", e);
    return [];
  }
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter()
  const today = new Date().toISOString().split("T")[0]

  const [tripTypes, setTripTypes] = useState<any[]>([])
  const [vehicleTypes, setVehicleTypes] = useState<vehicleType[]>([])
  const [fleetLoading, setFleetLoading] = useState(true)

  const [tripTypeId, setTripTypeId] = useState("")
  const [tripTypeName, setTripTypeName] = useState("")

  const [pickup, setPickup] = useState("")
  const [destination, setDestination] = useState("")
  const [airportCity, setAirportCity] = useState("")
  const [date, setDate] = useState("")
  const [returnDate, setReturnDate] = useState("")
  const [time, setTime] = useState("")

  const [airportDirection, setAirportDirection] = useState<"to" | "from">("to")
  const [outstationType, setOutstationType] = useState<"one-way" | "round-trip">("round-trip")
  const [formError, setFormError] = useState("")

  const [showPickupOptions, setShowPickupOptions] = useState(false)
  const [showDestOptions, setShowDestOptions] = useState(false)
  const [showAirportCityOptions, setShowAirportCityOptions] = useState(false)

  const [pickupSuggestions, setPickupSuggestions] = useState<Suggestion[]>([])
  const [destSuggestions, setDestSuggestions] = useState<Suggestion[]>([])
  const [airportCitySuggestions, setAirportCitySuggestions] = useState<Suggestion[]>([])

  const [loadingPickup, setLoadingPickup] = useState(false)
  const [loadingDest, setLoadingDest] = useState(false)
  const [loadingAirport, setLoadingAirport] = useState(false)

  const abortControllers = useRef<{ pickup?: AbortController, dest?: AbortController, airport?: AbortController }>({});

  const pickupDateRef = useRef<HTMLInputElement>(null);
  const returnDateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFleetLoading(true)
    Promise.all([gettripTypes(), getVehicleTypes()])
      .then(([trips, vehicles]) => {
        setTripTypes(trips || [])
        setVehicleTypes(vehicles || [])
        const outstation = trips?.find((t: any) => t.name.toLowerCase().includes("outstation")) || trips?.[0];
        if (outstation) {
          setTripTypeId(outstation.id);
          setTripTypeName(outstation.name);
        }
        setFleetLoading(false)
      })
      .catch(err => {
        console.error("Failed to fetch fleet data:", err)
        setFleetLoading(false)
      })
  }, [])

  // ── High Performance Autocomplete logic ──
  const handleAutocomplete = async (
    query: string, 
    setter: (val: Suggestion[]) => void, 
    setLoadingState: (val: boolean) => void,
    type: "pickup" | "dest" | "airport"
  ) => {
    if (query.length < 3) {
      setter([]);
      setLoadingState(false);
      return;
    }

    if (abortControllers.current[type]) {
      abortControllers.current[type]?.abort();
    }

    const controller = new AbortController();
    abortControllers.current[type] = controller;
    setLoadingState(true);
    
    const remote = await fetchPhoton(query, controller.signal);
    
    if (!controller.signal.aborted) {
      setter(remote.slice(0, 7));
      setLoadingState(false);
    }
  }

  useEffect(() => {
    if (showPickupOptions) {
      const t = setTimeout(() => handleAutocomplete(pickup, setPickupSuggestions, setLoadingPickup, "pickup"), 300);
      return () => clearTimeout(t);
    }
  }, [pickup, showPickupOptions]);

  useEffect(() => {
    if (showDestOptions) {
      const t = setTimeout(() => handleAutocomplete(destination, setDestSuggestions, setLoadingDest, "dest"), 300);
      return () => clearTimeout(t);
    }
  }, [destination, showDestOptions]);

  useEffect(() => {
    if (showAirportCityOptions) {
      const t = setTimeout(() => handleAutocomplete(airportCity, setAirportCitySuggestions, setLoadingAirport, "airport"), 300);
      return () => clearTimeout(t);
    }
  }, [airportCity, showAirportCityOptions]);


  const isAirport = tripTypeName.toLowerCase().includes("airport");
  const isLocal = tripTypeName.toLowerCase().includes("local");
  const isOutstation = !isAirport && !isLocal;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError("")

    if (!tripTypeId || !date || !time) {
      setFormError("Please fill in the date and time.")
      return
    }

    let finalPickup = pickup.trim();
    let finalDest = destination.trim();
    let additionalParams = "";

    if (isAirport) {
      if (airportCity.trim().length <= 2) {
        setFormError("Please enter a valid city name (min 3 characters).")
        return;
      }
      if (airportDirection === "to") {
        finalPickup = airportCity.trim();
        finalDest = "Hubli Airport (HBX)";
      } else {
        finalPickup = "Hubli Airport (HBX)";
        finalDest = airportCity.trim();
      }
    } else if (isLocal) {
      if (pickup.trim().length <= 2) {
        setFormError("Pickup location must be at least 3 characters long.")
        return;
      }
      finalPickup = pickup.trim();
      finalDest = "Local Rental Package";
    } else if (isOutstation) {
      if (pickup.trim().length <= 2 || destination.trim().length <= 2) {
        setFormError("Locations must be at least 3 characters long.")
        return;
      }
      if (pickup.trim().toLowerCase() === destination.trim().toLowerCase()) {
        setFormError("Pickup and Drop locations cannot be the same.")
        return;
      }
      if (outstationType === "round-trip") {
        if (!returnDate) {
          setFormError("Please select a return date for your round trip.");
          return;
        }
        if (returnDate < date) {
          setFormError("Return date cannot be before the pickup date.");
          return;
        }
        additionalParams = `&isRoundTrip=true&returnDate=${encodeURIComponent(returnDate)}`;
      } else {
        additionalParams = `&isRoundTrip=false`;
      }
      finalPickup = pickup.trim();
      finalDest = destination.trim();
    }

    router.push(
      `/user/vehicles?tripTypeId=${tripTypeId}&tripTypeName=${encodeURIComponent(tripTypeName)}` +
      `&pickup=${encodeURIComponent(finalPickup)}&destination=${encodeURIComponent(finalDest)}` +
      `&date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}${additionalParams}`
    )
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar />

      {/* ═══════════════════ HERO ═══════════════════ */}
      <section className="relative min-h-[85vh] flex items-center bg-gradient-to-br from-slate-950 via-green-950 to-slate-900 pt-24 pb-32 overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `radial-gradient(circle at 20% 50%,#16a34a 0%,transparent 50%),
                         radial-gradient(circle at 80% 20%,#15803d 0%,transparent 40%),
                         radial-gradient(circle at 60% 80%,#166534 0%,transparent 45%)`
        }} />
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2316a34a' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />

        <div className="max-w-7xl mx-auto px-6 md:px-12 w-full relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16 py-16">

            <motion.div className="flex-1 text-center lg:text-left"
              initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>

              <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Now available in Hubli–Dharwad
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight mb-6">
                Every Cab in<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">Hubli,</span><br />
                One Platform.
              </h1>

              <p className="text-lg md:text-xl text-slate-300 max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
                Stop calling around. Compare all local tours &amp; travels operators, see real prices, and book your ride in under 60 seconds.
              </p>

              <div className="flex flex-wrap gap-6 justify-center lg:justify-start mb-10">
                {STATS.map(s => (
                  <div key={s.label} className="text-center lg:text-left">
                    <div className="text-2xl font-black text-green-400">{s.value}</div>
                    <div className="text-sm text-slate-400">{s.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            <div className="flex-1 flex justify-center lg:justify-end w-full max-w-[520px] lg:max-w-none">
              {/* <VideoBanner /> */}
            </div>
          </div>

          <motion.div className="flex justify-center pb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
            <Link href="#search" className="flex flex-col items-center gap-1 text-slate-500 hover:text-green-400 transition-colors">
              <span className="text-xs tracking-widest uppercase">Search</span>
              <ChevronDown className="w-5 h-5 animate-bounce" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════ SEARCH ═══════════════════ */}
      <section id="search" className="relative z-30 -mt-28 px-4">
        <div className="max-w-[1150px] mx-auto px-4 -mt-1">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-visible">

            <div className="flex border-b border-slate-100 bg-slate-50 px-4 pt-4 gap-2 rounded-t-2xl overflow-hidden overflow-x-auto hide-scrollbar">
              {tripTypes.length === 0 ? (
                <div className="flex gap-3 pb-3">
                  {["Outstation", "Local", "Airport"].map(t => (
                    <div key={t} className="h-10 w-28 bg-slate-200 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : (
                tripTypes.map(t => (
                  <button key={t.id}
                    onClick={() => { setTripTypeId(t.id); setTripTypeName(t.name); setFormError(""); }}
                    className={`px-6 py-3 rounded-t-xl text-sm font-bold transition-all duration-150 border-b-2 whitespace-nowrap ${tripTypeId === t.id
                      ? "bg-white border-green-500 text-green-700 shadow-sm"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-white/60"
                      }`}>
                    {t.name}
                  </button>
                ))
              )}
            </div>

            <form onSubmit={handleSearch} className="p-6 md:p-8">

              <div className="flex flex-wrap gap-3 mb-6">
                {isAirport && (
                  <div className="flex gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                    <button type="button" onClick={() => setAirportDirection("to")}
                      className={`px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2 transition-colors ${airportDirection === "to" ? "bg-white shadow-sm text-slate-900 border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}>
                      <PlaneTakeoff className="w-4 h-4" /> To Airport
                    </button>
                    <button type="button" onClick={() => setAirportDirection("from")}
                      className={`px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2 transition-colors ${airportDirection === "from" ? "bg-white shadow-sm text-slate-900 border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}>
                      <PlaneLanding className="w-4 h-4" /> From Airport
                    </button>
                  </div>
                )}
                {isOutstation && (
                  <div className="flex gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                    <button type="button" onClick={() => setOutstationType("one-way")}
                      className={`px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2 transition-colors ${outstationType === "one-way" ? "bg-white shadow-sm text-slate-900 border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}>
                      <ArrowRight className="w-4 h-4" /> One-Way
                    </button>
                    <button type="button" onClick={() => setOutstationType("round-trip")}
                      className={`px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2 transition-colors ${outstationType === "round-trip" ? "bg-white shadow-sm text-slate-900 border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}>
                      <ArrowRightLeft className="w-4 h-4" /> Round Trip
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 mb-6">

                {isAirport ? (
                  <div className="flex flex-col gap-1.5 relative lg:col-span-6">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      {airportDirection === "to" ? "Pickup City/Area" : "Drop City/Area"}
                    </label>
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 h-14 focus-within:bg-white focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-100 transition-all relative">
                      <MapPin className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      <Input type="text" placeholder="e.g. Hubli, Dharwad"
                        value={airportCity}
                        onChange={e => { setAirportCity(e.target.value); setShowAirportCityOptions(true); }}
                        onFocus={() => { if(airportCitySuggestions.length) setShowAirportCityOptions(true) }}
                        onBlur={() => setTimeout(() => setShowAirportCityOptions(false), 200)}
                        required
                        className="border-0 bg-transparent p-0 h-auto text-base focus-visible:ring-0 placeholder:text-slate-400 font-medium w-full flex-1"
                      />
                      {loadingAirport && <Loader2 className="w-4 h-4 text-green-600 animate-spin absolute right-4"/>}
                    </div>
                    <AnimatePresence>
                      {showAirportCityOptions && airportCity && airportCitySuggestions.length > 0 && (
                        <motion.ul initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                          className="absolute top-[105%] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto py-2">
                          {airportCitySuggestions.map((place, idx) => (
                            <li key={idx} onClick={() => { setAirportCity(place.name); setShowAirportCityOptions(false); }}
                              className="px-4 py-3 hover:bg-green-50 hover:text-green-700 cursor-pointer text-sm font-semibold text-slate-700 transition-colors">
                              <div className="text-sm font-bold text-slate-800">{place.name}</div>
                              {place.sub && <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">{place.sub}</div>}
                            </li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <>
                    <div className={`flex flex-col gap-1.5 relative ${isLocal ? 'lg:col-span-6' : 'lg:col-span-3'}`}>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Pickup City</label>
                      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 h-14 focus-within:bg-white focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-100 transition-all relative">
                        <MapPin className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                        <Input type="text" placeholder="Search city or area..."
                          value={pickup}
                          onChange={e => { setPickup(e.target.value); setShowPickupOptions(true); }}
                          onFocus={() => { if(pickupSuggestions.length) setShowPickupOptions(true) }}
                          onBlur={() => setTimeout(() => setShowPickupOptions(false), 200)}
                          required
                          className="border-0 bg-transparent p-0 h-auto text-base focus-visible:ring-0 placeholder:text-slate-400 font-medium w-full flex-1"
                        />
                        {loadingPickup && <Loader2 className="w-4 h-4 text-green-600 animate-spin absolute right-4"/>}
                      </div>
                      <AnimatePresence>
                        {showPickupOptions && pickup && pickupSuggestions.length > 0 && (
                          <motion.ul initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                            className="absolute top-[105%] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto py-2">
                            {pickupSuggestions.map((place, idx) => (
                              <li key={idx} onClick={() => { setPickup(place.name); setShowPickupOptions(false); }}
                                className="px-4 py-3 hover:bg-green-50 hover:text-green-700 cursor-pointer text-sm font-semibold text-slate-700 transition-colors">
                                <div className="text-sm font-bold text-slate-800">{place.name}</div>
                                {place.sub && <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">{place.sub}</div>}
                              </li>
                            ))}
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </div>
                    {!isLocal && (
                      <div className="flex flex-col gap-1.5 relative lg:col-span-3">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Drop City</label>
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 h-14 focus-within:bg-white focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-100 transition-all relative">
                          <MapPin className="w-5 h-5 text-slate-400 mr-3 flex-shrink-0" />
                          <Input type="text" placeholder="Search destination..."
                            value={destination}
                            onChange={e => { setDestination(e.target.value); setShowDestOptions(true); }}
                            onFocus={() => { if(destSuggestions.length) setShowDestOptions(true) }}
                            onBlur={() => setTimeout(() => setShowDestOptions(false), 200)}
                            required
                            className="border-0 bg-transparent p-0 h-auto text-base focus-visible:ring-0 placeholder:text-slate-400 font-medium w-full flex-1"
                          />
                          {loadingDest && <Loader2 className="w-4 h-4 text-green-600 animate-spin absolute right-4"/>}
                        </div>
                        <AnimatePresence>
                          {showDestOptions && destination && destSuggestions.length > 0 && (
                            <motion.ul initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                              className="absolute top-[105%] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto py-2">
                              {destSuggestions.map((place, idx) => (
                                <li key={idx} onClick={() => { setDestination(place.name); setShowDestOptions(false); }}
                                  className="px-4 py-3 hover:bg-green-50 hover:text-green-700 cursor-pointer text-sm font-semibold text-slate-700 transition-colors">
                                  <div className="text-sm font-bold text-slate-800">{place.name}</div>
                                  {place.sub && <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">{place.sub}</div>}
                                </li>
                              ))}
                            </motion.ul>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </>
                )}

                <div className={`flex flex-col gap-1.5 ${isOutstation && outstationType === "round-trip" ? "lg:col-span-2" : "lg:col-span-3"}`}>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Pickup Date</label>
                  <div
                    className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 h-14 focus-within:bg-white focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-100 transition-all cursor-pointer"
                    onClick={() => pickupDateRef.current?.showPicker()}
                  >
                    <Calendar className="w-5 h-5 text-slate-400 mr-3 flex-shrink-0" />
                    <Input
                      ref={pickupDateRef}
                      id="date"
                      type="date"
                      min={today}
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      required
                      className="border-0 bg-transparent p-0 h-auto text-base focus-visible:ring-0 font-medium text-slate-700 w-full flex-1 [&::-webkit-calendar-picker-indicator]:hidden cursor-pointer"
                    />
                  </div>
                </div>

                {isOutstation && outstationType === "round-trip" && (
                  <div className="flex flex-col gap-1.5 lg:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide text-green-600">Return Date</label>
                    <div
                      className="flex items-center bg-green-50/50 border border-green-200 rounded-xl px-4 h-14 focus-within:bg-white focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-100 transition-all cursor-pointer"
                      onClick={() => returnDateRef.current?.showPicker()}
                    >
                      <Calendar className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      <Input
                        ref={returnDateRef}
                        id="returnDate"
                        type="date"
                        min={date || today}
                        value={returnDate}
                        onChange={e => setReturnDate(e.target.value)}
                        required
                        className="border-0 bg-transparent p-0 h-auto text-base focus-visible:ring-0 font-medium text-slate-700 w-full flex-1 [&::-webkit-calendar-picker-indicator]:hidden cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                <div className={`flex flex-col gap-1.5 ${isOutstation && outstationType === "round-trip" ? "lg:col-span-2" : "lg:col-span-3"}`}>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Pickup Time</label>
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 h-14 focus-within:bg-white focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-100 transition-all">
                    <Clock className="w-5 h-5 text-slate-400 mr-3 flex-shrink-0" />
                    <Select value={time} onValueChange={setTime} required>
                      <SelectTrigger className="border-0 bg-transparent p-0 h-auto text-base font-medium text-slate-700 focus:ring-0 shadow-none w-full flex-1">
                        <SelectValue placeholder="Select Time" />
                      </SelectTrigger>
                      <SelectContent className="max-h-64 border-slate-200 shadow-xl rounded-xl">
                        {TIME_OPTIONS.map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {formError && (
                <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6 flex items-center gap-2 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" /> {formError}
                </motion.p>
              )}

              <Button type="submit" disabled={!tripTypeId}
                className="w-full md:w-auto md:min-w-[280px] h-14 mx-auto block bg-slate-900 hover:bg-green-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-lg rounded-xl shadow-xl shadow-slate-900/10 transition-all hover:scale-[1.02] hover:shadow-green-600/25">
                Search Cabs & Prices <ArrowRight className="ml-2 w-5 h-5 inline-block" />
              </Button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════ FLEET ═══════════════════ */}
      <section id="fleet" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <FadeIn className="text-center mb-14">
            <span className="text-green-600 font-semibold text-sm uppercase tracking-widest">Our Fleet</span>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mt-2 mb-4">Vehicle for Every Journey</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              From solo airport runs to large group pilgrimages — every vehicle type available in Hubli.
            </p>
          </FadeIn>

          {fleetLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-white rounded-3xl border border-slate-100 shadow-sm" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {vehicleTypes.map((v, i) => {
                const imageName = CAR_IMAGE_MAP[v.slug] || "sedan-nobg.png";
                return (
                  <FadeIn key={v.id} delay={i * 0.05} className="h-full">
                    <div className="group bg-white border border-slate-100 rounded-3xl p-5 hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] hover:border-slate-200 transition-all duration-500 cursor-pointer flex flex-col h-full relative">
                      {v.badgeLabel && (
                        <div className="absolute top-5 left-5 z-10 bg-slate-900 text-white text-[10px] uppercase tracking-widest font-black px-3 py-1.5 rounded-full shadow-md">
                          {v.badgeLabel}
                        </div>
                      )}
                      <div className="relative h-40 mt-6 mb-4 flex items-center justify-center">
                        <div className="absolute bottom-2 w-4/5 h-4 bg-black/5 blur-[12px] rounded-[100%] group-hover:bg-black/10 transition-all duration-500" />
                        <Image
                          src={`/images/cars/${imageName}`}
                          alt={v.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                          className="object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-2 relative z-10"
                        />
                      </div>
                      <div className="mt-auto pt-4 border-t border-slate-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-black text-slate-900 text-xl tracking-tight leading-none">{v.name}</h3>
                            <p className="text-[11px] font-semibold text-slate-400 mt-2 line-clamp-1">{v.exampleVehicles || "Best in class"}</p>
                          </div>
                          <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 text-xs font-bold text-slate-600">
                            <Users className="w-3 h-3 text-slate-400" />
                            {v.maxSeats || 4}
                          </div>
                        </div>
                        <div className="flex items-end justify-between mt-6">
                          <div>
                            <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-0.5">Est. Rate</div>
                            <div className="text-lg font-black text-slate-900">₹{v.typicalPriceMin || 12}–{v.typicalPriceMax || 15}<span className="text-xs text-slate-400">/km</span></div>
                          </div>
                          <Link href="#search" className="block">
                            <Button className="rounded-full w-10 h-10 p-0 bg-slate-900 text-white hover:bg-green-600 transition-colors shadow-none"><ArrowRight className="w-4 h-4" /></Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </FadeIn>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════ HOW IT WORKS ═══════════════════ */}
      <section id="how-it-works" className="py-24 bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `radial-gradient(circle at 10% 50%,#16a34a 0%,transparent 45%),
                         radial-gradient(circle at 90% 50%,#166534 0%,transparent 45%)`
        }} />
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <FadeIn className="text-center mb-16">
            <span className="text-green-400 font-semibold text-sm uppercase tracking-widest">Simple Process</span>
            <h2 className="text-4xl md:text-5xl font-black text-white mt-2 mb-4">Book in 3 Steps</h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              No more calling 10 numbers. Find and book your cab in under a minute.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((step, i) => (
              <FadeIn key={step.step} delay={i * 0.12}>
                <div className="relative group">
                  {i < 2 && (
                    <div className="hidden md:block absolute top-10 left-full w-full h-px bg-gradient-to-r from-green-500/40 to-transparent z-0 translate-x-4" />
                  )}
                  <div className="relative bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/[0.08] hover:border-green-500/30 transition-all duration-300">
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

      {/* ═══════════════════ WHY NAMMACAB ═══════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <FadeIn>
              <span className="text-green-600 font-semibold text-sm uppercase tracking-widest">Why NammaCab</span>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mt-3 mb-6 leading-tight">
                Hubli&apos;s First<br />
                <span className="text-green-600">Cab Marketplace</span>
              </h2>
              <p className="text-lg text-slate-500 mb-8 leading-relaxed">
                Before NammaCab, finding a cab in Hubli meant calling friends or visiting multiple websites manually. We built the platform we always wished existed — one place for every operator, every vehicle, every trip.
              </p>
              <div className="flex flex-col gap-3">
                {[
                  "No more calling 10 operators",
                  "Compare prices in one view",
                  "Book at any time, from anywhere",
                  "Review operators after your trip",
                ].map(point => (
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
                  <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl hover:border-green-200 hover:bg-green-50/50 transition-all duration-300 group h-full">
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

      {/* ═══════════════════ OPERATOR CTA ═══════════════════ */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-emerald-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <FadeIn>
            <span className="inline-flex items-center gap-2 bg-white/20 border border-white/30 text-white px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <Building2 className="w-4 h-4" />For Tours &amp; Travels Owners
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-5 leading-tight">
              Grow Your Business<br />With NammaCab
            </h2>
            <p className="text-lg text-green-100 max-w-2xl mx-auto mb-10 leading-relaxed">
              List your vehicles for free. Get bookings directly from customers across Hubli–Dharwad. No commission for the first 3 months.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/agent-signup" className="block">
                <Button className="w-full sm:w-auto h-13 px-10 bg-white text-green-700 hover:bg-green-600 hover:text-white font-black text-base rounded-xl shadow-xl hover:scale-105 transition-all duration-200">
                  Register Your Business — Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/login" className="block">
                <Button variant="outline" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-14 px-10 border border-white/40 text-white hover:bg-white/20 font-semibold text-base rounded-xl transition-colors">
                  Already Registered? Sign in
                </Button>
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className="bg-slate-950 text-slate-400">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-black text-lg" style={{ fontFamily: "'Noto Sans Kannada',sans-serif" }}>ನ</span>
                </div>
                <div className="leading-none">
                  <span className="font-black text-xl text-white">namma</span>
                  <span className="font-black text-xl text-green-400 tracking-widest uppercase">CAB</span>
                </div>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed max-w-sm mb-5">
                Hubli&apos;s first cab marketplace. Connecting travellers with verified local operators for a seamless booking experience.
              </p>
              <div className="flex flex-col gap-2 text-sm">
                <a href="tel:+91-XXXXXXXXXX" className="flex items-center gap-2 hover:text-green-400 transition-colors">
                  <Phone className="w-4 h-4 text-green-500" />+91-XXXXXXXXXX
                </a>
                <a href="mailto:hello@nammacab.in" className="flex items-center gap-2 hover:text-green-400 transition-colors">
                  <Mail className="w-4 h-4 text-green-500" />hello@nammacab.in
                </a>
              </div>
            </div>
            <div>
              <div className="text-white font-bold mb-4 text-sm uppercase tracking-wider">For Travellers</div>
              <ul className="space-y-2 text-sm">
                {[["Book a Cab", "#search"]].map(([label, href]) => (
                  <li key={label}><Link href={href} className="hover:text-green-400 transition-colors">{label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-white font-bold mb-4 text-sm uppercase tracking-wider">For Operators</div>
              <ul className="space-y-2 text-sm">
                {[["Register Business", "/agent-signup"], ["Operator Login", "/login"], ["Manage Bookings", "/agent/bookings"], ["Dashboard", "/agent/dashboard"]].map(([label, href]) => (
                  <li key={label}><Link href={href} className="hover:text-green-400 transition-colors">{label}</Link></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
            <p>© {new Date().getFullYear()} nammaCab. Built for Hubli–Dharwad.</p>
            <div className="flex gap-6">
              <Link href="/privacy" className="hover:text-green-400 transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-green-400 transition-colors">Terms of Service</Link>
              <Link href="#" className="hover:text-green-400 transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}