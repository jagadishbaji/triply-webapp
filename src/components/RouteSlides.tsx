"use client";

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  MapPin, Clock, Navigation, Star,
  CheckCircle, Wifi, Signal, Battery, ChevronLeft,
  ChevronRight, Route
} from "lucide-react"


// ─── Route Data ─────────────────────────────────────────────────────────────
const ROUTES = [
  {
    id: 1,
    city: "Bangalore",
    code: "BLR",
    km: 420,
    eta: "7h 30m",
    price: 3500,
    rating: 4.8,
    trips: 156,
    popular: true,
    angle: -35,
  },
  {
    id: 2,
    city: "Goa",
    code: "GOA",
    km: 180,
    eta: "4h 00m",
    price: 1800,
    rating: 4.9,
    trips: 203,
    popular: true,
    angle: 25,
  },
  {
    id: 3,
    city: "Mumbai",
    code: "BOM",
    km: 680,
    eta: "11h 00m",
    price: 5500,
    rating: 4.7,
    trips: 89,
    popular: false,
    angle: -80,
  },
  {
    id: 4,
    city: "Pune",
    code: "PNQ",
    km: 350,
    eta: "6h 30m",
    price: 2800,
    rating: 4.6,
    trips: 124,
    popular: true,
    angle: -115,
  },
  {
    id: 5,
    city: "Mangalore",
    code: "IXE",
    km: 320,
    eta: "5h 30m",
    price: 2400,
    rating: 4.8,
    trips: 98,
    popular: false,
    angle: 75,
  },
  {
    id: 6,
    city: "Mysore",
    code: "MYQ",
    km: 380,
    eta: "6h 45m",
    price: 3000,
    rating: 4.5,
    trips: 67,
    popular: false,
    angle: 130,
  },
  {
    id: 7,
    city: "Dharwad",
    code: "DHW",
    km: 22,
    eta: "35m",
    price: 400,
    rating: 4.9,
    trips: 312,
    popular: true,
    angle: 0,
  },
  {
    id: 8,
    city: "Belagavi",
    code: "BEL",
    km: 80,
    eta: "1h 30m",
    price: 900,
    rating: 4.7,
    trips: 178,
    popular: false,
    angle: 45,
  },
]

// ─── Mini Map Component ──────────────────────────────────────────────────────
function MiniMap({ activeCity }: { activeCity: number }) {
  const centerX = 150
  const centerY = 120
  const radius = 85

  return (
    <svg viewBox="0 0 300 240" className="w-full h-full" fill="none">
      <defs>
        <radialGradient id="mapGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="routeLine" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* Background glow */}
      <ellipse cx={centerX} cy={centerY} rx="110" ry="90" fill="url(#mapGlow)" />

      {/* Concentric circles */}
      <circle cx={centerX} cy={centerY} r={radius * 0.5} stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="3 5" fill="none" />
      <circle cx={centerX} cy={centerY} r={radius * 0.75} stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="3 6" fill="none" />
      <circle cx={centerX} cy={centerY} r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="4 8" fill="none" />

      {/* Route lines */}
      {ROUTES.slice(0, 6).map((route, i) => {
        const rad = (route.angle * Math.PI) / 180
        const endX = centerX + Math.cos(rad) * (radius * 0.85)
        const endY = centerY + Math.sin(rad) * (radius * 0.85)
        const isActive = i === activeCity % 6

        return (
          <g key={route.id}>
            <motion.line
              x1={centerX} y1={centerY}
              x2={endX} y2={endY}
              stroke={isActive ? "rgba(16,185,129,0.6)" : "rgba(255,255,255,0.1)"}
              strokeWidth={isActive ? 2 : 1}
              strokeDasharray={isActive ? "none" : "4 6"}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: i * 0.1 }}
            />
            {isActive && (
              <motion.circle
                r="3"
                fill="#10b981"
                initial={{ cx: centerX, cy: centerY, opacity: 0 }}
                animate={{
                  cx: endX,
                  cy: endY,
                  opacity: [0, 1, 1, 0],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </g>
        )
      })}

      {/* City dots */}
      {ROUTES.slice(0, 6).map((route, i) => {
        const rad = (route.angle * Math.PI) / 180
        const endX = centerX + Math.cos(rad) * (radius * 0.85)
        const endY = centerY + Math.sin(rad) * (radius * 0.85)
        const isActive = i === activeCity % 6

        return (
          <motion.circle
            key={route.id}
            cx={endX} cy={endY}
            r={isActive ? 5 : 3}
            fill={isActive ? "#10b981" : "rgba(255,255,255,0.2)"}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 + i * 0.1 }}
          />
        )
      })}

      {/* Hubli center */}
      <motion.circle
        cx={centerX} cy={centerY} r="12"
        fill="rgba(16,185,129,0.2)"
        stroke="#10b981"
        strokeWidth="2"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
      />
      <motion.circle
        cx={centerX} cy={centerY} r="6"
        fill="#10b981"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, delay: 0.4 }}
      />

      {/* Hubli label */}
      <motion.text
        x={centerX} y={centerY + 28}
        textAnchor="middle"
        fill="rgba(255,255,255,0.6)"
        fontSize="8"
        fontWeight="600"
        letterSpacing="2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        HUBLI
      </motion.text>
    </svg>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function RouteSlides() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState(0)

const [vehicleCount, setVehicleCount] = useState(0); // ✅ FIX
  const route = ROUTES[activeIndex]

  // Auto-rotate
  useEffect(() => {
    if (isPaused) return
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % ROUTES.length)
      setProgress(0)
    }, 5000)
    return () => clearInterval(interval)
  }, [isPaused])

  // Progress bar
  useEffect(() => {
    if (isPaused) return
    const interval = setInterval(() => {
      setProgress(p => (p >= 100 ? 0 : p + 2))
    }, 100)
    return () => clearInterval(interval)
  }, [isPaused])

  const nextRoute = () => {
    setActiveIndex(prev => (prev + 1) % ROUTES.length)
    setProgress(0)
  }

  const prevRoute = () => {
    setActiveIndex(prev => (prev - 1 + ROUTES.length) % ROUTES.length)
    setProgress(0)
  }
useEffect(() => {
const random = Math.floor(Math.random() * 8) + 3;
setVehicleCount(random);
}, [activeIndex]);
  return (
    <div className="relative w-full max-w-[480px] mx-auto select-none">

      {/* Ambient glow */}
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glass Card */}
      <motion.div
        className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl overflow-hidden"
        style={{
          boxShadow: "0 0 0 1px rgba(255,255,255,0.05), 0 40px 80px -20px rgba(0,0,0,0.5)",
        }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500/70" />
              <span className="w-3 h-3 rounded-full bg-amber-500/70" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
            </div>
            <span className="text-[11px] font-medium text-white/40 ml-2">Route Explorer</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Signal className="w-3 h-3 text-emerald-400" />
              <Wifi className="w-3 h-3 text-emerald-400" />
              <Battery className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Mini Map */}
         
          {/* Route Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={route.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-5"
            >
              {/* Route Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {route.popular && (
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-400 to-orange-500 text-black px-2 py-0.5 rounded-full">
                        Popular
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-white">{route.city}</h3>
                  <p className="text-xs text-white/40 mt-0.5">{route.code}</p>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-white/40 uppercase tracking-wider">Starting From</div>
                  <motion.div
                    key={route.price}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400"
                  >
                    ₹{route.price.toLocaleString()}
                  </motion.div>
                </div>
              </div>

              {/* Route Path Visualization */}
              <div className="relative">
                <div className="flex items-center justify-between">
                  {/* Start */}
                  <div className="flex flex-col items-center">
                    <motion.div
                      className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                    >
                      <Navigation className="w-5 h-5 text-emerald-400" />
                    </motion.div>
                    <span className="text-[10px] font-semibold text-white mt-2">Hubli</span>
                    <span className="text-[9px] text-white/30">Start</span>
                  </div>

                  {/* Progress Line */}
                  <div className="flex-1 mx-4">
                    <div className="relative h-1 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                        initial={{ width: "0%" }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.1 }}
                      />
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-[9px] text-white/30">Route</span>
                      <span className="text-[9px] text-white/30">{route.km} km</span>
                    </div>
                  </div>

                  {/* End */}
                  <div className="flex flex-col items-center">
                    <motion.div
                      className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                    >
                      <MapPin className="w-5 h-5 text-white/60" />
                    </motion.div>
                    <span className="text-[10px] font-semibold text-white mt-2">{route.city}</span>
                    <span className="text-[9px] text-white/30">Destination</span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                <motion.div
                  className="bg-white/[0.03] rounded-xl p-3 text-center border border-white/5"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Route className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                  <div className="text-sm font-bold text-white">{route.km}</div>
                  <div className="text-[9px] text-white/40">Kilometers</div>
                </motion.div>
                <motion.div
                  className="bg-white/[0.03] rounded-xl p-3 text-center border border-white/5"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <Clock className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                  <div className="text-sm font-bold text-white">{route.eta}</div>
                  <div className="text-[9px] text-white/40">Duration</div>
                </motion.div>
                <motion.div
                  className="bg-white/[0.03] rounded-xl p-3 text-center border border-white/5"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Star className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                  <div className="text-sm font-bold text-white">{route.rating}</div>
                  <div className="text-[9px] text-white/40">{route.trips} trips</div>
                </motion.div>
              </div>

              {/* Availability */}
              <div className="flex items-center justify-between bg-gradient-to-r from-emerald-500/10 to-transparent rounded-xl px-4 py-3 border border-emerald-500/20">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-400">Cabs Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <motion.span
                    key={activeIndex}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-lg font-black text-white"
                  >
                    {vehicleCount}
                  </motion.span>
                  <span className="text-[10px] text-white/40">vehicles</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
            <div className="flex items-center gap-2">
              {ROUTES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setActiveIndex(i); setProgress(0); }}
                  className={`transition-all duration-300 rounded-full ${
                    i === activeIndex
                      ? "w-6 h-2 bg-gradient-to-r from-emerald-500 to-teal-400"
                      : "w-2 h-2 bg-white/20 hover:bg-white/30"
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={prevRoute}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-white/60" />
              </button>
              <button
                onClick={nextRoute}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-white/60" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
          <span className="text-[10px] text-white/30">Updated just now</span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-emerald-400 font-medium">Route network active</span>
          </div>
        </div>
      </motion.div>

      {/* Floating Cards */}
      <motion.div
        className="absolute -top-4 -right-4 bg-white rounded-2xl p-4 shadow-xl shadow-black/20 border border-slate-100/50"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">8 Routes</div>
            <div className="text-[10px] text-slate-400">Active network</div>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="absolute -bottom-4 -left-4 bg-white rounded-2xl p-4 shadow-xl shadow-black/20 border border-slate-100/50"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
            <Navigation className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">2,450+</div>
            <div className="text-[10px] text-slate-400">Cabs in network</div>
          </div>
        </div>
      </motion.div>

      {/* Corner Accents */}
      <svg className="absolute top-0 left-0 w-6 h-6 text-emerald-500/20 pointer-events-none" viewBox="0 0 24 24">
        <path d="M0 8 L0 0 L8 0" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </svg>
      <svg className="absolute top-0 right-0 w-6 h-6 text-emerald-500/20 pointer-events-none" viewBox="0 0 24 24">
        <path d="M16 0 L24 0 L24 8" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </svg>
      <svg className="absolute bottom-0 left-0 w-6 h-6 text-emerald-500/20 pointer-events-none" viewBox="0 0 24 24">
        <path d="M0 16 L0 24 L8 24" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </svg>
      <svg className="absolute bottom-0 right-0 w-6 h-6 text-emerald-500/20 pointer-events-none" viewBox="0 0 24 24">
        <path d="M16 24 L24 24 L24 16" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </svg>
    </div>
  )
}

// Missing import
function TrendingUp(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  )
}
