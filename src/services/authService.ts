import { apiFetch } from "@/lib/api";

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