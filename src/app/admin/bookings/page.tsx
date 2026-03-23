"use client"

import { useEffect, useState, useCallback } from "react"
import type { ColumnDef } from "@tanstack/react-table"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { PageLoader } from "@/components/ui/loader"
import { toast, Toaster } from "sonner"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  IconSearch,
  IconRefresh,
  IconUsers,
  IconCalendarEvent,
  IconMapPin,
  IconCash,
  IconCar,
  IconChevronRight,
  IconPhone,
} from "@tabler/icons-react"

// Import your agent fetcher (assuming you have this from your provided code)
import { getAgents } from "@/services/admin/agentVehiclesService" 
import { getBookingsByAgent, type BookingDetail } from "@/services/bookingService"

type Agent = { id: string; name: string }

// ─── Stat card ─────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: string | number; icon: React.ElementType; color: string
}) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <div className="text-2xl font-black text-slate-900">{value}</div>
        <div className="text-xs text-slate-500 font-medium">{label}</div>
      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────
export default function AgentBookingsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [bookings, setBookings] = useState<BookingDetail[]>([])
  const [filtered, setFiltered] = useState<BookingDetail[]>([])

  const [selectedAgentId, setSelectedAgentId] = useState("")
  const [search, setSearch] = useState("")

  const [loadingAgents, setLoadingAgents] = useState(true)
  const [loadingBookings, setLoadingBookings] = useState(false)

  // ── Load agents on mount ────────────────────────────
  useEffect(() => {
    getAgents()
      .then((data) => setAgents(data || []))
      .catch(() => toast.error("Failed to load agents."))
      .finally(() => setLoadingAgents(false))
  }, [])

  // ── Load bookings when agent changes ────────────────────────────────
  const fetchBookings = useCallback(async (agentId: string) => {
    if (!agentId) { setBookings([]); setFiltered([]); return }
    setLoadingBookings(true)
    try {
      const data = await getBookingsByAgent(agentId)
      setBookings(data || [])
      setFiltered(data || [])
    } catch {
      toast.error("Failed to fetch bookings.")
    } finally {
      setLoadingBookings(false)
    }
  }, [])

  useEffect(() => { fetchBookings(selectedAgentId) }, [selectedAgentId, fetchBookings])

  // ── Search filter ────────────────────────────────────────────────────
  useEffect(() => {
    const q = search.toLowerCase().trim()
    setFiltered(
      q
        ? bookings.filter(b =>
            b.customerName.toLowerCase().includes(q) ||
            b.bookingRef.toLowerCase().includes(q) ||
            b.pickupLocation.toLowerCase().includes(q)
          )
        : bookings
    )
  }, [search, bookings])

  // ── Helpers ──────────────────────────────────────────────────────────
  const selectedAgent = agents.find(a => a.id === selectedAgentId)

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase()
    if (s === 'pending') return "bg-yellow-50 text-yellow-700 border-yellow-200"
    if (s === 'confirmed') return "bg-blue-50 text-blue-700 border-blue-200"
    if (s === 'completed') return "bg-green-50 text-green-700 border-green-200"
    if (s === 'cancelled') return "bg-red-50 text-red-700 border-red-200"
    return "bg-slate-50 text-slate-700 border-slate-200"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true
    })
  }

  // Calculate Stats
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.finalPrice || 0), 0)
  const completedRides = bookings.filter(b => b.status.toLowerCase() === 'completed').length

  // ── Table columns ────────────────────────────────────────────────────
  const columns: ColumnDef<BookingDetail>[] = [
    {
      accessorKey: "bookingRef",
      header: "Reference",
      cell: ({ row }) => (
        <div>
          <div className="font-bold text-slate-900">{row.original.bookingRef || 'N/A'}</div>
          <div className="text-xs text-slate-500">{new Date(row.original.createdAt).toLocaleDateString()}</div>
        </div>
      ),
    },
    {
      accessorKey: "customerName",
      header: "Customer",
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-slate-800">{row.original.customerName}</div>
          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
            <IconPhone className="w-3 h-3" /> {row.original.customerPhone}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "tripDetails",
      header: "Trip Details",
      cell: ({ row }) => (
        <div>
          <Badge variant="outline" className="mb-1 text-[10px] uppercase tracking-wider bg-slate-50">
            {row.original.tripTypeName}
          </Badge>
          <div className="text-sm text-slate-700 flex flex-col gap-0.5">
            <span className="flex items-center gap-1 truncate max-w-[200px]" title={row.original.pickupLocation}>
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" /> {row.original.pickupLocation}
            </span>
            {row.original.dropoffLocation && (
              <span className="flex items-center gap-1 truncate max-w-[200px]" title={row.original.dropoffLocation}>
                <IconMapPin className="w-3 h-3 text-red-500 flex-shrink-0" /> {row.original.dropoffLocation}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "pickupTime",
      header: "Pickup Schedule",
      cell: ({ row }) => (
        <div className="text-sm text-slate-700 font-medium">
          {formatDate(row.original.pickupTime)}
        </div>
      ),
    },
    {
      accessorKey: "vehicleName",
      header: "Assigned Vehicle",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center">
            <IconCar className="w-3 h-3 text-slate-500" />
          </div>
          <span className="text-sm font-medium text-slate-700">{row.original.vehicleName}</span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge className={`border text-xs font-semibold ${getStatusBadge(row.original.status)}`}>
          {row.original.status.toUpperCase()}
        </Badge>
      ),
    },
    {
      accessorKey: "finalPrice",
      header: () => <div className="text-right">Amount</div>,
      cell: ({ row }) => (
        <div className="text-right font-black text-slate-900">
          {row.original.finalPrice != null ? `₹${row.original.finalPrice.toFixed(2)}` : 'TBD'}
        </div>
      ),
    },
  ]

  if (loadingAgents) return <PageLoader />

  return (
    <>
      <Toaster richColors position="top-right" />
      <SidebarProvider
        style={{
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties}
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />

          <div className="flex flex-1 flex-col p-6 bg-slate-50 min-h-full">

            {/* ── Page header ─────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-black text-slate-900">Agent Bookings</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  View and monitor all customer bookings assigned to specific agents.
                </p>
              </div>
            </div>

            {/* ── Agent selector card ─────────────────────────────── */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 mb-6 shadow-sm">
              <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                Select Agent
              </Label>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 h-11 focus-within:ring-2 focus-within:ring-green-100 focus-within:border-green-500 transition-all min-w-[260px]">
                  <IconUsers className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
                  <Select value={selectedAgentId} onValueChange={(v) => { setSelectedAgentId(v); setSearch("") }}>
                    <SelectTrigger className="border-0 bg-transparent p-0 h-auto text-sm focus:ring-0 shadow-none flex-1">
                      <SelectValue placeholder="Choose an agent to view their bookings" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map(a => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedAgentId && (
                  <Button
                    variant="outline"
                    onClick={() => fetchBookings(selectedAgentId)}
                    className="h-11 px-4 border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl flex items-center gap-2"
                  >
                    <IconRefresh className="w-4 h-4" /> Refresh
                  </Button>
                )}

                {/* Selected agent breadcrumb */}
                {selectedAgent && (
                  <div className="flex items-center gap-2 text-sm text-slate-500 ml-auto">
                    <IconUsers className="w-4 h-4 text-green-500" />
                    <span>Viewing bookings for</span>
                    <span className="font-bold text-slate-800">{selectedAgent.name}</span>
                    <IconChevronRight className="w-3.5 h-3.5" />
                    <span className="font-bold text-green-700">{bookings.length} trips</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── Stats (only when agent selected) ───────────────── */}
            {selectedAgentId && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                <StatCard label="Total Bookings" value={bookings.length} icon={IconCalendarEvent} color="bg-slate-700" />
                <StatCard label="Completed Trips" value={completedRides} icon={IconCar} color="bg-blue-600" />
                <StatCard label="Total Revenue" value={`₹${totalRevenue.toLocaleString()}`} icon={IconCash} color="bg-green-600" />
              </div>
            )}

            {/* ── No agent selected ───────────────────────────────── */}
            {!selectedAgentId && (
              <div className="bg-white border border-slate-100 rounded-2xl flex flex-col items-center justify-center py-20 text-center shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <IconCalendarEvent className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-slate-700 font-bold text-lg mb-1">Select an Agent</h3>
                <p className="text-slate-400 text-sm max-w-xs">
                  Choose an agent from the dropdown above to view their incoming and historical bookings.
                </p>
              </div>
            )}

            {/* ── Search + Table ─────────────────────────────────── */}
            {selectedAgentId && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 flex items-center bg-white border border-slate-200 rounded-xl px-3 h-10 focus-within:ring-2 focus-within:ring-green-100 focus-within:border-green-500 transition-all">
                    <IconSearch className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Search by reference, customer name, or location..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="flex-1 text-sm bg-transparent border-0 outline-none placeholder:text-slate-400 text-slate-800"
                    />
                    {search && (
                      <button onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600 ml-2 text-sm">✕</button>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  {loadingBookings ? (
                    <div className="flex items-center justify-center py-16">
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <IconRefresh className="w-7 h-7 animate-spin" />
                        <span className="text-sm">Loading bookings...</span>
                      </div>
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                        <IconCalendarEvent className="w-7 h-7 text-slate-400" />
                      </div>
                      <h3 className="text-slate-700 font-bold mb-1">
                        {search ? "No bookings match your search" : "No bookings found"}
                      </h3>
                      <p className="text-slate-400 text-sm mb-4 max-w-xs">
                        {search
                          ? "Try a different search term."
                          : `${selectedAgent?.name} doesn't have any customer bookings yet.`}
                      </p>
                    </div>
                  ) : (
                    <DataTable columns={columns} data={filtered} />
                  )}
                </div>
              </>
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </>
  )
}