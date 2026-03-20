"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/Auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      // Always show success — don't reveal if email exists or not
      setSent(true);
    } catch {
      // Even on network error show success — security best practice
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-green-950 to-slate-900 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background glow */}
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
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

          {/* Top accent */}
          <div className="h-1.5 w-full bg-gradient-to-r from-green-500 to-emerald-400" />

          <div className="px-8 pt-8 pb-10">
            {/* Logo */}
            <Link href="/" className="inline-block mb-8">
              <span className="text-xl font-black text-slate-900 hover:text-green-600 transition-colors">
                Triply Cars
              </span>
            </Link>

            <AnimatePresence mode="wait">
              {/* ── Sent state ─────────────────────────────────────────── */}
              {sent ? (
                <motion.div
                  key="sent"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 mb-3">Check your email</h2>
                  <p className="text-slate-500 text-sm leading-relaxed mb-2">
                    If <span className="font-semibold text-slate-700">{email}</span> is registered, you'll receive a password reset link shortly.
                  </p>
                  <p className="text-slate-400 text-xs leading-relaxed mb-8">
                    Don't see it? Check your spam/junk folder. The link expires in 1 hour.
                  </p>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => { setSent(false); setEmail(""); }}
                      className="text-sm text-green-600 hover:text-green-500 font-semibold transition-colors"
                    >
                      Try a different email
                    </button>
                    <Link href="/login">
                      <Button variant="outline" className="w-full h-11 border-slate-200 text-slate-600 rounded-xl font-semibold flex items-center justify-center gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Login
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              ) : (
                /* ── Form state ──────────────────────────────────────── */
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <h1 className="text-2xl font-black text-slate-900 mb-1">Forgot your password?</h1>
                  <p className="text-slate-500 text-sm mb-7">
                    Enter your email and we'll send you a reset link.
                  </p>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mb-5 flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3"
                      >
                        <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                        <p className="text-sm text-red-700">{error}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                        Email Address
                      </Label>
                      <div className={`flex items-center bg-slate-50 border rounded-xl px-3 h-12 transition-all duration-200
                        focus-within:bg-white focus-within:ring-2
                        ${error ? "border-red-400 focus-within:ring-red-100" : "border-slate-200 focus-within:border-green-500 focus-within:ring-green-100"}`}
                      >
                        <Mail className={`w-4 h-4 mr-2 flex-shrink-0 ${error ? "text-red-400" : "text-green-500"}`} />
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); setError(""); }}
                          autoComplete="email"
                          className="border-0 bg-transparent p-0 h-auto text-sm focus-visible:ring-0 placeholder:text-slate-400 text-slate-800"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 bg-green-600 hover:bg-green-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black text-base rounded-xl shadow-lg shadow-green-500/20 transition-all duration-200 hover:scale-[1.01]"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Sending...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Send Reset Link
                          <ArrowRight className="w-5 h-5" />
                        </span>
                      )}
                    </Button>
                  </form>

                  <div className="mt-6 text-center">
                    <Link href="/login" className="text-sm text-slate-500 hover:text-green-600 font-semibold transition-colors flex items-center justify-center gap-1">
                      <ArrowLeft className="w-4 h-4" />
                      Back to Login
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}