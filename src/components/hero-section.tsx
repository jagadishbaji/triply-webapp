"use client"

import React from "react"
import { DotLottieReact } from "@lottiefiles/dotlottie-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Car, MapPin, Map, Repeat, CreditCard,Calendar, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
export default function HeroBanner() {
  const steps = [
    {
      title: "Choose Your Trip",
      description: "Select trip type, pickup & drop details, and car preference.",
      icon: <MapPin className="h-8 w-8 text-green-600" />,
    },
    {
      title: "Get Best Prices",
      description: "We compare prices and show you the best available options.",
      icon: <Car className="h-8 w-8 text-green-600" />,
    },
    {
      title: "Book & Ride",
      description: "Confirm your booking securely and enjoy a comfortable ride.",
      icon: <CreditCard className="h-8 w-8 text-green-600" />,
    },
  ]

  const availableCars = [
    { type: "Mini", description: "Affordable rides for short distances", icon: "🚗" },
    { type: "Sedan", description: "Comfortable for city and long drives", icon: "🚘" },
    { type: "SUV", description: "Spacious & powerful for family trips", icon: "🚙" },
    { type: "Tempo Traveller", description: "Perfect for group travel", icon: "🚌" },
  ]

  return (
    <>
      {/* Hero Section */}
      <section className="">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between px-6 md:px-12 gap-12">
          
          {/* Left Content */}
          <motion.div
            className="md:w-1/2 text-center md:text-left space-y-6"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl font-bold text-gray-800 leading-snug">
              Book Your Perfect Ride <br /> Anytime, Anywhere 🚖
            </h1>
            <p className="text-lg text-gray-600">
              Fast, reliable, and affordable car rentals for your every journey. Choose your ride and get started in just a few clicks.
            </p>
            <Button size="lg" className="bg-green-600 hover:bg-green-700">
              Get Started
            </Button>
          </motion.div>

          {/* Right Animation */}
          <motion.div
            className="md:w-1/2 flex justify-center"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <DotLottieReact
              width={350}
              height={300}
              src="https://lottie.host/7e0a9dc3-fc78-4753-89a3-e882ddd5dfdc/MCnY92gelA.lottie"
              loop
              autoplay
            />
          </motion.div>
        </div>
      </section>

   


      
    </>
  )
}
