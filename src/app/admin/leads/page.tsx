"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import Link from "next/link"
import {
  Phone, MessageCircle, Calendar, Clock, MapPin, Car,
  ShieldCheck, RefreshCw, CheckCircle2, AlertCircle, ArrowLeft,
  Users, Fuel, Search, ChevronRight, Copy, Check, Lock,
  KeyRound, LogOut, Eye, EyeOff, Download, UserCheck
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast, Toaster } from "sonner"
import { RidevoLogo } from "@/components/RidevoLogo"
import type { StoredTripRequest } from "@/app/api/trip-requests/route"

export default function OperatorLeadsPage() {
  const [mounted, setMounted] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Login form state
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState("")
  const [loginSubmitting, setLoginSubmitting] = useState(false)

  // Leads data state
  const [leads, setLeads] = useState<StoredTripRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [storageEngine, setStorageEngine] = useState<string>("local_disk")
  const [visitorStats, setVisitorStats] = useState<{ total: number; today: number; engine: string }>({
    total: 1420,
    today: 142,
    engine: "local_disk",
  })

  // 1. Check existing session on mount
  useEffect(() => {
    setMounted(true)
    // The session lives in a secure server-set cookie; ask the server if we are signed in.
    fetch("/api/operator/login")
      .then((r) => r.json())
      .then((d) => setIsAuthenticated(Boolean(d?.authenticated)))
      .catch(() => setIsAuthenticated(false))
  }, [])

  // 2. Fetch leads from project database (/api/trip-requests)
  const fetchLeads = useCallback(async () => {
    if (!isAuthenticated) return
    setLoading(true)
    try {
      const res = await fetch("/api/trip-requests")
      if (res.status === 401) {
        setIsAuthenticated(false)
        return
      }
      const data = await res.json()
      if (data.success && Array.isArray(data.bookings)) {
        setLeads(data.bookings)
        if (data.storageEngine) setStorageEngine(data.storageEngine)
      } else {
        setLeads([])
      }
    } catch {
      toast.error("Failed to load customer trip inquiries")
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  // 3. Fetch visitor analytics
  const fetchVisitorStats = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const res = await fetch("/api/visitor-count")
      const data = await res.json()
      if (data?.success) {
        setVisitorStats({
          total: data.totalVisits || 1420,
          today: data.todayVisits || 142,
          engine: data.storageEngine || "local_disk",
        })
      }
    } catch {}
  }, [isAuthenticated])

  useEffect(() => {
    if (isAuthenticated) {
      fetchLeads()
      fetchVisitorStats()
      // Auto-poll every 15 seconds so new bookings appear automatically
      const timer = setInterval(() => {
        fetchLeads()
        fetchVisitorStats()
      }, 15000)
      return () => clearInterval(timer)
    }
  }, [isAuthenticated, fetchLeads, fetchVisitorStats])

  // Handle Login Submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginSubmitting(true)
    setLoginError("")
    try {
      const res = await fetch("/api/operator/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginEmail, password: loginPassword }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data?.success) {
        setIsAuthenticated(true)
        setLoginPassword("")
        toast.success("RIDEVO Inquiries Desk unlocked.")
      } else {
        setLoginError(data?.error || "Invalid operator credentials.")
        toast.error("Access denied. Please check username & password.")
      }
    } catch {
      setLoginError("Could not reach the server. Please try again.")
    } finally {
      setLoginSubmitting(false)
    }
  }

  // Handle Logout
  const handleLogout = () => {
    fetch("/api/operator/login", { method: "DELETE" }).catch(() => {})
    setIsAuthenticated(false)
    setLoginPassword("")
    toast.info("Logged out from Inquiries Desk.")
  }

  // Update Booking Status
  const updateStatus = async (bookingRef: string, newStatus: string) => {
    // Show the change straight away; undo it if the server does not confirm it.
    const previous = leads
    setLeads((prev) =>
      prev.map((l) =>
        l.bookingRef === bookingRef ? { ...l, status: newStatus as StoredTripRequest["status"] } : l
      )
    )
    try {
      const res = await fetch("/api/trip-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingRef, status: newStatus }),
      })
      if (res.status === 401) {
        setLeads(previous)
        setIsAuthenticated(false)
        toast.error("Session expired. Please sign in again.")
        return
      }
      const data = await res.json().catch(() => ({}))
      if (res.ok && data?.success && data.booking) {
        setLeads((prev) => prev.map((l) => (l.bookingRef === bookingRef ? data.booking : l)))
        toast.success(`Booking ${bookingRef} marked as ${newStatus.replace(/_/g, " ")}`)
      } else {
        setLeads(previous)
        toast.error(data?.error || "Could not update the booking status. Please try again.")
      }
    } catch {
      setLeads(previous)
      toast.error("Failed to update booking status. Check your internet connection.")
    }
  }

  const copyRef = (ref: string) => {
    navigator.clipboard.writeText(ref)
    setCopiedId(ref)
    setTimeout(() => setCopiedId(null), 2000)
    toast.success("Booking ref copied")
  }

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = leads.length
    const pending = leads.filter((l) => l.status === "pending_confirmation").length
    const confirmed = leads.filter((l) => l.status === "called_confirmed").length
    const allotted = leads.filter((l) => l.status === "driver_allotted").length
    return { total, pending, confirmed, allotted }
  }, [leads])

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((item) => {
      const matchesSearch =
        item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.customerPhone.includes(searchTerm) ||
        item.bookingRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.destination.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus =
        statusFilter === "all" ? true : item.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [leads, searchTerm, statusFilter])

  // Driver Dispatch WhatsApp Message
  const getDriverDispatchMsg = (item: StoredTripRequest) => {
    const text =
      `*🚖 OUTSTATION CAB DUTY ALLOTMENT*\n` +
      `*Ref:* ${item.bookingRef}\n` +
      `---------------------------------------\n` +
      `*Customer:* ${item.customerName}\n` +
      `*Phone:* +91 ${item.customerPhone}\n` +
      `*Route:* ${item.source} ➔ ${item.destination}\n` +
      `*Pickup Landmark:* ${item.pickupAddress}\n` +
      `*Pickup Time:* ${item.pickupDate} at ${item.pickupTime}\n` +
      `*Duration:* ${item.days} Day(s)\n` +
      `*Car Category:* ${item.carName} (Rate: ₹${item.ratePerKm}/km | Bata: ₹${item.driverBata}/day)\n` +
      `*Package Allowance:* ${item.packageMinKm} km min (Extra km @ ₹${item.ratePerKm}/km)\n` +
      `*Est. Fare:* ₹${item.estimatedFare.toLocaleString("en-IN")} + Toll/Parking\n` +
      (item.notes ? `*Customer Notes:* ${item.notes}\n` : "") +
      `---------------------------------------\n` +
      `Please confirm driver & vehicle number.`

    return `https://wa.me/?text=${encodeURIComponent(text)}`
  }

  // Export to CSV
  const exportToCSV = () => {
    if (leads.length === 0) {
      toast.error("No bookings to export")
      return
    }
    const headers = [
      "Booking Ref", "Date Received", "Customer Name", "Customer Phone",
      "Route", "Pickup Address", "Pickup Date", "Pickup Time", "Days",
      "Vehicle", "Rate/KM", "Driver Bata/Day", "Billed KM", "Estimated Fare", "Status", "Notes"
    ]
    const rows = leads.map((l) => [
      l.bookingRef,
      new Date(l.createdAt).toLocaleDateString("en-IN"),
      `"${l.customerName.replace(/"/g, '""')}"`,
      l.customerPhone,
      `"${l.source} to ${l.destination}"`,
      `"${l.pickupAddress.replace(/"/g, '""')}"`,
      l.pickupDate,
      l.pickupTime,
      l.days,
      l.carName,
      l.ratePerKm,
      l.driverBata,
      l.billedKm,
      l.estimatedFare,
      l.status,
      `"${(l.notes || "").replace(/"/g, '""')}"`,
    ])

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `ridevo-leads-${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("Customer leads exported to CSV!")
  }

  if (!mounted) return null

  // ═══════════════════════════════════════════════════════════════════════════
  // LOGIN GATE SCREEN (If Not Authenticated)
  // ═══════════════════════════════════════════════════════════════════════════
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
        <Toaster position="top-right" richColors />

        {/* Ambient background glow */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 40%, #16a34a 0%, transparent 40%),
                             radial-gradient(circle at 80% 60%, #15803d 0%, transparent 40%)`,
          }}
        />

        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <RidevoLogo size="lg" theme="dark" showTagline={true} />
          </div>

          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold px-3 py-1 rounded-full mb-2">
              <Lock className="w-3.5 h-3.5" /> Fleet Administrator Portal
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Operator Inquiries Desk
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Enter your credentials to access live customer trip bookings.
            </p>
          </div>

          {loginError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 block">
                Username / Email
              </Label>
              <Input
                type="email"
                placeholder="Jagadishbaji@gmail.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                className="h-12 bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 rounded-xl text-sm font-semibold focus-visible:ring-green-500"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 block">
                Password
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  className="h-12 bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 rounded-xl text-sm font-semibold pr-10 focus-visible:ring-green-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loginSubmitting}
              className="w-full h-12 bg-green-600 hover:bg-green-500 text-white font-black text-sm rounded-xl shadow-lg transition-all cursor-pointer mt-2"
            >
              Sign In to Inquiries Desk
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <Link href="/" className="text-xs text-slate-400 hover:text-green-400 transition-colors inline-flex items-center gap-1 font-semibold">
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Customer Website
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTHENTICATED OPERATOR DESK
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 sm:p-8">
      <Toaster position="top-right" richColors />

      <div className="max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                href="/"
                className="inline-flex items-center gap-1 text-xs text-green-400 hover:text-green-300 font-bold"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Website
              </Link>
              <span className="text-slate-500">•</span>
              <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-0.5 rounded-full">
                <UserCheck className="w-3 h-3" /> Logged in: Jagadishbaji@gmail.com
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Customer Trip Requests &amp; Inquiries Desk
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 flex items-center gap-2 flex-wrap">
              <span>Live outstation cab bookings saved in database. Auto-refreshes every 15s.</span>
              <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                storageEngine === "vercel_kv_upstash"
                  ? "bg-emerald-950/80 text-emerald-300 border-emerald-700/50"
                  : storageEngine === "local_disk"
                  ? "bg-blue-950/80 text-blue-300 border-blue-700/50"
                  : "bg-amber-950/80 text-amber-300 border-amber-700/50"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${storageEngine === "vercel_kv_upstash" ? "bg-emerald-400" : storageEngine === "local_disk" ? "bg-blue-400" : "bg-amber-400"}`} />
                {storageEngine === "vercel_kv_upstash"
                  ? "Vercel KV Cloud Sync: Active"
                  : storageEngine === "local_disk"
                  ? "Local Disk Storage (data/trip-requests.json)"
                  : "Temporary storage: bookings can disappear. Connect Upstash / Vercel KV"}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              onClick={exportToCSV}
              variant="outline"
              className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-green-400" /> Export CSV
            </Button>

            <Button
              onClick={() => { fetchLeads(); fetchVisitorStats(); }}
              variant="outline"
              className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>

            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-red-900/40 bg-red-950/40 text-red-300 hover:bg-red-900/60 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </Button>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Bookings</div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5">{metrics.total}</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" /> Pending Call
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-700 mt-0.5">{metrics.pending}</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Called &amp; Confirmed</div>
            <div className="text-2xl sm:text-3xl font-black text-blue-700 mt-0.5">{metrics.confirmed}</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Driver Allotted</div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-0.5">{metrics.allotted}</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm col-span-2 sm:col-span-1">
            <div className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-indigo-500" /> Page Visitors
            </div>
            <div className="text-2xl sm:text-3xl font-black text-indigo-900 mt-0.5">
              {visitorStats.total.toLocaleString("en-IN")}
            </div>
            <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
              +{visitorStats.today} visits today
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search by name, phone, ref, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-11 rounded-xl text-xs font-medium"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {[
              { id: "all", label: `All (${metrics.total})` },
              { id: "pending_confirmation", label: `Pending Call (${metrics.pending})` },
              { id: "called_confirmed", label: `Confirmed (${metrics.confirmed})` },
              { id: "driver_allotted", label: `Driver Allotted (${metrics.allotted})` },
              { id: "completed", label: "Completed" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`text-xs font-bold px-3 py-2 rounded-xl border transition-colors whitespace-nowrap cursor-pointer ${
                  statusFilter === tab.id
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Leads Cards */}
        {loading && leads.length === 0 ? (
          <div className="py-20 text-center">
            <RefreshCw className="w-8 h-8 text-green-600 animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">Loading incoming trip requests...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Trip Requests Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Customer trip bookings submitted on the website appear here automatically.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredLeads.map((item) => (
              <div
                key={item.bookingRef}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 sm:p-6 shadow-sm transition-all duration-200"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-black bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1.5">
                      {item.bookingRef}
                      <button
                        onClick={() => copyRef(item.bookingRef)}
                        className="text-slate-400 hover:text-slate-700"
                      >
                        {copiedId === item.bookingRef ? (
                          <Check className="w-3 h-3 text-green-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </span>

                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        item.status === "pending_confirmation"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : item.status === "called_confirmed"
                          ? "bg-blue-100 text-blue-800 border border-blue-200"
                          : item.status === "driver_allotted"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {item.status.replace(/_/g, " ")}
                    </span>

                    <span className="text-[11px] text-slate-400 font-medium">
                      Received: {new Date(item.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                    </span>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={`tel:+91${item.customerPhone}`}
                      className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-colors shadow-sm"
                    >
                      <Phone className="w-3.5 h-3.5" /> Call Customer
                    </a>

                    <a
                      href={`https://wa.me/91${item.customerPhone}?text=${encodeURIComponent(
                        `Hello ${item.customerName}, this is regarding your outstation cab booking (${item.bookingRef}) from Hubli to ${item.destination}.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs px-3 py-2 rounded-xl transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-green-600" /> WhatsApp Customer
                    </a>

                    <a
                      href={getDriverDispatchMsg(item)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3 py-2 rounded-xl transition-colors"
                    >
                      <Car className="w-3.5 h-3.5 text-green-400" /> Allot to Driver
                    </a>

                    <select
                      value={item.status}
                      onChange={(e) => updateStatus(item.bookingRef, e.target.value)}
                      className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-700 cursor-pointer"
                    >
                      <option value="pending_confirmation">Pending Call</option>
                      <option value="called_confirmed">Called &amp; Confirmed</option>
                      <option value="driver_allotted">Driver Allotted</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Main Lead Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  {/* Customer Information */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-1">
                      Customer Info
                    </div>
                    <div className="text-sm font-bold text-slate-900">{item.customerName}</div>
                    <div className="text-slate-600 font-mono mt-0.5">+91 {item.customerPhone}</div>
                    <div className="text-slate-500 text-[11px] mt-1.5">
                      <strong>Landmark:</strong> {item.pickupAddress}
                    </div>
                  </div>

                  {/* Route & Schedule */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-1">
                      Trip Route &amp; Time
                    </div>
                    <div className="text-sm font-bold text-slate-900">
                      {item.source} ➔ {item.destination}
                    </div>
                    <div className="text-slate-600 mt-1">
                      {item.days} Day(s) • {item.pickupDate} ({item.pickupTime})
                    </div>
                    <div className="text-[11px] text-green-700 font-semibold mt-1">
                      {item.billedKm} km billed ({item.packageMinKm} km package min)
                    </div>
                  </div>

                  {/* Vehicle & Pricing Breakdown */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-1">
                      Car &amp; Fare
                    </div>
                    <div className="text-sm font-bold text-slate-900">{item.carName}</div>
                    <div className="text-slate-600">
                      ₹{item.ratePerKm}/km • ₹{item.driverBata}/day Bata
                    </div>
                    <div className="text-sm font-black text-green-800 mt-1">
                      Est. Total: ₹{item.estimatedFare.toLocaleString("en-IN")}
                    </div>
                  </div>

                  {/* Customer Notes & Terms */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-1">
                      Notes &amp; Extra KM Policy
                    </div>
                    <div className="text-slate-600 italic">
                      {item.notes ? `"${item.notes}"` : "No special notes provided"}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1.5">
                      Extra km crossed will be billed @ ₹{item.ratePerKm}/km by driver.
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
