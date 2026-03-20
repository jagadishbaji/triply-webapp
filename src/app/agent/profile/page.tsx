"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { getCookie } from "cookies-next";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast, Toaster } from "sonner";

import { getProfile, updateProfile } from "@/services/authService";

interface ProfileDto {
  id: string;
  fullName: string;
  email: string;
  role?: string;
  mobile?: string;
}

export default function AgentProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ProfileDto>({ id: "", fullName: "", email: "", role: "agent", mobile: "" });

  const profileId = (getCookie("profileId") as string) || ""; // set at login

  const load = useCallback(async () => {
    if (!profileId) {
      setError("Profile ID not found. Please login again.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getProfile(profileId);
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
  }, [profileId]);

  useEffect(() => {
    load();
  }, [load]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const onSave = async () => {
    if (!form.id) return;
    setSaving(true);
    try {
      await updateProfile(form.id, {
        fullName: form.fullName,
      mobile: form.mobile || "",
      email: form.email,
      role: getCookie("role") as string,
      id: getCookie("profileId") as string
      });
      const refreshed = await getProfile(form.id);
      setForm({
        id: refreshed.id,
        fullName: refreshed.fullName,
        email: refreshed.email,
        role: refreshed.role,
        mobile: refreshed.mobile,
      });
      toast.success("Profile updated");
    } catch (e: any) {
      toast.error(e?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
      
        <Toaster richColors position="top-right" />
        <div className="flex flex-1 flex-col gap-4 p-6">
         

          <Card className="rounded-2xl shadow-xl border-0 overflow-hidden max-w-3xl mx-auto w-full">
            <div className="bg-gradient-to-r from-green-500 to-green-700 p-6 text-white">
              <div className="flex items-center gap-4">
                <div className="relative w-14 h-14 rounded-full overflow-hidden ring-4 ring-white/30">
                  <Image src="/images/avatar-placeholder.png" alt="avatar" fill sizes="56px" className="object-cover" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{form.fullName || "Agent"}</h2>
                  <p className="text-white/90 text-sm">{form.role || "agent"}</p>
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
                    <Button variant="outline" className="rounded-xl" onClick={load} disabled={saving}>
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
      </SidebarInset>
    </SidebarProvider>
  );
}
