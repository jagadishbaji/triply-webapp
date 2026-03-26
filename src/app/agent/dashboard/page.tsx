"use client"

import { useEffect, useMemo, useState } from "react"
import { getCookie } from "cookies-next"
import { Toaster, toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageLoader } from "@/components/ui/loader"

import { AgentBooking, getBookingsByAgent, getBookingById, updateBookingStatus } from "@/services/bookingService"
import { getWalletByAgentId, AgentWallet } from "@/services/walletService"
import { Calendar, MapPin, Check, X, Phone, User as UserIcon, Sparkles, TrendingUp, Clock } from "lucide-react"

export default function AgentDashboardPage() {
  const [agentId, setAgentId] = useState<string>("")
  const [bookings, setBookings] = useState<AgentBooking[]>([])
  const [wallet, setWallet] = useState<AgentWallet | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const [detailsOpen, setDetailsOpen] = useState(false)
  const [details, setDetails] = useState<AgentBooking | null>(null)
  const [confirmAcceptId, setConfirmAcceptId] = useState<string | null>(null)

  useEffect(() => {
    const id = (getCookie("agentId") as string) || (getCookie("loginId") as string) || ""
    setAgentId(id)
  }, [])

  const fetchData = async () => {
    if (!agentId) return
    try {
      setLoading(true)
      const [bookingsData, walletData] = await Promise.all([
        getBookingsByAgent(agentId),
        getWalletByAgentId(agentId)
      ])
      setBookings(bookingsData || [])
      setWallet(walletData)
    } catch (err: any) {
      setError(err?.message || "Failed to fetch dashboard data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId])

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
      setConfirmAcceptId(null)
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
        
        {/* ── REDESIGNED METRICS CARDS ── */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Savings Card */}
          {wallet && (
            <Card className="rounded-2xl border-none shadow-md overflow-hidden relative bg-gradient-to-br from-emerald-500 to-emerald-700 text-white">
              <div className="absolute -right-6 -top-6 opacity-20 pointer-events-none">
                <TrendingUp className="w-32 h-32" />
              </div>
              <CardContent className="p-6 relative z-10 flex flex-col justify-between h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="font-medium text-emerald-100 text-lg">Platform Fees Saved</div>
                  <span className="bg-emerald-900/60 text-emerald-50 text-[10px] px-3 py-1 rounded-full uppercase tracking-wider font-bold shadow-sm backdrop-blur-sm border border-emerald-400/30">
                    Launch Promo
                  </span>
                </div>
                <div>
                  <div className="text-4xl font-extrabold tracking-tight">
                    ₹{wallet.lifetimeSavings.toLocaleString('en-IN')}
                  </div>
                  <p className="text-emerald-100 text-sm mt-2 opacity-90">
                    100% of your commission fees waived. Enjoy the free leads!
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pending Bookings Card */}
          <Card className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative bg-white">
            {/* Modern side-accent bar */}
            <div className="absolute left-0 top-0 w-1.5 h-full bg-amber-400"></div>
            <CardContent className="p-6 pl-8 flex flex-col justify-between h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="font-medium text-slate-500 text-lg">Pending Requests</div>
                <div className="bg-amber-100/80 p-2.5 rounded-xl text-amber-600 shadow-sm border border-amber-200/50">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="text-4xl font-extrabold text-slate-800 tracking-tight">
                  {pending.length}
                </div>
                <p className="text-slate-500 text-sm mt-2">
                  New rides awaiting your confirmation.
                </p>
              </div>
            </CardContent>
          </Card>
          
        </div>
        {/* ──────────────────────────────── */}

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Pending Bookings</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchData} className="rounded-xl">Refresh</Button>
          </div>
        </div>

        {error && (
          <Card className="mb-4 border-red-200 bg-red-50 rounded-2xl">
            <CardContent className="p-4 text-red-700">{error}</CardContent>
          </Card>
        )}

        {!pending.length && !loading ? (
          <Card className="rounded-2xl border-dashed">
            <CardContent className="p-12 text-center text-gray-500 flex flex-col items-center">
              <Check className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-lg font-medium text-gray-700">You're all caught up!</p>
              <p className="text-sm">No pending bookings at this time.</p>
            </CardContent>
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
                            
                            const isConfirmed = String((b as any).status || "").toLowerCase().match(/confirmed|accepted|accept/)

                            return (
                              <TableRow key={idForApi}>
                                <TableCell className="text-gray-800 font-medium">{(b as any).tripTypeName || "Trip"}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2 text-gray-700 text-sm">
                                    <UserIcon className="w-4 h-4 text-green-600" /> {(b as any).customerName || "-"}
                                    {(b as any).customerPhone && (
                                      <span className="flex items-center gap-1 text-gray-500 ml-3">
                                        <Phone className="w-4 h-4" />
                                        {isConfirmed ? (b as any).customerPhone : "Hidden until confirmed"}
                                      </span>
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
                                      onClick={() => setConfirmAcceptId(idForApi)}
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
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm">
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
                <div className="font-semibold">
                  {(details as any).customerName} 
                  <span className="text-gray-500 font-normal ml-1">
                    {(() => {
                      if (!(details as any).customerPhone) return "";
                      const isConfirmed = String((details as any).status || "").toLowerCase().match(/confirmed|accepted|accept/);
                      return `(${isConfirmed ? (details as any).customerPhone : "Phone hidden until confirmed"})`;
                    })()}
                  </span>
                </div>
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
                <div className="text-gray-500 mb-1">
                  {(details as any).tripTypeName?.toLowerCase() === "airport"
                    ? "Airport Price"
                    : (details as any).tripTypeName?.toLowerCase() === "local"
                    ? "Price / km"
                    : "Outstation Price / km"}
                </div>
                <div className="font-semibold">
                  {(() => {
                    const tripType = (details as any).tripTypeName?.toLowerCase()
                    let price = null

                    if (tripType === "local") {
                      price = (details as any).localPerKmPrice
                    } else if (tripType === "out station") {
                      price = (details as any).outPerKmPrice   
                    } else if (tripType === "airport") {
                      price = (details as any).airportPrice
                    }

                    return price ? `₹${price}` : "-"
                  })()}
                </div>
              </div>
               <div>
                <div className="text-gray-500 mb-1">Notes</div>
                <div className="font-semibold">{(details as any).notes || "-"}</div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-6">
              <Button
                variant="outline"
                className="border-green-500 text-green-700 hover:bg-green-50 rounded-xl"
                onClick={() => setConfirmAcceptId(String((details as any).bookingId || (details as any).id))}
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

      {/* Confirmation Modal for Shadow Ledger Acceptance */}
      {confirmAcceptId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 rounded-bl-full -z-10 opacity-50" />
            
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-gray-900">Accept Booking</h3>
              <button className="text-gray-400 hover:text-gray-600" onClick={() => setConfirmAcceptId(null)}>✕</button>
            </div>
            <p className="text-gray-600 text-sm mb-6">You are about to accept this booking and reveal the customer's contact information.</p>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5 mb-6 relative overflow-hidden">
              <div className="absolute -top-3 -right-3 bg-red-500 text-white text-[10px] font-bold px-4 py-4 rounded-full flex items-center justify-center transform rotate-12 shadow-lg">
                <div className="flex flex-col items-center">
                  <Sparkles className="w-3 h-3 mb-0.5" />
                  <span>100%</span>
                  <span>FREE</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-gray-600">
                  <span className="text-sm font-medium">Standard Platform Fee</span>
                  <span className="text-gray-400 line-through decoration-gray-400">₹100.00</span>
                </div>
                
                <div className="flex justify-between items-center text-emerald-600">
                  <span className="text-sm font-bold flex items-center gap-1">Launch Promo Applied</span>
                  <span className="font-bold">-₹100.00</span>
                </div>

                <div className="border-t border-green-200/60 pt-3 mt-1 flex justify-between items-center">
                  <span className="text-gray-900 font-bold">Total to Deduct</span>
                  <span className="text-2xl font-black text-gray-900">₹0</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setConfirmAcceptId(null)}>Cancel</Button>
              <Button 
                className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-md"
                disabled={updatingId === confirmAcceptId}
                onClick={() => handleUpdate(confirmAcceptId, "accept")}
              >
                {updatingId === confirmAcceptId ? "Processing..." : "Confirm & Accept"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}