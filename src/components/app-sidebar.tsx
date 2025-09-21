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
  IconMoneybag,
  IconMoneybagPlus,
  IconZoomMoney,
  IconPigMoney,
  IconCoinBitcoin
} from "@tabler/icons-react"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import Cookies, { getCookie } from "cookies-next"   // ✅ install with: npm install js-cookie
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

// ✅ Menu config with role restrictions
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
    const cookieRole = getCookie("role")?.toString() || "agent" // ✅ fallback to agent
    setRole(cookieRole)
  }, [])

  if (!role) return null // or loading spinner

  // ✅ Filter menus by role
  const navMain = menuConfig.navMain
    .map((item) => ({ ...item, isActive: pathname.startsWith(item.url) }))
    .filter((item) => item.roles.includes(role))

  const navSecondary = menuConfig.navSecondary
    .map((item) => ({ ...item, isActive: pathname.startsWith(item.url) }))
    .filter((item) => item.roles.includes(role))

  // ✅ User info (you can also store in cookies)
  const user = {
    name: "Jagadish",
    email: "test@example.com",
    avatar: "/avatars/shadcn.jpg",
    role,
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <Link href={role === "admin" ? "/admin/dashboard" : "/agent/dashboard"}>
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">JP Tech.</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
