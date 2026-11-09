"use client"

import { useEffect, useState } from "react"
import { Download, X, Wifi, WifiOff } from "lucide-react"

// ── Service Worker Registration ───────────────────────────────────────────────
function registerSW() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        console.log("[PWA] Service Worker registered:", reg.scope)
        // Check for updates every 60 seconds
        setInterval(() => reg.update(), 60_000)
      })
      .catch((err) => console.warn("[PWA] SW registration failed:", err))
  })
}

// ── Install Prompt Banner ─────────────────────────────────────────────────────
function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if already installed or previously dismissed
    const wasDismissed = localStorage.getItem("pwa-install-dismissed")
    if (wasDismissed) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      // Small delay so it doesn't pop immediately
      setTimeout(() => setShowBanner(true), 3000)
    }

    window.addEventListener("beforeinstallprompt", handler as EventListener)
    return () => window.removeEventListener("beforeinstallprompt", handler as EventListener)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === "accepted") {
      setShowBanner(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowBanner(false)
    setDismissed(true)
    localStorage.setItem("pwa-install-dismissed", "true")
  }

  if (!showBanner || dismissed) return null

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-[9999] md:left-auto md:right-6 md:w-[380px]"
      style={{
        background: "linear-gradient(135deg, #0d1529 0%, #0f1f0f 100%)",
        border: "1px solid rgba(0,200,83,0.3)",
        borderRadius: "16px",
        padding: "16px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,200,83,0.1)",
        backdropFilter: "blur(20px)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        {/* Icon */}
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: "rgba(0,200,83,0.15)",
          border: "1px solid rgba(0,200,83,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: "22px" }}>🚗</span>
        </div>
        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, color: "#f1f5f9", fontSize: "14px", margin: "0 0 4px" }}>
            Install RIDEVO
          </p>
          <p style={{ color: "#94a3b8", fontSize: "12px", margin: "0 0 12px", lineHeight: 1.5 }}>
            Add to home screen for faster booking, offline access &amp; push notifications
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handleInstall}
              style={{
                flex: 1, background: "#00c853", color: "#000",
                border: "none", borderRadius: "8px", padding: "8px 12px",
                fontWeight: 700, fontSize: "13px", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
              }}
            >
              <Download size={14} /> Install App
            </button>
            <button
              onClick={handleDismiss}
              style={{
                background: "rgba(255,255,255,0.08)", color: "#94a3b8",
                border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px",
                padding: "8px 12px", fontWeight: 600, fontSize: "13px", cursor: "pointer",
              }}
            >
              Not now
            </button>
          </div>
        </div>
        {/* Close */}
        <button
          onClick={handleDismiss}
          style={{
            background: "none", border: "none", color: "#64748b",
            cursor: "pointer", padding: "2px", flexShrink: 0,
          }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

// ── Offline Indicator ─────────────────────────────────────────────────────────
function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [showRestore, setShowRestore] = useState(false)

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); setShowRestore(true); setTimeout(() => setShowRestore(false), 3000) }
    const handleOffline = () => { setIsOnline(false); setShowRestore(false) }
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  if (isOnline && !showRestore) return null

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 99999,
      background: isOnline ? "#00c853" : "#ef4444",
      color: isOnline ? "#000" : "#fff",
      padding: "8px 16px",
      display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
      fontSize: "13px", fontWeight: 600,
      transition: "all 0.3s ease",
    }}>
      {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
      {isOnline ? "Back online! ✓" : "No internet connection – some features limited"}
    </div>
  )
}

// ── Main Export ───────────────────────────────────────────────────────────────
export function PWARegister() {
  useEffect(() => {
    registerSW()
  }, [])

  return (
    <>
      <OfflineIndicator />
      <InstallBanner />
    </>
  )
}
