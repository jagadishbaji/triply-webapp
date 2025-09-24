"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Car, MapPin, Repeat, Calendar } from "lucide-react"
import Navbar from "@/components/navbar"
import HeroBanner from "@/components/hero-section"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AvailableVehicles } from "@/components/available-Vehicles"

// 🔹 Import your services
import { gettripTypes } from "@/services/admin/tripTypesService"
import { getVehicleTypes } from "@/services/admin/vehicleTypesService"

export default function LandingPage() {
  const [tripTypes, setTripTypes] = useState<any[]>([])
  const [vehicleTypes, setVehicleTypes] = useState<any[]>([])

  const [tripTypeId, setTripTypeId] = useState("")
  const [tripTypeName, setTripTypeName] = useState("") 
  const [vehicleTypeId, setVehicleTypeId] = useState("")
  const [vehicleTypeName, setVehicleTypeName] = useState("") 
  const [pickup, setPickup] = useState("")
  const [destination, setDestination] = useState("")
  const [date, setDate] = useState("")

  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    // ✅ Validation (skip destination if Airport)
    if (!tripTypeId || !pickup || !date || !vehicleTypeId || (tripTypeName !== "Airport" && !destination)) {
      alert("Please fill in all required fields before searching.")
      return
    }

    // ✅ Pass both IDs and names in query string
    router.push(
      `/user/vehicles?tripTypeId=${tripTypeId}&tripTypeName=${encodeURIComponent(tripTypeName)}&vehicleTypeId=${vehicleTypeId}&vehicleTypeName=${encodeURIComponent(vehicleTypeName)}&pickup=${encodeURIComponent(pickup)}&destination=${encodeURIComponent(destination)}&date=${encodeURIComponent(date)}`
    )
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const trips = await gettripTypes()
        setTripTypes(trips || [])

        const vehicles = await getVehicleTypes()
        setVehicleTypes(vehicles || [])
      } catch (err) {
        console.error("Failed to fetch trip/vehicle types:", err)
      }
    }
    fetchData()
  }, [])

  return (
    <>
      <Navbar />
      <HeroBanner />

      {/* SEARCH FORM */}
      <section className="relative w-full py-20 bg-white">
        <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 w-full max-w-7xl">
          <Card className="p-8 shadow-2xl rounded-4xl bg-white">
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  
                  {/* Trip Type */}
                  <div className="flex flex-col">
                    <label className="text-gray-700 mb-2 font-medium">Trip Type</label>
                    <div className="flex items-center border rounded-xl px-4 py-3 bg-white">
                      <Repeat className="w-5 h-5 text-gray-400 mr-2" />
                      <Select
                        onValueChange={(val) => {
                          setTripTypeId(val)
                          const selected = tripTypes.find((t) => t.id === val)
                          setTripTypeName(selected?.name || "")
                        }}
                        required
                      >
                        <SelectTrigger className="border-0 focus:ring-0 text-lg">
                          <SelectValue placeholder="Choose trip type" />
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
                    <label className="text-gray-700 mb-2 font-medium">Pickup</label>
                    <div className="flex items-center border rounded-xl px-4 py-3 bg-white">
                      <MapPin className="w-5 h-5 text-gray-400 mr-2" />
                      <Input
                        type="text"
                        placeholder="Enter pickup location"
                        value={pickup}
                        onChange={(e) => setPickup(e.target.value)}
                        required
                        className="border-0 focus:ring-0 text-lg"
                      />
                    </div>
                  </div>

                  {/* Destination (hide if Airport) */}
                  {tripTypeName !== "Airport" && (
                    <div className="flex flex-col">
                      <label className="text-gray-700 mb-2 font-medium">Destination</label>
                      <div className="flex items-center border rounded-xl px-4 py-3 bg-white">
                        <MapPin className="w-5 h-5 text-gray-400 mr-2" />
                        <Input
                          type="text"
                          placeholder="Enter destination"
                          value={destination}
                          onChange={(e) => setDestination(e.target.value)}
                          required={tripTypeName !== "Airport"}
                          className="border-0 focus:ring-0 text-lg"
                        />
                      </div>
                    </div>
                  )}

                  {/* Date */}
                  <div className="flex flex-col">
                    <label className="text-gray-700 mb-2 font-medium">Date</label>
                    <div className="flex items-center border rounded-xl px-4 py-3 bg-white">
                      <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                      <Input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                        className="border-0 focus:ring-0 text-lg"
                      />
                    </div>
                  </div>

                  {/* Vehicle Type */}
                  <div className="flex flex-col">
                    <label className="text-gray-700 mb-2 font-medium">Vehicle Type</label>
                    <div className="flex items-center border rounded-xl px-4 py-3 bg-white">
                      <Car className="w-5 h-5 text-gray-400 mr-2" />
                      <Select
                        onValueChange={(val) => {
                          setVehicleTypeId(val)
                          const selected = vehicleTypes.find((v) => v.id === val)
                          setVehicleTypeName(selected?.name || "")
                        }}
                        required
                      >
                        <SelectTrigger className="border-0 focus:ring-0 text-lg">
                          <SelectValue placeholder="Choose vehicle" />
                        </SelectTrigger>
                        <SelectContent>
                          {vehicleTypes.map((vehicle) => (
                            <SelectItem key={vehicle.id} value={vehicle.id}>
                              {vehicle.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Search Button */}
                <div className="text-center">
                  <Button
                    type="submit"
                    className="w-1/3 py-3 text-base rounded-lg bg-green-600 hover:bg-green-700"
                  >
                    Search Ride
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      <AvailableVehicles />
    </>
  )
}
