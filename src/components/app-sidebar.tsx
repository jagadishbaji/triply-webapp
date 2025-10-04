"use client"

import type * as React from "react"
import {
  IconInnerShadowTop,
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
  IconCoinBitcoin
} from "@tabler/icons-react"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import Cookies, { getCookie } from "cookies-next"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Link from "next/link"

// Menu config with role restrictions
const menuConfig = {
  navMain: [
    // ---- Admin ----
    { title: "Dashboard", url: "/admin/dashboard", icon: IconDashboard, roles: ["admin"] },
    { title: "Agents", url: "/admin/agents", icon: IconUsers, roles: ["admin"] },
    { title: "Approve Agents", url: "/admin/approveAgents", icon: IconUserCheck, roles: ["admin"] },
    { title: "Agent Vehicles", url: "/admin/agentVehicles", icon: IconCar, roles: ["admin"] },
    { title: "Vehicles Price", url: "/admin/vehiclePrice", icon: IconCoinBitcoin, roles: ["admin"] },
    { title: "Vehicle Types", url: "/admin/vehicleTypes", icon: IconCarCrane, roles: ["admin"] },
    { title: "Trip Types", url: "/admin/tripTypes", icon: IconRoute, roles: ["admin"] },
    { title: "Bookings", url: "/admin/bookings", icon: IconCalendarEvent, roles: ["admin"] },

    // ---- Agent ----
    { title: "Dashboard", url: "/agent/dashboard", icon: IconDashboard, roles: ["agent"] },
    { title: "My Vehicles", url: "/agent/myVehicles", icon: IconCar, roles: ["agent"] },
    { title: "Vehicles Price", url: "/agent/agentVehiclePrice", icon: IconCoinBitcoin, roles: ["agent"] },
    { title: "My Bookings", url: "/agent/bookings", icon: IconClipboardList, roles: ["agent"] },
    { title: "Payments", url: "/agent/payments", icon: IconWallet, roles: ["agent"] },
    { title: "Profile", url: "/agent/profile", icon: IconUser, roles: ["agent"] },
  ],
  navSecondary: [
    { title: "Settings", url: "/settings", icon: IconSettings, roles: ["admin", "agent"] },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    const cookieRole = getCookie("role")?.toString() || "agent"
    setRole(cookieRole)
  }, [])

  if (!role) return null

  // Filter menus by role
  const navMain = menuConfig.navMain
    .map((item) => ({ ...item, isActive: pathname.startsWith(item.url) }))
    .filter((item) => item.roles.includes(role))

  const navSecondary = menuConfig.navSecondary
    .map((item) => ({ ...item, isActive: pathname.startsWith(item.url) }))
    .filter((item) => item.roles.includes(role))

  // User info
  const user = {
    name: "Jagadish",
    email: "test@example.com",
    avatar: "/avatars/shadcn.jpg",
    role,
  }

  return (
    <Sidebar
      collapsible="offcanvas"
      className="bg-gradient-to-b from-green-50 via-white to-green-100 border-r-0 shadow-xl min-h-screen"
      {...props}
    >
      <SidebarHeader className="py-6 px-4 border-b-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-2">
              <Link href={role === "admin" ? "/admin/dashboard" : "/agent/dashboard"}>
                <span className="inline-flex items-center gap-3">
                  
                  <span className="text-xl font-extrabold text-gray-900 tracking-tight">
                    JP Tech.
                  </span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="pt-6 px-2">
        <nav>
          {navMain.map((item) => (
            <Link
              key={item.url}
              href={item.url}
              className={`flex items-center gap-4 px-5 py-3 my-1 rounded-2xl font-semibold text-lg transition-all
                ${
                  item.isActive
                    ? "bg-gradient-to-r from-green-500 to-green-700 text-white shadow-lg"
                    : "text-gray-700 hover:bg-green-100 hover:text-green-700"
                }
              `}
            >
              {/* Icon without background */}
              <item.icon className={`w-6 h-6 ${item.isActive ? "text-white" : "text-black"}`} />
              <span>{item.title}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-8">
          {navSecondary.map((item) => (
            <Link
              key={item.url}
              href={item.url}
              className={`flex items-center gap-4 px-5 py-3 my-1 rounded-2xl font-semibold text-base transition-all
                ${
                  item.isActive
                    ? "bg-gradient-to-r from-green-400 to-green-600 text-white shadow"
                    : "text-gray-600 hover:bg-green-50 hover:text-green-700"
                }
              `}
            >
              {/* Icon without background */}
              <item.icon className={`w-5 h-5 ${item.isActive ? "text-white" : "text-black"}`} />
              <span>{item.title}</span>
            </Link>
          ))}
        </div>
      </SidebarContent>

      <SidebarFooter className="px-4 py-6 border-t-0">
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
