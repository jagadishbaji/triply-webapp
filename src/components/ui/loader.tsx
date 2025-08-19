// components/ui/loader.tsx
"use client"

import { Loader2 } from "lucide-react"

export function PageLoader() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-white to-primary/5">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h1 className="text-xl font-semibold text-gray-700">Loading</h1>
        <p className="text-sm text-gray-500">Fetching data, please wait...</p>
      </div>
    </div>
  )
}
