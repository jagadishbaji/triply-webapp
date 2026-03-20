"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";

// ─── Password strength ──────────────────────────────────────────────────────
function getStrength(pw: string) {
  const checks = [pw.length >= 8, /[A-Z]/.test(pw), /[0-9]/.test(pw), /[^A-Za-z0-9]/.test(pw)];
  const score = checks.filter(Boolean).length;
  return {
    score,
    label: ["", "Weak", "Fair", "Good", "Strong"][score],
    barColor: ["", "bg-red-400", "bg-amber-400", "bg-blue-400", "bg-green-500"][score],
    textColor: ["", "text-red-500", "text-amber-500", "text-blue-500", "text-green-600"][score],
  };
}

// ─── Inner component (uses useSearchParams — must be inside Suspense) ───────
function ResetPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [tokenError, setTokenError] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const strength = getStrength(password);

  // ── Extract tokens from URL ─────────────────────────────────────────────
  // Supabase puts tokens in the URL hash (#access_token=...&refresh_token=...)
  // NOT in query params. We parse window.location.hash on mount.
  useEffect(() => {
    // Try query params first (some setups redirect with ?access_token=...)
    const qToken = searchParams.get("access_token");
    const qRefresh = searchParams.get("refresh_token");

    if (qToken) {
      setAccessToken(qToken);
      setRefreshToken(qRefresh || "");
      return;
    }

    // Parse from hash fragment (default Supabase behaviour)
    if (typeof window !== "undefined") {
      const hash = window.location.hash.substring(1); // remove leading #
      const params = new URLSearchParams(hash);
      const hashToken = params.get("access_token");
      const hashRefresh = params.get("refresh_token");
      const type = params.get("type");

      if (hashToken && type === "recovery") {
        setAccessToken(hashToken);
        setRefreshToken(hashRefresh || "");
      } else {
        setTokenError(true);
      }
    }
  }, [searchParams]);

  // ── Validate ────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const errs: typeof errors = {};
    if (!password || password.length < 8)
      errs.password = "Password must be at least 8 characters";
    else if (!/[A-Z]/.test(password))
      errs.password = "Must include at least one uppercase letter";
    else if (!/[0-9]/.test(password))
      errs.password = "Must include at least one number";

    if (!confirmPassword)
      errs.confirm = "Please confirm your password";
    else if (password !== confirmPassword)
      errs.confirm = "Passwords do not match";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/Auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken,
          refreshToken,
          password,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || "Failed to reset password");
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: any) {
      const msg: string = err?.message || "";
      if (msg.toLowerCase().includes("expired") || msg.toLowerCase().includes("invalid")) {
        setSubmitError("This reset link has expired or is invalid. Please request a new one.");
      } else {
        setSubmitError(msg || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Invalid / missing token screen ─────────────────────────────────────
  if (tokenError) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="w-8 h-8 text-amber-600" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-3">Invalid Reset Link</h2>
        <p className="text-slate-500 text-sm leading-relaxed mb-8">
          This password reset link is missing, expired, or has already been used. Please request a new one.
        </p>
        <Link href="/forgot-password">
          <Button className="w-full h-11 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl">
            Request New Reset Link
          </Button>
        </Link>
        <div className="mt-4">
          <Link href="/login" className="text-sm text-slate-500 hover:text-green-600 font-semibold transition-colors">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  // ── Success screen ──────────────────────────────────────────────────────
  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-3">Password Updated!</h2>
        <p className="text-slate-500 text-sm leading-relaxed mb-6">
          Your password has been changed successfully. Redirecting to login...
        </p>
        <div className="w-full bg-slate-100 rounded-full h-1.5 mb-6 overflow-hidden">
          <motion.div
            className="h-full bg-green-500 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 3, ease: "linear" }}
          />
        </div>
        <Link href="/login">
          <Button className="w-full h-11 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2">
            Login Now
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </motion.div>
    );
  }

  // ── Main form ───────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <h1 className="text-2xl font-black text-slate-900 mb-1">Set new password</h1>
      <p className="text-slate-500 text-sm mb-7">
        Choose a strong password for your Triply Cars account.
      </p>

      <AnimatePresence>
        {submitError && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3"
          >
            <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-1" />
            <p className="text-sm text-red-700 leading-relaxed">{submitError}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

        {/* New password */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
            New Password
          </Label>
          <div className={`flex items-center bg-slate-50 border rounded-xl px-3 h-12 transition-all duration-200
            focus-within:bg-white focus-within:ring-2
            ${errors.password ? "border-red-400 focus-within:ring-red-100" : "border-slate-200 focus-within:border-green-500 focus-within:ring-green-100"}`}
          >
            <Lock className={`w-4 h-4 mr-2 flex-shrink-0 ${errors.password ? "text-red-400" : "text-green-500"}`} />
            <Input
              id="password"
              type={showPw ? "text" : "password"}
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors((er) => ({ ...er, password: "" })); }}
              autoComplete="new-password"
              className="border-0 bg-transparent p-0 h-auto text-sm focus-visible:ring-0 placeholder:text-slate-400 flex-1"
            />
            <button type="button" onClick={() => setShowPw((v) => !v)} tabIndex={-1}
              className="ml-2 text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Strength bar */}
          {password.length > 0 && (
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex gap-1 flex-1">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < strength.score ? strength.barColor : "bg-slate-200"}`} />
                ))}
              </div>
              <span className={`text-xs font-semibold ${strength.textColor}`}>{strength.label}</span>
            </div>
          )}
          {errors.password && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-red-500 inline-block flex-shrink-0" />
              {errors.password}
            </p>
          )}
        </div>

        {/* Confirm password */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700">
            Confirm New Password
          </Label>
          <div className={`flex items-center bg-slate-50 border rounded-xl px-3 h-12 transition-all duration-200
            focus-within:bg-white focus-within:ring-2
            ${errors.confirm ? "border-red-400 focus-within:ring-red-100" : "border-slate-200 focus-within:border-green-500 focus-within:ring-green-100"}`}
          >
            <Lock className={`w-4 h-4 mr-2 flex-shrink-0 ${errors.confirm ? "text-red-400" : "text-green-500"}`} />
            <Input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setErrors((er) => ({ ...er, confirm: "" })); }}
              autoComplete="new-password"
              className="border-0 bg-transparent p-0 h-auto text-sm focus-visible:ring-0 placeholder:text-slate-400 flex-1"
            />
            <button type="button" onClick={() => setShowConfirm((v) => !v)} tabIndex={-1}
              className="ml-2 text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0">
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirm && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-red-500 inline-block flex-shrink-0" />
              {errors.confirm}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-green-600 hover:bg-green-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black text-base rounded-xl shadow-lg shadow-green-500/20 transition-all duration-200 hover:scale-[1.01] mt-1"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Updating Password...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Update Password
              <ArrowRight className="w-5 h-5" />
            </span>
          )}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link href="/login" className="text-sm text-slate-500 hover:text-green-600 font-semibold transition-colors">
          Back to Login
        </Link>
      </div>
    </motion.div>
  );
}

// ─── Page wrapper — Suspense required for useSearchParams in Next.js ────────
export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-green-950 to-slate-900 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle at 30% 50%, #16a34a 0%, transparent 55%),
                          radial-gradient(circle at 70% 50%, #166534 0%, transparent 50%)`
      }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-green-500 to-emerald-400" />
          <div className="px-8 pt-8 pb-10">
            <Link href="/" className="inline-block mb-8">
              <span className="text-xl font-black text-slate-900 hover:text-green-600 transition-colors">
                Triply Cars
              </span>
            </Link>
            <Suspense fallback={
              <div className="flex items-center justify-center py-12">
                <svg className="animate-spin w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            }>
              <ResetPasswordInner />
            </Suspense>
          </div>
        </div>
      </motion.div>
    </div>
  );
}