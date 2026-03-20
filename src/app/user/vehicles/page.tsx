"use client"

import { useEffect, useState, useCallback } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, MapPin, Calendar, Repeat, Car, ArrowRight, Check, X, AlertCircle } from "lucide-react"
import Link from "next/link"
import { getCookie } from "cookies-next"

import { getPricesByTripTypeId } from "@/services/prices/pricesService"
import { gettripTypes } from "@/services/admin/tripTypesService"
import { getVehicleTypes } from "@/services/admin/vehicleTypesService"
import { logout } from "@/services/authService"
import { createBooking, BookingRequest } from "@/services/bookingService"

import { DotLottieReact } from "@lottiefiles/dotlottie-react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast, Toaster } from "sonner"

import BookingSuccessModal from "@/components/bookingSuccessfull"
import UserHeader from "@/components/user/UserHeader"

interface VehiclePrice {
  id: string
  agentVehicleId: string
  agentVehicleName: string
  agentName: string
  agentId: string
  vehicleName: string
  seatingCapacity: number
  tripTypeName: string
  localPerKmPrice?: number
  localMinKm?: number
  airportPrice?: number
  outPerKmPrice?: number
  outMinKm?: number
  tripTypeId: string
  vehicleTypeId: string
  vehicleTypeName?: string
}

export default function VehiclesPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // State for filters
  const [tripTypes, setTripTypes] = useState<any[]>([])
  const [vehicleTypes, setVehicleTypes] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<VehiclePrice[]>([])
  const [loading, setLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehiclePrice | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState("");

  // Pre-fill from query string
  const [tripTypeId, setTripTypeId] = useState(searchParams.get("tripTypeId") || "")
  const [vehicleTypeId, setVehicleTypeId] = useState(searchParams.get("vehicleTypeId") || "")
  const [pickup, setPickup] = useState(searchParams.get("pickup") || "")
  const [destination, setDestination] = useState(searchParams.get("destination") || "")
  const [date, setDate] = useState(searchParams.get("date") || "")

  // Auth state
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [loginId, setLoginId] = useState<string | null>(null)
  const [loggedName, setLoggedName] = useState<string | null>(null)

  // success modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    setAccessToken((getCookie("accessToken") as string) || null)
    setLoginId((getCookie("loginId") as string) || null)
    setLoggedName((getCookie("loggedName") as string) || null)
  }, [])

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const trips = await gettripTypes()
        setTripTypes(trips || [])
        const vehicles = await getVehicleTypes()
        setVehicleTypes(vehicles || [])
      } catch (err) {
        console.error("Failed to fetch trip/vehicle types:", err)
      }
    }
    fetchFilters()
  }, [])

  useEffect(() => {
    const fetchVehicles = async () => {
      if (!tripTypeId) return
      setLoading(true)
      try {
        let data: VehiclePrice[] = await getPricesByTripTypeId(tripTypeId)
        if (vehicleTypeId) {
          data = data.filter(v => v.vehicleTypeId === vehicleTypeId)
        }
        setVehicles(data)
      } catch (err) {
        console.error("Failed to fetch vehicle prices:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchVehicles()
  }, [tripTypeId, vehicleTypeId])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    if (!tripTypeId || !pickup || !date || !vehicleTypeId || (tripTypes.find(t => t.id === tripTypeId)?.name !== "Airport" && !destination)) {
      alert("Please fill in all required fields.")
      return
    }

    const query = new URLSearchParams({
      tripTypeId,
      vehicleTypeId,
      pickup,
      destination,
      date
    })

    router.push(`${pathname}?${query.toString()}`)
  }

  const maskAgentName = (name: string) => {
    if (!name) return "Agent: ****";
    const [first, ...rest] = name.split(" ");
    return `${first[0]}****${rest.length ? " " + rest.map(w => w[0] + "***").join(" ") : ""}`;
  };

  const maskPrice = () => "₹****";
  const maskKm = () => "**";

  const renderPriceDetails = (vehicle: VehiclePrice) => {
    if (!accessToken) {
      return (
        <div className="flex flex-col items-start bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-2 w-full">
          <span className="text-sm font-semibold text-gray-700 mb-1">Price</span>
          <span className="text-lg font-bold text-green-700 mb-1">
            {maskPrice()} <span className="text-base font-medium text-gray-700">/km</span>
          </span>
          <span className="text-base text-gray-700 font-semibold">
            Min. {maskKm()} km
          </span>
          <span className="text-xs text-gray-500 mt-2 italic">
            Sign in to unlock exclusive pricing and see full fare details.
          </span>
          <span className="text-xs text-gray-400 mt-1">
            <strong>Note:</strong> Charges may vary. Please discuss with the agent for final pricing.
          </span>
        </div>
      )
    }

    let price = "";
    let minKm = "";
    if (vehicle.tripTypeName === "Local") {
      price = vehicle.localPerKmPrice ? `₹${vehicle.localPerKmPrice}` : "-";
      minKm = vehicle.localMinKm ? `${vehicle.localMinKm}` : "-";
    } else if (vehicle.tripTypeName === "Airport") {
      price = vehicle.airportPrice ? `₹${vehicle.airportPrice}` : "-";
      minKm = "-";
    } else if (vehicle.tripTypeName === "Out Station") {
      price = vehicle.outPerKmPrice ? `₹${vehicle.outPerKmPrice}` : "-";
      minKm = vehicle.outMinKm ? `${vehicle.outMinKm}` : "-";
    }
    return (
      <>
        <div className="flex flex-col items-start bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-2 w-full">
          <span className="text-sm font-semibold text-gray-700 mb-1">Price</span>
          <span className="text-lg font-bold text-green-700 mb-1">
            {price} <span className="text-base font-medium text-gray-700">{vehicle.tripTypeName === "Airport" ? "" : "/km"}</span>
          </span>
          {vehicle.tripTypeName !== "Airport" && (
            <span className="text-base text-gray-700 font-semibold">
              Minimum {minKm} km per booking
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400 mt-1">
          <strong>Note:</strong> Charges may vary. Please discuss with the agent for final pricing.
        </span>
      </>
    )
  }

  const renderAgentName = (name: string) => {
    if (!accessToken) {
      return (
        <>
          <span className="font-medium text-gray-700">{maskAgentName(name)}</span>
          <span className="text-xs text-gray-400 ml-2">Login to view agent</span>
        </>
      )
    }
    return <span className="font-medium text-gray-700">{name}</span>
  }

  const getVehicleImage = (agentVehicleName: string) => {
    const normalized = agentVehicleName?.toLowerCase().replace(/\s+/g, "").trim() || ""
    if (normalized.includes("mini")) return "/images/cars/sedan-car.jpg"
    if (normalized.includes("hatchback")) return "/images/cars/sedan-car.jpg"
    if (normalized.includes("sedan")) return "/images/cars/sedan-car.jpg"
    if (normalized.includes("suv")) return "/images/cars/suv-car.png"
    return "/images/cars/vehicle-placeholder.png"
  }

  // Use shared header like MyBookings
  const onLogout = useCallback(async () => {
    await logout();
    router.push("/login");
  }, [router]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-green-100 via-white to-green-200">
      <Toaster />
      <UserHeader onLogout={onLogout} title="Search Vehicles" />

      {/* SEARCH SECTION - matches landing */}
      <section className="relative z-20 flex flex-col items-center pt-6">
        <Card className="w-full max-w-7xl mx-auto rounded-[2.5rem] shadow-2xl border-0 bg-white/90 backdrop-blur-lg">
          <CardContent className="p-0">
            <form
              onSubmit={handleSearch}
              className="flex flex-col md:flex-row items-center gap-0 md:gap-4"
              style={{
                background:
                  "linear-gradient(90deg, #e0ffe6 0%, #f8fafc 60%, #e0ffe6 100%)",
                borderRadius: "2.5rem",
                boxShadow: "0 8px 32px 0 rgba(34,197,94,0.10)",
                padding: "1.5rem 1.5rem",
                position: "relative",
                top: "-2rem",
                zIndex: 10,
              }}
            >
              {/* Trip Type */}
              <div className="flex flex-col flex-1 min-w-[180px] px-2">
                <label className="mb-2 text-xs font-semibold text-green-700 tracking-widest uppercase">
                  Trip Type
                </label>
                <div className="flex items-center bg-white border-0 rounded-2xl px-3 py-2 shadow-md focus-within:ring-2 focus-within:ring-green-400 transition w-full">
                  <Repeat className="w-5 h-5 text-green-500 mr-2" />
                  <Select value={tripTypeId} onValueChange={setTripTypeId} required>
                    <SelectTrigger className="border-0 focus:ring-0 h-10 text-base bg-transparent font-medium w-full">
                      <SelectValue placeholder="Choose" />
                    </SelectTrigger>
                    <SelectContent className="w-full min-w-[180px]">
                      {tripTypes.map((trip) => (
                        <SelectItem key={trip.id} value={trip.id} className="w-full">
                          {trip.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Pickup */}
              <div className="flex flex-col flex-1 min-w-[180px] px-2">
                <label className="mb-2 text-xs font-semibold text-green-700 tracking-widest uppercase">
                  Pickup
                </label>
                <div className="flex items-center bg-white border-0 rounded-2xl px-3 py-2 shadow-md focus-within:ring-2 focus-within:ring-green-400 transition w-full">
                  <MapPin className="w-5 h-5 text-green-400 mr-2" />
                  <Input
                    type="text"
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    placeholder="Enter pickup location"
                    required
                    className="border-0 focus:ring-0 h-10 text-base bg-transparent font-medium"
                  />
                </div>
              </div>

              {/* Destination (hide if Airport) */}
              {tripTypes.find((t) => t.id === tripTypeId)?.name !== "Airport" && (
                <div className="flex flex-col flex-1 min-w-[180px] px-2">
                  <label className="mb-2 text-xs font-semibold text-green-700 tracking-widest uppercase">
                    Drop
                  </label>
                  <div className="flex items-center bg-white border-0 rounded-2xl px-3 py-2 shadow-md focus-within:ring-2 focus-within:ring-green-400 transition w-full">
                    <MapPin className="w-5 h-5 text-green-400 mr-2" />
                    <Input
                      type="text"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="Destination"
                      required
                      className="border-0 focus:ring-0 h-10 text-base bg-transparent font-medium"
                    />
                  </div>
                </div>
              )}

              {/* Date */}
              <div className="flex flex-col flex-1 min-w-[180px] px-2">
                <label className="mb-2 text-xs font-semibold text-green-700 tracking-widest uppercase">
                  Date
                </label>
                <div className="flex items-center bg-white border-0 rounded-2xl px-3 py-2 shadow-md focus-within:ring-2 focus-within:ring-green-400 transition w-full">
                  <Calendar className="w-5 h-5 text-green-400 mr-2" />
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="border-0 focus:ring-0 h-10 text-base bg-transparent font-medium"
                  />
                </div>
              </div>

              {/* Vehicle Type */}
              <div className="flex flex-col flex-1 min-w-[180px] px-2">
                <label className="mb-2 text-xs font-semibold text-green-700 tracking-widest uppercase">
                  Vehicle
                </label>
                <div className="flex items-center bg-white border-0 rounded-2xl px-3 py-2 shadow-md focus-within:ring-2 focus-within:ring-green-400 transition w-full">
                  <Car className="w-5 h-5 text-green-500 mr-2" />
                  <Select value={vehicleTypeId} onValueChange={setVehicleTypeId} required>
                    <SelectTrigger className="border-0 focus:ring-0 h-10 text-base bg-transparent font-medium w-full">
                      <SelectValue placeholder="Choose" />
                    </SelectTrigger>
                    <SelectContent className="w-full min-w-[180px]">
                      {vehicleTypes.map((v) => (
                        <SelectItem key={v.id} value={v.id} className="w-full">
                          {v.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Search Button */}
              <div className="flex flex-col flex-[0.7] min-w-[140px] px-2 mt-6 md:mt-0">
                <Button
                  type="submit"
                  className="h-12 w-full bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white text-base rounded-2xl shadow-lg font-bold tracking-wide transition-transform hover:scale-105"
                >
                  Search
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>

      {/* Vehicles Heading */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-center mb-12 mt-6"
      >
        <h2 className="text-4xl font-bold text-gray-900 mb-3">Premium Fleet Selection</h2>
        <div className="h-1.5 w-24 bg-gradient-to-r from-green-400 to-green-600 rounded-full mx-auto mb-4"></div>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Choose from our meticulously maintained vehicles tailored to your journey needs
        </p>
      </motion.div>

      {/* Loading State */}
      {loading && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-12"
        >
          <DotLottieReact
            src="https://lottie.host/613a9cab-8f82-4d21-97b2-89a561b65f76/y1uXoMv7cP.lottie"
            autoplay
            loop
            style={{ width: "250px", height: "250px" }}
          />
          <p className="text-xl font-medium text-gray-700 mt-6">
            Finding the perfect vehicles for your journey...
          </p>
        </motion.div>
      )}

      {/* Empty State */}
      {!loading && vehicles.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 bg-white/80 rounded-3xl shadow-lg max-w-4xl mx-auto"
        >
          <motion.div
            className="md:w-1/2 flex justify-center mx-auto"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <DotLottieReact
              src="https://lottie.host/613a9cab-8f82-4d21-97b2-89a561b65f76/y1uXoMv7cP.lottie"
              loop
              autoplay
            />
          </motion.div>
          <p className="text-xl font-medium text-gray-700">No vehicles found for your search criteria</p>
          <p className="text-gray-500 mt-3 max-w-lg mx-auto">Try adjusting your search parameters or contact our support team for personalized assistance.</p>
        </motion.div>
      )}

      {/* Vehicle Cards */}
      <div className="max-w-7xl mx-auto px-4 pb-20 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {vehicles.map((vehicle, index) => (
          <motion.div
            key={vehicle.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card
              className="group shadow-xl rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 h-full flex flex-col"
            >
              <div className="relative">
                <img
                  src={getVehicleImage(vehicle.agentVehicleName || "")}
                  alt={vehicle.agentVehicleName}
                  className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-3 py-1 rounded-full shadow-md">
                  {vehicle.tripTypeName}
                </div>
                <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                  <Users className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-700">
                    {vehicle.seatingCapacity}
                  </span>
                </div>
              </div>
              <CardContent className="flex flex-col gap-3 p-5 flex-grow">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-bold text-lg text-gray-800 group-hover:text-green-700 transition-colors">{vehicle.vehicleName}</h2>
                </div>

                {/* Agent Name */}
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <img
                    src="/images/agent-avatar.png"
                    alt="Agent"
                    className="w-6 h-6 rounded-full border border-gray-200"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/images/avatar-placeholder.png" }}
                  />
                  {renderAgentName(vehicle.agentName)}
                </div>

                <div className="mb-2 flex-grow">{renderPriceDetails(vehicle)}</div>

                <Button 
                  className="mt-2 bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white font-medium w-full flex items-center justify-center gap-2 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg hover:scale-105 group"
                  onClick={() => {
                    if (!accessToken) {
                      router.push("/login?redirect=vehicles");
                      return;
                    }
                    setSelectedVehicle(vehicle);
                    setIsConfirmOpen(true);
                  }}
                >
                  {accessToken ? (
                    <span className="flex items-center justify-center">
                      Book Now
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      Login to Book
                    </span>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      
      {/* Booking Confirmation Modal */}
      <AnimatePresence>
        {isConfirmOpen && selectedVehicle && (
          <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
            <DialogContent className="sm:max-w-xl md:max-w-2xl rounded-xl p-0 overflow-hidden">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                className="p-6"
              >
                <DialogHeader className="pb-4 border-b border-gray-100">
                  <DialogTitle className="text-2xl font-bold text-gray-800">Booking Review</DialogTitle>
                  <DialogDescription className="text-gray-600 text-lg mt-2">
                    Please confirm your booking details for {selectedVehicle.agentVehicleName}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="mt-6 space-y-5">
                  <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
                    <h4 className="font-semibold text-gray-800 text-lg mb-3 flex items-center">
                      <MapPin className="h-5 w-5 text-green-600 mr-2" />
                      Trip Details
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4 text-base">
                      <div className="flex flex-col gap-1">
                        <span className="text-gray-600 font-medium">From:</span>
                        <span className="font-semibold text-gray-800 text-lg">{pickup}</span>
                      </div>
                      {destination && (
                        <div className="flex flex-col gap-1">
                          <span className="text-gray-600 font-medium">To:</span>
                          <span className="font-semibold text-gray-800 text-lg">{destination}</span>
                        </div>
                      )}
                      <div className="flex flex-col gap-1">
                        <span className="text-gray-600 font-medium">Date:</span>
                        <span className="font-semibold text-gray-800 text-lg">{date}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-gray-600 font-medium">Trip Type:</span>
                        <span className="font-semibold text-gray-800 text-lg">{selectedVehicle.tripTypeName}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
                    <h4 className="font-semibold text-gray-800 text-lg mb-3 flex items-center">
                      <Car className="h-5 w-5 text-green-600 mr-2" />
                      Vehicle & Pricing
                    </h4>
                    <div className="space-y-4 text-base">
                      <div className="flex flex-col gap-1">
                        <span className="text-gray-600 font-medium">Vehicle:</span>
                        <span className="font-semibold text-gray-800 text-lg">{selectedVehicle.agentVehicleName}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-gray-600 font-medium">Capacity:</span>
                        <span className="font-semibold text-gray-800 text-lg">{selectedVehicle.seatingCapacity} persons</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-gray-600 font-medium">Price:</span>
                        <span className="font-semibold text-gray-800 text-xl text-green-700">
                          {selectedVehicle.tripTypeName === "Local" ? (
                            <>₹{selectedVehicle.localPerKmPrice}/km <span className="text-gray-600 text-base">(Minimum {selectedVehicle.localMinKm} km)</span></>
                          ) : selectedVehicle.tripTypeName === "Airport" ? (
                            <>₹{selectedVehicle.airportPrice} <span className="text-gray-600 text-base">(Fixed Price)</span></>
                          ) : (
                            <>₹{selectedVehicle.outPerKmPrice}/km <span className="text-gray-600 text-base">(Minimum {selectedVehicle.outMinKm} km)</span></>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-5 rounded-lg border border-green-100">
                    <h4 className="font-semibold text-gray-800 text-lg mb-3 flex items-center">
                      <Check className="h-5 w-5 text-green-600 mr-2" />
                      Booking Summary
                    </h4>
                    <p className="text-gray-700 mb-2">
                      You're about to book a <span className="font-semibold">{selectedVehicle.agentVehicleName}</span> for your trip from <span className="font-semibold">{pickup}</span>{destination ? ` to ${destination}` : ''} on <span className="font-semibold">{date}</span>.
                    </p>
                    <p className="text-gray-700">
                      Please click "Confirm Booking" to proceed with your reservation.
                    </p>
                  </div>
                </div>
                
                {bookingError && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-red-700 text-sm">{bookingError}</p>
                  </div>
                )}
                
                {bookingSuccess && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Check className="h-6 w-6 text-green-500 mr-2" />
                      <h3 className="font-semibold text-green-700">Booking Confirmed!</h3>
                    </div>
                    <p className="text-green-700 text-sm">
                      Your booking has been successfully created. An agent will review your booking and contact you shortly.
                    </p>
                  </div>
                )}
                
                <DialogFooter className="mt-8 flex gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsConfirmOpen(false)}
                    className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg py-6 text-lg"
                    disabled={isBooking}
                  >
                    <X className="mr-2 h-5 w-5" />
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white rounded-lg py-6 text-lg"
                    onClick={async () => {
                      try {
                        setIsBooking(true);
                        setBookingError("");
                        
                        const userId = getCookie("loginId") as string;
                        if (!userId) {
                          throw new Error("User ID not found. Please log in again.");
                        }
                        
                        const formattedDate = new Date(date).toISOString();
                        
                        const bookingData: BookingRequest = {
                          userId,
                          agentVehicleId: selectedVehicle.agentVehicleId,
                          tripTypeId,
                          priceId: selectedVehicle.id,
                          pickupLocation: pickup,
                          dropLocation: destination || "",
                          pickupDateTime: formattedDate
                        };
                        
                        const token = getCookie("accessToken") as string;
                        
                        await createBooking(bookingData, token);
                        
                        setBookingSuccess(true);
                        setShowSuccessModal(true);
                        
                      } catch (error) {
                        console.error("Booking error:", error);                        
                        toast.error("failed to book")
                      } finally {
                        setIsBooking(false);
                      }
                    }}
                    disabled={isBooking || bookingSuccess}
                  >
                    {isBooking ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : bookingSuccess ? (
                      <span className="flex items-center justify-center">
                        <Check className="mr-2 h-5 w-5" />
                        Booking Confirmed
                      </span>
                    ) : (
                      <>
                        <Check className="mr-2 h-5 w-5" />
                        Confirm Booking
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
      <BookingSuccessModal open={showSuccessModal} onClose={() => setShowSuccessModal(false)} />
    </div>
  )
}