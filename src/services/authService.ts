import { apiFetch } from "@/lib/api";
import { deleteCookie, getCookie } from "cookies-next";

export type ProfileUpdateDto = {
  fullName?: string;
  mobile?: string;
  role?: string;
  id?:string
  email?:string
};

export async function login(email: string, password: string) {
  return apiFetch("/api/Auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  }, false); // no token required
}

export async function register(userData: { fullname: string; mobile: string; email: string; password: string }) {
  return apiFetch("/api/Auth/signup", {
    method: "POST",
    body: JSON.stringify({
      fullName: userData.fullname,
      mobile: userData.mobile,
      email: userData.email,
      password: userData.password,
      role: "user"
    }),
  }, false); // no token required
}

export async function forgotPassword(email: string) {
  return apiFetch("/api/Auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  }, false); // no token required
}

// ✅ Logout
export async function logout() {
  try {
    // (Optional) Call backend to invalidate token if you support it
    await apiFetch("/api/Auth/logout", { method: "POST" });

    // Remove cookie
    deleteCookie("accessToken");
    deleteCookie("role");

    return { success: true };
  } catch (error) {
    // Still remove cookie even if backend fails
    deleteCookie("accessToken");
    deleteCookie("role");
    return { success: false, error };
  }
}

// ✅ Reset Password (accepts token + new password)
export async function resetPassword(token: string, newPassword: string) {
  return apiFetch("/api/Auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
  }, false);
}

// ✅ Get Profile by id
export async function getProfile(id: string) {
  return apiFetch(`/api/Auth/profile/${id}`, {
    method: "GET"   
  });
}

// ✅ Update Profile (FIXED)
export async function updateProfile(
  id: string,
  profile: ProfileUpdateDto
) {
  if (!id) throw new Error("User id is required");

  return apiFetch(
    `/api/Auth/profile/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(profile),
    }
  );
}
