"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { API_BASE_URL } from "@/lib/api";
import { setCookie } from "cookies-next";
import Link from "next/link";
import { Lock, Mail, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";

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
    <div className="min-h-screen w-full flex bg-white font-sans">
      
      {/* ── Left Pane: Branding (Hidden on smaller screens) ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#02180d] relative overflow-hidden flex-col p-12 xl:p-16">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-green-600/10 blur-[120px]" />
          <div className="absolute bottom-[10%] right-[10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[100px]" />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0 w-fit">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
              <span className="text-[#02180d] font-black text-xl leading-none" style={{fontFamily:"'Noto Sans Kannada',sans-serif"}}>ನ</span>
            </div>
            <div className="leading-none">
              <span className="font-black text-2xl text-white tracking-tight">namma</span>
              <span className="font-black text-2xl text-green-400 tracking-widest uppercase">CAB</span>
            </div>
          </Link>
        </div>

        {/* Hero Text (Shifted Higher to match Agent Signup) */}
        <div className="relative z-10 mt-20 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-green-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <ShieldCheck className="w-3.5 h-3.5" /> Secure Partner Portal
          </div>
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-[1.1] tracking-tight mb-6">
            Every Cab in Hubli,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">
              One Platform.
            </span>
          </h1>
          <p className="text-emerald-100/70 text-lg leading-relaxed">
            Manage your fleet, accept confirmed bookings, and grow your travel business with zero upfront platform fees.
          </p>
        </div>

        {/* Footer text (Pushed to bottom) */}
        <div className="relative z-10 mt-auto text-emerald-100/40 text-sm">
          © {new Date().getFullYear()} RIDEVO Technologies. All rights reserved.
        </div>
      </div>

      {/* ── Right Pane: Login Form ── */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 relative">
        
        {/* Mobile Logo (Only visible when Left Pane is hidden) */}
        <div className="lg:hidden absolute top-8 left-8">
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center shadow-md shadow-green-600/20">
              <span className="text-white font-black text-base leading-none" style={{fontFamily:"'Noto Sans Kannada',sans-serif"}}>ನ</span>
            </div>
            <div className="leading-none">
              <span className="font-black text-xl text-slate-900 tracking-tight">namma</span>
              <span className="font-black text-xl text-green-600 tracking-widest uppercase">CAB</span>
            </div>
          </Link>
        </div>

        <div className="w-full max-w-[420px] mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
            <p className="text-slate-500 mt-2 text-base">Please enter your details to sign in.</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
              <span className="font-medium leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-semibold text-slate-700">Email Address</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <Input
                  id="email" 
                  type="email" 
                  placeholder="you@company.com" 
                  required
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 bg-white border-slate-200 text-slate-900 rounded-lg focus-visible:ring-1 focus-visible:ring-green-500 focus-visible:border-green-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</Label>
                <Link href="/forgot-password" className="text-sm font-medium text-green-600 hover:text-green-700 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <Input
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  required
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 bg-white border-slate-200 text-slate-900 rounded-lg focus-visible:ring-1 focus-visible:ring-green-500 focus-visible:border-green-500 transition-all"
                />
              </div>
            </div>

            <Button
              type="submit" 
              disabled={loading}
              className="w-full h-12 mt-4 bg-green-600 hover:bg-green-700 text-white font-semibold text-base rounded-lg shadow-sm transition-all group"
            >
              {loading ? "Verifying credentials..." : "Sign in"}
              {!loading && <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />}
            </Button>
          </form>
          
          <div className="mt-10 pt-6 border-t border-slate-100 space-y-4">
            <div className="bg-slate-50 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-slate-100">
              <div className="text-sm">
                <span className="text-slate-500 block text-xs font-semibold uppercase tracking-wider mb-0.5">For Partners</span>
                <span className="font-medium text-slate-900">Tours & Travels operator?</span>
              </div>
              <Link href="/agent-signup">
                <Button variant="outline" size="sm" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900">
                  Partner with us
                </Button>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}