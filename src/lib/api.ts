// src/lib/api.ts
//
// ROOT CAUSE OF ALL API FAILURES:
// NEXT_PUBLIC_API_URL = "https://triply-api-connector-1.onrender.com/api"
// Services call apiFetch("/api/prices") → URL becomes .../api/api/prices → 404
//
// FIX: apiFetch endpoints must NOT include the leading /api/ prefix.
// The base URL already contains /api. Endpoints are plain paths like /prices.
//
// Token source: services pass Authorization via headers from cookies.
// apiFetch also reads from localStorage as a fallback. Both are supported.

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5004/api";

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {},
  requiresAuth: boolean = true
): Promise<T> {
  // Token from localStorage (fallback — cookies are the primary source
  // passed directly by each service via options.headers)
  const localToken =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  // Only add Authorization from localStorage if the service hasn't already
  // provided one via options.headers
  if (requiresAuth && localToken && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${localToken}`;
  }

  // Strip any accidental leading /api from endpoint to prevent /api/api/...
  // e.g. "/api/prices" → "/prices", "/prices" → "/prices"
  const cleanEndpoint = endpoint.startsWith("/api/")
    ? endpoint.slice(4)   // remove the leading /api
    : endpoint;

  const url = `${API_BASE_URL}${cleanEndpoint}`;

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorMessage = `API error: ${res.status}`;
    try {
      const errBody = await res.json();
      errorMessage = errBody?.message || errBody?.msg || errorMessage;
    } catch {
      // ignore JSON parse errors on error responses
    }
    throw new Error(errorMessage);
  }

  return res.json();
}