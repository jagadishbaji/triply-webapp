import { apiFetch } from "@/lib/api";
import { deleteCookie } from "cookies-next";

export interface ProfileUpdateDto {
  id?: string;
  fullName?: string;
  email?: string;
  role?: string;
  mobile?: string;
  avatarUrl?: string;
  preferredLanguage?: string;
}

export interface ProfileDto {
  id: string;
  fullName: string;
  email: string;
  role: string;
  mobile?: string;
  avatarUrl?: string;
  isActive: boolean;
  phoneVerified: boolean;
  preferredLanguage: string;
}

// ── Auth ──────────────────────────────────────────────────────────────────

export async function login(email: string, password: string) {
  return apiFetch("/Auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  }, false);
}

export async function register(userData: {
  fullname: string;
  mobile: string;
  email: string;
  password: string;
}) {
  return apiFetch("/Auth/signup", {
    method: "POST",
    body: JSON.stringify({
      fullName: userData.fullname,
      mobile:   userData.mobile,
      email:    userData.email,
      password: userData.password,
      role:     "user",
    }),
  }, false);
}

export async function forgotPassword(email: string) {
  return apiFetch("/Auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  }, false);
}

export async function resetPassword(accessToken: string, refreshToken: string, newPassword: string) {
  return apiFetch("/Auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ accessToken, refreshToken, password: newPassword }),
  }, false);
}

export async function logout() {
  try {
    await apiFetch("/Auth/logout", { method: "POST" });
  } catch { /* swallow — always clear cookies */ }
  deleteCookie("accessToken");
  deleteCookie("role");
  deleteCookie("loginId");
  deleteCookie("profileId");
  deleteCookie("loggedName");
  return { success: true };
}

// ── Profile ───────────────────────────────────────────────────────────────

export async function getProfile(id: string): Promise<ProfileDto> {
  return apiFetch<ProfileDto>(`/Auth/profile/${id}`, { method: "GET" });
}

export async function updateProfile(id: string, profile: ProfileUpdateDto): Promise<ProfileDto> {
  if (!id) throw new Error("User id is required");
  return apiFetch<ProfileDto>(`/Auth/profile/${id}`, {
    method: "PUT",
    body: JSON.stringify(profile),
  });
}

// ── Agent signup ──────────────────────────────────────────────────────────

export interface AgentSignupPayload {
  email: string;
  password: string;
  agentData: {
    businessName: string;
    ownerName: string;
    phoneNumber: string;
    address: string;
    city: string;
    licenseNumber?: string;
    whatsAppNumber?: string;
  };
}

export async function agentSignup(payload: AgentSignupPayload) {
  return apiFetch("/Auth/agentSignup", {
    method: "POST",
    body: JSON.stringify(payload),
  }, false);
}
