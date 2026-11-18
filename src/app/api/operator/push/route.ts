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
  let result
  try {
    result = await sendPushToOperators({
      title: "🚖 RIDEVO test alert",
      body: "If you can feel and hear this, new booking alerts will reach you.",
      url: "/admin/leads",
      tag: "ridevo-test",
    })
  } catch {
    return NextResponse.json({ success: false, error: "The test alert failed on the server. Please try again." }, { status: 500, headers: NO_STORE })
  }
  if (result.error === "VAPID_INVALID") {
    return NextResponse.json(
      {
        success: false,
        error:
          "The alert keys in Vercel are not valid. Check VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY (copy them exactly, from the same generated pair) and VAPID_SUBJECT (like mailto:support@ridevo.in), then redeploy.",
      },
      { status: 500, headers: NO_STORE },
    )
  }
  let message = "Test alert sent. It should reach your phone in a few seconds."
  if (result.registered === 0) message = "No phone is registered yet. Turn alerts on first."
  else if (result.sent === 0 && result.failed > 0) {
    const refused = result.statuses.some((c) => c === 401 || c === 403)
    message = refused
      ? "Your phone’s push service refused the alert. Turn alerts OFF and ON again on this phone. If it still fails, check that the two VAPID keys in Vercel are the same generated pair."
      : "The alert could not be delivered right now. Check your phone’s internet connection and try again."
  } else if (result.sent === 0 && result.removed > 0) message = "This phone’s registration had expired. Turn alerts ON again."
  return NextResponse.json({ success: true, ...result, message }, { headers: NO_STORE })
}
