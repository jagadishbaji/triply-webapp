"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { motion } from "framer-motion"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { PageLoader } from "@/components/ui/loader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  IconUsers, IconCar, IconClipboardList, IconUserCheck,
  IconClock, IconCircleCheckFilled, IconRefresh, IconArrowRight,
  IconMapPin, IconPlane, IconRoute, IconAlertTriangle,
} from "@tabler/icons-react"

import { getAgents, getInActiveAgents } from "@/services/admin/agentsService"
import { getAllPrices, PriceDetailsByTrip } from "@/services/prices/pricesService"
import { AgentBooking, getBookingsByAgent } from "@/services/bookingService"
import { getVehicleTypes } from "@/services/admin/vehicleTypesService"
import { gettripTypes } from "@/services/admin/tripTypesService"

// ─── Types ─────────────────────────────────────────────────────────────────
interface DashboardStats {
  totalAgents:    number
  activeAgents:   number
  pendingAgents:  number
  totalVehicles:  number
  vehicleTypes:   number
  tripTypes:      number
  totalPrices:    number
  recentBookings: AgentBooking[]
}

// ─── Helper: safe fetch that never throws, returns null on failure ──────────
async function safeFetch<T>(fn: () => Promise<T>): Promise<T | null> {
  try { return await fn() } catch { return null }
}

// ─── Helper: read a cookie client-side ─────────────────────────────────────
function readCookie(name: string): string {
  if (typeof document === "undefined") return ""
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : ""
}

// ─── Stat card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, sub, href, delay = 0 }: {
  label: string; value: number | string; icon: React.ElementType
  color: string; sub?: string; href?: string; delay?: number
}) {
  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4 group"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-2xl font-black text-slate-900 tabular-nums">{value}</div>
        <div className="text-sm font-medium text-slate-500 mt-0.5">{label}</div>
        {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
      </div>
      {href && <IconArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />}
    </motion.div>
  )
  return href ? <Link href={href}>{inner}</Link> : inner
}

// ─── Section heading ─────────────────────────────────────────────────────────
function SectionHeading({ title, sub, href, hrefLabel }: {
  title: string; sub?: string; href?: string; hrefLabel?: string
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-lg font-black text-slate-900">{title}</h2>
        {sub && <p className="text-sm text-slate-500 mt-0.5">{sub}</p>}
      </div>
      {href && (
        <Link href={href}>
          <Button variant="outline" className="h-8 px-3 text-xs border-slate-200 text-slate-600 rounded-xl flex items-center gap-1.5">
            {hrefLabel ?? "View all"} <IconArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      )}
    </div>
  )
}

// ─── Booking helpers ─────────────────────────────────────────────────────────
function bookingBadge(status?: string) {
  const s = (status ?? "").toLowerCase()
  if (s.includes("confirm"))  return { label: "Confirmed", cls: "bg-green-50 text-green-700 border-green-200" }
  if (s.includes("pending"))  return { label: "Pending",   cls: "bg-amber-50 text-amber-700 border-amber-200" }
  if (s.includes("cancel"))   return { label: "Cancelled", cls: "bg-red-50 text-red-600 border-red-200" }
  if (s.includes("ongoing"))  return { label: "Ongoing",   cls: "bg-blue-50 text-blue-700 border-blue-200" }
  if (s.includes("complete")) return { label: "Completed", cls: "bg-slate-50 text-slate-600 border-slate-200" }
  return { label: status ?? "—", cls: "bg-slate-50 text-slate-600 border-slate-200" }
}

function TripIcon({ name }: { name?: string }) {
  const n = (name ?? "").toLowerCase()
  if (n.includes("airport")) return <IconPlane  className="w-3.5 h-3.5" />
  if (n.includes("out"))     return <IconRoute  className="w-3.5 h-3.5" />
  return                            <IconMapPin className="w-3.5 h-3.5" />
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [stats,     setStats]     = useState<DashboardStats | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [errors,    setErrors]    = useState<string[]>([])
  const [adminName, setAdminName] = useState("Admin")

  // Read name from cookie on mount (client-side only, no library needed)
  useEffect(() => {
    const raw = readCookie("loggedName")
    if (raw && raw !== "undefined" && raw !== "null") {
      setAdminName(raw.split(" ")[0])
    }
  }, [])

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    setErrors([])

    // ── Fetch each source independently so one failure doesn't kill all ──
    const [agents, inactive, prices, vTypes, tTypes] = await Promise.all([
      safeFetch(getAgents),
      safeFetch(getInActiveAgents),
      safeFetch(getAllPrices),
      safeFetch(getVehicleTypes),
      safeFetch(gettripTypes),
    ])

    const errs: string[] = []
    if (!agents)   errs.push("Failed to load agents")
    if (!inactive) errs.push("Failed to load pending agents")
    if (!prices)   errs.push("Failed to load price data")
    if (!vTypes)   errs.push("Failed to load vehicle types")
    if (!tTypes)   errs.push("Failed to load trip types")

    // ── Bookings: fetch from first 3 active agents, each independently ───
    const activeIds = (agents ?? []).filter(a => a.isActive).slice(0, 3).map(a => a.id)
    const bookingResults = await Promise.allSettled(
      activeIds.map(id => getBookingsByAgent(id))
    )
    const allBookings: AgentBooking[] = bookingResults
      .flatMap(r => r.status === "fulfilled" ? (r.value ?? []) : [])
      .sort((a, b) => new Date((b as any).createdAt || 0).getTime() - new Date((a as any).createdAt || 0).getTime())
      .slice(0, 8)

    const priceList = prices ?? []

    setErrors(errs)
    setStats({
      totalAgents:    (agents   ?? []).length,
      activeAgents:   (agents   ?? []).filter(a => a.isActive).length,
      pendingAgents:  (inactive ?? []).length,
      totalVehicles:  [...new Set(priceList.map(p => p.agentVehicleId))].length,
      vehicleTypes:   (vTypes   ?? []).length,
      tripTypes:      (tTypes   ?? []).length,
      totalPrices:    priceList.length,
      recentBookings: allBookings,
    })
    setLoading(false)
  }, [])

  useEffect(() => { fetchDashboard() }, [fetchDashboard])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening"

  if (loading) return <PageLoader />

  return (
    <SidebarProvider style={{ "--sidebar-width": "calc(var(--spacing) * 72)", "--header-height": "calc(var(--spacing) * 12)" } as React.CSSProperties}>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col p-6 bg-slate-50 min-h-full">

          {/* ── Welcome ──────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-7"
          >
            <div>
              <h1 className="text-2xl font-black text-slate-900">
                Good {greeting}, {adminName} 👋
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">Here's what's happening on RIDEVO today.</p>
            </div>
            <Button variant="outline" onClick={fetchDashboard}
              className="h-9 px-4 border-slate-200 text-slate-600 rounded-xl flex items-center gap-2 self-start sm:self-auto">
              <IconRefresh className="w-4 h-4" /> Refresh
            </Button>
          </motion.div>

          {/* ── Partial errors (non-blocking) ────────────────────── */}
          {errors.length > 0 && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5">
              <IconAlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800 mb-0.5">Some data could not be loaded</p>
                <p className="text-xs text-amber-700">{errors.join(" · ")} — showing available data below.</p>
              </div>
              <Button variant="outline" size="sm" onClick={fetchDashboard}
                className="ml-auto border-amber-300 text-amber-700 hover:bg-amber-100 rounded-lg h-7 text-xs flex-shrink-0">
                Retry
              </Button>
            </div>
          )}

          {stats && (
            <>
              {/* ── Pending approval alert ───────────────────────── */}
              {stats.pendingAgents > 0 && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
                  <IconAlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <p className="text-sm text-amber-800 flex-1">
                    <strong>{stats.pendingAgents}</strong> agent{stats.pendingAgents !== 1 ? "s" : ""} waiting for approval.
                  </p>
                  <Link href="/admin/approveAgents">
                    <Button className="h-7 px-3 text-xs bg-amber-500 hover:bg-amber-400 text-white rounded-lg font-semibold">
                      Review now
                    </Button>
                  </Link>
                </motion.div>
              )}

              {/* ── Stats grid ───────────────────────────────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard label="Total Agents"      value={stats.totalAgents}   icon={IconUsers}       color="bg-slate-700" sub={`${stats.activeAgents} active · ${stats.pendingAgents} pending`} href="/admin/agents"        delay={0}    />
                <StatCard label="Pending Approvals" value={stats.pendingAgents} icon={IconUserCheck}   color={stats.pendingAgents > 0 ? "bg-amber-500" : "bg-green-600"} sub={stats.pendingAgents > 0 ? "Needs attention" : "All approved"} href="/admin/approveAgents" delay={0.06} />
                <StatCard label="Active Vehicles"   value={stats.totalVehicles} icon={IconCar}         color="bg-green-600" sub={`Across ${stats.vehicleTypes} vehicle types`} href="/admin/agentVehicles"  delay={0.12} />
                <StatCard label="Price Entries"     value={stats.totalPrices}   icon={IconClipboardList} color="bg-blue-600" sub={`${stats.tripTypes} trip types configured`} href="/admin/vehiclePrice"   delay={0.18} />
              </div>

              {/* ── Three panel row ──────────────────────────────── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">

                {/* Agent overview */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.24 }}
                  className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                  <SectionHeading title="Agent Overview" href="/admin/agents" hrefLabel="Manage" />
                  <div className="space-y-1">
                    {[
                      { icon: IconCircleCheckFilled, iconColor: "text-green-500", label: "Active",          val: stats.activeAgents  },
                      { icon: IconClock,             iconColor: "text-amber-500", label: "Pending approval", val: stats.pendingAgents },
                      { icon: IconUsers,             iconColor: "text-slate-400", label: "Total registered", val: stats.totalAgents   },
                    ].map(({ icon: Icon, iconColor, label, val }) => (
                      <div key={label} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                        <div className={`flex items-center gap-2 text-sm text-slate-600`}>
                          <Icon className={`w-4 h-4 ${iconColor}`} />{label}
                        </div>
                        <span className="font-black text-slate-900 text-lg tabular-nums">{val}</span>
                      </div>
                    ))}
                  </div>
                  {stats.totalAgents > 0 && (
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                        <span>Active ratio</span>
                        <span>{Math.round((stats.activeAgents / stats.totalAgents) * 100)}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div className="h-full bg-green-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${(stats.activeAgents / stats.totalAgents) * 100}%` }}
                          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }} />
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Platform config */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.30 }}
                  className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                  <SectionHeading title="Platform Config" />
                  <div className="space-y-1">
                    {[
                      { icon: IconCar,            iconColor: "text-green-500",  label: "Vehicle types", val: stats.vehicleTypes, href: "/admin/vehicleTypes" },
                      { icon: IconRoute,          iconColor: "text-blue-500",   label: "Trip types",    val: stats.tripTypes,    href: "/admin/tripTypes"    },
                      { icon: IconClipboardList,  iconColor: "text-purple-500", label: "Price entries", val: stats.totalPrices,  href: "/admin/vehiclePrice" },
                    ].map(({ icon: Icon, iconColor, label, val, href }) => (
                      <div key={label} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                        <div className={`flex items-center gap-2 text-sm text-slate-600`}>
                          <Icon className={`w-4 h-4 ${iconColor}`} />{label}
                        </div>
                        <Link href={href}>
                          <span className="font-black text-slate-900 text-lg tabular-nums hover:text-green-700 transition-colors">{val}</span>
                        </Link>
                      </div>
                    ))}
                  </div>
                  <div className={`mt-4 rounded-xl px-3 py-2.5 flex items-center gap-2 text-xs font-medium
                    ${stats.vehicleTypes > 0 && stats.tripTypes > 0 && stats.totalPrices > 0
                      ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                    {stats.vehicleTypes > 0 && stats.tripTypes > 0 && stats.totalPrices > 0
                      ? <><IconCircleCheckFilled className="w-4 h-4" /> Platform fully configured</>
                      : <><IconAlertTriangle className="w-4 h-4" /> Some configuration missing</>
                    }
                  </div>
                </motion.div>

                {/* Quick actions */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.36 }}
                  className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                  <SectionHeading title="Quick Actions" />
                  <div className="flex flex-col gap-2">
                    {[
                      { label: "Approve pending agents", href: "/admin/approveAgents",  icon: IconUserCheck,     color: "text-amber-600 bg-amber-50 border-amber-200"   },
                      { label: "Manage agents",          href: "/admin/agents",          icon: IconUsers,         color: "text-slate-600 bg-slate-50 border-slate-200"   },
                      { label: "Agent vehicles",         href: "/admin/agentVehicles",   icon: IconCar,           color: "text-green-600 bg-green-50 border-green-200"   },
                      { label: "Manage pricing",         href: "/admin/vehiclePrice",    icon: IconClipboardList, color: "text-blue-600 bg-blue-50 border-blue-200"       },
                      { label: "Vehicle types",          href: "/admin/vehicleTypes",    icon: IconCar,           color: "text-purple-600 bg-purple-50 border-purple-200" },
                      { label: "Trip types",             href: "/admin/tripTypes",       icon: IconRoute,         color: "text-slate-600 bg-slate-50 border-slate-200"   },
                    ].map(({ label, href, icon: Icon, color }) => (
                      <Link key={href} href={href}>
                        <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm font-semibold hover:opacity-80 transition-opacity ${color}`}>
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          {label}
                          <IconArrowRight className="w-3.5 h-3.5 ml-auto" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* ── Recent bookings ──────────────────────────────── */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.42 }}
                className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                <SectionHeading title="Recent Bookings" sub="Latest bookings across active agents" href="/admin/bookings" hrefLabel="View all" />
                {stats.recentBookings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                      <IconClipboardList className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-slate-600 font-semibold mb-1">No bookings yet</p>
                    <p className="text-slate-400 text-sm">Customer bookings will appear here.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100">
                          {["Customer", "Vehicle", "Route", "Trip", "Status"].map((h, i) => (
                            <th key={h} className={`text-left text-xs font-semibold text-slate-400 pb-3 pr-4 uppercase tracking-wide ${i === 1 ? "hidden md:table-cell" : ""} ${i === 2 ? "hidden lg:table-cell" : ""}`}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {stats.recentBookings.map((b, i) => {
                          const { label, cls } = bookingBadge((b as any).status)
                          const customer  = (b as any).userName         || "Customer"
                          const vehicle   = (b as any).agentVehicleName || (b as any).vehicleName || "—"
                          const pickup    = (b as any).pickupLocation   || "—"
                          const drop      = (b as any).dropLocation     || (b as any).dropoffLocation || ""
                          const tripName  = (b as any).tripTypeName     || "Trip"
                          const initials  = customer.split(" ").slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? "").join("")
                          return (
                            <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-3 pr-4">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-700 flex-shrink-0">{initials}</div>
                                  <span className="font-medium text-slate-800 truncate max-w-[120px]">{customer}</span>
                                </div>
                              </td>
                              <td className="py-3 pr-4 hidden md:table-cell">
                                <span className="text-slate-600 truncate max-w-[130px] block">{vehicle}</span>
                              </td>
                              <td className="py-3 pr-4 hidden lg:table-cell">
                                <span className="text-slate-500 text-xs truncate max-w-[180px] block" title={`${pickup}${drop ? ` → ${drop}` : ""}`}>
                                  {pickup}{drop ? <> → {drop}</> : null}
                                </span>
                              </td>
                              <td className="py-3 pr-4">
                                <div className="flex items-center gap-1 text-slate-500 text-xs">
                                  <TripIcon name={tripName} />{tripName}
                                </div>
                              </td>
                              <td className="py-3">
                                <Badge className={`${cls} border text-xs font-semibold`}>{label}</Badge>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}