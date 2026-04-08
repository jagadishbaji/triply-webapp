"use client"

import { useEffect, useState, useCallback, useRef, Suspense, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  MapPin, Calendar, Car, Users, ArrowRight, Loader2, AlertCircle, Search, X, Phone,
  User, Mail, MessageSquare, CheckCircle2, Wind, Clock, PlaneTakeoff, PlaneLanding, ArrowRightLeft, Info, ChevronDown, ChevronUp, ShieldCheck
} from "lucide-react" // <-- User imported correctly
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input }  from "@/components/ui/input"
import { Label }  from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Navbar from "@/components/navbar"

import { searchAvailableCabs, CabSearchResultDto, PriceDetailsByTrip } from "@/services/prices/pricesService"
import { gettripTypes }    from "@/services/admin/tripTypesService"
import { getVehicleTypes, vehicleType } from "@/services/admin/vehicleTypesService"
import { createBooking, GuestBookingRequest, BookingResponse } from "@/services/bookingService"
import { getCoordinates } from "@/services/geocodingService"
import { searchPlacesAutocomplete, PhotonFeature } from "@/services/photonService"

// ── Helpers & Static Data ──────────────────────────────────────────────────
const CAR_IMAGE_MAP: Record<string, string> = {
  "mini": "mini-nobg.png", "sedan": "sedan-nobg.png", "ertiga": "ertiga-nobg.png",
  "innova": "innova-nobg.png", "innova-crysta": "crysta-nobg.png", "suv": "Scorpio-nobg.png",
  "premium-suv": "Toyota-Innova--Crysta-MPV.png", "tempo-traveller": "tt-nobg.png", "coach-bus": "TT.jpg", 
}

const TIME_OPTIONS = Array.from({ length: 48 }).map((_, i) => {
  const hour = Math.floor(i / 2); const min = i % 2 === 0 ? "00" : "30";
  const ampm = hour < 12 ? "AM" : "PM"; const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${min} ${ampm}`;
});

function fmtPrice(v: PriceDetailsByTrip) {
  const t = v.tripTypeName?.toLowerCase() ?? ""
  if (t.includes("airport") && v.airportPrice) return { label: `₹${v.airportPrice}`, sub: "Fixed fare", isFixed: true }
  if (t.includes("local") && v.localPerKmPrice) return { label: `₹${v.localPerKmPrice}/km`, sub: `Min ${v.localMinKm ?? "—"} km`, isFixed: false }
  if (v.outPerKmPrice) return { label: `₹${v.outPerKmPrice}/km`, sub: `Min ${v.outMinKm ?? "—"} km/day`, isFixed: false }
  return { label: "Contact operator", sub: "", isFixed: false }
}

function getCarImage(slug: string) { return `/images/cars/${CAR_IMAGE_MAP[slug] || "sedan-nobg.png"}`; }
function formatDuration(mins: number) {
  if (!mins) return "";
  const hrs = Math.floor(mins / 60); const m = Math.round(mins % 60);
  if (hrs > 0 && m > 0) return `${hrs} hr ${m} min`;
  if (hrs > 0) return `${hrs} hr`; return `${m} min`;
}

// ── Skeleton ───────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-white rounded-[24px] sm:rounded-[32px] border border-slate-100 overflow-hidden animate-pulse shadow-sm">
    <div className="h-40 sm:h-48 bg-slate-100/60 border-b border-slate-100"/><div className="p-4 sm:p-5 space-y-4"><div className="h-6 bg-slate-100 rounded w-2/3"/><div className="h-4 bg-slate-100 rounded w-1/2"/><div className="h-14 bg-slate-50 border border-slate-100 rounded-xl mt-4"/><div className="h-11 bg-slate-100 rounded-xl mt-2"/></div>
  </div>
)

// ── Booking sheet ──────────────────────────────────────────────────────────
interface BookingSheetProps {
  vehicle: PriceDetailsByTrip; fareInfo: { estimatedFare: number, distanceKm: number, estimatedDurationMins: number, extraPickupKm: number, extraPickupCharge: number };
  pickup: string; destination: string; date: string; time: string; tripName: string; isRoundTrip: boolean; returnDate: string; onClose: () => void; onDone: (res: BookingResponse) => void;
}

function BookingSheet({ vehicle, fareInfo, pickup, destination, date, time, tripName, isRoundTrip, returnDate, onClose, onDone }: BookingSheetProps) {
  const pr = fmtPrice(vehicle)
  const [name, setName] = useState(""); const [phone, setPhone] = useState(""); const [email, setEmail] = useState(""); const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({}); const [step, setStep] = useState<"form" | "loading" | "done" | "error">("form");
  const [errMsg, setErrMsg] = useState(""); const [termsAccepted, setTermsAccepted] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {}
    if (!name.trim() || name.trim().length < 2) e.name = "Enter your full name"; 
    if (!/^[6-9][0-9]{9}$/.test(phone.trim())) e.phone = "Enter a valid 10-digit mobile number";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = "Enter a valid email address"; 
    if (!termsAccepted) e.terms = "You must accept the Terms & Conditions to book.";
    setErrors(e); return Object.keys(e).length === 0;
  }

  const handleSubmit = async () => {
    if (!validate()) return; setStep("loading");
    const getCombinedDateTime = () => {
      const d = new Date(date); const [timePart, modifier] = time.split(" "); let [hours, minutes] = timePart.split(":"); let h = parseInt(hours, 10);
      if (modifier === "PM" && h !== 12) h += 12; if (modifier === "AM" && h === 12) h = 0; d.setHours(h, parseInt(minutes, 10), 0, 0); return d.toISOString();
    };
    try {
      const payload: GuestBookingRequest = {
        customerName: name.trim(), customerPhone: phone.trim(), customerEmail: email.trim() || undefined, notes: notes.trim(), agentVehicleId: vehicle.agentVehicleId,
        tripTypeId: vehicle.tripTypeId, priceId: vehicle.id, pickupLocation: pickup, dropLocation: destination || undefined, pickupDateTime: getCombinedDateTime(),
        isRoundTrip: isRoundTrip, returnDate: returnDate && isRoundTrip ? new Date(returnDate).toISOString() : undefined,
      }
      const res = await createBooking(payload); setStep("done"); setTimeout(() => onDone(res), 1600);
    } catch (e: any) { setErrMsg(e?.message || "Something went wrong. Please try again."); setStep("error"); }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={step === "form" || step === "error" ? onClose : undefined}>
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="bg-white w-full sm:max-w-lg rounded-t-[28px] sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[95vh]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1 sm:hidden"><div className="w-12 h-1.5 bg-slate-200 rounded-full"/></div>
        
        {step === "form" && (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="px-5 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-slate-100 flex-shrink-0">
              <div><h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Confirm Booking</h2><p className="text-[11px] sm:text-xs font-semibold text-slate-500">Contact details required</p></div>
              <Button variant="ghost" onClick={onClose} className="rounded-full w-9 h-9 p-0 hover:bg-slate-100"><X className="w-5 h-5 text-slate-600"/></Button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-5 sm:space-y-6">
              
              <div className="bg-slate-50 rounded-2xl p-3 sm:p-4 flex gap-3 sm:gap-4 items-center border border-slate-100 shadow-sm">
                <img src={getCarImage(vehicle.vehicleName?.toLowerCase() || "sedan")} className="w-20 sm:w-24 h-12 sm:h-14 object-contain drop-shadow-lg" alt=""/>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-slate-900 text-base sm:text-lg truncate leading-tight">{vehicle.vehicleName}</div>
                  <div className="text-[10px] sm:text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">{tripName}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                 <div className="bg-green-50 border border-green-100 rounded-2xl p-3 sm:p-4">
                    <div className="text-[9px] sm:text-[10px] uppercase tracking-widest font-black text-green-800 mb-1">Starting At</div>
                    <div className="text-xl sm:text-2xl font-black text-green-700">{fareInfo.estimatedFare > 0 ? `₹${Math.round(fareInfo.estimatedFare).toLocaleString()}` : "As per rate"}</div>
                 </div>
                 <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 sm:p-4 flex flex-col justify-center">
                    <div className="text-[9px] sm:text-[10px] uppercase tracking-widest font-black text-slate-500 mb-0.5 sm:mb-1">Base Rate</div>
                    <div className="text-base sm:text-lg font-black text-slate-900 leading-none">{pr.label}</div>
                    <div className="flex flex-col mt-1 sm:mt-1.5">
                      <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase leading-tight">{pr.sub}</span>
                      {vehicle.driverDayAllowance ? (
                        <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase leading-tight">+ ₹{vehicle.driverDayAllowance}/day bata</span>
                      ) : null}
                    </div>
                 </div>
              </div>
              
              {fareInfo.extraPickupCharge > 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex gap-2">
                  <MapPin className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] sm:text-[11px] text-amber-800 font-medium leading-relaxed">Includes <strong className="font-black">₹{Math.round(fareInfo.extraPickupCharge)}</strong> out-of-city pickup charge ({fareInfo.extraPickupKm} km from Hubli/Dharwad center).</p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-2">
                 <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                 <p className="text-[10px] sm:text-[11px] text-blue-800 font-medium leading-relaxed">The displayed amount is an estimated starting price. Final price may vary based on exact driving distance, tolls, or parking fees. Please confirm with your operator.</p>
              </div>

              {/* ── PERFECTLY ALIGNED TIMELINE ── */}
              <div className="relative pl-3 sm:pl-4 space-y-5 my-2">
                {/* The continuous vertical line */}
                <div className="absolute left-[15px] sm:left-[19px] top-2 bottom-2 w-[2px] bg-slate-200 rounded-full z-0"></div>
                
                <div className="relative flex items-start gap-4">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-white border-[3px] border-green-500 rounded-full flex-shrink-0 relative z-10 mt-1.5"></div>
                  <div className="flex-1">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Pickup</p>
                     <p className="text-sm font-bold text-slate-800 leading-snug">{pickup}</p>
                  </div>
                </div>

                {destination && destination !== "Local Rental Package" && (
                  <div className="relative flex items-start gap-4">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-white border-[3px] border-red-500 rounded-full flex-shrink-0 relative z-10 mt-1.5"></div>
                    <div className="flex-1">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Drop</p>
                       <p className="text-sm font-bold text-slate-800 leading-snug">{destination}</p>
                    </div>
                  </div>
                )}

                <div className="relative flex items-start gap-4">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-white border-[3px] border-slate-300 rounded-full flex-shrink-0 relative z-10 mt-1"></div>
                  <div className="flex-1 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400"/>
                      <p className="text-[11px] sm:text-xs font-semibold text-slate-600 leading-snug">
                        {new Date(date).toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"short", year:"numeric" })} at {time}
                      </p>
                  </div>
                </div>

                {isRoundTrip && returnDate && (
                  <div className="relative flex items-start gap-4">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-white border-[3px] border-green-500 rounded-full flex-shrink-0 relative z-10 mt-1"></div>
                    <div className="flex-1 flex items-center gap-2">
                      <ArrowRightLeft className="w-4 h-4 text-green-600"/>
                      <p className="text-[11px] sm:text-xs font-semibold text-green-700 leading-snug">
                        Returning: {new Date(returnDate).toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"short", year:"numeric" })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100"/>
              
              <div className="space-y-3 sm:space-y-4">
                <div className="space-y-1.5"><Label className="text-[9px] sm:text-[10px] uppercase tracking-widest font-black text-slate-400 ml-1">Full Name *</Label><div className={`flex items-center bg-slate-50 border rounded-2xl px-3 sm:px-4 h-12 sm:h-14 transition-all focus-within:bg-white focus-within:ring-2 ${errors.name ? "border-red-400 focus-within:ring-red-100" : "border-slate-200 focus-within:border-slate-900 focus-within:ring-slate-100"}`}><User className={`w-4 h-4 mr-3 flex-shrink-0 ${errors.name ? "text-red-400" : "text-slate-400"}`}/><Input value={name} onChange={e => { setName(e.target.value); setErrors(p => ({...p, name:""})) }} placeholder="Rajesh Kumar" className="border-0 bg-transparent p-0 text-base sm:text-sm font-bold focus-visible:ring-0 placeholder:font-medium placeholder:text-slate-400"/></div>{errors.name && <p className="text-[10px] font-bold text-red-600 ml-1">{errors.name}</p>}</div>
                <div className="space-y-1.5"><Label className="text-[9px] sm:text-[10px] uppercase tracking-widest font-black text-slate-400 ml-1">Mobile Number *</Label><div className={`flex items-center bg-slate-50 border rounded-2xl px-3 sm:px-4 h-12 sm:h-14 transition-all focus-within:bg-white focus-within:ring-2 ${errors.phone ? "border-red-400 focus-within:ring-red-100" : "border-slate-200 focus-within:border-slate-900 focus-within:ring-slate-100"}`}><Phone className={`w-4 h-4 mr-3 flex-shrink-0 ${errors.phone ? "text-red-400" : "text-slate-400"}`}/><Input value={phone} onChange={e => { setPhone(e.target.value.replace(/\D/g,"")); setErrors(p => ({...p, phone:""})) }} placeholder="9876543210" maxLength={10} inputMode="numeric" className="border-0 bg-transparent p-0 text-base sm:text-sm font-bold focus-visible:ring-0 placeholder:font-medium placeholder:text-slate-400"/></div>{errors.phone && <p className="text-[10px] font-bold text-red-600 ml-1">{errors.phone}</p>}</div>
                <div className="space-y-1.5"><Label className="text-[9px] sm:text-[10px] uppercase tracking-widest font-black text-slate-400 ml-1">Email Address <span className="font-medium lowercase text-slate-400 tracking-normal">(optional)</span></Label><div className={`flex items-center bg-slate-50 border rounded-2xl px-3 sm:px-4 h-12 sm:h-14 transition-all focus-within:bg-white focus-within:ring-2 ${errors.email ? "border-red-400 focus-within:ring-red-100" : "border-slate-200 focus-within:border-slate-900 focus-within:ring-slate-100"}`}><Mail className={`w-4 h-4 mr-3 flex-shrink-0 ${errors.email ? "text-red-400" : "text-slate-400"}`}/><Input type="email" value={email} onChange={e => { setEmail(e.target.value); setErrors(p => ({...p, email:""})) }} placeholder="rajesh@example.com" className="border-0 bg-transparent p-0 text-base sm:text-sm font-bold focus-visible:ring-0 placeholder:font-medium placeholder:text-slate-400"/></div>{errors.email && <p className="text-[10px] font-bold text-red-600 ml-1">{errors.email}</p>}</div>
                <div className="space-y-1.5"><Label className="text-[9px] sm:text-[10px] uppercase tracking-widest font-black text-slate-400 ml-1">Special Instructions <span className="font-medium lowercase text-slate-400 tracking-normal">(optional)</span></Label><div className="flex items-start bg-slate-50 border border-slate-200 rounded-2xl px-3 sm:px-4 py-3 focus-within:bg-white focus-within:border-slate-900 focus-within:ring-2 focus-within:ring-slate-100 transition-all"><MessageSquare className="w-4 h-4 text-slate-400 mr-3 flex-shrink-0 mt-0.5"/><textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Need a/c, have luggage…" rows={2} className="w-full bg-transparent text-base sm:text-sm font-bold focus:outline-none placeholder:font-medium placeholder:text-slate-400 resize-none"/></div></div>
              </div>
            </div>

            {/* ── ALIGNED TERMS AND CONDITIONS BOX ── */}
            <div className="p-5 sm:p-6 border-t border-slate-100 flex-shrink-0 bg-white pb-8 sm:pb-6">
              <div className="flex items-start gap-3.5 mb-4 sm:mb-5 bg-slate-50 p-4 rounded-xl border border-slate-100 cursor-pointer" onClick={() => { setTermsAccepted(!termsAccepted); setErrors(p => ({...p, terms:""})) }}>
                <div className="flex items-center justify-center pt-0.5">
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${termsAccepted ? 'bg-green-600 border-green-600' : 'bg-white border-slate-300'}`}>
                    {termsAccepted && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </div>
                </div>
                <Label className="text-[11px] sm:text-xs font-medium text-slate-600 cursor-pointer leading-relaxed flex-1 pointer-events-none">
                  I agree to NammaCab's <span className="text-green-600 font-bold hover:underline pointer-events-auto" onClick={(e) => {e.stopPropagation(); window.open('/terms','_blank')}}>Terms</span> & <span className="text-green-600 font-bold hover:underline pointer-events-auto" onClick={(e) => {e.stopPropagation(); window.open('/privacy','_blank')}}>Privacy Policy</span>. Payment is handled directly with the operator.
                </Label>
              </div>
              {errors.terms && <p className="text-[10px] text-red-600 font-bold -mt-2 sm:-mt-3 mb-3 text-center">{errors.terms}</p>}
              
              <Button onClick={handleSubmit} className="w-full h-12 sm:h-14 bg-slate-900 hover:bg-green-600 text-white font-black rounded-xl sm:rounded-2xl shadow-xl hover:shadow-green-600/25 text-base sm:text-lg transition-all active:scale-95">
                Confirm Booking <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5"/>
              </Button>
            </div>
          </div>
        )}

        {step === "loading" && <div className="p-16 sm:p-24 text-center flex flex-col items-center"><Loader2 className="w-10 h-10 sm:w-12 sm:h-12 animate-spin text-green-600 mb-6"/><h3 className="text-lg sm:text-xl font-black text-slate-900">Requesting Ride...</h3></div>}
        {step === "done" && <div className="p-16 sm:p-24 text-center flex flex-col items-center"><CheckCircle2 className="w-12 h-12 sm:w-16 sm:h-16 text-green-600 mb-6"/><h3 className="text-xl sm:text-2xl font-black text-slate-900">Ride Requested!</h3><p className="text-sm sm:text-base text-slate-500 font-medium mt-2">Redirecting...</p></div>}
        {step === "error" && (<div className="p-10 sm:p-12 text-center flex flex-col items-center"><AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 mb-6"/><h3 className="text-lg sm:text-xl font-black text-slate-900">Booking Failed</h3><p className="text-xs sm:text-sm font-medium text-slate-500 mt-2 mb-8">{errMsg}</p><div className="flex flex-col sm:flex-row gap-3 w-full"><Button variant="outline" onClick={onClose} className="flex-1 h-12 rounded-xl font-bold text-sm">Cancel</Button><Button onClick={() => setStep("form")} className="flex-1 h-12 rounded-xl bg-slate-900 hover:bg-green-600 text-white font-bold transition-colors text-sm">Try Again</Button></div></div>)}
      </motion.div>
    </motion.div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
function VehiclesPageInner() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const today = new Date().toISOString().split("T")[0]

  const [tripTypes,    setTripTypes]    = useState<any[]>([])
  const [vehicleTypes, setVehicleTypes] = useState<vehicleType[]>([])
  const [results,      setResults]      = useState<CabSearchResultDto[]>([])
  const [loading,      setLoading]      = useState(false)
  const [searched,     setSearched]     = useState(false)
  const [confirmItem,  setConfirmItem]  = useState<CabSearchResultDto | null>(null)

  const [tripTypeId,   setTripTypeId]   = useState(searchParams.get("tripTypeId")    ?? "")
  const [tripTypeName, setTripTypeName] = useState(searchParams.get("tripTypeName")  ?? "")
  const [pickup,       setPickup]       = useState(searchParams.get("pickup")        ?? "")
  const [destination,  setDestination]  = useState(searchParams.get("destination")   ?? "")
  const [date,         setDate]         = useState(searchParams.get("date")          ?? "")
  const [time,         setTime]         = useState(searchParams.get("time")          ?? "")
  
  const isRoundParam = searchParams.get("isRoundTrip") === "true";
  const [outstationType, setOutstationType] = useState<"one-way" | "round-trip">(isRoundParam ? "round-trip" : "one-way")
  const [returnDate,   setReturnDate]   = useState(searchParams.get("returnDate")    ?? "")
  
  const [searchedIsRound, setSearchedIsRound] = useState(isRoundParam)
  const [searchedReturnDate, setSearchedReturnDate] = useState(searchParams.get("returnDate") ?? "")
  
  // ── AGGREGATION STATE ──
  const [activeVehicleFilter, setActiveVehicleFilter] = useState<string>("all")
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null) // Tracks which category is expanded to show operators

  const isUrlAirport = (searchParams.get("tripTypeName") || "").toLowerCase().includes("airport");
  const initAirportDir = isUrlAirport && (searchParams.get("pickup") || "").toLowerCase().includes("airport") ? "from" : "to";
  const initAirportCity = isUrlAirport ? (initAirportDir === "from" ? destination : pickup) : "";

  const [airportDirection, setAirportDirection] = useState<"to" | "from">(initAirportDir)
  const [airportCity, setAirportCity] = useState(initAirportCity)
  const [formError,   setFormError]   = useState("")

  const [showPickupOptions, setShowPickupOptions] = useState(false)
  const [showDestOptions, setShowDestOptions]     = useState(false)
  const [showAirportCityOptions, setShowAirportCityOptions] = useState(false)

  const [pickupSuggestions, setPickupSuggestions] = useState<PhotonFeature[]>([])
  const [destSuggestions, setDestSuggestions] = useState<PhotonFeature[]>([])
  const [airportCitySuggestions, setAirportCitySuggestions] = useState<PhotonFeature[]>([])

  const [loadingPickup, setLoadingPickup] = useState(false)
  const [loadingDest, setLoadingDest] = useState(false)
  const [loadingAirport, setLoadingAirport] = useState(false)

  const abortControllers = useRef<{ pickup?: AbortController, dest?: AbortController, airport?: AbortController }>({});
  const pickupDateRef = useRef<HTMLInputElement>(null);
  const returnDateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([gettripTypes(), getVehicleTypes()]).then(([t, v]) => { setTripTypes(t ?? []); setVehicleTypes(v ?? []) }).catch(console.error)
  }, [])

  const handleAutocomplete = async (query: string, setter: (val: PhotonFeature[]) => void, setLoadingState: (val: boolean) => void, type: "pickup" | "dest" | "airport") => {
    if (query.length < 3) { setter([]); setLoadingState(false); return; }
    if (abortControllers.current[type]) abortControllers.current[type]?.abort();
    const controller = new AbortController(); abortControllers.current[type] = controller;
    setLoadingState(true);
    const remote = await searchPlacesAutocomplete(query, controller.signal);
    if (!controller.signal.aborted) {
      setter(remote.slice(0, 7)); setLoadingState(false);
    }
  }

  useEffect(() => { if (showPickupOptions) { const t = setTimeout(() => handleAutocomplete(pickup, setPickupSuggestions, setLoadingPickup, "pickup"), 300); return () => clearTimeout(t); } }, [pickup, showPickupOptions]);
  useEffect(() => { if (showDestOptions) { const t = setTimeout(() => handleAutocomplete(destination, setDestSuggestions, setLoadingDest, "dest"), 300); return () => clearTimeout(t); } }, [destination, showDestOptions]);
  useEffect(() => { if (showAirportCityOptions) { const t = setTimeout(() => handleAutocomplete(airportCity, setAirportCitySuggestions, setLoadingAirport, "airport"), 300); return () => clearTimeout(t); } }, [airportCity, showAirportCityOptions]);

  const doSearch = useCallback(async (ttId: string, pick: string, dest: string, isRound: boolean, pDate: string, rDate: string) => {
    if (!ttId || !pDate) return
    setLoading(true); setSearched(true); setSearchedIsRound(isRound); setSearchedReturnDate(rDate);
    setExpandedGroup(null); // Reset expansions on new search
    try {
      const pickCoords = await getCoordinates(pick); const destCoords = await getCoordinates(dest);
      if (!pickCoords) throw new Error("Could not find the pickup location on the map.");
      const data = await searchAvailableCabs(ttId, pickCoords.lat, pickCoords.lng, destCoords ? destCoords.lat : 0, destCoords ? destCoords.lng : 0, isRound, pDate, rDate);
      setResults(data)
    } catch (e: any) { setFormError(e.message || "Failed to search for cabs."); setResults([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { if (tripTypeId && pickup && date) doSearch(tripTypeId, pickup, destination, isRoundParam, date, searchParams.get("returnDate") ?? ""); }, []) // eslint-disable-line

  const isAirport = tripTypeName.toLowerCase().includes("airport");
  const isLocal = tripTypeName.toLowerCase().includes("local");
  const isOutstation = !isAirport && !isLocal;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault(); setFormError("");
    if (!tripTypeId || !date || !time) { setFormError("Please fill in the date and time."); return; }

    let finalPickup = pickup.trim(); let finalDest = destination.trim(); let additionalParams = ""; let isRound = false; let finalReturnDate = "";

    if (isAirport) {
      if (airportCity.trim().length <= 2) { setFormError("Enter a valid city name."); return; }
      if (airportDirection === "to") { finalPickup = airportCity.trim(); finalDest = "Hubli Airport (HBX)"; } 
      else { finalPickup = "Hubli Airport (HBX)"; finalDest = airportCity.trim(); }
    } else if (isLocal) {
      if (pickup.trim().length <= 2) { setFormError("Pickup location must be at least 3 characters."); return; }
      finalPickup = pickup.trim(); finalDest = "Local Rental Package"; 
    } else if (isOutstation) {
      if (pickup.trim().length <= 2 || destination.trim().length <= 2) { setFormError("Locations must be at least 3 characters."); return; }
      if (pickup.trim().toLowerCase() === destination.trim().toLowerCase()) { setFormError("Pickup and Drop cannot be the same."); return; }
      if (outstationType === "round-trip") {
        if (!returnDate) { setFormError("Please select a return date."); return; }
        if (returnDate < date) { setFormError("Return date cannot be before pickup date."); return; }
        isRound = true; finalReturnDate = returnDate; additionalParams = `&isRoundTrip=true&returnDate=${encodeURIComponent(returnDate)}`;
      } else { additionalParams = `&isRoundTrip=false`; }
      finalPickup = pickup.trim(); finalDest = destination.trim();
    }

    setPickup(finalPickup); setDestination(finalDest); setActiveVehicleFilter("all");
    doSearch(tripTypeId, finalPickup, finalDest, isRound, date, finalReturnDate);
    router.replace(`/user/vehicles?tripTypeId=${tripTypeId}&tripTypeName=${encodeURIComponent(tripTypeName)}&pickup=${encodeURIComponent(finalPickup)}&destination=${encodeURIComponent(finalDest)}&date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}${additionalParams}`)
  }

  const handleDone = (res: BookingResponse) => { setConfirmItem(null); router.push(`/booking/confirmation?ref=${res.bookingRef}&id=${res.id}`) }

  // ── AGGREGATION LOGIC ──
  // Group the results by vehicle type so we don't show 50 identical cars
  const groupedCabs = useMemo(() => {
    const groups: Record<string, CabSearchResultDto[]> = {};
    
    // Filter first if a category pill is selected
    const filteredToProcess = activeVehicleFilter === "all" ? results : results.filter(r => r.vehicleDetails.vehicleTypeId === activeVehicleFilter);

    filteredToProcess.forEach(cab => {
      const typeId = cab.vehicleDetails.vehicleTypeId || 'unknown';
      if (!groups[typeId]) groups[typeId] = [];
      groups[typeId].push(cab);
    });

    // Sort cabs within each group by EstimatedFare
    Object.values(groups).forEach(list => list.sort((a, b) => a.estimatedFare - b.estimatedFare));

    // Map into an array for rendering and sort groups by the absolute lowest fare
    return Object.entries(groups).map(([typeId, cabs]) => {
      const typeInfo = vehicleTypes.find(v => v.id === typeId);
      return {
        typeId,
        typeInfo,
        cabs,
        lowestFare: cabs[0].estimatedFare
      };
    }).sort((a, b) => a.lowestFare - b.lowestFare);

  }, [results, vehicleTypes, activeVehicleFilter]);


  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="pt-20 pb-4 sm:pb-6 bg-slate-900 border-b border-slate-800">
        <div className="max-w-[1150px] mx-auto px-3 sm:px-4 mt-2 sm:mt-4">
          <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} className="bg-white rounded-[24px] sm:rounded-[32px] shadow-xl overflow-visible p-1.5 sm:p-2">

            <div className="flex bg-slate-100 p-1.5 rounded-[20px] sm:rounded-[24px] gap-1.5 overflow-x-auto hide-scrollbar">
              {tripTypes.length === 0 ? (
                <div className="flex gap-2 sm:gap-3">{["Outstation","Local","Airport"].map(t => <div key={t} className="h-10 sm:h-12 w-28 sm:w-32 bg-white/50 rounded-xl animate-pulse"/>)}</div>
              ) : (
                tripTypes.map(t => (
                  <button key={t.id} onClick={() => { setTripTypeId(t.id); setTripTypeName(t.name); setFormError(""); }}
                    className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-[16px] sm:rounded-[18px] text-[11px] sm:text-sm font-black uppercase tracking-wider transition-all duration-200 whitespace-nowrap ${tripTypeId === t.id ? "bg-white text-slate-900 shadow-[0_4px_15px_rgba(0,0,0,0.05)]" : "text-slate-500 hover:text-slate-800 hover:bg-white/60"}`}>
                    {t.name}
                  </button>
                ))
              )}
            </div>

            <form onSubmit={handleSearch} className="p-3 sm:p-4">
              <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-5">
                {isAirport && (
                  <div className="flex gap-2 bg-slate-50 p-1.5 rounded-[12px] sm:rounded-[14px] border border-slate-100">
                    <button type="button" onClick={() => setAirportDirection("to")} className={`px-3 sm:px-4 py-2 rounded-[8px] sm:rounded-[10px] text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 sm:gap-2 transition-all ${airportDirection === "to" ? "bg-white shadow-sm text-slate-900 border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}><PlaneTakeoff className="w-3.5 h-3.5 sm:w-4 sm:h-4"/> To Airport</button>
                    <button type="button" onClick={() => setAirportDirection("from")} className={`px-3 sm:px-4 py-2 rounded-[8px] sm:rounded-[10px] text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 sm:gap-2 transition-all ${airportDirection === "from" ? "bg-white shadow-sm text-slate-900 border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}><PlaneLanding className="w-3.5 h-3.5 sm:w-4 sm:h-4"/> From Airport</button>
                  </div>
                )}
                {isOutstation && (
                  <div className="flex gap-2 bg-slate-50 p-1.5 rounded-[12px] sm:rounded-[14px] border border-slate-100">
                    <button type="button" onClick={() => setOutstationType("one-way")} className={`px-3 sm:px-4 py-2 rounded-[8px] sm:rounded-[10px] text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 sm:gap-2 transition-all ${outstationType === "one-way" ? "bg-white shadow-sm text-slate-900 border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}><ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4"/> One-Way</button>
                    <button type="button" onClick={() => setOutstationType("round-trip")} className={`px-3 sm:px-4 py-2 rounded-[8px] sm:rounded-[10px] text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 sm:gap-2 transition-all ${outstationType === "round-trip" ? "bg-white shadow-sm text-slate-900 border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}><ArrowRightLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4"/> Round Trip</button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
                {isAirport ? (
                  <div className="flex flex-col gap-1 sm:gap-1.5 relative lg:col-span-6">
                    <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 sm:ml-2">{airportDirection === "to" ? "Pickup City" : "Drop City"}</label>
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl px-3 sm:px-4 h-12 sm:h-14 focus-within:bg-white focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-100 transition-all relative">
                      <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 sm:mr-3 flex-shrink-0"/>
                      <Input type="text" placeholder="e.g. Hubli, Dharwad" value={airportCity} onChange={e => { setAirportCity(e.target.value); setShowAirportCityOptions(true); }} onFocus={() => { if(airportCitySuggestions.length) setShowAirportCityOptions(true) }} onBlur={() => setTimeout(() => setShowAirportCityOptions(false), 200)} required className="border-0 bg-transparent p-0 h-auto text-base sm:text-sm font-bold text-slate-900 focus-visible:ring-0 placeholder:font-medium w-full flex-1"/>
                      {loadingAirport && <Loader2 className="w-4 h-4 text-green-600 animate-spin absolute right-4"/>}
                    </div>
                    <AnimatePresence>
                      {showAirportCityOptions && airportCity && airportCitySuggestions.length > 0 && (
                        <motion.ul initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute top-[105%] left-0 w-full bg-white border border-slate-200 rounded-xl sm:rounded-2xl shadow-xl z-50 max-h-48 overflow-y-auto py-2">
                          {airportCitySuggestions.map((place, idx) => (
                            <li key={idx} onClick={() => { setAirportCity(place.name); setShowAirportCityOptions(false); }} className="px-3 sm:px-4 py-2 sm:py-2.5 hover:bg-green-50 cursor-pointer transition-colors">
                              <div className="text-xs sm:text-sm font-bold text-slate-800">{place.name}</div>
                              {place.sub && <div className="text-[9px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">{place.sub}</div>}
                            </li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <>
                    <div className={`flex flex-col gap-1 sm:gap-1.5 relative ${isLocal ? 'lg:col-span-6' : 'lg:col-span-3'}`}>
                      <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 sm:ml-2">Pickup City</label>
                      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl px-3 sm:px-4 h-12 sm:h-14 focus-within:bg-white focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-100 transition-all relative">
                        <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 sm:mr-3 flex-shrink-0"/>
                        <Input type="text" placeholder="e.g. Hubli" value={pickup} onChange={e => { setPickup(e.target.value); setShowPickupOptions(true); }} onFocus={() => { if(pickupSuggestions.length) setShowPickupOptions(true) }} onBlur={() => setTimeout(() => setShowPickupOptions(false), 200)} required className="border-0 bg-transparent p-0 h-auto text-base sm:text-sm font-bold text-slate-900 focus-visible:ring-0 placeholder:font-medium w-full flex-1"/>
                        {loadingPickup && <Loader2 className="w-4 h-4 text-green-600 animate-spin absolute right-4"/>}
                      </div>
                      <AnimatePresence>
                        {showPickupOptions && pickup && pickupSuggestions.length > 0 && (
                          <motion.ul initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute top-[105%] left-0 w-full bg-white border border-slate-200 rounded-xl sm:rounded-2xl shadow-xl z-50 max-h-48 overflow-y-auto py-2">
                            {pickupSuggestions.map((place, idx) => (
                              <li key={idx} onClick={() => { setPickup(place.name); setShowPickupOptions(false); }} className="px-3 sm:px-4 py-2 sm:py-2.5 hover:bg-green-50 cursor-pointer transition-colors">
                                <div className="text-xs sm:text-sm font-bold text-slate-800">{place.name}</div>
                                {place.sub && <div className="text-[9px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">{place.sub}</div>}
                              </li>
                            ))}
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </div>

                    {!isLocal && (
                      <div className="flex flex-col gap-1 sm:gap-1.5 relative lg:col-span-3">
                        <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 sm:ml-2">Drop City</label>
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl px-3 sm:px-4 h-12 sm:h-14 focus-within:bg-white focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-100 transition-all relative">
                          <MapPin className="w-4 h-4 sm:w-5 h-5 text-slate-400 mr-2 sm:mr-3 flex-shrink-0"/>
                          <Input type="text" placeholder="e.g. Mantralayam" value={destination} onChange={e => { setDestination(e.target.value); setShowDestOptions(true); }} onFocus={() => { if(destSuggestions.length) setShowDestOptions(true) }} onBlur={() => setTimeout(() => setShowDestOptions(false), 200)} required className="border-0 bg-transparent p-0 h-auto text-base sm:text-sm font-bold text-slate-900 focus-visible:ring-0 placeholder:font-medium w-full flex-1"/>
                          {loadingDest && <Loader2 className="w-4 h-4 text-green-600 animate-spin absolute right-4"/>}
                        </div>
                        <AnimatePresence>
                          {showDestOptions && destination && destSuggestions.length > 0 && (
                            <motion.ul initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute top-[105%] left-0 w-full bg-white border border-slate-200 rounded-xl sm:rounded-2xl shadow-xl z-50 max-h-48 overflow-y-auto py-2">
                              {destSuggestions.map((place, idx) => (
                                <li key={idx} onClick={() => { setDestination(place.name); setShowDestOptions(false); }} className="px-3 sm:px-4 py-2 sm:py-2.5 hover:bg-green-50 cursor-pointer transition-colors">
                                  <div className="text-xs sm:text-sm font-bold text-slate-800">{place.name}</div>
                                  {place.sub && <div className="text-[9px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">{place.sub}</div>}
                                </li>
                              ))}
                            </motion.ul>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </>
                )}

                <div className={`flex flex-col gap-1 sm:gap-1.5 ${isOutstation && outstationType === "round-trip" ? "lg:col-span-2" : "lg:col-span-3"}`}>
                  <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 sm:ml-2">Pickup Date</label>
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl px-3 sm:px-4 h-12 sm:h-14 focus-within:bg-white focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-100 transition-all cursor-pointer" onClick={() => pickupDateRef.current?.showPicker()}>
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 mr-2 sm:mr-3 flex-shrink-0"/>
                    <Input ref={pickupDateRef} id="date" type="date" min={today} value={date} onChange={e => setDate(e.target.value)} required className="border-0 bg-transparent p-0 h-auto text-base sm:text-sm font-bold text-slate-900 focus-visible:ring-0 w-full [&::-webkit-calendar-picker-indicator]:hidden cursor-pointer" />
                  </div>
                </div>

                {isOutstation && outstationType === "round-trip" && (
                  <div className="flex flex-col gap-1 sm:gap-1.5 lg:col-span-2">
                    <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 sm:ml-2">Return Date</label>
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl px-3 sm:px-4 h-12 sm:h-14 focus-within:bg-white focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-100 transition-all cursor-pointer" onClick={() => returnDateRef.current?.showPicker()}>
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 mr-2 sm:mr-3 flex-shrink-0"/>
                      <Input ref={returnDateRef} id="returnDate" type="date" min={date || today} value={returnDate} onChange={e => setReturnDate(e.target.value)} required className="border-0 bg-transparent p-0 h-auto text-base sm:text-sm font-bold text-slate-900 focus-visible:ring-0 w-full [&::-webkit-calendar-picker-indicator]:hidden cursor-pointer" />
                    </div>
                  </div>
                )}

                <div className={`flex flex-col gap-1 sm:gap-1.5 ${isOutstation && outstationType === "round-trip" ? "lg:col-span-2" : "lg:col-span-3"}`}>
                  <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 sm:ml-2">Time</label>
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl px-3 sm:px-4 h-12 sm:h-14 focus-within:bg-white focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-100 transition-all">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 mr-2 sm:mr-3 flex-shrink-0"/>
                    <Select value={time} onValueChange={setTime} required>
                      <SelectTrigger className="border-0 bg-transparent p-0 h-auto text-base sm:text-sm font-bold text-slate-900 focus:ring-0 shadow-none w-full">
                        <SelectValue placeholder="Time"/>
                      </SelectTrigger>
                      <SelectContent className="max-h-64 border-slate-200 shadow-xl rounded-xl sm:rounded-2xl">
                        {TIME_OPTIONS.map(t => <SelectItem key={t} value={t} className="font-semibold">{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="mt-4 sm:mt-5 flex justify-end">
                  <Button type="submit" disabled={!tripTypeId||loading} className="w-full md:w-auto md:min-w-[200px] h-12 sm:h-14 bg-slate-900 hover:bg-green-600 text-white font-black text-base sm:text-lg rounded-xl sm:rounded-2xl shadow-xl transition-all active:scale-95">
                    Update Search
                  </Button>
              </div>
              
              {formError && (<p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-3 flex items-center gap-1.5 font-bold"><AlertCircle className="w-3.5 h-3.5"/> {formError}</p>)}
            </form>
          </motion.div>
        </div>
      </div>

      {/* ── Results ────────────────────────────────────────────────────── */}
      <div className="max-w-[1150px] mx-auto px-3 sm:px-4 py-8 sm:py-10 flex-1 w-full">
        {!searched && !loading && (
          <div className="text-center py-20 sm:py-24 bg-white rounded-[24px] sm:rounded-[32px] border border-slate-100 shadow-sm mx-1 sm:mx-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-[16px] sm:rounded-[20px] flex items-center justify-center mx-auto mb-4 sm:mb-5 border border-slate-100"><Search className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400"/></div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">Find Cabs in Hubli</h2><p className="text-sm sm:text-base text-slate-500 font-medium">Update your route details above to see real-time prices.</p>
          </div>
        )}

        {loading && (
          <div>
            <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8 bg-white py-2 sm:py-3 px-4 sm:px-5 border border-slate-100 rounded-full inline-flex shadow-sm"><Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-slate-900 animate-spin"/><span className="text-xs sm:text-sm text-slate-700 font-bold uppercase tracking-widest">Calculating Routes & Fares...</span></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">{Array.from({length:4}).map((_,i)=><SkeletonCard key={i}/>)}</div>
          </div>
        )}

        {searched && !loading && results.length === 0 && (
          <div className="text-center py-20 sm:py-24 bg-white rounded-[24px] sm:rounded-[32px] border border-slate-100 shadow-sm mx-1 sm:mx-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-50 rounded-[16px] sm:rounded-[20px] flex items-center justify-center mx-auto mb-4 sm:mb-5 border border-red-100"><AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500"/></div>
            <h3 className="font-black text-slate-900 text-xl sm:text-2xl mb-2">No Cabs Available</h3><p className="text-sm sm:text-base text-slate-500 font-medium max-w-xs sm:max-w-sm mx-auto">We couldn't find vehicles for this exact route and date. Try adjusting your dates or pickup location.</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <>
            <div className="mb-6 sm:mb-8 flex flex-col gap-4 sm:gap-6 border-b border-slate-200 pb-4 sm:pb-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h2 className="font-black text-slate-900 text-2xl sm:text-3xl tracking-tight">{results.length} Cabs Available</h2>
                  <div className="text-xs sm:text-sm font-bold text-slate-500 mt-2 flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="bg-slate-900 text-white px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-[9px] sm:text-[10px] uppercase tracking-widest">{tripTypeName}</span> 
                    <span className="text-slate-700">{pickup}</span>
                    {destination && destination !== "Local Rental Package" && (<> <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400"/> <span className="text-slate-700">{destination}</span> </>)}
                  </div>
                  {results[0]?.distanceKm > 0 && !isAirport && (
                     <div className="mt-3 text-[10px] sm:text-xs font-bold text-slate-400 flex flex-wrap items-center gap-2 sm:gap-4">
                       <span className="flex items-center gap-1.5 bg-white border border-slate-200 px-2 py-1 rounded-md"><MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-500"/> Est. Distance: {Math.round(results[0].distanceKm)} km</span>
                       <span className="flex items-center gap-1.5 bg-white border border-slate-200 px-2 py-1 rounded-md"><Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-500"/> ETA: {formatDuration(results[0].estimatedDurationMins)}</span>
                     </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1 snap-x">
                <button onClick={() => setActiveVehicleFilter("all")} className={`px-4 sm:px-5 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all flex-shrink-0 snap-start border ${activeVehicleFilter === "all" ? "bg-slate-900 text-white border-slate-900 shadow-md" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"}`}>All Cars</button>
                {vehicleTypes.map(v => (
                  <button key={v.id} onClick={() => setActiveVehicleFilter(v.id)} className={`px-4 sm:px-5 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all flex-shrink-0 snap-start border ${activeVehicleFilter === v.id ? "bg-slate-900 text-white border-slate-900 shadow-md" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"}`}>{v.name}</button>
                ))}
              </div>
            </div>

            {groupedCabs.length === 0 && (
               <div className="text-center py-12 sm:py-16 bg-slate-50 rounded-[24px] sm:rounded-[32px] border border-slate-200 border-dashed mx-1 sm:mx-0">
                 <p className="text-slate-500 font-bold text-base sm:text-lg mb-2">No {vehicleTypes.find(v => v.id === activeVehicleFilter)?.name}s available.</p>
                 <Button variant="link" onClick={() => setActiveVehicleFilter("all")} className="text-slate-900 font-black">View all cars</Button>
               </div>
            )}

            {/* ── AGGREGATED CATEGORY GRID ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {groupedCabs.map((group, i) => {
                const categoryName = group.typeInfo?.name || "Vehicle";
                const carImage = getCarImage(group.typeInfo?.slug || "sedan");
                const operatorCount = group.cabs.length;
                const isExpanded = expandedGroup === group.typeId;
                
                return (
                  <motion.div key={group.typeId} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.05 }} className="h-full">
                    
                    <div className="bg-white rounded-[24px] sm:rounded-[32px] border border-slate-200 overflow-hidden shadow-sm transition-all duration-300 flex flex-col h-full relative">
                      
                      {/* Category Header Card */}
                      <div className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-start cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setExpandedGroup(isExpanded ? null : group.typeId)}>
                        
                        <div className="w-full sm:w-1/3 h-32 sm:h-auto min-h-[120px] bg-slate-100/50 rounded-2xl flex items-center justify-center p-4 relative">
                           <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-200/60 via-slate-50/0 to-transparent"></div>
                           <img src={carImage} alt={categoryName} className="w-full h-full object-contain drop-shadow-xl relative z-10" />
                        </div>
                        
                        <div className="flex-1 w-full flex flex-col text-center sm:text-left">
                          <h3 className="font-black text-xl sm:text-2xl text-slate-900 leading-tight tracking-tight mb-1">
                            {categoryName}
                          </h3>
                          <p className="text-[11px] sm:text-xs font-semibold text-slate-500 mb-3">{group.typeInfo?.exampleVehicles || "Swift Dzire, Etios, or similar"}</p>
                          
                          <div className="flex items-center justify-center sm:justify-start gap-1.5 mb-4 sm:mb-auto">
                            <div className="bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-black px-2 py-1 rounded-md flex items-center gap-1">
                              <Users className="w-3 h-3"/> Up to {group.typeInfo?.maxSeats || 4}
                            </div>
                            <div className="bg-sky-50 border border-sky-100 text-sky-700 text-[10px] font-black px-2 py-1 rounded-md flex items-center gap-1">
                              <Wind className="w-3 h-3"/> AC
                            </div>
                          </div>

                          <div className="flex items-end justify-between w-full mt-2 pt-4 sm:pt-0 border-t sm:border-0 border-slate-100">
                             <div>
                                <div className="text-[10px] sm:text-[11px] text-green-700 font-black uppercase tracking-widest mb-0.5">Starting At</div>
                                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
                                  ₹{Math.round(group.lowestFare).toLocaleString()}
                                </div>
                             </div>
                             <div className="flex flex-col items-end">
                                <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg flex items-center gap-1">
                                  {operatorCount} Operator{operatorCount > 1 ? 's' : ''} {isExpanded ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}
                                </span>
                             </div>
                          </div>
                        </div>

                      </div>

                      {/* Expanded Operator List */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-slate-100 bg-slate-50/50">
                            <div className="p-2 sm:p-4 space-y-2">
                               <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 mb-2">Available Operators</div>
                               
                               {group.cabs.map((cab, idx) => {
                                  const pr = fmtPrice(cab.vehicleDetails);
                                  return (
                                    <div key={cab.vehicleDetails.id} className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-center sm:items-center hover:border-green-300 transition-colors shadow-sm group">
                                      
                                      <div className="w-full sm:flex-1 flex flex-col">
                                         <div className="flex items-center justify-between sm:justify-start gap-2 mb-1.5">
                                            <div className="flex items-center gap-2">
                                              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-slate-900 rounded-md flex items-center justify-center text-white text-[9px] sm:text-[10px] font-black">{cab.vehicleDetails.agentName?.[0]?.toUpperCase()??"A"}</div>
                                              <span className="text-sm font-bold text-slate-900">{cab.vehicleDetails.agentName}</span>
                                            </div>
                                            <div className="flex items-center gap-1 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                              <ShieldCheck className="w-3 h-3 text-blue-600"/>
                                              <span className="text-[8px] font-bold text-blue-700 uppercase tracking-wider">Verified</span>
                                            </div>
                                         </div>
                                         <div className="flex items-center gap-2 text-[10px] sm:text-xs font-semibold text-slate-500">
                                            <span>{pr.label} base</span>
                                            {cab.vehicleDetails.driverDayAllowance ? <span>• ₹{cab.vehicleDetails.driverDayAllowance}/day bata</span> : null}
                                         </div>
                                         {cab.extraPickupCharge > 0 && (
                                            <div className="text-[9px] font-bold text-amber-600 mt-1">
                                              + ₹{Math.round(cab.extraPickupCharge)} out-of-city pickup
                                            </div>
                                         )}
                                      </div>

                                      <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-4 border-t sm:border-0 border-slate-100 pt-3 sm:pt-0">
                                         <div className="text-left sm:text-right">
                                            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Est. Fare</div>
                                            <div className="text-lg font-black text-slate-900">₹{Math.round(cab.estimatedFare).toLocaleString()}</div>
                                         </div>
                                         <Button onClick={() => setConfirmItem(cab)} className="h-10 sm:h-11 px-4 sm:px-5 bg-slate-900 text-white font-black rounded-xl text-xs sm:text-sm transition-all duration-300 shadow-md group-hover:bg-green-600 group-hover:shadow-green-600/25 active:scale-95">
                                            Select
                                         </Button>
                                      </div>
                                    </div>
                                  )
                               })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                    </div>
                  </motion.div>
                )
              })}
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {confirmItem && (
          <BookingSheet
            vehicle={confirmItem.vehicleDetails} 
            fareInfo={{ 
              estimatedFare: confirmItem.estimatedFare, 
              distanceKm: confirmItem.distanceKm,
              estimatedDurationMins: confirmItem.estimatedDurationMins,
              extraPickupCharge: confirmItem.extraPickupCharge,
              extraPickupKm: confirmItem.extraPickupKm
            }} 
            pickup={pickup}
            destination={destination}
            date={date}
            time={time}
            tripName={tripTypeName}
            isRoundTrip={searchedIsRound}
            returnDate={searchedReturnDate}
            onClose={()=>setConfirmItem(null)}
            onDone={handleDone}
          />
        )}
      </AnimatePresence>
      
      <footer className="bg-slate-950 text-slate-400 mt-auto">
         <div className="max-w-7xl mx-auto px-6 py-12 sm:py-16">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-8 sm:gap-10 mb-10 sm:mb-12">
             <div className="md:col-span-2">
               <div className="flex items-center gap-2.5 mb-4">
                 <div className="w-8 h-8 sm:w-9 sm:h-9 bg-green-600 rounded-xl flex items-center justify-center">
                   <span className="text-white font-black text-base sm:text-lg" style={{fontFamily:"'Noto Sans Kannada',sans-serif"}}>ನ</span>
                 </div>
                 <div className="leading-none">
                   <span className="font-black text-lg sm:text-xl text-white">namma</span>
                   <span className="font-black text-lg sm:text-xl text-green-400 tracking-widest uppercase">CAB</span>
                 </div>
               </div>
               <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-sm mb-5">
                 Hubli's first cab marketplace. Connecting travellers with verified local operators for a seamless booking experience.
               </p>
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