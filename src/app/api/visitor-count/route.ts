import { NextResponse } from "next/server"
import { isOperator } from "@/lib/operatorAuth"
import {
  getVisitStats,
  isValidVisitorId,
  looksLikeBot,
  recordVisit,
  visitStorageEngine,
} from "@/lib/visitStats"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const NO_STORE = { "Cache-Control": "no-store, max-age=0" }

// GET: current numbers (the home page shows the unique-visitor count)
export async function GET() {
  try {
    const stats = await getVisitStats()
    return NextResponse.json(
      { success: true, ...stats, storageEngine: visitStorageEngine() },
      { headers: NO_STORE }
    )
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to load visitor count" },
      { status: 503, headers: NO_STORE }
    )
  }
}

// POST: record one visit per browser session.
// Search-engine bots, link previews, monitoring tools and signed-in operators are not counted.
export async function POST(req: Request) {
  try {
    let visitorId: unknown
    try {
      visitorId = (await req.json())?.visitorId
    } catch {
      // no body
    }
    const skip =
      looksLikeBot(req.headers.get("user-agent")) || isOperator(req) || !isValidVisitorId(visitorId)

    const stats = skip ? await getVisitStats() : await recordVisit(visitorId as string)
    return NextResponse.json(
      { success: true, counted: !skip, ...stats, storageEngine: visitStorageEngine() },
      { headers: NO_STORE }
    )
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to record visit" },
      { status: 503, headers: NO_STORE }
    )
  }
}
