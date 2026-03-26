"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { deleteCookie } from "cookies-next"
import { logout } from "@/services/authService"
import { getWalletByAgentId } from "@/services/walletService" // <-- Added import
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  LogOut,
  User,
  Settings,
  ChevronRight,
  LayoutDashboard,
  Wallet, // <-- Added Wallet icon
} from "lucide-react"

// ─── Route → page title map ─────────────────────────────────────────────────
const PAGE_TITLES: Record<string, string> = {
  "/admin/dashboard":       "Dashboard",
  "/admin/agents":          "Agents",
  "/admin/approveAgents":   "Approve Agents",
  "/admin/agentVehicles":   "Agent Vehicles",
  "/admin/vehiclePrice":    "Vehicle Prices",
  "/admin/vehicleTypes":    "Vehicle Types",
  "/admin/tripTypes":       "Trip Types",
  "/admin/bookings":        "Bookings",
  "/agent/dashboard":       "Dashboard",
  "/agent/myVehicles":      "My Vehicles",
  "/agent/agentVehiclePrice": "Vehicle Prices",
  "/agent/bookings":        "My Bookings",
  "/agent/payments":        "Payments",
  "/agent/profile":         "Profile",
  "/user/dashboard":        "Dashboard",
  "/user/mybookings":       "My Bookings",
  "/user/profile":          "Profile",
  "/settings":              "Settings",
}

// ─── Breadcrumb segments ─────────────────────────────────────────────────────
function getBreadcrumbs(pathname: string): { label: string; href: string }[] {
  const segments = pathname.split("/").filter(Boolean)
  const crumbs: { label: string; href: string }[] = []
  let path = ""
  for (const seg of segments) {
    path += `/${seg}`
    const label = PAGE_TITLES[path]
      ?? seg.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())
    crumbs.push({ label, href: path })
  }
  return crumbs
}

// ─── Read cookie client-side (no library dependency) ────────────────────────
function readCookie(name: string): string {
  if (typeof document === "undefined") return ""
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return m ? decodeURIComponent(m[1]) : ""
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? "")
    .join("") || "U"
}

// ─── Main component ──────────────────────────────────────────────────────────
export function SiteHeader() {
  const router   = useRouter()
  const pathname = usePathname()

  const [userName,    setUserName]    = useState("")
  const [role,        setRole]        = useState("")
  const [walletPoints, setWalletPoints] = useState<number | null>(null) // <-- Added state for wallet
  const [loggingOut,  setLoggingOut]  = useState(false)

  useEffect(() => {
    const name = readCookie("loggedName")
    const r    = readCookie("role")
    const id   = readCookie("loginId") // Fetch loginId to use as agentId

    if (name && name !== "null" && name !== "undefined") setUserName(name)
    if (r) setRole(r)

    // Fetch wallet data only if the user is an agent
    if (r === "agent" && id) {
      getWalletByAgentId(id)
        .then(wallet => {
          // Setting the balance as points. 
          setWalletPoints(wallet.currentBalance);
        })
        .catch(err => console.error("Failed to load wallet points in header:", err));
    }
  }, [pathname]) // Refreshing on pathname change ensures points update when navigating

  const handleLogout = async () => {
    setLoggingOut(true)
    try { await logout() } catch { /* ignore API errors */ } finally {
      deleteCookie("accessToken")
      deleteCookie("role")
      deleteCookie("loginId")
      deleteCookie("loggedName")
      deleteCookie("profileId")
      router.push("/login")
    }
  }

  const breadcrumbs = getBreadcrumbs(pathname)
  const pageTitle   = PAGE_TITLES[pathname] ?? breadcrumbs[breadcrumbs.length - 1]?.label ?? "Page"
  const initials    = getInitials(userName || role || "U")
  const dashboardHref = role === "admin" ? "/admin/dashboard" : role === "agent" ? "/agent/dashboard" : "/user/dashboard"
  const profileHref   = role === "agent" ? "/agent/profile"   : role === "user"  ? "/user/profile"   : "/settings"

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 bg-white border-b border-slate-100 px-4 lg:px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-14">

      {/* ── Left: sidebar trigger + breadcrumb ────────────────── */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <SidebarTrigger className="-ml-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors" />
        <Separator orientation="vertical" className="h-4 bg-slate-200" />

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm min-w-0">
          {breadcrumbs.length > 1 && (
            <>
              <span className="text-slate-400 hidden sm:inline truncate max-w-[80px]">
                {breadcrumbs[0].label}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 hidden sm:block flex-shrink-0" />
            </>
          )}
          <span className="font-semibold text-slate-800 truncate">{pageTitle}</span>
        </nav>
      </div>

      {/* ── Right: user menu ───────────────────────────────────── */}
      <div className="flex items-center gap-3">

        {/* Agent Wallet Badge */}
        {role === "agent" && walletPoints !== null && (
          <div 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-xl text-green-700 font-semibold text-sm shadow-sm cursor-default transition-all hover:bg-green-100"
            title="Your available NammaCab points"
          >
            <Wallet className="w-4 h-4 text-green-600" />
            <span>₹{walletPoints.toLocaleString('en-IN')} </span>
          </div>
        )}

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 hover:bg-slate-50 transition-colors group outline-none">
              <Avatar className="h-7 w-7">
                <AvatarFallback className={`text-xs font-bold ${
                  role === "admin" ? "bg-purple-100 text-purple-700" :
                  role === "agent" ? "bg-green-100 text-green-700"   :
                  "bg-slate-100 text-slate-600"
                }`}>
                  {initials}
                </AvatarFallback>
              </Avatar>
              {userName && (
                <span className="text-sm font-medium text-slate-700 hidden md:block truncate max-w-[120px]">
                  {userName.split(" ")[0]}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side="bottom"
            align="end"
            sideOffset={8}
            className="w-56 rounded-xl shadow-lg border border-slate-200 p-1"
          >
            {/* User info */}
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-3 px-3 py-3 border-b border-slate-100 mb-1">
                <Avatar className="h-9 w-9 flex-shrink-0">
                  <AvatarFallback className={`text-sm font-bold ${
                    role === "admin" ? "bg-purple-100 text-purple-700" :
                    role === "agent" ? "bg-green-100 text-green-700"   :
                    "bg-slate-100 text-slate-600"
                  }`}>
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900 truncate">
                    {userName || "User"}
                  </div>
                  {role && (
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mt-0.5 ${
                      role === "admin" ? "bg-purple-100 text-purple-700" :
                      role === "agent" ? "bg-green-100 text-green-700"   :
                      "bg-slate-100 text-slate-600"
                    }`}>
                      {role}
                    </span>
                  )}
                </div>
              </div>
            </DropdownMenuLabel>

            {/* Nav items */}
            <DropdownMenuItem asChild>
              <button
                onClick={() => router.push(dashboardHref)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 rounded-lg cursor-pointer hover:bg-slate-50"
              >
                <LayoutDashboard className="w-4 h-4 text-slate-400" />
                Dashboard
              </button>
            </DropdownMenuItem>

            {role !== "admin" && (
              <DropdownMenuItem asChild>
                <button
                  onClick={() => router.push(profileHref)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 rounded-lg cursor-pointer hover:bg-slate-50"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  My Profile
                </button>
              </DropdownMenuItem>
            )}

            <DropdownMenuItem asChild>
              <button
                onClick={() => router.push("/settings")}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 rounded-lg cursor-pointer hover:bg-slate-50"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                Settings
              </button>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-slate-100 mx-1 my-1" />

            {/* Logout */}
            <DropdownMenuItem asChild>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 rounded-lg cursor-pointer hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogOut className="w-4 h-4" />
                {loggingOut ? "Logging out..." : "Log Out"}
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}