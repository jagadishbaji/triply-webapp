"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Car, MapPin, Repeat, Calendar } from "lucide-react"
import Navbar from "@/components/navbar"
import HeroBanner from "@/components/hero-section"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AvailableVehicles } from "@/components/available-Vehicles"

// 🔹 Import your services
import {gettripTypes} from "@/services/admin/tripTypesService"
import {getVehicleTypes} from "@/services/admin/vehicleTypesService"

export default function LandingPage() {
  const [tripTypes, setTripTypes] = useState<any[]>([])
  const [vehicleTypes, setVehicleTypes] = useState<any[]>([])

  // Fetch data when page loads
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
              <form className="space-y-6">
                {/* Fields in one horizontal row */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">

                  {/* Trip Type */}
                  <div className="flex flex-col">
                    <label className="text-gray-700 mb-2 font-medium">Trip Type</label>
                    <div className="flex items-center border rounded-xl px-4 py-3 bg-white">
                      <Repeat className="w-5 h-5 text-gray-400 mr-2" />
                      <Select>
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
                        className="border-0 focus:ring-0 text-lg"
                      />
                    </div>
                  </div>

                  {/* Destination */}
                  <div className="flex flex-col">
                    <label className="text-gray-700 mb-2 font-medium">Destination</label>
                    <div className="flex items-center border rounded-xl px-4 py-3 bg-white">
                      <MapPin className="w-5 h-5 text-gray-400 mr-2" />
                      <Input
                        type="text"
                        placeholder="Enter destination"
                        className="border-0 focus:ring-0 text-lg"
                      />
                    </div>
                  </div>

                  {/* Date */}
                  <div className="flex flex-col">
                    <label className="text-gray-700 mb-2 font-medium">Date</label>
                    <div className="flex items-center border rounded-xl px-4 py-3 bg-white">
                      <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                      <Input type="date" className="border-0 focus:ring-0 text-lg" />
                    </div>
                  </div>

                  {/* Vehicle Type */}
                  <div className="flex flex-col">
                    <label className="text-gray-700 mb-2 font-medium">Vehicle Type</label>
                    <div className="flex items-center border rounded-xl px-4 py-3 bg-white">
                    
                      <Select>
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

                {/* Medium Search Button */}
                <div className="text-center">
                  <Button className="w-1/3 py-3 text-base rounded-lg bg-green-600 hover:bg-green-700">
                    Search Ride
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Available vehicles */}
      <AvailableVehicles />
    </>
  )
}
