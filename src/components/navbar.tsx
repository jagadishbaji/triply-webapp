"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { getCookie, deleteCookie } from "cookies-next"
import { Button } from "@/components/ui/button"
import { User, LogOut, LayoutDashboard, Menu, X, Phone } from "lucide-react"

export default function Navbar() {
  const router   = useRouter()
  const pathname = usePathname()
  const [loggedIn,   setLoggedIn]   = useState(false)
  const [userName,   setUserName]   = useState("")
  const [role,       setRole]       = useState("")
  const [scrolled,   setScrolled]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const token = getCookie("accessToken") as string
    const name  = getCookie("loggedName")  as string
    const r     = getCookie("role")        as string
    setLoggedIn(!!token); setUserName(name || ""); setRole(r || "")
  }, [pathname])

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12)
    window.addEventListener("scroll", fn, { passive: true })
    return () => window.removeEventListener("scroll", fn)
  }, [])

  useEffect(() => { setMobileOpen(false) }, [pathname])

  const dashboardHref =
    role === "admin" ? "/admin/dashboard" :
    role === "agent" ? "/agent/dashboard" : "/user/dashboard"

  const handleLogout = () => {
    ;["accessToken","role","loginId","agentId","loggedName","profileId"].forEach(k => deleteCookie(k))
    setLoggedIn(false); setUserName(""); setRole(""); router.push("/")
  }

  return (
    <>
      <header className={`w-full fixed top-0 left-0 z-30 transition-all duration-300 ${
        scrolled ? "bg-slate-950/95 backdrop-blur-md shadow-md h-16" : "bg-transparent h-20"
      }`}>
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-lg shadow-green-600/30 group-hover:scale-105 transition-transform">
              <span className="text-white font-black text-xl leading-none tracking-tight">R</span>
            </div>
            <div className="leading-none flex items-center tracking-tight">
              <span className="font-black text-2xl text-white">RIDE</span>
              <span className="font-black text-2xl text-green-400">VO</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex gap-8 font-semibold text-sm">
            <a href="#planner" className="text-slate-300 hover:text-green-400 transition-colors">Book a Ride</a>
            <a href="#fleet" className="text-slate-300 hover:text-green-400 transition-colors">Fleet &amp; Rates</a>
            <a href="#how-it-works" className="text-slate-300 hover:text-green-400 transition-colors">How it Works</a>
          </nav>

          {/* Desktop Booking Helpline / Account */}
          <div className="hidden md:flex gap-3 items-center">
            {loggedIn ? (
              <>
                <div className="flex items-center gap-2 text-sm text-slate-300 font-medium mr-1">
                  <div className="w-8 h-8 rounded-full bg-green-900/60 border border-green-700/40 flex items-center justify-center">
                    <User className="w-4 h-4 text-green-400" />
                  </div>
                  <span className="max-w-[120px] truncate">{userName || "Account"}</span>
                </div>
                <Link href={dashboardHref}>
                  <Button variant="outline" className="border-green-600/50 text-green-400 hover:bg-green-900/40 rounded-full px-5 font-semibold text-sm flex items-center gap-1.5">
                    <LayoutDashboard className="w-4 h-4" />Dashboard
                  </Button>
                </Link>
                <Button onClick={handleLogout} variant="outline" className="border-red-800/50 text-red-400 hover:bg-red-900/30 rounded-full px-5 font-semibold text-sm flex items-center gap-1.5">
                  <LogOut className="w-4 h-4" />Logout
                </Button>
              </>
            ) : (
              <a
                href="tel:+918884856868"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white rounded-full px-5 py-2.5 font-bold text-sm shadow-lg shadow-green-600/30 transition-all hover:scale-105"
              >
                <Phone className="w-4 h-4" />
                <span>+91 8884856868</span>
              </a>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2 rounded-xl text-slate-300 hover:bg-white/10 transition" onClick={() => setMobileOpen(o => !o)}>
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-20 bg-black/60 md:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute top-0 right-0 w-72 h-full bg-slate-950 border-l border-white/10 shadow-2xl flex flex-col pt-24 pb-8 px-6 gap-4" onClick={e => e.stopPropagation()}>
            {loggedIn && (
              <div className="flex items-center gap-3 mb-2 pb-4 border-b border-white/10">
                <div className="w-10 h-10 rounded-full bg-green-900/60 border border-green-700/40 flex items-center justify-center">
                  <User className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <div className="font-bold text-white text-sm truncate max-w-[160px]">{userName}</div>
                  <div className="text-xs text-slate-400 capitalize">{role || "user"}</div>
                </div>
              </div>
            )}
            <a href="#planner" className="font-semibold text-slate-300 hover:text-green-400 py-2 transition-colors">Book a Ride</a>
            <a href="#fleet" className="font-semibold text-slate-300 hover:text-green-400 py-2 transition-colors">Fleet &amp; Rates</a>
            <a href="#how-it-works" className="font-semibold text-slate-300 hover:text-green-400 py-2 transition-colors">How it Works</a>
            <div className="border-t border-white/10 pt-4 flex flex-col gap-3 mt-2">
              {loggedIn ? (
                <>
                  <Link href={dashboardHref}>
                    <Button className="w-full bg-green-600 hover:bg-green-500 text-white rounded-xl font-semibold flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4" />Dashboard
                    </Button>
                  </Link>
                  <Button onClick={handleLogout} variant="outline" className="w-full border-red-800/50 text-red-400 hover:bg-red-900/30 rounded-xl font-semibold flex items-center gap-2">
                    <LogOut className="w-4 h-4" />Logout
                  </Button>
                </>
              ) : (
                <a
                  href="tel:+918884856868"
                  className="w-full bg-green-600 hover:bg-green-500 text-white rounded-xl py-3 font-bold text-sm flex items-center justify-center gap-2 shadow-lg"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call: +91 8884856868</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
