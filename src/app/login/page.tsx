"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { API_BASE_URL } from "@/lib/api";
import { apiFetch } from "@/lib/api";
import { setCookie } from "cookies-next";
import Link from "next/link";
import { Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Step 1: Login
      const res = await fetch(`${API_BASE_URL}/Auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || err?.msg || "Login failed");
      }

      const data = await res.json();

      if (!data?.accessToken || !data?.profile?.role) {
        throw new Error("Invalid response from server");
      }

      const cookieOpts = { maxAge: 60 * 60 * 24, path: "/" };
      setCookie("accessToken", data.accessToken,      cookieOpts);
      setCookie("role",        data.profile.role,     cookieOpts);
      setCookie("profileId",   data.profile.id,       cookieOpts);
      setCookie("loginId",     data.user?.id ?? data.profile.id, cookieOpts);
      setCookie("loggedName",  data.profile.fullName, cookieOpts);

      // Step 2: If agent — fetch their Agents.id and store it
      // loginId = Profiles.id (auth user id). Agent pages need Agents.id.
      if (data.profile.role === "agent") {
        try {
          const agentRes = await fetch(`${API_BASE_URL}/agents/me`, {
            headers: { Authorization: `Bearer ${data.accessToken}` },
          });
          if (agentRes.ok) {
            const agent = await agentRes.json();
            setCookie("agentId", agent.id, cookieOpts);
          }
        } catch {
          // Non-fatal — agent pages will fall back to loginId
        }
      }

      // Step 3: Redirect
      if (data.profile.role === "admin") {
        router.push("/admin/dashboard");
      } else if (data.profile.role === "agent") {
        router.push("/agent/dashboard");
      } else {
        router.push("/user/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="pb-2 text-center">
          <div className="w-12 h-12 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-black text-lg">ನ</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Welcome back</h1>
          <p className="text-slate-500 text-sm">Sign in to NammaCab</p>
        </CardHeader>
        <CardContent className="pt-4">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">
              {error}
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-sm font-semibold text-slate-700">Email</Label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 h-12 focus-within:bg-white focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-100 transition-all">
                <Mail className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                <Input
                  id="email" type="email" placeholder="you@example.com" required
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="border-0 bg-transparent p-0 h-auto text-sm focus-visible:ring-0 placeholder:text-slate-400"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</Label>
                <Link href="/forgot-password" className="text-xs text-green-600 hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 h-12 focus-within:bg-white focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-100 transition-all">
                <Lock className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                <Input
                  id="password" type="password" placeholder="••••••••" required
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="border-0 bg-transparent p-0 h-auto text-sm focus-visible:ring-0 placeholder:text-slate-400"
                />
              </div>
            </div>
            <Button
              type="submit" disabled={loading}
              className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl"
            >
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          <div className="mt-6 text-center space-y-2 text-sm text-slate-500">
            <p>
              New customer?{" "}
              <Link href="/user-signup" className="text-green-600 font-semibold hover:underline">Create account</Link>
            </p>
            <p>
              Tours & Travels operator?{" "}
              <Link href="/agent-signup" className="text-green-600 font-semibold hover:underline">Partner with us</Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
