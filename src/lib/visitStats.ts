import fs from "fs/promises"
import path from "path"

// Visitor statistics.
//  • Supabase (preferred): every counted visit is one row in `site_visits`; totals come from the
//    `get_visit_stats` database function. Permanent and shared by every server instance.
//  • KV (Upstash / Vercel KV): atomic counters, shared by every server instance.
//  • No KV: JSON file (data/ locally, /tmp on Vercel; /tmp is not permanent).
// Numbers are REAL: they start at zero (no made-up starting values).

const SB_URL = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "")
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || ""
const USE_SUPABASE = Boolean(SB_URL && SB_KEY)
const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
const IS_VERCEL = Boolean(process.env.VERCEL)
const RUNTIME_DIR = IS_VERCEL ? path.join("/tmp", "ridevo-data") : path.join(process.cwd(), "data")
const FILE = path.join(RUNTIME_DIR, "analytics.json")

const TOTAL_KEY = "ridevo:visits:total"
const UNIQUE_KEY = "ridevo:visitors:unique"
const LEGACY_TOTAL_KEY = "ridevo_total_visits"
const NINETY_DAYS = 90 * 24 * 60 * 60

export interface VisitStats {
  totalVisits: number
  todayVisits: number
  uniqueVisitors: number
  uniqueToday: number
}

// Today's date in India (IST), calculated on every call so it rolls over at midnight.
export function istDate(now = Date.now()): string {
  return new Date(now + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

export function isValidVisitorId(id: unknown): id is string {
  return typeof id === "string" && /^[A-Za-z0-9-]{8,64}$/.test(id)
}

const BOT_PATTERN =
  /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|whatsapp|telegram|curl|wget|python|node-fetch|axios|monitor|uptime|pingdom/i

export function looksLikeBot(userAgent: string | null): boolean {
  return !userAgent || BOT_PATTERN.test(userAgent)
}

export function visitStorageEngine(): "supabase" | "vercel_kv_upstash" | "vercel_ephemeral" | "local_disk" {
  if (USE_SUPABASE) return "supabase"
  if (KV_URL && KV_TOKEN) return "vercel_kv_upstash"
  return IS_VERCEL ? "vercel_ephemeral" : "local_disk"
}

// ── Supabase helpers (PostgREST over fetch; server-side only) ────────────────
async function sb<T = unknown>(pathAndQuery: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${SB_URL}/rest/v1/${pathAndQuery}`, {
    ...init,
    cache: "no-store",
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  })
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) throw new Error(`Visit storage error: ${data?.message || res.status}`)
  return data as T
}

async function sbStats(day: string): Promise<VisitStats> {
  const r = await sb<{ total_visits: number; today_visits: number; unique_visitors: number; unique_today: number }>(
    "rpc/get_visit_stats",
    { method: "POST", body: JSON.stringify({ p_day: day }) },
  )
  return {
    totalVisits: Number(r?.total_visits) || 0,
    todayVisits: Number(r?.today_visits) || 0,
    uniqueVisitors: Number(r?.unique_visitors) || 0,
    uniqueToday: Number(r?.unique_today) || 0,
  }
}

// ── Redis helpers ────────────────────────────────────────────────────────────
async function pipeline(commands: (string | number)[][]): Promise<unknown[]> {
  const res = await fetch(`${KV_URL}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KV_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(commands),
    cache: "no-store",
  })
  const data = await res.json().catch(() => null)
  if (!res.ok || !Array.isArray(data)) throw new Error(`Visit storage error: ${res.status}`)
  return data.map((d: { result?: unknown; error?: string }) => {
    if (d?.error) throw new Error(`Visit storage error: ${d.error}`)
    return d?.result
  })
}

async function kvStats(day: string): Promise<VisitStats> {
  const [total, today, unique, uniqueToday] = await pipeline([
    ["GET", TOTAL_KEY],
    ["GET", `ridevo:visits:day:${day}`],
    ["PFCOUNT", UNIQUE_KEY],
    ["PFCOUNT", `ridevo:visitors:day:${day}`],
  ])
  return {
    totalVisits: Number(total) || 0,
    todayVisits: Number(today) || 0,
    uniqueVisitors: Number(unique) || 0,
    uniqueToday: Number(uniqueToday) || 0,
  }
}

async function kvEnsureTotalSeeded() {
  // Carry over the real count from the older counter, once.
  const [current, legacy] = await pipeline([["GET", TOTAL_KEY], ["GET", LEGACY_TOTAL_KEY]])
  if (current == null && legacy != null && Number(legacy) > 0) {
    await pipeline([["SETNX", TOTAL_KEY, String(Number(legacy))]])
  }
}

// ── File helpers (no KV) ─────────────────────────────────────────────────────
interface FileData {
  totalVisits: number
  visitors: string[]
  days: Record<string, { visits: number; ids: string[] }>
}

declare global {
  // eslint-disable-next-line no-var
  var __ridevo_visit_lock: Promise<unknown> | undefined
  // eslint-disable-next-line no-var
  var __ridevo_visit_mem: FileData | undefined
}

async function readFileData(): Promise<FileData> {
  try {
    const parsed = JSON.parse(await fs.readFile(FILE, "utf-8"))
    if (parsed && typeof parsed.totalVisits === "number") {
      return {
        totalVisits: parsed.totalVisits,
        visitors: Array.isArray(parsed.visitors) ? parsed.visitors : [],
        days: parsed.days && typeof parsed.days === "object" ? parsed.days : {},
      }
    }
  } catch {
    // no file yet
  }
  return globalThis.__ridevo_visit_mem ?? { totalVisits: 0, visitors: [], days: {} }
}

async function writeFileData(d: FileData) {
  // keep only the last 14 days and at most 20,000 ids so the file stays small
  const keep = Object.keys(d.days).sort().slice(-14)
  d.days = Object.fromEntries(keep.map((k) => [k, d.days[k]]))
  d.visitors = d.visitors.slice(-20000)
  globalThis.__ridevo_visit_mem = d
  try {
    await fs.mkdir(RUNTIME_DIR, { recursive: true })
    await fs.writeFile(FILE, JSON.stringify(d), "utf-8")
  } catch (err) {
    console.warn("Visit stats file not writable (memory only):", err)
  }
}

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = (globalThis.__ridevo_visit_lock ?? Promise.resolve()).then(fn, fn)
  globalThis.__ridevo_visit_lock = run.catch(() => undefined)
  return run
}

function fileToStats(d: FileData, day: string): VisitStats {
  const t = d.days[day]
  return {
    totalVisits: d.totalVisits,
    todayVisits: t?.visits ?? 0,
    uniqueVisitors: d.visitors.length,
    uniqueToday: t?.ids.length ?? 0,
  }
}

// ── Public API ───────────────────────────────────────────────────────────────
export async function getVisitStats(): Promise<VisitStats> {
  const day = istDate()
  if (USE_SUPABASE) return sbStats(day)
  if (KV_URL && KV_TOKEN) {
    await kvEnsureTotalSeeded()
    return kvStats(day)
  }
  return fileToStats(await readFileData(), day)
}

export async function recordVisit(visitorId: string): Promise<VisitStats> {
  const day = istDate()
  if (USE_SUPABASE) {
    await sb("site_visits", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ visitor_id: visitorId, visit_day: day }),
    })
    return sbStats(day)
  }
  if (KV_URL && KV_TOKEN) {
    await kvEnsureTotalSeeded()
    const dayVisits = `ridevo:visits:day:${day}`
    const dayUnique = `ridevo:visitors:day:${day}`
    await pipeline([
      ["INCR", TOTAL_KEY],
      ["INCR", dayVisits],
      ["EXPIRE", dayVisits, NINETY_DAYS],
      ["PFADD", UNIQUE_KEY, visitorId],
      ["PFADD", dayUnique, visitorId],
      ["EXPIRE", dayUnique, NINETY_DAYS],
    ])
    return kvStats(day)
  }
  return withLock(async () => {
    const d = await readFileData()
    d.totalVisits += 1
    const t = (d.days[day] ??= { visits: 0, ids: [] })
    t.visits += 1
    if (!t.ids.includes(visitorId)) t.ids.push(visitorId)
    if (!d.visitors.includes(visitorId)) d.visitors.push(visitorId)
    await writeFileData(d)
    return fileToStats(d, day)
  })
}
