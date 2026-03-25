"use client"

import { useEffect, useMemo, useState } from "react"
import { getCookie } from "cookies-next"
import { Toaster, toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageLoader } from "@/components/ui/loader"

import { AgentBooking, getBookingsByAgent, getBookingById } from "@/services/bookingService"
import { Calendar, MapPin, Phone, User as UserIcon } from "lucide-react"

export default function AgentBookingsPage() {
  const [agentId, setAgentId] = useState<string>("")
  const [bookings, setBookings] = useState<AgentBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Details modal state
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [details, setDetails] = useState<AgentBooking | null>(null)

  // get agentId from cookies (like master pages)
  useEffect(() => {
    const id = (getCookie("agentId") as string) || (getCookie("loginId") as string) || ""
    setAgentId(id)
  }, [])

  const fetchData = async () => {
    if (!agentId) return
    try {
      setError(null)
      setLoading(true)
      const data = await getBookingsByAgent(agentId)
      setBookings(data || [])
    } catch (err: any) {
      setError(err?.message || "Failed to fetch bookings")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId])

  const grouped = useMemo(() => {
    const norm = (v: any) => String(v ?? "").trim().toLowerCase()
    const map: Record<string, AgentBooking[]> = {}
    const filtered = bookings.filter(b => statusFilter === "all" ? true : norm((b as any).status) === statusFilter)
    for (const b of filtered) {
      const key = new Date((b as any).pickupDateTime || (b as any).pickupTime || (b as any).createdAt || Date.now()).toDateString()
      ;(map[key] ||= []).push(b)
    }
    return Object.entries(map)
      .map(([date, items]) => ({ date, items }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [bookings, statusFilter])

  const openDetails = async (id: string) => {
    try {
      const d = await getBookingById(id)
      setDetails(d)
      setDetailsOpen(true)
    } catch (err: any) {
      toast.error(err?.message || "Failed to load details")
    }
  }

  if (loading && !bookings.length) return <PageLoader />

  return (
    <>
      <Toaster richColors position="top-right" />
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Bookings</h1>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <Button variant="outline" onClick={fetchData}>Refresh</Button>
          </div>
        </div>

        {error && (
          <Card className="mb-4 border-red-200 bg-red-50">
            <CardContent className="p-4 text-red-700">{error}</CardContent>
          </Card>
        )}

        {!grouped.length && !loading ? (
          <Card className="rounded-2xl">
            <CardContent className="p-8 text-center text-gray-600">No bookings available.</CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {grouped.map((group) => (
              <div key={group.date}>
                <div className="flex items-center gap-2 mb-3 text-gray-700">
                  <Calendar className="w-5 h-5 text-green-600" />
                  <span className="font-semibold">{group.date}</span>
                </div>
                <Card className="rounded-2xl overflow-hidden">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Trip</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead className="hidden xl:table-cell">Vehicle</TableHead>
                            <TableHead className="hidden xl:table-cell">Route</TableHead>
                            <TableHead>Pickup</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.items.map((b) => {
                            const idForApi = String((b as any).bookingId || (b as any).id)
                            const pickup = (b as any).pickupLocation
                            const drop = (b as any).dropLocation || (b as any).dropoffLocation
                            const pickupDT = (b as any).pickupDateTime || (b as any).pickupTime || (b as any).createdAt
                            const status = String((b as any).status || "pending")
                            return (
                              <TableRow key={idForApi}>
                                <TableCell className="text-gray-800 font-medium">{(b as any).tripTypeName || "Trip"}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2 text-gray-700 text-sm">
                                    <UserIcon className="w-4 h-4 text-green-600" /> {(b as any).customerName || "-"}
                                    {(b as any).customerPhone && (
                                      <span className="flex items-center gap-1 text-gray-500 ml-3"><Phone className="w-4 h-4" />{(b as any).customerPhone}</span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="hidden xl:table-cell text-gray-700">{(b as any).agentVehicleName || (b as any).vehicleName || "-"}</TableCell>
                                <TableCell className="hidden xl:table-cell">
                                  <div className="text-gray-700 text-sm flex items-center gap-1">
                                    <MapPin className="w-4 h-4 text-green-500" />
                                    <span className="truncate max-w-[260px]" title={`${pickup || "-"} ${drop ? `→ ${drop}` : ""}`}>
                                      {pickup || "-"}
                                      {drop ? <span className="mx-1">→ {drop}</span> : null}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col text-gray-700 text-sm">
                                    <span className="font-medium">{new Date(pickupDT || Date.now()).toLocaleDateString()}</span>
                                    <span className="text-gray-600">{new Date(pickupDT || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${status.includes("confirmed") ? "bg-green-100 text-green-700" : status.includes("cancelled") ? "bg-red-100 text-red-700" : status.includes("completed") ? "bg-gray-100 text-gray-700" : status.includes("ongoing") ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                                    {status}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="rounded-xl"
                                      onClick={() => openDetails(idForApi)}
                                    >
                                      View Details
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details Modal (read-only) */}
      {detailsOpen && details && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Booking Details</h3>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setDetailsOpen(false)}>✕</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-800">
              <div>
                <div className="text-gray-500 mb-1">Trip Type</div>
                <div className="font-semibold">{(details as any).tripTypeName}</div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">Status</div>
                <div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${String(details.status || "").includes("confirmed") ? "bg-green-100 text-green-700" : String(details.status || "").includes("cancelled") ? "bg-red-100 text-red-700" : String(details.status || "").includes("completed") ? "bg-gray-100 text-gray-700" : String(details.status || "").includes("ongoing") ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                    {String(details.status || "pending")}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">Customer</div>
                <div className="font-semibold">{(details as any).userName} <span className="text-gray-500 font-normal">{(details as any).userPhone ? `(${(details as any).userPhone})` : ""}</span></div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">Vehicle</div>
                <div className="font-semibold">{(details as any).agentVehicleName || (details as any).vehicleName}</div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">Pickup</div>
                <div className="font-semibold">{(details as any).pickupLocation}</div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">Drop</div>
                <div className="font-semibold">{(details as any).dropLocation || (details as any).dropoffLocation || "-"}</div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">Pickup Time</div>
                <div className="font-semibold">{new Date((details as any).pickupDateTime || (details as any).pickupTime || "").toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">Seating</div>
                <div className="font-semibold">{(details as any).seatingCapacity}</div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">Airport Price</div>
                <div className="font-semibold">{(details as any).airportPrice ? `₹${(details as any).airportPrice}` : "-"}</div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-6">
              <Button onClick={() => setDetailsOpen(false)} className="rounded-xl">Close</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
