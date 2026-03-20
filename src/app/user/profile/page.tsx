"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getCookie } from "cookies-next";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast, Toaster } from "sonner";

import UserHeader from "@/components/user/UserHeader";
import useAuthGuard from "@/components/hooks/useAuthGuard";
import { getProfile, updateProfile } from "@/services/authService";

interface ProfileDto {
  id: string;
  fullName: string;
  email: string;
  role?: string;
  mobile?: string;
}

export default function UserProfilePage() {
  useAuthGuard();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<ProfileDto>({ id: "", fullName: "", email: "", role: "user", mobile: "" });

  const onLogout = useCallback(async () => {
    router.push("/login");
  }, [router]);

  useEffect(() => {
    const token = getCookie("accessToken");
    const id = getCookie("profileId") as string | undefined; // assuming userId cookie is set after login

    if (!token) {
      router.push("/login?redirect=/user/profile");
      return;
    }

    if (!id) {
      setError("No user id available.");
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getProfile(id);
        setForm({
          id: data.id,
          fullName: data.fullName,
          email: data.email,
          role: data.role,
          mobile: data.mobile,
        });
      } catch (e: any) {
        setError(e?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const onSave = async () => {
  if (!form.id) {
    toast.error("Invalid user profile");
    return;
  }

  setSaving(true);
  try {
    await updateProfile(form.id, {
      fullName: form.fullName,
      mobile: form.mobile || "",
      email: form.email,
      role: getCookie("role") as string,
      id: getCookie("profileId") as string
    });

    // Re-fetch profile after update
    const refreshed = await getProfile(form.id);

    setForm({
      id: refreshed.id,
      fullName: refreshed.fullName,
      email: refreshed.email,
      role: refreshed.role,
      mobile: refreshed.mobile,
    });

    toast.success("Profile updated successfully");
  } catch (e: any) {
    toast.error(e?.message || "Failed to update profile");
  } finally {
    setSaving(false);
  }
};
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-green-100 via-white to-green-200">
      <UserHeader onLogout={onLogout} title="My Profile" />
      <Toaster richColors position="top-right" />

      <main className="py-10">
        <div className="max-w-3xl mx-auto px-4">
            <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900">Profile</h2>
            <p className="text-gray-600 mt-2">Manage your profile information</p>
            <div className="h-1 w-24 bg-gradient-to-r from-green-400 to-green-600 rounded-full mx-auto mt-4" />
          </div>
          <Card className="rounded-2xl shadow-xl border-0 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-700 p-6 text-white">
              <div className="flex items-center gap-4">
                <div className="relative w-14 h-14 rounded-full overflow-hidden ring-4 ring-white/30">
                  <Image src="/images/avatar-placeholder.png" alt="avatar" fill sizes="56px" className="object-cover" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{form.fullName || "User"}</h2>
                  <p className="text-white/90 text-sm">{form.role || "user"}</p>
                </div>
              </div>
            </div>

            <CardContent className="p-6 bg-white">
              {loading ? (
                <div className="text-gray-600">Loading profile...</div>
              ) : error ? (
                <div className="text-red-600">{error}</div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <Label className="text-gray-700">Full name</Label>
                    <Input name="fullName" value={form.fullName} onChange={onChange} className="mt-2 rounded-xl focus-visible:ring-green-600" />
                  </div>
                  <div>
                    <Label className="text-gray-700">Email</Label>
                    <Input value={form.email} disabled className="mt-2 rounded-xl bg-gray-50 text-gray-600" />
                  </div>
                  <div>
                    <Label className="text-gray-700">Mobile</Label>
                    <Input name="mobile" value={form.mobile || ""} onChange={onChange} className="mt-2 rounded-xl focus-visible:ring-green-600" />
                  </div>

                  <Separator className="my-2" />

                  <div className="flex items-center justify-end gap-3">
                    <Button variant="outline" className="rounded-xl" onClick={() => router.refresh()} disabled={saving}>
                      Reset
                    </Button>
                    <Button onClick={onSave} disabled={saving} className="rounded-xl bg-gradient-to-r from-green-500 to-green-700 text-white hover:from-green-600 hover:to-green-800">
                      {saving ? "Saving..." : "Save changes"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
