"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DollarSign, Users, MapPin, Calendar, Repeat, Car, LogOut, User, ClipboardList } from "lucide-react"
import Link from "next/link"
import { getCookie } from "cookies-next"

// Services
import { getPricesByTripTypeId } from "@/services/prices/pricesService"
import { gettripTypes } from "@/services/admin/tripTypesService"
import { getVehicleTypes } from "@/services/admin/vehicleTypesService"
import { logout } from "@/services/authService"

import { DotLottieReact } from "@lottiefiles/dotlottie-react"
import { motion } from "framer-motion"

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
  const [loading, setLoading] = useState(false)

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

  useEffect(() => {
    setAccessToken(getCookie("accessToken") as string || null)
    setLoginId(getCookie("loginId") as string || null)
    setLoggedName(getCookie("loggedName") as string || null)
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

  // ✅ Handle search again
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

  // Masking function for agent name
  const maskAgentName = (name: string) => {
    if (!name) return "Agent: ****";
    const [first, ...rest] = name.split(" ");
    return `${first[0]}****${rest.length ? " " + rest.map(w => w[0] + "***").join(" ") : ""}`;
  };

  // Masking function for price
  const maskPrice = () => "₹****";

  // Masking function for km
  const maskKm = () => "**";

  // Show price details based on login
  const renderPriceDetails = (vehicle: VehiclePrice) => {
    if (!accessToken) {
      // Masked for not-logged-in users
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

    // Show actual price details for logged-in users
    let price = "";
    let minKm = "";
    if (vehicle.tripTypeName === "Local") {
      price = vehicle.localPerKmPrice ? `₹${vehicle.localPerKmPrice}` : "-";
      minKm = vehicle.localMinKm ? `${vehicle.localMinKm}` : "-";
    } else if (vehicle.tripTypeName === "Airport") {
      price = vehicle.airportPrice ? `₹${vehicle.airportPrice}` : "-";
      minKm = "-";
    } else if (vehicle.tripTypeName === "Outstation") {
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
      <span className="text-xs text-black-400 mt-1">
          <strong>Note:</strong> Charges may vary. Please discuss with the agent for final pricing.
        </span>
      </>
    )
  }

  // Show agent name based on login
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

  // vehicle name → image mapping (using agentVehicleName now)
  const getVehicleImage = (agentVehicleName: string) => {
    const normalized = agentVehicleName?.toLowerCase().replace(/\s+/g, "").trim() || ""
    if (normalized.includes("mini")) return "/images/cars/sedan-car.jpg"
    if (normalized.includes("hatchback")) return "/images/cars/sedan-car.jpg"
    if (normalized.includes("sedan")) return "/images/cars/sedan-car.jpg"
    if (normalized.includes("suv")) return "/images/cars/suv-car.png"
    return "/images/cars/vehicle-placeholder.png"
  }

  // Header enhancement
  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-4">
      {/* Enhanced Site Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md shadow-lg rounded-2xl mb-10">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
          Triply Cars
        </h1>
        <div className="flex items-center gap-4">
          {accessToken ? (
            <>
              <Link href="/user/bookings">
                <Button variant="ghost" className="gap-2 text-green-700 hover:bg-green-50 rounded-xl font-semibold">
                  <ClipboardList className="w-5 h-5" />
                  My Bookings
                </Button>
              </Link>
              <Link href="/user/profile">
                <Button variant="ghost" className="gap-2 text-green-700 hover:bg-green-50 rounded-xl font-semibold">
                  <User className="w-5 h-5" />
                  Profile
                </Button>
              </Link>
              <Button
                variant="ghost"
                className="gap-2 text-green-700 hover:text-white hover:bg-gradient-to-r hover:from-green-500 hover:to-green-700 font-semibold rounded-xl transition"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="outline" className="rounded-xl border-green-500 text-green-700 font-semibold">
                  Login
                </Button>
              </Link>
              <Link href="/user-signup">
                <Button className="bg-gradient-to-r from-green-500 to-green-700 text-white rounded-xl font-semibold">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Editable Search Bar */}
      <Card className="mb-12 border-0 bg-white/80 shadow-2xl rounded-[2.5rem]">
        <CardContent className="p-0">
          <form
            onSubmit={handleSearch}
            className="flex flex-col md:flex-row items-center gap-0 md:gap-4"
            style={{
              background:
                "linear-gradient(90deg, #e0ffe6 0%, #f8fafc 60%, #e0ffe6 100%)",
              borderRadius: "2.5rem",
              boxShadow: "0 8px 32px 0 rgba(34,197,94,0.12)",
              padding: "2.5rem 2rem",
              position: "relative",
              top: "-2rem",
              zIndex: 10,
            }}
          >
            {/* Trip Type */}
            <div className="flex flex-col w-full md:w-1/5 px-2">
              <label className="mb-2 text-xs font-semibold text-green-700 tracking-widest uppercase">
                Trip Type
              </label>
              <div className="flex items-center bg-gradient-to-r from-green-50 to-green-100 border-0 rounded-2xl px-3 py-2 shadow-md w-full">
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
            <div className="flex flex-col w-full md:w-1/5 px-2">
              <label className="mb-2 text-xs font-semibold text-green-700 tracking-widest uppercase">
                Pickup
              </label>
              <div className="flex items-center bg-white border-0 rounded-2xl px-3 py-2 shadow-md focus-within:ring-2 focus-within:ring-green-400 transition">
                <MapPin className="w-5 h-5 text-green-400 mr-2" />
                <Input
                  type="text"
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  placeholder="Pickup location"
                  required
                  className="border-0 focus:ring-0 h-10 text-base bg-transparent font-medium"
                />
              </div>
            </div>

            {/* Destination (hide if Airport) */}
            {tripTypes.find((t) => t.id === tripTypeId)?.name !== "Airport" && (
              <div className="flex flex-col w-full md:w-1/5 px-2">
                <label className="mb-2 text-xs font-semibold text-green-700 tracking-widest uppercase">
                  Drop
                </label>
                <div className="flex items-center bg-white border-0 rounded-2xl px-3 py-2 shadow-md focus-within:ring-2 focus-within:ring-green-400 transition">
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
            <div className="flex flex-col w-full md:w-1/5 px-2">
              <label className="mb-2 text-xs font-semibold text-green-700 tracking-widest uppercase">
                Date
              </label>
              <div className="flex items-center bg-white border-0 rounded-2xl px-3 py-2 shadow-md focus-within:ring-2 focus-within:ring-green-400 transition">
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
            <div className="flex flex-col w-full md:w-1/5 px-2">
              <label className="mb-2 text-xs font-semibold text-green-700 tracking-widest uppercase">
                Vehicle
              </label>
              <div className="flex items-center bg-gradient-to-r from-green-50 to-green-100 border-0 rounded-2xl px-3 py-2 shadow-md w-full">
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
            <div className="flex flex-col w-full md:w-32 px-2 mt-6 md:mt-0">
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

      {/* Enhanced Available Vehicles Heading */}
      <div className="flex items-center gap-4 mb-10">
        <span className="hidden md:inline-block flex-1 h-1 bg-gradient-to-r from-green-250 via-green-250 to-green-400 rounded-full ml-4"></span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 tracking-tight drop-shadow-sm">
          Available Vehicles
        </h1>
        <span className="hidden md:inline-block flex-1 h-1 bg-gradient-to-r from-green-400 via-green-250 to-transparent rounded-full ml-4"></span>
      </div>

      {/* Loader */}
      {loading && <p className="text-center text-gray-500">Fetching vehicles...</p>}

      {/* Empty State */}
      {!loading && vehicles.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <motion.div
            className="md:w-1/2 flex justify-center"
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
          <p className="text-lg font-medium text-gray-600">No vehicles found for your search</p>
          <p className="text-sm text-gray-500">Try adjusting your filters and search again.</p>
        </div>
      )}

      {/* Vehicle Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {vehicles.map(vehicle => (
          <Card
            key={vehicle.id}
            className="group shadow-lg rounded-2xl overflow-hidden hover:shadow-2xl transition-shadow"
          >
            <div className="relative">
              <img
                src={getVehicleImage(vehicle.agentVehicleName || "")}
                alt={vehicle.agentVehicleName}
                className="w-full h-44 object-cover group-hover:scale-105 transition-transform"
              />
              <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-3 py-1 rounded-full shadow-md">
                {vehicle.tripTypeName}
              </div>
            </div>
            <CardContent className="flex flex-col gap-3 p-5">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-bold text-lg text-gray-800 group-hover:text-green-700 transition-colors">{vehicle.vehicleName}</h2>
                <div className="flex items-center gap-1 text-gray-600 bg-gray-100 px-2 py-1 rounded-full text-xs">
                  <Users className="w-4 h-4" /> {vehicle.seatingCapacity}
                </div>
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

              <div className="mb-2">{renderPriceDetails(vehicle)}</div>

              <Button className="mt-2 bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white font-medium w-full flex items-center justify-center gap-2 rounded-xl shadow-md transition-transform hover:scale-105">
                Book Now
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
