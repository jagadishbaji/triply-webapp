"use client"

import { useCallback, useEffect, useState } from "react"
import { Bell, BellOff, BellRing, Smartphone } from "lucide-react"

type Phase = "checking" | "unsupported" | "ios_install" | "server_off" | "blocked" | "off" | "on"

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

// Make sure the service worker is registered and active (safe to call repeatedly)
async function getRegistration(): Promise<ServiceWorkerRegistration> {
  await navigator.serviceWorker.register("/sw.js", { scope: "/" })
  return await navigator.serviceWorker.ready
}

// Lets the operator turn booking alerts on for THIS phone, and send a test alert.
export default function AdminAlertSetup() {
  const [phase, setPhase] = useState<Phase>("checking")
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState("")

  const check = useCallback(async () => {
    try {
      const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
      const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true
      if (isIOS && !standalone) return setPhase("ios_install")
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return setPhase("unsupported")
      const res = await fetch("/api/operator/push", { cache: "no-store" })
      const cfg = await res.json().catch(() => null)
      if (!res.ok || !cfg?.configured) return setPhase("server_off")
      if (Notification.permission === "denied") return setPhase("blocked")
      const reg = await getRegistration()
      const sub = await reg.pushManager.getSubscription()
      if (sub && Notification.permission === "granted") {
        // Re-register quietly in case the server lost it
        await fetch("/api/operator/push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: sub.toJSON(), label: navigator.userAgent.slice(0, 80) }),
        }).catch(() => {})
        return setPhase("on")
      }
      setPhase("off")
    } catch {
      setPhase("unsupported")
    }
  }, [])

  useEffect(() => {
    check()
  }, [check])

  const enable = async () => {
    setBusy(true)
    setNote("")
    try {
      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        setPhase(permission === "denied" ? "blocked" : "off")
        return
      }
      const cfg = await (await fetch("/api/operator/push", { cache: "no-store" })).json()
      const reg = await getRegistration()
      const sub =
        (await reg.pushManager.getSubscription()) ||
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(cfg.publicKey) as BufferSource,
        }))
      const res = await fetch("/api/operator/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON(), label: navigator.userAgent.slice(0, 80) }),
      })
      if (!res.ok) throw new Error("save failed")
      setPhase("on")
      setNote("Alerts are on for this phone. Tap “Send test alert” to check.")
    } catch {
      setNote("Could not turn alerts on. Check your internet connection and try again.")
    } finally {
      setBusy(false)
    }
  }

  const disable = async () => {
    setBusy(true)
    setNote("")
    try {
      const reg = await getRegistration()
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch("/api/operator/push", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        }).catch(() => {})
        await sub.unsubscribe()
      }
      setPhase("off")
    } catch {
      setNote("Could not turn alerts off. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  const test = async () => {
    setBusy(true)
    setNote("")
    try {
      const res = await fetch("/api/operator/push", { method: "PUT" })
      const j = await res.json().catch(() => null)
      setNote(j?.message || j?.error || "Could not send the test alert.")
    } catch {
      setNote("Could not send the test alert.")
    } finally {
      setBusy(false)
    }
  }

  if (phase === "checking") return null

  const box = "mb-6 rounded-2xl border px-4 py-3 text-sm"
  if (phase === "ios_install")
    return (
      <div className={`${box} border-sky-300 bg-sky-50 text-sky-900`}>
        <Smartphone className="inline w-4 h-4 mr-1.5 -mt-0.5" />
        <b>iPhone:</b> tap Share → “Add to Home Screen”, open RIDEVO Admin from the new icon, then turn on booking alerts here.
      </div>
    )
  if (phase === "unsupported")
    return (
      <div className={`${box} border-slate-300 bg-slate-50 text-slate-700`}>
        This browser can’t receive booking alerts. Open this page in Chrome on your Android phone.
      </div>
    )
  if (phase === "server_off")
    return (
      <div className={`${box} border-amber-300 bg-amber-50 text-amber-900`}>
        Phone alerts are not switched on in the server yet (the VAPID keys are missing in Vercel).
      </div>
    )
  if (phase === "blocked")
    return (
      <div className={`${box} border-red-300 bg-red-50 text-red-900`}>
        <BellOff className="inline w-4 h-4 mr-1.5 -mt-0.5" />
        Notifications are blocked for this app. Allow them in your phone’s settings (Apps → Chrome or RIDEVO Admin → Notifications), then reload.
      </div>
    )

  return (
    <div className={`${box} ${phase === "on" ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-slate-300 bg-white text-slate-800"}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="font-semibold">
          {phase === "on" ? <BellRing className="inline w-4 h-4 mr-1.5 -mt-0.5" /> : <Bell className="inline w-4 h-4 mr-1.5 -mt-0.5" />}
          {phase === "on" ? "Booking alerts are ON for this phone" : "Get an alert with strong vibration for every new booking"}
        </div>
        <div className="flex gap-2">
          {phase === "off" && (
            <button onClick={enable} disabled={busy} className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60">
              Turn on booking alerts
            </button>
          )}
          {phase === "on" && (
            <>
              <button onClick={test} disabled={busy} className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60">
                Send test alert
              </button>
              <button onClick={disable} disabled={busy} className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 disabled:opacity-60">
                Turn off
              </button>
            </>
          )}
        </div>
      </div>
      {note && <p className="mt-2 text-xs font-medium">{note}</p>}
    </div>
  )
}
