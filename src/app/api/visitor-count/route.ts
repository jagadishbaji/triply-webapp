import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// ── In-Memory Fallback ──────────────────────────────────────────────────────
declare global {
  // eslint-disable-next-line no-var
  var __ridevo_visitor_count: number | undefined;
  // eslint-disable-next-line no-var
  var __ridevo_visitor_today: { date: string; count: number } | undefined;
}

if (!globalThis.__ridevo_visitor_count) {
  globalThis.__ridevo_visitor_count = 1420;
}
const todayKey = new Date().toISOString().split("T")[0];
if (!globalThis.__ridevo_visitor_today || globalThis.__ridevo_visitor_today.date !== todayKey) {
  globalThis.__ridevo_visitor_today = { date: todayKey, count: 142 };
}

// ── Upstash / Vercel KV Config ──────────────────────────────────────────────
const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

// ── Local Filesystem Persistence ────────────────────────────────────────────
const IS_VERCEL = Boolean(process.env.VERCEL);
const ANALYTICS_FILE = path.join(process.cwd(), "data", "analytics.json");
const RUNTIME_DIR = IS_VERCEL ? path.join("/tmp", "ridevo-data") : path.join(process.cwd(), "data");
const RUNTIME_ANALYTICS_FILE = path.join(RUNTIME_DIR, "analytics.json");

interface AnalyticsData {
  totalVisits: number;
  lastUpdated: string;
  dailyVisits: Record<string, number>;
}

async function loadAnalytics(): Promise<AnalyticsData> {
  // 1. Try Upstash / Vercel KV if available
  if (KV_URL && KV_TOKEN) {
    try {
      const res = await fetch(`${KV_URL}/get/ridevo_total_visits`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` },
        cache: "no-store",
      });
      const data = await res.json();
      const totalVisits = Number(data?.result) || 1420;

      const todayRes = await fetch(`${KV_URL}/get/ridevo_visits_${todayKey}`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` },
        cache: "no-store",
      });
      const todayData = await todayRes.json();
      const todayVisits = Number(todayData?.result) || 142;

      return {
        totalVisits,
        lastUpdated: new Date().toISOString(),
        dailyVisits: { [todayKey]: todayVisits },
      };
    } catch (err) {
      console.warn("KV read error, falling back to disk/memory:", err);
    }
  }

  // 2. Try disk storage
  try {
    const filePath = IS_VERCEL ? RUNTIME_ANALYTICS_FILE : ANALYTICS_FILE;
    const raw = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.totalVisits === "number") {
      return parsed;
    }
  } catch {
    // try fallback seed file
    try {
      const raw = await fs.readFile(ANALYTICS_FILE, "utf-8");
      return JSON.parse(raw);
    } catch {}
  }

  // 3. Fallback memory
  return {
    totalVisits: globalThis.__ridevo_visitor_count || 1420,
    lastUpdated: new Date().toISOString(),
    dailyVisits: { [todayKey]: globalThis.__ridevo_visitor_today?.count || 142 },
  };
}

async function incrementAnalytics(): Promise<{ totalVisits: number; todayVisits: number }> {
  // 1. Try Upstash / Vercel KV (Atomic INCR)
  if (KV_URL && KV_TOKEN) {
    try {
      const res = await fetch(`${KV_URL}/incr/ridevo_total_visits`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` },
      });
      const data = await res.json();
      const totalVisits = Number(data?.result) || 1420;

      const todayRes = await fetch(`${KV_URL}/incr/ridevo_visits_${todayKey}`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` },
      });
      const todayData = await todayRes.json();
      const todayVisits = Number(todayData?.result) || 142;

      return { totalVisits, todayVisits };
    } catch (err) {
      console.warn("KV incr error, falling back to disk/memory:", err);
    }
  }

  // 2. Local disk or memory
  const current = await loadAnalytics();
  current.totalVisits = (current.totalVisits || 1420) + 1;
  current.dailyVisits = current.dailyVisits || {};
  current.dailyVisits[todayKey] = (current.dailyVisits[todayKey] || 0) + 1;
  current.lastUpdated = new Date().toISOString();

  // Update memory
  globalThis.__ridevo_visitor_count = current.totalVisits;
  globalThis.__ridevo_visitor_today = { date: todayKey, count: current.dailyVisits[todayKey] };

  // Write disk
  try {
    const dir = IS_VERCEL ? RUNTIME_DIR : path.join(process.cwd(), "data");
    const file = IS_VERCEL ? RUNTIME_ANALYTICS_FILE : ANALYTICS_FILE;
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(file, JSON.stringify(current, null, 2), "utf-8");
  } catch (err) {
    console.warn("Disk write skipped or failed:", err);
  }

  return { totalVisits: current.totalVisits, todayVisits: current.dailyVisits[todayKey] };
}

// ── GET: Read current visitor metrics ────────────────────────────────────────
export async function GET() {
  try {
    const data = await loadAnalytics();
    return NextResponse.json({
      success: true,
      totalVisits: data.totalVisits,
      todayVisits: data.dailyVisits[todayKey] || 142,
      lastUpdated: data.lastUpdated,
      storageEngine: KV_URL && KV_TOKEN ? "vercel_kv_upstash" : IS_VERCEL ? "vercel_ephemeral" : "local_disk",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to load visitor count" },
      { status: 500 }
    );
  }
}

// ── POST: Record a new visitor ───────────────────────────────────────────────
export async function POST() {
  try {
    const { totalVisits, todayVisits } = await incrementAnalytics();
    return NextResponse.json({
      success: true,
      totalVisits,
      todayVisits,
      storageEngine: KV_URL && KV_TOKEN ? "vercel_kv_upstash" : IS_VERCEL ? "vercel_ephemeral" : "local_disk",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to increment visitor count" },
      { status: 500 }
    );
  }
}
