"use client"

import { Button } from "@/components/ui/button"
import { Car } from "lucide-react"
import Link from "next/link"

export default function Navbar() {
  return (
    <header className="w-full bg-white/80 backdrop-blur-md shadow-lg fixed top-0 left-0 z-30 transition-all">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-20">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          
          <span className="font-extrabold text-2xl text-gray-900 group-hover:text-green-700 tracking-tight transition-colors">
            Triply Cars
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex gap-8 font-semibold text-lg">
          <a href="#services" className="hover:text-green-600 transition-colors">Services</a>
          <a href="#pricing" className="hover:text-green-600 transition-colors">Pricing</a>
          <a href="#contact" className="hover:text-green-600 transition-colors">Contact</a>
        </nav>

        {/* Auth buttons */}
        <div className="flex gap-3 items-center">
          <Link href="/login">
            <Button
              variant="outline"
              className="border-green-500 text-green-700 hover:bg-green-50 rounded-full px-6 font-semibold transition"
            >
              Login
            </Button>
          </Link>
          <Link href="/user-signup">
            <Button className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white rounded-full px-7 font-bold shadow transition">
              Sign Up
            </Button>
          </Link>
          <Link href="/agent-signup">
            <Button
              variant="outline"
              className="border-green-500 text-green-700 hover:bg-green-50 rounded-full px-6 font-semibold transition"
            >
              Agent Register
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
