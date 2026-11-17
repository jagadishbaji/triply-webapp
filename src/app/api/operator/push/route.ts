import { NextResponse } from "next/server"
import { isOperator } from "@/lib/operatorAuth"
import {
  parseSubscription,
  pushConfigured,
  removeSubscription,
  saveSubscription,
  sendPushToOperators,
  vapidPublicKey,
} from "@/lib/pushAlerts"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const NO_STORE = { "Cache-Control": "no-store, max-age=0" }
const deny = () => NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401, headers: NO_STORE })

// GET: is phone alerting set up on the server? (and the public key the phone needs to subscribe)
export async function GET(req: Request) {
  if (!isOperator(req)) return deny()
  return NextResponse.json({ success: true, configured: pushConfigured(), publicKey: vapidPublicKey() }, { headers: NO_STORE })
}

// POST: register this phone for booking alerts
export async function POST(req: Request) {
  if (!isOperator(req)) return deny()
  if (!pushConfigured()) {
    return NextResponse.json({ success: false, error: "Phone alerts are not set up on the server yet." }, { status: 503, headers: NO_STORE })
  }
  const body = await req.json().catch(() => null)
  const sub = parseSubscription(body)
  if (!sub) return NextResponse.json({ success: false, error: "Invalid subscription." }, { status: 400, headers: NO_STORE })
  try {
    await saveSubscription(sub, typeof body?.label === "string" ? body.label : "")
    return NextResponse.json({ success: true }, { headers: NO_STORE })
  } catch {
    return NextResponse.json({ success: false, error: "Could not save. Please try again." }, { status: 503, headers: NO_STORE })
  }
}

// DELETE: turn alerts off for this phone
export async function DELETE(req: Request) {
  if (!isOperator(req)) return deny()
  const body = await req.json().catch(() => null)
  const endpoint = body?.endpoint
  if (typeof endpoint !== "string" || !endpoint) {
    return NextResponse.json({ success: false, error: "Missing endpoint." }, { status: 400, headers: NO_STORE })
  }
  try {
    if (pushConfigured()) await removeSubscription(endpoint)
    return NextResponse.json({ success: true }, { headers: NO_STORE })
  } catch {
    return NextResponse.json({ success: false, error: "Could not remove. Please try again." }, { status: 503, headers: NO_STORE })
  }
}

// PUT: send a test alert to every registered phone
export async function PUT(req: Request) {
  if (!isOperator(req)) return deny()
  if (!pushConfigured()) {
    return NextResponse.json({ success: false, error: "Phone alerts are not set up on the server yet." }, { status: 503, headers: NO_STORE })
  }
  const result = await sendPushToOperators({
    title: "🚖 RIDEVO test alert",
    body: "If you can feel and hear this, new booking alerts will reach you.",
    url: "/admin/leads",
    tag: "ridevo-test",
  })
  return NextResponse.json({ success: true, ...result }, { headers: NO_STORE })
}
