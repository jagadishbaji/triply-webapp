// app/agent/dashboard/layout.tsx
"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {/* ✅ Left Sidebar */}
        <AppSidebar />

        {/* ✅ Right Content Area */}
        <SidebarInset>
          {/* Top Navbar */}
          <SiteHeader></SiteHeader>

          {/* Page Content */}
          <main className="flex-1 p-4">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
