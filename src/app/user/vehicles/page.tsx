"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DollarSign, Users, MapPin, Calendar, Repeat, Car } from "lucide-react"

// Services
import { getPricesByTripTypeId } from "@/services/prices/pricesService"
import { gettripTypes } from "@/services/admin/tripTypesService"
import { getVehicleTypes } from "@/services/admin/vehicleTypesService"

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

  const renderPriceDetails = (vehicle: VehiclePrice) => {
    if (vehicle.tripTypeName.toLowerCase() === "local") {
      return (
        <div className="text-sm text-gray-700 space-y-1">
          <span>🚖 Min Km: {vehicle.localMinKm}</span>
          <span className="block">💰 Per Km: ₹{vehicle.localPerKmPrice}</span>
        </div>
      )
    }
    if (vehicle.tripTypeName.toLowerCase() === "outstation") {
      return (
        <div className="text-sm text-gray-700 space-y-1">
          <span>🚘 Min Km: {vehicle.outMinKm}</span>
          <span className="block">💰 Per Km: ₹{vehicle.outPerKmPrice}</span>
        </div>
      )
    }
    if (vehicle.tripTypeName.toLowerCase() === "airport") {
      return <span className="text-sm text-gray-700">✈️ Price: ₹{vehicle.airportPrice}</span>
    }
    return <span className="text-gray-500">Price not available</span>
  }

 // ✅ vehicle name → image mapping (using agentVehicleName now)
const getVehicleImage = (agentVehicleName: string) => {
  const normalized = agentVehicleName?.toLowerCase().replace(/\s+/g, "").trim() || ""

  if (normalized.includes("mini")) return "/images/cars/mini-car.png"
  if (normalized.includes("hatchback")) return "/images/cars/hatchback-car.png"
  if (normalized.includes("sedan")) return "/images/cars/sedan-car.png"
  if (normalized.includes("suv")) return "/images/cars/suv-car.png"

  return "/images/cars/vehicle-placeholder.png"
}

  return (
    <div className="max-w-7xl mx-auto py-12 px-4">
      {/* Editable Search Bar */}
      <Card className="mb-10 shadow-md rounded-xl">
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
            {/* Trip Type */}
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-gray-700">Trip Type</label>
              <div className="flex items-center border rounded-lg px-2 py-1 bg-white">
                <Repeat className="w-4 h-4 text-gray-400 mr-1" />
                <Select value={tripTypeId} onValueChange={setTripTypeId} required>
                  <SelectTrigger className="border-0 focus:ring-0 h-9 text-sm">
                    <SelectValue placeholder="Choose" />
                  </SelectTrigger>
                  <SelectContent>
                    {tripTypes.map((trip) => (
                      <SelectItem key={trip.id} value={trip.id}>
                        {trip.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Pickup */}
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-gray-700">Pickup</label>
              <div className="flex items-center border rounded-lg px-2 py-1 bg-white">
                <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                <Input
                  type="text"
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  placeholder="Pickup"
                  required
                  className="border-0 focus:ring-0 h-9 text-sm"
                />
              </div>
            </div>

            {/* Destination (hide if Airport) */}
            {tripTypes.find(t => t.id === tripTypeId)?.name !== "Airport" && (
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">Drop</label>
                <div className="flex items-center border rounded-lg px-2 py-1 bg-white">
                  <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                  <Input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Destination"
                    required
                    className="border-0 focus:ring-0 h-9 text-sm"
                  />
                </div>
              </div>
            )}

            {/* Date */}
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-gray-700">Date</label>
              <div className="flex items-center border rounded-lg px-2 py-1 bg-white">
                <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="border-0 focus:ring-0 h-9 text-sm"
                />
              </div>
            </div>

            {/* Vehicle Type */}
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-gray-700">Vehicle</label>
              <div className="flex items-center border rounded-lg px-2 py-1 bg-white">
                <Car className="w-4 h-4 text-gray-400 mr-1" />
                <Select value={vehicleTypeId} onValueChange={setVehicleTypeId} required>
                  <SelectTrigger className="border-0 focus:ring-0 h-9 text-sm">
                    <SelectValue placeholder="Choose" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleTypes.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Search Again */}
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-transparent">Search</label>
              <Button
                type="submit"
                className="h-9 px-6 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg"
              >
                Search
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <h1 className="text-3xl font-extrabold mb-8 text-gray-800">🚗 Available Vehicles</h1>

      {/* Loader */}
      {loading && <p className="text-center text-gray-500">Fetching vehicles...</p>}

      {/* Empty State */}
      {!loading && vehicles.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <img
            src="/images/no-vehicles.png"
            alt="No vehicles"
            className="w-64 h-64 object-contain mb-6"
          />
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
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-lg text-gray-800">{vehicle.vehicleName}</h2>
                <div className="flex items-center gap-1 text-gray-600">
                  <Users className="w-5 h-5" /> {vehicle.seatingCapacity}
                </div>
              </div>

              {renderPriceDetails(vehicle)}

              <Button className="mt-4 bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white font-medium w-full flex items-center justify-center gap-2 rounded-xl">
                <DollarSign className="w-4 h-4" /> Book Now
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
