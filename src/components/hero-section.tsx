"use client"
import React from "react"
import { DotLottieReact } from "@lottiefiles/dotlottie-react"

export default function HeroBanner() {
  return (
    <section className="w-full bg-white py-24 md:py-32">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between px-6 md:px-12 gap-12">
        
        {/* Left Side */}
        <div className="text-center md:text-left md:w-1/2 space-y-8">
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight">
            Book Your Ride in Seconds
          </h1>
          <p className="text-lg text-gray-600 max-w-md mx-auto md:mx-0">
            Affordable, reliable, and available 24/7. Get your car anytime, anywhere with just a few clicks.
          </p>
          <button className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full shadow-md transition">
            Download App
          </button>
        </div>

        {/* Right Side with .lottie animation */}
        <div className="md:w-1/2 flex justify-center">
          <DotLottieReact
      src="images/Tourists.lottie"
      loop
      autoplay
    />
        </div>
      </div>
    </section>
  )
}
