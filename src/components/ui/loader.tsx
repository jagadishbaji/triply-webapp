"use client"

import { motion } from "framer-motion"
import { Car } from "lucide-react"

// ─── Full-page loader ────────────────────────────────────────────────────────
export function PageLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-5">

        {/* Animated logo mark */}
        <div className="relative">
          {/* Outer pulse ring */}
          <motion.div
            className="absolute inset-0 rounded-2xl bg-green-500/15"
            animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Icon container */}
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center shadow-lg shadow-green-500/25">
            <motion.div
              animate={{ x: [-3, 3, -3] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Car className="w-8 h-8 text-white" />
            </motion.div>
          </div>
        </div>

        {/* Brand name */}
        <div className="text-center">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Triply Cars</h2>
          <p className="text-sm text-slate-400 mt-0.5">{message}</p>
        </div>

        {/* Progress bar */}
        <div className="w-40 h-1 bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Inline / section loader ──────────────────────────────────────────────────
export function SectionLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 w-full">
      <div className="relative mb-4">
        <motion.div
          className="absolute inset-0 rounded-xl bg-green-500/15"
          animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center shadow-md shadow-green-500/20">
          <motion.div
            animate={{ x: [-2, 2, -2] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Car className="w-6 h-6 text-white" />
          </motion.div>
        </div>
      </div>
      <p className="text-sm font-medium text-slate-500">{message}</p>

      {/* Dots */}
      <div className="flex items-center gap-1.5 mt-3">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-green-500"
            animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Button spinner (inline use inside buttons) ───────────────────────────────
export function ButtonSpinner({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin w-4 h-4 ${className}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

// ─── Skeleton loaders ─────────────────────────────────────────────────────────
export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-slate-100 last:border-0">
      <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-slate-200 animate-pulse rounded-full w-1/3" />
        <div className="h-3 bg-slate-100 animate-pulse rounded-full w-1/2" />
      </div>
      <div className="h-6 w-16 bg-slate-200 animate-pulse rounded-full" />
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-200 animate-pulse flex-shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-5 bg-slate-200 animate-pulse rounded-full w-10" />
          <div className="h-3 bg-slate-100 animate-pulse rounded-full w-20" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-slate-100 bg-slate-50">
        {[40, 25, 20, 15].map((w, i) => (
          <div key={i} className={`h-3 bg-slate-200 animate-pulse rounded-full`} style={{ width: `${w}%` }} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  )
}