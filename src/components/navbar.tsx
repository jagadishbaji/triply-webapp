"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { getCookie, deleteCookie } from "cookies-next"
import { Button } from "@/components/ui/button"
import { User, LogOut, LayoutDashboard, Menu, X } from "lucide-react"

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()

  const [loggedIn, setLoggedIn] = useState(false)
  const [userName, setUserName] = useState("")
  const [role, setRole] = useState("")
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Read auth cookies on mount
  useEffect(() => {
    const token = getCookie("accessToken") as string
    const name = getCookie("loggedName") as string
    const r = getCookie("role") as string
    setLoggedIn(!!token)
    setUserName(name || "")
    setRole(r || "")
  }, [pathname]) // re-run on route change so logout/login updates instantly

  // Shrink navbar on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const dashboardHref =
    role === "admin" ? "/admin/dashboard" :
    role === "agent" ? "/agent/dashboard" :
    "/user/dashboard"

  const handleLogout = () => {
    deleteCookie("accessToken")
    deleteCookie("role")
    deleteCookie("loginId")
    deleteCookie("loggedName")
    deleteCookie("profileId")
    setLoggedIn(false)
    setUserName("")
    setRole("")
    router.push("/")
  }

  return (
    <>
      <header
        className={`w-full fixed top-0 left-0 z-30 transition-all duration-300
          ${scrolled
            ? "bg-white/95 backdrop-blur-md shadow-md h-16"
            : "bg-white/80 backdrop-blur-md shadow-lg h-20"
          }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
            <span className="font-extrabold text-2xl text-gray-900 group-hover:text-green-700 tracking-tight transition-colors">
              Triply Cars
            </span>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex gap-8 font-semibold text-base">
            <a href="/#search" className="text-gray-600 hover:text-green-600 transition-colors">Book a Ride</a>
            <a href="/#how-it-works" className="text-gray-600 hover:text-green-600 transition-colors">How it Works</a>
            <Link href="/agent-signup" className="text-gray-600 hover:text-green-600 transition-colors">
              List Your Cabs
            </Link>
          </nav>

          {/* Desktop auth area */}
          <div className="hidden md:flex gap-3 items-center">
            {loggedIn ? (
              <>
                {/* User greeting */}
                <div className="flex items-center gap-2 text-sm text-gray-600 font-medium mr-1">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-green-700" />
                  </div>
                  <span className="max-w-[120px] truncate">{userName || "Account"}</span>
                </div>

                {/* Dashboard */}
                <Link href={dashboardHref}>
                  <Button
                    variant="outline"
                    className="border-green-500 text-green-700 hover:bg-green-50 rounded-full px-5 font-semibold transition flex items-center gap-1.5"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Button>
                </Link>

                {/* Logout */}
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-full px-5 font-semibold transition flex items-center gap-1.5"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* ── Mobile menu ─────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-20 bg-black/40 md:hidden" onClick={() => setMobileOpen(false)}>
          <div
            className="absolute top-0 right-0 w-72 h-full bg-white shadow-2xl flex flex-col pt-24 pb-8 px-6 gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            {loggedIn && (
              <div className="flex items-center gap-3 mb-2 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-green-700" />
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-sm truncate max-w-[160px]">{userName}</div>
                  <div className="text-xs text-gray-400 capitalize">{role || "user"}</div>
                </div>
              </div>
            )}

            <a href="/#search" className="font-semibold text-gray-700 hover:text-green-600 py-2 transition-colors">
              Book a Ride
            </a>
            <a href="/#how-it-works" className="font-semibold text-gray-700 hover:text-green-600 py-2 transition-colors">
              How it Works
            </a>
            <Link href="/agent-signup" className="font-semibold text-gray-700 hover:text-green-600 py-2 transition-colors">
              List Your Cabs
            </Link>

            <div className="border-t border-gray-100 pt-4 flex flex-col gap-3 mt-2">
              {loggedIn ? (
                <>
                  <Link href={dashboardHref}>
                    <Button className="w-full bg-green-600 hover:bg-green-500 text-white rounded-xl font-semibold flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Button>
                  </Link>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="w-full border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-semibold flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="outline" className="w-full border-green-500 text-green-700 rounded-xl font-semibold">
                      Login
                    </Button>
                  </Link>
                  <Link href="/user-signup">
                    <Button className="w-full bg-gradient-to-r from-green-500 to-green-700 text-white rounded-xl font-bold">
                      Sign Up
                    </Button>
                  </Link>
                  <Link href="/agent-signup">
                    <Button variant="outline" className="w-full border-green-500 text-green-700 rounded-xl font-semibold">
                      Agent Register
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}