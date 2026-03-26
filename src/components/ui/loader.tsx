import { motion } from "framer-motion"

// ═══════════════════════════════════════════════════════════════════════════════
// NAMMACAB - CORPORATE LOADER COMPONENTS
// Production-ready loading states for a cab booking marketplace
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Full-page loader ──────────────────────────────────────────────────────────
export function PageLoader({ message = "Finding the best rides for you..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated gradient orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 50, 0],
            y: [0, -30, 0]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.2, 0.4],
            x: [0, -40, 0],
            y: [0, 40, 0]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />
      </div>

      <div className="relative flex flex-col items-center">
        {/* Logo with animated elements */}
        <div className="relative mb-8">
          {/* Outer rotating ring */}
          <motion.div
            className="absolute -inset-4 rounded-full border-2 border-green-500/20 border-t-green-500"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Middle pulsing ring */}
          <motion.div
            className="absolute -inset-2 rounded-2xl bg-green-500/10"
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.2, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Logo container */}
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-2xl shadow-green-500/30">
            {/* Kannada character */}
            <motion.span 
              className="text-white font-black text-4xl leading-none"
              style={{ fontFamily: "'Noto Sans Kannada', sans-serif" }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              ನ
            </motion.span>
          </div>
        </div>

        {/* Brand name */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-center gap-1 mb-2">
            <span className="font-black text-2xl text-white tracking-tight">namma</span>
            <span className="font-black text-2xl text-green-400 tracking-widest uppercase">CAB</span>
          </div>
          <p className="text-slate-400 text-sm">{message}</p>
        </motion.div>

        {/* Animated road with car */}
        <div className="relative w-64 h-12 mb-6">
          {/* Road */}
          <div className="absolute bottom-2 left-0 right-0 h-2 bg-slate-800 rounded-full overflow-hidden">
            {/* Road markings */}
            <motion.div
              className="absolute inset-y-0 flex items-center gap-4"
              animate={{ x: [0, -32] }}
              transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
            >
              {[...Array(12)].map((_, i) => (
                <div key={i} className="w-4 h-0.5 bg-slate-600 rounded-full flex-shrink-0" />
              ))}
            </motion.div>
          </div>
          
          {/* Car icon */}
          <motion.div
            className="absolute bottom-3 left-1/2 -translate-x-1/2"
            animate={{ y: [-1, 1, -1], x: [-2, 2, -2] }}
            transition={{ duration: 0.3, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg width="40" height="24" viewBox="0 0 40 24" fill="none" className="drop-shadow-lg">
              {/* Car body */}
              <path 
                d="M6 14h28c1.1 0 2 .9 2 2v4c0 .55-.45 1-1 1H5c-.55 0-1-.45-1-1v-4c0-1.1.9-2 2-2z" 
                fill="#22c55e"
              />
              {/* Car top */}
              <path 
                d="M10 14l3-7c.4-.9 1.3-1.5 2.3-1.5h9.4c1 0 1.9.6 2.3 1.5l3 7H10z" 
                fill="#16a34a"
              />
              {/* Windows */}
              <path 
                d="M12 13l2.2-5.5c.2-.4.5-.5.8-.5h10c.3 0 .6.1.8.5L28 13H12z" 
                fill="#0f172a"
                fillOpacity="0.6"
              />
              {/* Wheels */}
              <circle cx="10" cy="20" r="3" fill="#1e293b" />
              <circle cx="10" cy="20" r="1.5" fill="#475569" />
              <circle cx="30" cy="20" r="3" fill="#1e293b" />
              <circle cx="30" cy="20" r="1.5" fill="#475569" />
              {/* Headlights */}
              <rect x="34" y="15" width="2" height="2" rx="0.5" fill="#fef08a" />
              {/* Taillight */}
              <rect x="4" y="15" width="1.5" height="2" rx="0.5" fill="#ef4444" />
            </svg>
          </motion.div>
          
          {/* Dust particles */}
          <motion.div
            className="absolute bottom-4 left-1/3"
            animate={{ opacity: [0, 0.6, 0], x: [-10, -30], y: [0, -5] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "easeOut" }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-slate-500/50" />
          </motion.div>
          <motion.div
            className="absolute bottom-5 left-1/3"
            animate={{ opacity: [0, 0.4, 0], x: [-5, -25], y: [0, -8] }}
            transition={{ duration: 0.6, repeat: Infinity, ease: "easeOut", delay: 0.2 }}
          >
            <div className="w-1 h-1 rounded-full bg-slate-500/40" />
          </motion.div>
        </div>

        {/* Loading progress bar */}
        <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-green-500 via-emerald-400 to-green-500 rounded-full"
            style={{ backgroundSize: "200% 100%" }}
            animate={{ 
              backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"],
              width: ["0%", "100%", "0%"]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {/* Loading dots */}
        <div className="flex items-center gap-1.5 mt-4">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-green-500"
              animate={{ 
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1, 0.8]
              }}
              transition={{ 
                duration: 1, 
                repeat: Infinity, 
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Section loader (for inline/section use) ──────────────────────────────────
export function SectionLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 w-full">
      <div className="relative mb-6">
        {/* Animated rings */}
        <motion.div
          className="absolute -inset-3 rounded-2xl border-2 border-green-500/20 border-t-green-500/60"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute -inset-1.5 rounded-xl bg-green-500/10"
          animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.2, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Logo */}
        <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/25">
          <motion.span 
            className="text-white font-black text-2xl leading-none"
            style={{ fontFamily: "'Noto Sans Kannada', sans-serif" }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          >
            ನ
          </motion.span>
        </div>
      </div>

      {/* Message */}
      <p className="text-sm font-medium text-slate-600 mb-4">{message}</p>
      
      {/* Mini progress */}
      <div className="w-32 h-1 bg-slate-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  )
}

// ─── Compact loader (for cards/small areas) ───────────────────────────────────
export function CompactLoader({ message }: { message?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-8">
      <div className="relative">
        <motion.div
          className="w-8 h-8 rounded-lg border-2 border-green-500/30 border-t-green-500"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-green-500" />
        </div>
      </div>
      {message && <span className="text-sm text-slate-500">{message}</span>}
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
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4" 
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
      />
    </svg>
  )
}

// ─── Skeleton loaders ─────────────────────────────────────────────────────────

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-slate-100 last:border-0 animate-pulse">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-200 to-slate-100 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gradient-to-r from-slate-200 to-slate-100 rounded-lg w-2/5" />
        <div className="h-3 bg-gradient-to-r from-slate-100 to-slate-50 rounded-lg w-3/5" />
      </div>
      <div className="h-8 w-20 bg-gradient-to-r from-slate-200 to-slate-100 rounded-full" />
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-200 to-slate-100 flex-shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-5 bg-gradient-to-r from-slate-200 to-slate-100 rounded-lg w-24" />
          <div className="h-3 bg-gradient-to-r from-slate-100 to-slate-50 rounded-lg w-32" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-3 bg-gradient-to-r from-slate-100 to-slate-50 rounded-lg w-full" />
        <div className="h-3 bg-gradient-to-r from-slate-100 to-slate-50 rounded-lg w-4/5" />
      </div>
      <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
        <div className="h-6 w-20 bg-gradient-to-r from-slate-200 to-slate-100 rounded-lg" />
        <div className="h-9 w-24 bg-gradient-to-r from-slate-200 to-slate-100 rounded-xl" />
      </div>
    </div>
  )
}

export function SkeletonVehicleCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
      {/* Image area */}
      <div className="h-44 bg-gradient-to-b from-slate-100 to-slate-50 relative">
        <div className="absolute top-3 left-3 h-6 w-20 bg-slate-200 rounded-full" />
        <div className="absolute top-3 right-3 h-6 w-12 bg-slate-200 rounded-full" />
      </div>
      {/* Content */}
      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <div className="h-5 bg-gradient-to-r from-slate-200 to-slate-100 rounded-lg w-2/3" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-200" />
            <div className="h-3 bg-slate-100 rounded-lg w-24" />
          </div>
        </div>
        {/* Price area */}
        <div className="bg-slate-50 rounded-xl p-3 space-y-2">
          <div className="h-6 bg-gradient-to-r from-slate-200 to-slate-100 rounded-lg w-1/3" />
          <div className="h-3 bg-slate-100 rounded-lg w-1/2" />
        </div>
        {/* Button */}
        <div className="h-10 bg-gradient-to-r from-slate-200 to-slate-100 rounded-xl" />
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-4 px-5 py-4 border-b border-slate-100 bg-slate-50/80">
        <div className="h-4 bg-slate-200 rounded-lg w-1/4 animate-pulse" />
        <div className="h-4 bg-slate-200 rounded-lg w-1/5 animate-pulse" />
        <div className="h-4 bg-slate-200 rounded-lg w-1/6 animate-pulse" />
        <div className="h-4 bg-slate-200 rounded-lg w-1/6 animate-pulse ml-auto" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  )
}

// ─── Booking confirmation loader ──────────────────────────────────────────────
export function BookingLoader({ message = "Processing your booking..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div className="relative mb-6">
        {/* Success ring animation */}
        <motion.svg
          width="80"
          height="80"
          viewBox="0 0 80 80"
          className="transform -rotate-90"
        >
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="4"
          />
          <motion.circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke="#22c55e"
            strokeWidth="4"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            style={{ 
              strokeDasharray: "226.19",
              strokeDashoffset: "0"
            }}
          />
        </motion.svg>
        
        {/* Inner icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-green-600">
              <motion.path
                d="M9 12l2 2 4-4"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              />
            </svg>
          </motion.div>
        </div>
      </div>
      
      <h3 className="text-lg font-bold text-slate-900 mb-1">{message}</h3>
      <p className="text-sm text-slate-500">Please wait while we confirm your ride</p>
    </div>
  )
}

// ─── Search results loader ────────────────────────────────────────────────────
export function SearchingLoader({ message = "Searching available cabs..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      {/* Animated search icon */}
      <div className="relative mb-6">
        <motion.div
          className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.svg 
            width="32" 
            height="32" 
            viewBox="0 0 24 24" 
            fill="none"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
          >
            <circle cx="11" cy="11" r="7" stroke="#22c55e" strokeWidth="2" />
            <path d="M16 16l4 4" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
          </motion.svg>
        </motion.div>
        
        {/* Radar effect */}
        <motion.div
          className="absolute inset-0 rounded-2xl border-2 border-green-500/30"
          animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.div
          className="absolute inset-0 rounded-2xl border-2 border-green-500/30"
          animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
        />
      </div>
      
      <p className="text-sm font-medium text-slate-600 mb-4">{message}</p>
      
      {/* Car icons moving */}
      <div className="flex items-center gap-3">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center"
            animate={{ y: [-2, 2, -2], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path 
                d="M16 6l2 4h2a2 2 0 012 2v4a1 1 0 01-1 1h-1a2 2 0 11-4 0h-8a2 2 0 11-4 0H3a1 1 0 01-1-1v-4a2 2 0 012-2h2l2-4h8z" 
                fill="#94a3b8"
              />
            </svg>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ─── Empty state with loader ──────────────────────────────────────────────────
export function EmptyStateLoader({ 
  title = "No results found",
  message = "Try adjusting your search criteria"
}: { 
  title?: string
  message?: string 
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-6">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
          <path 
            d="M9 9a3 3 0 116 0 3 3 0 01-6 0z" 
            stroke="#94a3b8" 
            strokeWidth="2"
          />
          <path 
            d="M12 2a10 10 0 110 20 10 10 0 010-20z" 
            stroke="#cbd5e1" 
            strokeWidth="2"
          />
          <path 
            d="M2 2l20 20" 
            stroke="#94a3b8" 
            strokeWidth="2" 
            strokeLinecap="round"
          />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 max-w-xs">{message}</p>
    </div>
  )
}

export default {
  PageLoader,
  SectionLoader,
  CompactLoader,
  ButtonSpinner,
  SkeletonRow,
  SkeletonCard,
  SkeletonVehicleCard,
  SkeletonTable,
  BookingLoader,
  SearchingLoader,
  EmptyStateLoader
}
