"use client"

import React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Car, MapPin, Repeat, Calendar, ArrowRight } from "lucide-react"
import Navbar from "@/components/navbar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AvailableVehicles } from "@/components/available-Vehicles"
import { motion } from "framer-motion"
import { DotLottieReact } from "@lottiefiles/dotlottie-react"
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
  interface VehicleItem {
    id: string;
    title: string;
    description: string;
    image: string;
  }
  const vehicles: VehicleItem[] = [
    {
      id: "mini",
      title: "Mini",
      description: "Affordable rides for quick city travel.",
      image: "/images/cars/mini-car.png",
    },
    {
      id: "sedan",
      title: "Sedan",
      description: "Comfortable rides for everyday journeys.",
      image: "/images/cars/sedan-car.jpg",
    },
    {
      id: "suv",
      title: "SUV",
      description: "Spacious and strong rides for long trips.",
      image: "/images/cars/suv-car.png",
    },
    {
      id: "tempo",
      title: "Tempo Traveller",
      description: "Perfect for family and group travel.",
      image: "/images/cars/TT.jpg",
    },
  ];
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!tripTypeId || !pickup || !date || !vehicleTypeId || (tripTypeName !== "Airport" && !destination)) {
      alert("Please fill in all required fields before searching.")
      return
    }
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
      {/* HERO + SEARCH SECTION TOGETHER */}
      <section className="relative w-full min-h-[90vh] bg-gradient-to-br from-green-100 via-white to-green-200 overflow-hidden flex flex-col justify-center">
        {/* Decorative Blobs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-green-200 rounded-full opacity-30 blur-3xl z-0" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-green-400 rounded-full opacity-20 blur-3xl z-0" />
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between px-6 md:px-12 gap-12 relative z-10 py-10 md:py-20">
          {/* Left Content */}
          <motion.div
            className="md:w-1/2 text-center md:text-left space-y-8"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block bg-gradient-to-r from-green-400 to-green-700 text-white px-4 py-1 rounded-full text-xs font-semibold shadow mb-2 tracking-widest uppercase">
              Your Journey Starts Here
            </span>
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight drop-shadow-lg">
              Book Your Perfect Ride <br />
              <span className="bg-gradient-to-r from-green-500 to-green-700 bg-clip-text text-transparent">
                Anytime, Anywhere
              </span>
            </h1>
            <p className="text-xl text-gray-700 max-w-xl">
              Fast, reliable, and affordable car rentals for every journey.<br />
              <span className="text-green-700 font-semibold">
                Choose your ride and get started in just a few clicks.
              </span>
            </p>
            <div className="flex flex-row gap-4 mt-6 justify-center md:justify-start">
              <div className="flex items-center gap-2">
                <Car className="w-7 h-7 text-green-600" />
                <span className="text-lg font-semibold text-green-700">Wide Range of Vehicles</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-6 h-6 text-green-500" />
                <span className="text-lg font-semibold text-green-700">Flexible Booking</span>
              </div>
            </div>
          </motion.div>
          {/* Right Animation - Modern Lottie */}
          <motion.div
            className="md:w-1/2 flex justify-center"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="rounded-3xl shadow-2xl bg-white/70 p-4 flex flex-col items-center">
              <DotLottieReact
                width={370}
                height={320}
                src="https://lottie.host/7e0a9dc3-fc78-4753-89a3-e882ddd5dfdc/MCnY92gelA.lottie"
                loop
                autoplay
              />

            </div>
          </motion.div>
        </div>
        {/* SEARCH SECTION OVERLAYS HERO */}
        <div className="relative z-20 flex flex-col items-center -mt-12">
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
                  padding: "1.5rem 1.5rem", // Reduced vertical and horizontal padding
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
                    <Select
                      onValueChange={(val) => {
                        setTripTypeId(val)
                        const selected = tripTypes.find((t) => t.id === val)
                        setTripTypeName(selected?.name || "")
                      }}
                      required
                    >
                      <SelectTrigger className="border-0 focus:ring-0 h-10 text-base bg-transparent font-medium w-full">
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
                <div className="flex flex-col flex-1 min-w-[180px] px-2">
                  <label className="mb-2 text-xs font-semibold text-green-700 tracking-widest uppercase">
                    Pickup
                  </label>
                  <div className="flex items-center bg-white border-0 rounded-2xl px-3 py-2 shadow-md focus-within:ring-2 focus-within:ring-green-400 transition w-full">
                    <Input
                      type="text"
                      placeholder="Pickup location"
                      value={pickup}
                      onChange={(e) => setPickup(e.target.value)}
                      required
                      className="border-0 focus:ring-0 h-10 text-base bg-transparent font-medium w-full"
                    />
                  </div>
                </div>

                {/* Destination (hide if Airport) */}
                {tripTypeName !== "Airport" && (
                  <div className="flex flex-col flex-1 min-w-[180px] px-2">
                    <label className="mb-2 text-xs font-semibold text-green-700 tracking-widest uppercase">
                      Drop
                    </label>
                    <div className="flex items-center bg-white border-0 rounded-2xl px-3 py-2 shadow-md focus-within:ring-2 focus-within:ring-green-400 transition w-full">
                      <Input
                        type="text"
                        placeholder="Destination"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        required={tripTypeName !== "Airport"}
                        className="border-0 focus:ring-0 h-10 text-base bg-transparent font-medium w-full"
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
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className="border-0 focus:ring-0 h-10 text-base bg-transparent font-medium w-full"
                    />
                  </div>
                </div>

                {/* Vehicle Type */}
                <div className="flex flex-col flex-1 min-w-[180px] px-2">
                  <label className="mb-2 text-xs font-semibold text-green-700 tracking-widest uppercase">
                    Vehicle
                  </label>
                  <div className="flex items-center bg-white border-0 rounded-2xl px-3 py-2 shadow-md focus-within:ring-2 focus-within:ring-green-400 transition w-full">
                    <Select
                      onValueChange={(val) => {
                        setVehicleTypeId(val)
                        const selected = vehicleTypes.find((v) => v.id === val)
                        setVehicleTypeName(selected?.name || "")
                      }}
                      required
                    >
                      <SelectTrigger className="border-0 focus:ring-0 h-10 text-base bg-transparent font-medium w-full">
                        <SelectValue placeholder="Choose" />
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
        </div>
      </section>
<AvailableVehicles></AvailableVehicles>
      {/* ENHANCED AVAILABLE VEHICLES SECTION */}
      <section className="py-20 bg-gradient-to-br from-green-50 via-white to-green-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-10">
             <span className="hidden md:inline-block flex-1 h-1 bg-gradient-to-r from-green-200 via-green-500 to-green-500 rounded-full ml-4"></span>
             <h2 className="text-3xl md:text-4xl font-extrabold text-gray-800 tracking-tight drop-shadow-sm">
              Available Vehicles
            </h2>
            <span className="hidden md:inline-block flex-1 h-1 bg-gradient-to-r from-green-500 via-green-200 to-transperent rounded-full ml-4"></span>
          </div>
          <p className="text-muted-foreground mb-12 text-lg text-center max-w-2xl mx-auto">
            Choose from our wide range of vehicles to fit your journey.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {vehicles.map((vehicle) => (
              <Card
                key={vehicle.id}
                className="bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border-0 group relative overflow-hidden"
              >
                {/* Decorative badge */}
                <span className="absolute top-5 left-5 bg-gradient-to-br from-green-400 to-green-700 text-white px-4 py-1 rounded-full text-xs font-semibold shadow group-hover:scale-110 transition-transform z-10">
                  {vehicle.title}
                </span>
                <CardHeader className="p-0">
                  <div className="flex justify-center items-center bg-gradient-to-br from-green-100 to-green-200 rounded-t-3xl h-48">
                    <img
                      src={vehicle.image}
                      alt={vehicle.title}
                      className="h-32 w-auto object-contain drop-shadow-xl transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                </CardHeader>
                <CardContent className="text-center px-6 pb-8 pt-4">
                  <CardTitle className="text-2xl font-bold text-gray-800 mb-2">
                    {vehicle.title}
                  </CardTitle>
                  <CardDescription className="mt-2 text-gray-600 text-base min-h-[48px]">
                    {vehicle.description}
                  </CardDescription>
                  <Button
                    variant="outline"
                    className="mt-6 border-green-500 text-green-700 font-semibold rounded-xl px-6 py-2 hover:bg-green-50 transition"
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-800 tracking-tight text-center mb-10">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="flex flex-col items-center text-center p-8 bg-gradient-to-br from-green-50 to-green-100 rounded-3xl shadow-lg">
              <span className="inline-flex items-center justify-center bg-gradient-to-br from-green-400 to-green-700 text-white rounded-full w-16 h-16 shadow-lg mb-4">
                <Repeat className="w-8 h-8" />
              </span>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Choose Your Trip</h3>
              <p className="text-gray-600">
                Select your trip type, pickup, drop, date, and vehicle as per your needs.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-8 bg-gradient-to-br from-green-50 to-green-100 rounded-3xl shadow-lg">
              <span className="inline-flex items-center justify-center bg-gradient-to-br from-green-400 to-green-700 text-white rounded-full w-16 h-16 shadow-lg mb-4">
                <Calendar className="w-8 h-8" />
              </span>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Book Instantly</h3>
              <p className="text-gray-600">
                Get instant confirmation and transparent pricing. No hidden charges.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-8 bg-gradient-to-br from-green-50 to-green-100 rounded-3xl shadow-lg">
              <span className="inline-flex items-center justify-center bg-gradient-to-br from-green-400 to-green-700 text-white rounded-full w-16 h-16 shadow-lg mb-4">
                <Car className="w-8 h-8" />
              </span>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Enjoy Your Ride</h3>
              <p className="text-gray-600">
                Sit back and relax while we take you to your destination safely and comfortably.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* DOWNLOAD APP SECTION */}
      <section className="py-20 bg-gradient-to-br from-green-100 via-white to-green-200">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-800 tracking-tight mb-4">
              Download Our App
            </h2>
            <p className="text-lg text-gray-700 mb-6">
              Book rides, track your bookings, and get exclusive offers on our mobile app.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <a
                href="#"
                className="inline-flex items-center bg-black text-white px-6 py-3 rounded-xl font-semibold shadow hover:scale-105 transition"
              >
                <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M17.564 13.271c-.026-2.637 2.151-3.898 2.247-3.957-1.226-1.789-3.134-2.034-3.805-2.057-1.617-.163-3.162.949-3.985.949-.823 0-2.081-.927-3.426-.902-1.759.026-3.382 1.021-4.283 2.591-1.833 3.176-.468 7.872 1.312 10.453.872 1.26 1.908 2.678 3.273 2.627 1.313-.052 1.807-.849 3.395-.849 1.588 0 2.027.849 3.426.823 1.419-.026 2.308-1.282 3.177-2.545.623-.911.872-1.37 1.367-2.404-3.591-1.369-3.448-4.043-3.422-4.141zm-3.253-12.271c-.072 0-.146.005-.22.016-1.011.145-2.073.728-2.747 1.583-.597.755-1.122 1.963-.922 3.117 1.089.042 2.217-.617 2.899-1.478.613-.771 1.09-1.978.99-3.238z" /></svg>
                App Store
              </a>
              <a
                href="#"
                className="inline-flex items-center bg-green-600 text-white px-6 py-3 rounded-xl font-semibold shadow hover:scale-105 transition"
              >
                <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M3.654 1.328c-.197.197-.197.516 0 .713l16.604 16.604c.197.197.516.197.713 0 .197-.197.197-.516 0-.713l-16.604-16.604c-.197-.197-.516-.197-.713 0zm2.646 2.646l2.646 2.646-2.646 2.646-2.646-2.646 2.646-2.646zm13.354 13.354l-2.646-2.646 2.646-2.646 2.646 2.646-2.646 2.646zm-7.646-7.646l2.646 2.646-2.646 2.646-2.646-2.646 2.646-2.646zm-2.646 2.646l-2.646 2.646-2.646-2.646 2.646-2.646 2.646 2.646zm13.354 13.354l-2.646-2.646 2.646-2.646 2.646 2.646-2.646 2.646z" /></svg>
                Google Play
              </a>
            </div>
          </div>
          <div className="flex-1 flex justify-center">
            <img
              src="/images/app-mockup.png"
              alt="Triply Cars App"
              className="w-72 md:w-96 rounded-3xl shadow-2xl border-4 border-white"
            />
          </div>
        </div>
      </section>

      {/* ABOUT US SECTION */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-800 tracking-tight mb-6">
            About Us
          </h2>
          <p className="text-lg text-gray-700 mb-8">
            Triply Cars is dedicated to making your travel experience seamless, affordable, and enjoyable. With a wide range of vehicles, transparent pricing, and a commitment to customer satisfaction, we are your trusted partner for every journey.
          </p>
          <div className="flex flex-col md:flex-row gap-8 justify-center">
            <div className="flex-1 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-lg p-8">
              <h3 className="text-xl font-bold text-green-700 mb-2">Our Mission</h3>
              <p className="text-gray-600">
                To provide safe, reliable, and affordable transportation solutions for everyone, everywhere.
              </p>
            </div>
            <div className="flex-1 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-lg p-8">
              <h3 className="text-xl font-bold text-green-700 mb-2">Why Choose Us?</h3>
              <ul className="text-gray-600 list-disc list-inside text-left space-y-2">
                <li>Wide range of vehicles for every need</li>
                <li>Transparent pricing, no hidden charges</li>
                <li>24/7 customer support</li>
                <li>Easy booking and cancellation</li>
                <li>Trusted by thousands of happy customers</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
