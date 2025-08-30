"use client"

import { Button } from "@/components/ui/button"
import { Car } from "lucide-react"
import Link from "next/link"

export default function Navbar() {
  return (
    <header className="w-full bg-white text-black shadow-md">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Car className="w-6 h-6 text-black" />
          <span className="font-bold text-lg">Triply Cars</span>
        </div>

        {/* Nav links */}
        <nav className="hidden md:flex gap-6 font-medium">
          <a href="#services" className="hover:text-green-600">Services</a>
          <a href="#pricing" className="hover:text-green-600">Pricing</a>
          <a href="#contact" className="hover:text-green-600">Contact</a>
        </nav>

        {/* Auth buttons */}
        <div className="flex gap-3">
          <Link href="/login"><Button variant="outline" className="border-gray-300 text-black hover:bg-gray-100">
            Login
          </Button></Link> 
          <Button className="bg-green-600 hover:bg-green-700 text-white rounded-full px-6">
            Sign Up
          </Button>
          <Link href="/agentSignup">
          <Button variant="outline" className="border-gray-300 text-black hover:bg-gray-100">
            Agent Resgister         </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
