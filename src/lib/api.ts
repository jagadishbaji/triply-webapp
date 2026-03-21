// src/lib/api.ts
// Central HTTP client for all NammaCab API calls.
// NEXT_PUBLIC_API_URL = "https://triply-api-connector-1.onrender.com/api"

import { getCookie } from "cookies-next";

// export const API_BASE_URL =
//   process.env.NEXT_PUBLIC_API_URL || "http://localhost:5004/api";
export const API_BASE_URL ="http://localhost:5004/api";
export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {},
  requiresAuth = true
): Promise<T> {
  const token = getCookie("accessToken") as string | undefined;
  // Read role from cookie — sent as header so backend can enforce role-based auth
  // Supabase JWTs don't include app role by default, so we bridge it via header
  const role  = getCookie("role")        as string | undefined;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (requiresAuth && token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Send role header so backend [Authorize(Roles="admin"/"agent")] works
  // Backend reads X-User-Role when JWT doesn't contain app role claim
  if (role && !headers["X-User-Role"]) {
    headers["X-User-Role"] = role;
  }

  // Strip any accidental /api/ prefix to prevent /api/api/... double prefix
  const clean = endpoint.startsWith("/api/") ? endpoint.slice(4) : endpoint;
  const url   = `${API_BASE_URL}${clean}`;

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    let msg = `API error ${res.status}`;
    try {
      const body = await res.json();
      msg = body?.message || body?.msg || msg;
    } catch { /* ignore */ }
    throw new Error(msg);
  }

  if (res.status === 204) return {} as T;
  return res.json();
}
