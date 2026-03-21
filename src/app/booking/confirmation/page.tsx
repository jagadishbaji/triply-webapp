"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  CheckCircle2, MapPin, Calendar, Car, Phone, User,
  Clock, Copy, Check, ArrowLeft, Share2, MessageCircle,
  Shield, AlertCircle,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { trackBooking, BookingDetail } from "@/services/bookingService"

// ── Helpers ────────────────────────────────────────────────────────────────
function fmt(dateStr?: string) {
  if (!dateStr) return "—"
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long", year:"numeric" })
}

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: React.FC<any>; msg: string }> = {
  pending:     { label:"Pending Confirmation", color:"text-amber-700",  bg:"bg-amber-50  border-amber-200",  icon:Clock,        msg:"The operator will review and call you shortly to confirm." },
  confirmed:   { label:"Confirmed",            color:"text-green-700",  bg:"bg-green-50  border-green-200",  icon:CheckCircle2, msg:"Your booking is confirmed! Operator will contact you before pickup." },
  in_progress: { label:"Ride In Progress",     color:"text-blue-700",   bg:"bg-blue-50   border-blue-200",   icon:Car,          msg:"Your ride is currently in progress." },
  completed:   { label:"Completed",            color:"text-slate-700",  bg:"bg-slate-50  border-slate-200",  icon:CheckCircle2, msg:"Your ride has been completed. Thank you for choosing NammaCab!" },
  cancelled:   { label:"Cancelled",            color:"text-red-700",    bg:"bg-red-50    border-red-200",    icon:AlertCircle,  msg:"This booking was cancelled. Please book again." },
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button onClick={copy}
      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-green-100 flex items-center justify-center transition-colors">
      {copied
        ? <Check className="w-4 h-4 text-green-600"/>
        : <Copy className="w-4 h-4 text-slate-500"/>
      }
    </button>
  )
}

// ── Main inner component ───────────────────────────────────────────────────
function ConfirmationInner() {
  const params = useSearchParams()
  const router = useRouter()

  const ref = params.get("ref") ?? ""
  const id  = params.get("id")  ?? ""

  // We show the confirmation immediately from URL params
  // and also try to fetch full details from backend
  const [detail,  setDetail]  = useState<BookingDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [shareOk, setShareOk] = useState(false)

  useEffect(() => {
    if (!ref && !id) { router.push("/"); return }
    if (ref) {
      setLoading(true)
      trackBooking(ref)
        .then(d => setDetail(d))
        .catch(() => {}) // non-fatal, we still show basic info from URL
        .finally(() => setLoading(false))
    }
  }, [ref])

  const status   = (detail?.status ?? "pending").toLowerCase()
  const meta     = STATUS_META[status] ?? STATUS_META.pending
  const StatusIcon = meta.icon

  const handleShare = () => {
    const text = `My NammaCab booking: ${ref}\nPickup: ${detail?.pickupLocation ?? "—"}\nDate: ${fmt(detail?.pickupDateTime)}\nStatus: ${meta.label}`
    if (navigator.share) {
      navigator.share({ title: "NammaCab Booking", text })
    } else {
      navigator.clipboard.writeText(text)
      setShareOk(true)
      setTimeout(() => setShareOk(false), 2000)
    }
  }

  const whatsappMsg = encodeURIComponent(
    `Hi, I have booked a cab via NammaCab.\nBooking Ref: ${ref}\nName: ${detail?.customerName ?? ""}\nPhone: ${detail?.customerPhone ?? ""}\nPickup: ${detail?.pickupLocation ?? ""}\nDate: ${fmt(detail?.pickupDateTime)}`
  )

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* Simple top nav */}
      <header className="bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push("/")}
          className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200">
          <ArrowLeft className="w-5 h-5 text-slate-600"/>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-sm" style={{fontFamily:"'Noto Sans Kannada',sans-serif"}}>ನ</span>
          </div>
          <span className="font-black text-slate-900">namma<span className="text-green-600 tracking-widest uppercase">CAB</span></span>
        </div>
      </header>

      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-8 space-y-5">

        {/* ── Hero status card ─────────────────────────────────────────── */}
        <motion.div
          initial={{ scale:0.92, opacity:0 }}
          animate={{ scale:1, opacity:1 }}
          transition={{ type:"spring", stiffness:280, damping:26 }}
          className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">

          {/* Green top stripe */}
          <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-500"/>

          <div className="p-6 text-center">
            {/* Big success icon */}
            <motion.div
              initial={{ scale:0 }}
              animate={{ scale:1 }}
              transition={{ delay:0.15, type:"spring", stiffness:300, damping:22 }}
              className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-600"/>
            </motion.div>

            <h1 className="text-2xl font-black text-slate-900 mb-1">Booking Request Sent!</h1>
            <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">
              The operator will call you to confirm within a short time.
            </p>

            {/* Booking ref pill */}
            {ref && (
              <div className="flex items-center justify-center gap-2 mt-5 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 mx-auto max-w-xs">
                <div>
                  <div className="text-xs text-slate-400 font-medium">Booking Reference</div>
                  <div className="text-xl font-black text-slate-900 tracking-widest">{ref}</div>
                </div>
                <CopyButton text={ref}/>
              </div>
            )}
          </div>

          {/* Status banner */}
          <div className={`mx-4 mb-4 p-3 rounded-2xl border flex items-start gap-2.5 ${meta.bg}`}>
            <StatusIcon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${meta.color}`}/>
            <div>
              <div className={`text-xs font-bold ${meta.color}`}>{meta.label}</div>
              <div className={`text-xs mt-0.5 ${meta.color} opacity-80`}>{meta.msg}</div>
            </div>
          </div>
        </motion.div>

        {/* ── Trip details ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity:0, y:16 }}
          animate={{ opacity:1, y:0 }}
          transition={{ delay:0.18 }}
          className="bg-white rounded-2xl border border-slate-100 overflow-hidden">

          <div className="px-5 py-4 border-b border-slate-50">
            <h2 className="font-black text-slate-900 text-sm">Trip Details</h2>
          </div>

          <div className="p-5 space-y-4">
            {/* Pickup */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <MapPin className="w-4 h-4 text-green-600"/>
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">Pickup Location</div>
                <div className="font-semibold text-slate-900 text-sm">{detail?.pickupLocation ?? "—"}</div>
              </div>
            </div>

            {/* Drop */}
            {(detail?.dropLocation) && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4 text-slate-400"/>
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-medium">Drop Location</div>
                  <div className="font-semibold text-slate-900 text-sm">{detail.dropLocation}</div>
                </div>
              </div>
            )}

            {/* Date */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Calendar className="w-4 h-4 text-blue-500"/>
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">Travel Date</div>
                <div className="font-semibold text-slate-900 text-sm">{fmt(detail?.pickupDateTime)}</div>
              </div>
            </div>

            {/* Vehicle */}
            {detail?.vehicleName && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Car className="w-4 h-4 text-green-500"/>
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-medium">Vehicle</div>
                  <div className="font-semibold text-slate-900 text-sm">{detail.vehicleName} · {detail.seatingCapacity} seats</div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Customer details ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity:0, y:16 }}
          animate={{ opacity:1, y:0 }}
          transition={{ delay:0.24 }}
          className="bg-white rounded-2xl border border-slate-100 overflow-hidden">

          <div className="px-5 py-4 border-b border-slate-50">
            <h2 className="font-black text-slate-900 text-sm">Your Details</h2>
          </div>
          <div className="p-5 space-y-3">
            {detail?.customerName && (
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-slate-400 flex-shrink-0"/>
                <div>
                  <div className="text-xs text-slate-400">Name</div>
                  <div className="font-semibold text-slate-900 text-sm">{detail.customerName}</div>
                </div>
              </div>
            )}
            {detail?.customerPhone && (
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-slate-400 flex-shrink-0"/>
                <div>
                  <div className="text-xs text-slate-400">Mobile</div>
                  <div className="font-semibold text-slate-900 text-sm">{detail.customerPhone}</div>
                </div>
              </div>
            )}
            {detail?.notes && (
              <div className="flex items-start gap-3">
                <MessageCircle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5"/>
                <div>
                  <div className="text-xs text-slate-400">Notes</div>
                  <div className="text-slate-700 text-sm">{detail.notes}</div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Operator ─────────────────────────────────────────────────── */}
        {detail?.agentName && (
          <motion.div
            initial={{ opacity:0, y:16 }}
            animate={{ opacity:1, y:0 }}
            transition={{ delay:0.30 }}
            className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-black">{detail.agentName[0]?.toUpperCase()}</span>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Operated by</div>
                  <div className="font-bold text-slate-900">{detail.agentName}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Shield className="w-3 h-3 text-green-500"/>
                    <span className="text-xs text-green-600 font-medium">Verified operator</span>
                  </div>
                </div>
              </div>
              {detail.agentPhone && (
                <a href={`tel:${detail.agentPhone}`}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors">
                  <Phone className="w-4 h-4"/> Call
                </a>
              )}
            </div>
          </motion.div>
        )}

        {/* ── What happens next ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity:0, y:16 }}
          animate={{ opacity:1, y:0 }}
          transition={{ delay:0.36 }}
          className="bg-green-50 border border-green-100 rounded-2xl p-5">
          <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-green-600"/> What happens next?
          </h3>
          <ol className="space-y-2.5">
            {[
              "The operator reviews your request",
              `They call you at ${detail?.customerPhone ?? "your number"} to confirm`,
              "Arrive at your pickup point on time",
              "Enjoy your ride!",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                <span className="w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                  {i+1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </motion.div>

        {/* ── Actions ──────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity:0, y:16 }}
          animate={{ opacity:1, y:0 }}
          transition={{ delay:0.42 }}
          className="space-y-3">

          {/* WhatsApp share (if agent phone known) */}
          {detail?.agentPhone && (
            <a href={`https://wa.me/91${detail.agentPhone}?text=${whatsappMsg}`}
              target="_blank" rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 h-12 bg-[#25D366] hover:bg-[#20bd5c] text-white font-bold rounded-xl transition-colors shadow-sm">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.109.549 4.09 1.508 5.81L.057 23.428a.5.5 0 00.609.616l5.71-1.433A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.805 9.805 0 01-5.023-1.382l-.36-.214-3.732.937.994-3.643-.234-.375A9.818 9.818 0 012.182 12C2.182 6.567 6.567 2.182 12 2.182S21.818 6.567 21.818 12 17.433 21.818 12 21.818z"/>
              </svg>
              Message Operator on WhatsApp
            </a>
          )}

          <Button onClick={handleShare} variant="outline"
            className="w-full h-12 rounded-xl border-slate-200 font-semibold text-slate-700 flex items-center justify-center gap-2">
            {shareOk ? <><Check className="w-4 h-4 text-green-600"/> Copied!</> : <><Share2 className="w-4 h-4"/> Share Booking Details</>}
          </Button>

          <Link href="/" className="block">
            <Button variant="ghost" className="w-full h-11 rounded-xl text-slate-500 font-medium">
              ← Back to Home
            </Button>
          </Link>
        </motion.div>

        {/* Small print */}
        <p className="text-xs text-slate-400 text-center pb-4">
          Save your booking ref <strong className="text-slate-600">{ref}</strong> to track your booking
        </p>
      </div>
    </div>
  )
}

export default function ConfirmationPage() {
  return <Suspense><ConfirmationInner/></Suspense>
}
