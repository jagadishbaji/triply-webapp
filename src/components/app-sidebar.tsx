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
} from "@tabler/icons-react"
import { usePathname } from "next/navigation"

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
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
      roles: ["admin", "agent", "user"], // visible to all
    },
    {
      title: "Agents",
      url: "/agents",
      icon: IconUsers,
      roles: ["admin"], // only admin
    },
    {
      title: "Agent Vehicles",
      url: "/agent-vehicles",
      icon: IconCar,
      roles: ["admin"],
    },
    {
      title: "Vehicle Types",
      url: "/vehicleTypes",
      icon: IconCarCrane,
      roles: ["admin"],
    },
    {
      title: "Trip Types",
      url: "/tripTypes",
      icon: IconRoute,
      roles: ["admin"],
    },
    {
      title: "Bookings",
      url: "/bookings",
      icon: IconCalendarEvent,
      roles: ["admin", "agent"], // agents can also see bookings
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/settings",
      icon: IconSettings,
      roles: ["admin", "agent", "user"],
    },
  ],
}

export function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  // ✅ Simulate current user (replace with API/Auth context)
  const user = {
    name: "Jagadish",
    email: "admin@example.com",
    avatar: "/avatars/shadcn.jpg",
    role: "admin", // change to "agent" or "user" to test
  }

  // ✅ Filter menu items by role
  const navMain = menuConfig.navMain.map((item) => ({
    ...item,
    isActive: pathname.startsWith(item.url),
  })).filter((item) => item.roles.includes(user.role))

  const navSecondary = menuConfig.navSecondary
    .map((item) => ({
      ...item,
      isActive: pathname.startsWith(item.url),
    }))
    .filter((item) => item.roles.includes(user.role))

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
               <Link href="/dashboard">
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
