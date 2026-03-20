"use client"

import * as React from "react"
import {
  IconSettings,
  IconUsers,
  IconCar,
  IconCarCrane,
  IconRoute,
  IconCalendarEvent,
  IconDashboard,
  IconUserCheck,
  IconClipboardList,
  IconWallet,
  IconUser,
  IconCoinBitcoin,
  IconLogout,
  IconChevronRight,
  IconBell,
  IconHelp,
} from "@tabler/icons-react"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { getCookie, deleteCookie } from "cookies-next"
import Link from "next/link"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { logout } from "@/services/authService"

// ─── Types ─────────────────────────────────────────────────────────────────
interface NavItem {
  title: string
  url: string
  icon: React.ElementType
  roles: string[]
  badge?: number
}

interface UserInfo {
  name: string
  email: string
  role: string
  initials: string
}

// ─── Menu config ────────────────────────────────────────────────────────────
const NAV_ITEMS: NavItem[] = [
  // Admin
  { title: "Dashboard",      url: "/admin/dashboard",      icon: IconDashboard,      roles: ["admin"] },
  { title: "Agents",         url: "/admin/agents",         icon: IconUsers,          roles: ["admin"] },
  { title: "Approve Agents", url: "/admin/approveAgents",  icon: IconUserCheck,      roles: ["admin"] },
  { title: "Agent Vehicles", url: "/admin/agentVehicles",  icon: IconCar,            roles: ["admin"] },
  { title: "Vehicle Prices", url: "/admin/vehiclePrice",   icon: IconCoinBitcoin,    roles: ["admin"] },
  { title: "Vehicle Types",  url: "/admin/vehicleTypes",   icon: IconCarCrane,       roles: ["admin"] },
  { title: "Trip Types",     url: "/admin/tripTypes",      icon: IconRoute,          roles: ["admin"] },
  { title: "Bookings",       url: "/admin/bookings",       icon: IconCalendarEvent,  roles: ["admin"] },

  // Agent
  { title: "Dashboard",      url: "/agent/dashboard",          icon: IconDashboard,    roles: ["agent"] },
  { title: "My Vehicles",    url: "/agent/myVehicles",         icon: IconCar,          roles: ["agent"] },
  { title: "Vehicle Prices", url: "/agent/agentVehiclePrice",  icon: IconCoinBitcoin,  roles: ["agent"] },
  { title: "My Bookings",    url: "/agent/bookings",           icon: IconClipboardList,roles: ["agent"] },
  { title: "Payments",       url: "/agent/payments",           icon: IconWallet,       roles: ["agent"] },
  { title: "Profile",        url: "/agent/profile",            icon: IconUser,         roles: ["agent"] },
]

const NAV_SECONDARY: NavItem[] = [
  { title: "Settings", url: "/settings", icon: IconSettings, roles: ["admin", "agent"] },
  { title: "Help",     url: "/help",     icon: IconHelp,     roles: ["admin", "agent"] },
]

// ─── Helper: get initials from name ────────────────────────────────────────
function getInitials(name: string): string {
  if (!name) return "U"
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("")
}

// ─── Role badge ─────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  const isAdmin = role === "admin"
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
      ${isAdmin
        ? "bg-purple-100 text-purple-700 border border-purple-200"
        : "bg-green-100 text-green-700 border border-green-200"
      }`}
    >
      {role}
    </span>
  )
}

// ─── Single nav link ─────────────────────────────────────────────────────────
function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <Link
      href={item.url}
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative
        ${isActive
          ? "bg-green-600 text-white shadow-md shadow-green-500/25"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`}
    >
      {/* Active indicator bar */}
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white/40 rounded-r-full" />
      )}

      <item.icon className={`w-[18px] h-[18px] flex-shrink-0 transition-transform duration-150
        group-hover:scale-110 ${isActive ? "text-white" : "text-slate-500"}`}
      />

      <span className="flex-1 truncate">{item.title}</span>

      {typeof item.badge === "number" && item.badge > 0 && (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center
          ${isActive ? "bg-white/25 text-white" : "bg-green-100 text-green-700"}`}
        >
          {item.badge > 99 ? "99+" : item.badge}
        </span>
      )}
    </Link>
  )
}

// ─── Section label ────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 mb-1 mt-5 first:mt-0">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        {children}
      </span>
    </div>
  )
}

// ─── Main sidebar component ──────────────────────────────────────────────────
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const router = useRouter()
  const { isMobile, setOpenMobile } = useSidebar()

  const [user, setUser] = useState<UserInfo | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  // Read user info from cookies
  useEffect(() => {
    const role = getCookie("role")?.toString() || ""
    const name = getCookie("loggedName")?.toString() || ""
    const email = getCookie("loggedEmail")?.toString() || ""

    if (role) {
      setUser({
        name: name || (role === "admin" ? "Admin" : "Agent"),
        email: email || "",
        role,
        initials: getInitials(name || role),
      })
    }
  }, [pathname]) // refresh on route change

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
    } catch {
      // Even if API fails, clear cookies and redirect
    } finally {
      deleteCookie("accessToken")
      deleteCookie("role")
      deleteCookie("loginId")
      deleteCookie("loggedName")
      deleteCookie("loggedEmail")
      deleteCookie("profileId")
      router.push("/login")
    }
  }

  const closeMobile = () => {
    if (isMobile) setOpenMobile(false)
  }

  if (!user) return null

  // Filter and annotate nav items for this role
  const mainItems = NAV_ITEMS
    .filter((item) => item.roles.includes(user.role))
    .map((item) => ({ ...item, isActive: pathname === item.url || pathname.startsWith(item.url + "/") }))

  const secondaryItems = NAV_SECONDARY
    .filter((item) => item.roles.includes(user.role))
    .map((item) => ({ ...item, isActive: pathname === item.url || pathname.startsWith(item.url + "/") }))

  const dashboardUrl = user.role === "admin" ? "/admin/dashboard" : "/agent/dashboard"

  return (
    <Sidebar
      collapsible="offcanvas"
      className="border-r border-slate-200 bg-white"
      {...props}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <SidebarHeader className="px-4 py-4 border-b border-slate-100">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="h-auto hover:bg-transparent active:bg-transparent">
              <Link href={dashboardUrl} onClick={closeMobile} className="flex items-center gap-3 py-1">
                {/* Logo mark */}
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <IconCar className="w-4 h-4 text-white" />
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-base font-black text-slate-900 tracking-tight">
                    Triply Cars
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                    {user.role === "admin" ? "Admin Portal" : "Agent Portal"}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <SidebarContent className="px-3 py-3 overflow-y-auto">

        {/* Main nav */}
        <SectionLabel>
          {user.role === "admin" ? "Administration" : "My Workspace"}
        </SectionLabel>

        <nav className="flex flex-col gap-0.5" onClick={closeMobile}>
          {mainItems.map((item) => (
            <NavLink key={item.url} item={item} isActive={item.isActive} />
          ))}
        </nav>

        {/* Secondary nav */}
        {secondaryItems.length > 0 && (
          <>
            <SidebarSeparator className="my-4 bg-slate-100" />
            <SectionLabel>General</SectionLabel>
            <nav className="flex flex-col gap-0.5" onClick={closeMobile}>
              {secondaryItems.map((item) => (
                <NavLink key={item.url} item={item} isActive={item.isActive} />
              ))}
            </nav>
          </>
        )}
      </SidebarContent>

      {/* ── Footer — user card ───────────────────────────────────────────── */}
      <SidebarFooter className="px-3 py-3 border-t border-slate-100">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group text-left">
              {/* Avatar */}
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className={`text-xs font-bold
                  ${user.role === "admin"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-green-100 text-green-700"
                  }`}
                >
                  {user.initials}
                </AvatarFallback>
              </Avatar>

              {/* Name & email */}
              <div className="flex-1 min-w-0 text-left">
                <div className="text-sm font-semibold text-slate-800 truncate leading-tight">
                  {user.name}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <RoleBadge role={user.role} />
                </div>
              </div>

              <IconChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors flex-shrink-0" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side={isMobile ? "top" : "right"}
            align="end"
            sideOffset={8}
            className="w-56 rounded-xl shadow-lg border border-slate-200"
          >
            {/* User info header */}
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-3 px-3 py-3 border-b border-slate-100">
                <Avatar className="h-9 w-9 flex-shrink-0">
                  <AvatarFallback className={`text-sm font-bold
                    ${user.role === "admin"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-green-100 text-green-700"
                    }`}
                  >
                    {user.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900 truncate">{user.name}</div>
                  {user.email && (
                    <div className="text-xs text-slate-500 truncate">{user.email}</div>
                  )}
                  <RoleBadge role={user.role} />
                </div>
              </div>
            </DropdownMenuLabel>

            {/* Profile link */}
            <div className="p-1">
              {user.role === "agent" && (
                <DropdownMenuItem asChild>
                  <Link href="/agent/profile" className="flex items-center gap-2 cursor-pointer rounded-lg">
                    <IconUser className="w-4 h-4 text-slate-500" />
                    <span className="text-sm">My Profile</span>
                  </Link>
                </DropdownMenuItem>
              )}

              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center gap-2 cursor-pointer rounded-lg">
                  <IconSettings className="w-4 h-4 text-slate-500" />
                  <span className="text-sm">Settings</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href="/help" className="flex items-center gap-2 cursor-pointer rounded-lg">
                  <IconHelp className="w-4 h-4 text-slate-500" />
                  <span className="text-sm">Help & Support</span>
                </Link>
              </DropdownMenuItem>
            </div>

            <DropdownMenuSeparator className="bg-slate-100 mx-1" />

            {/* Logout */}
            <div className="p-1">
              <DropdownMenuItem
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center gap-2 cursor-pointer rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 focus:bg-red-50 focus:text-red-700"
              >
                <IconLogout className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {loggingOut ? "Logging out..." : "Log Out"}
                </span>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}