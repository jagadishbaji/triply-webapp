"use client"

import { useEffect, useMemo, useState } from "react"
import { getCookie } from "cookies-next"
import { Toaster, toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageLoader } from "@/components/ui/loader"

import { AgentBooking, getBookingsByAgent, getBookingById, updateBookingStatus } from "@/services/bookingService"
import { Calendar, MapPin, Check, X, Phone, User as UserIcon } from "lucide-react"

export default function AgentDashboardPage() {
  const [agentId, setAgentId] = useState<string>("")
  const [bookings, setBookings] = useState<AgentBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Details modal state
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [details, setDetails] = useState<AgentBooking | null>(null)

  useEffect(() => {
    const id = (getCookie("agentId") as string) || (getCookie("loginId") as string) || ""
    setAgentId(id)
  }, [])

  const fetchData = async () => {
    if (!agentId) return
    try {
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

  // Pending only for dashboard
  const pending = useMemo(() => (bookings || []).filter(b => String((b as any).status || "").toLowerCase() === "pending"), [bookings])

  const grouped = useMemo(() => {
    const map: Record<string, AgentBooking[]> = {}
    for (const b of pending) {
      const key = new Date((b as any).pickupDateTime || (b as any).pickupTime || (b as any).createdAt || Date.now()).toDateString()
      ;(map[key] ||= []).push(b)
    }
    return Object.entries(map)
      .map(([date, items]) => ({ date, items }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [pending])

  const handleUpdate = async (id: string, status: "accept" | "reject") => {
    try {
      setUpdatingId(id)
      await updateBookingStatus(id, status)
      toast.success(`Booking ${status === "accept" ? "accepted" : "rejected"}`)
      await fetchData()
      setDetailsOpen(false)
    } catch (err: any) {
      toast.error(err?.message || "Failed to update booking")
    } finally {
      setUpdatingId(null)
    }
  }

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
          <h1 className="text-2xl font-bold">Pending Bookings</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchData}>Refresh</Button>
          </div>
        </div>

        {error && (
          <Card className="mb-4 border-red-200 bg-red-50">
            <CardContent className="p-4 text-red-700">{error}</CardContent>
          </Card>
        )}

        {!pending.length && !loading ? (
          <Card className="rounded-2xl">
            <CardContent className="p-8 text-center text-gray-600">No pending bookings.</CardContent>
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
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.items.map((b) => {
                            const idForApi = String((b as any).bookingId || (b as any).id)
                            const pickup = (b as any).pickupLocation
                            const drop = (b as any).dropLocation || (b as any).dropoffLocation
                            const pickupDT = (b as any).pickupDateTime || (b as any).pickupTime || (b as any).createdAt
                            return (
                              <TableRow key={idForApi}>
                                <TableCell className="text-gray-800 font-medium">{(b as any).tripTypeName || "Trip"}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2 text-gray-700 text-sm">
                                    <UserIcon className="w-4 h-4 text-green-600" /> {(b as any).userName || "-"}
                                    {(b as any).userPhone && (
                                      <span className="flex items-center gap-1 text-gray-500 ml-3"><Phone className="w-4 h-4" />{(b as any).userPhone}</span>
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
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-green-500 text-green-700 hover:bg-green-50 rounded-xl"
                                      disabled={updatingId === idForApi}
                                      onClick={() => handleUpdate(idForApi, "accept")}
                                    >
                                      <Check className="w-4 h-4 mr-1" /> Accept
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-red-500 text-red-700 hover:bg-red-50 rounded-xl"
                                      disabled={updatingId === idForApi}
                                      onClick={() => handleUpdate(idForApi, "reject")}
                                    >
                                      <X className="w-4 h-4 mr-1" /> Reject
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

      {/* Details Modal */}
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
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${String(details.status || "").includes("confirmed") ? "bg-green-100 text-green-700" : String(details.status || "").includes("cancelled") ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
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
              <Button
                variant="outline"
                className="border-green-500 text-green-700 hover:bg-green-50 rounded-xl"
                onClick={async () => {
                  const id = String((details as any).bookingId || (details as any).id)
                  try {
                    setUpdatingId(id)
                    await updateBookingStatus(id, "accept")
                    toast.success("Booking accepted")
                    setDetailsOpen(false)
                    await fetchData()
                  } catch (e: any) {
                    toast.error(e?.message || "Failed to accept")
                  } finally {
                    setUpdatingId(null)
                  }
                }}
              >
                <Check className="w-4 h-4 mr-1" /> Accept
              </Button>
              <Button
                variant="outline"
                className="border-red-500 text-red-700 hover:bg-red-50 rounded-xl"
                onClick={async () => {
                  const id = String((details as any).bookingId || (details as any).id)
                  try {
                    setUpdatingId(id)
                    await updateBookingStatus(id, "reject")
                    toast.success("Booking rejected")
                    setDetailsOpen(false)
                    await fetchData()
                  } catch (e: any) {
                    toast.error(e?.message || "Failed to reject")
                  } finally {
                    setUpdatingId(null)
                  }
                }}
              >
                <X className="w-4 h-4 mr-1" /> Reject
              </Button>
              <Button onClick={() => setDetailsOpen(false)} className="rounded-xl">Close</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
