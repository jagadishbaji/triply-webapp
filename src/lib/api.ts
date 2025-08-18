// src/lib/api.ts

//export const API_BASE_URL = "https://triply-api-connector-1.onrender.com";
export const API_BASE_URL = "http://localhost:5004";

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {},
  requiresAuth: boolean = true
): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  // ✅ Explicitly use Record<string, string>
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>), // cast here
  };

  if (requiresAuth && token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}
