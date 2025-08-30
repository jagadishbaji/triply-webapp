import { apiFetch } from "@/lib/api";
import { deleteCookie } from "cookies-next";

export async function login(email: string, password: string) {
  return apiFetch("/api/Auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  }, false); // no token required
}

export async function register(userData: any) {
  return apiFetch("/api/Auth/signup", {
    method: "POST",
    body: JSON.stringify(userData),
  }, false); // no token required
}
export async function forgotPassword(email: string) {
  return apiFetch("/api/Auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({email}),
  }, false); // no token required
}

// ✅ Logout
export async function logout() {
  try {
    // (Optional) Call backend to invalidate token if you support it
    await apiFetch("/api/Auth/logout", { method: "POST" });

    // Remove cookie
    deleteCookie("accessToken");

    return { success: true };
  } catch (error) {
    // Still remove cookie even if backend fails
    deleteCookie("accessToken");
    return { success: false, error };
  }}