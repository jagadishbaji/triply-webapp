"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { register } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User, Mail, Phone, Lock, Eye, EyeOff,
  ArrowRight, CheckCircle2, Car, Shield, Zap,
} from "lucide-react";
import Link from "next/link";

// ─── Password strength ─────────────────────────────────────────────────────
function getStrength(pw: string) {
  const checks = [
    pw.length >= 8,
    /[A-Z]/.test(pw),
    /[0-9]/.test(pw),
    /[^A-Za-z0-9]/.test(pw),
  ];
  const score = checks.filter(Boolean).length;
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "bg-red-400", "bg-amber-400", "bg-blue-400", "bg-green-500"];
  const textColors = ["", "text-red-500", "text-amber-500", "text-blue-500", "text-green-600"];
  return { score, label: labels[score], barColor: colors[score], textColor: textColors[score] };
}

// ─── Reusable field ────────────────────────────────────────────────────────
function Field({
  id, label, icon: Icon, error, hint, rightElement, ...props
}: {
  id: string;
  label: string;
  icon: React.ElementType;
  error?: string;
  hint?: string;
  rightElement?: React.ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-sm font-semibold text-slate-700">
        {label}
      </Label>
      <div className={`flex items-center bg-slate-50 border rounded-xl px-3 h-12 transition-all duration-200
        focus-within:bg-white focus-within:ring-2
        ${error
          ? "border-red-400 bg-red-50/30 focus-within:ring-red-100"
          : "border-slate-200 focus-within:border-green-500 focus-within:ring-green-100"
        }`}
      >
        <Icon className={`w-4 h-4 mr-2 flex-shrink-0 ${error ? "text-red-400" : "text-green-500"}`} />
        <Input
          id={id}
          {...props}
          className="border-0 bg-transparent p-0 h-auto text-sm focus-visible:ring-0 placeholder:text-slate-400 text-slate-800 flex-1"
        />
        {rightElement}
      </div>
      <AnimatePresence mode="wait">
        {error && (
          <motion.p
            key="error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="text-xs text-red-600 flex items-center gap-1"
          >
            <span className="w-1 h-1 rounded-full bg-red-500 flex-shrink-0 inline-block" />
            {error}
          </motion.p>
        )}
        {!error && hint && (
          <motion.p
            key="hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-slate-400"
          >
            {hint}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Left panel perks ──────────────────────────────────────────────────────
const PERKS = [
  { icon: Zap, title: "Book in 60 seconds", desc: "Find and confirm a cab faster than any phone call." },
  { icon: Shield, title: "Verified operators", desc: "Every tours & travels is reviewed before listing." },
  { icon: Car, title: "All vehicles in one place", desc: "Mini, Sedan, SUV, Tempo — all Hubli operators, one screen." },
];

// ─── Main component ────────────────────────────────────────────────────────
export default function UserSignupPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "", confirmPassword: "",
  });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);

  const strength = getStrength(form.password);

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      setErrors((er) => ({ ...er, [field]: "" }));
      setSubmitError("");
    };

  // ── Client-side validation ─────────────────────────────────────────────
  const validate = (): boolean => {
    const errs: Partial<typeof form> = {};

    if (!form.name.trim() || form.name.trim().length < 2)
      errs.name = "Enter your full name (at least 2 characters)";

    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Enter a valid email address";

    if (!form.phone || !/^[6-9][0-9]{9}$/.test(form.phone))
      errs.phone = "Enter a valid 10-digit Indian mobile number";

    if (!form.password || form.password.length < 8)
      errs.password = "Password must be at least 8 characters";
    else if (!/[A-Z]/.test(form.password))
      errs.password = "Must include at least one uppercase letter";
    else if (!/[0-9]/.test(form.password))
      errs.password = "Must include at least one number";

    if (!form.confirmPassword)
      errs.confirmPassword = "Please confirm your password";
    else if (form.password !== form.confirmPassword)
      errs.confirmPassword = "Passwords do not match";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await register({
        fullname: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        mobile: form.phone.trim(),
        password: form.password,
      });

      if (res?.success === false) {
        throw new Error(res?.error || "Registration failed");
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: any) {
      const msg: string = err?.message || "";
      if (msg.toLowerCase().includes("exist") || msg.toLowerCase().includes("already")) {
        setSubmitError("An account with this email already exists. Please login instead.");
      } else if (msg.includes("mobile") || msg.includes("phone")) {
        setSubmitError("This mobile number is already registered.");
      } else {
        setSubmitError(msg || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ─────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-green-950 to-slate-900 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-3">Account Created!</h2>
          <p className="text-slate-500 leading-relaxed mb-2">
            Welcome to <span className="font-semibold text-green-600">Triply Cars</span>.
          </p>
          <p className="text-slate-500 leading-relaxed mb-8">
            Redirecting you to login in a moment...
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
            <Button className="w-full h-12 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl text-base">
              Login Now
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  // ── Main layout ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* ── LEFT PANEL ─────────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[42%] bg-gradient-to-br from-slate-950 via-green-950 to-slate-900 flex-col justify-between p-12 relative overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
          backgroundImage: `radial-gradient(circle at 20% 40%, #16a34a 0%, transparent 55%),
                            radial-gradient(circle at 80% 70%, #166534 0%, transparent 50%)`
        }} />

        <div className="relative z-10">
          <Link href="/" className="inline-block mb-16">
            <span className="text-2xl font-black text-white hover:text-green-400 transition-colors">
              Triply Cars
            </span>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 bg-green-500/15 border border-green-500/30 text-green-400 px-3 py-1.5 rounded-full text-xs font-semibold mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Hubli's #1 Cab Marketplace
            </div>

            <h1 className="text-4xl font-black text-white leading-tight mb-4">
              Your Next Ride <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">
                Starts Here.
              </span>
            </h1>

            <p className="text-slate-400 text-base leading-relaxed mb-10">
              Create a free account and book from all local Hubli tours & travels operators in one place — no calls, no confusion.
            </p>
          </motion.div>

          <div className="flex flex-col gap-4">
            {PERKS.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                className="flex items-start gap-4 bg-white/5 border border-white/8 rounded-2xl px-5 py-4"
              >
                <div className="w-9 h-9 rounded-xl bg-green-500/15 border border-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <p.icon className="w-[18px] h-[18px] text-green-400" />
                </div>
                <div>
                  <div className="text-white font-bold text-sm mb-0.5">{p.title}</div>
                  <div className="text-slate-400 text-xs leading-relaxed">{p.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-slate-500 text-xs mt-8">
          Are you a tours & travels owner?{" "}
          <Link href="/agent-signup" className="text-green-400 hover:text-green-300 font-semibold transition-colors">
            Register your business
          </Link>
        </div>
      </div>

      {/* ── RIGHT PANEL — form ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16 overflow-y-auto">

        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <Link href="/" className="text-2xl font-black text-slate-900">Triply Cars</Link>
          <p className="text-slate-500 text-sm mt-1">Create your account</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-lg mx-auto"
        >
          <div className="mb-8">
            <h2 className="text-3xl font-black text-slate-900 mb-2">Create your account</h2>
            <p className="text-slate-500 text-base">
              Already have an account?{" "}
              <Link href="/login" className="text-green-600 font-bold hover:text-green-500 transition-colors">
                Login here
              </Link>
            </p>
          </div>

          {/* Global error */}
          <AnimatePresence>
            {submitError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3"
              >
                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 block" />
                </div>
                <p className="text-sm text-red-700 leading-relaxed">{submitError}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

            {/* Full name */}
            <Field
              id="name"
              label="Full Name"
              icon={User}
              type="text"
              placeholder="e.g. Rahul Sharma"
              value={form.name}
              onChange={set("name")}
              error={errors.name}
              autoComplete="name"
            />

            {/* Email */}
            <Field
              id="email"
              label="Email Address"
              icon={Mail}
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={set("email")}
              error={errors.email}
              autoComplete="email"
            />

            {/* Phone */}
            <Field
              id="phone"
              label="Mobile Number"
              icon={Phone}
              type="tel"
              placeholder="10-digit mobile number"
              maxLength={10}
              value={form.phone}
              onChange={set("phone")}
              error={errors.phone}
              hint="Indian numbers only (starts with 6, 7, 8 or 9)"
              autoComplete="tel"
            />

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                Password
              </Label>
              <div className={`flex items-center bg-slate-50 border rounded-xl px-3 h-12 transition-all duration-200
                focus-within:bg-white focus-within:ring-2
                ${errors.password
                  ? "border-red-400 bg-red-50/30 focus-within:ring-red-100"
                  : "border-slate-200 focus-within:border-green-500 focus-within:ring-green-100"
                }`}
              >
                <Lock className={`w-4 h-4 mr-2 flex-shrink-0 ${errors.password ? "text-red-400" : "text-green-500"}`} />
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={set("password")}
                  autoComplete="new-password"
                  className="border-0 bg-transparent p-0 h-auto text-sm focus-visible:ring-0 placeholder:text-slate-400 flex-1"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="ml-2 text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
                  tabIndex={-1}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength bar */}
              {form.password.length > 0 && (
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex gap-1 flex-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          i < strength.score ? strength.barColor : "bg-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                  <span className={`text-xs font-semibold ${strength.textColor}`}>
                    {strength.label}
                  </span>
                </div>
              )}

              <AnimatePresence mode="wait">
                {errors.password && (
                  <motion.p
                    key="pw-err"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-xs text-red-600 flex items-center gap-1"
                  >
                    <span className="w-1 h-1 rounded-full bg-red-500 inline-block flex-shrink-0" />
                    {errors.password}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Confirm password */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700">
                Confirm Password
              </Label>
              <div className={`flex items-center bg-slate-50 border rounded-xl px-3 h-12 transition-all duration-200
                focus-within:bg-white focus-within:ring-2
                ${errors.confirmPassword
                  ? "border-red-400 bg-red-50/30 focus-within:ring-red-100"
                  : "border-slate-200 focus-within:border-green-500 focus-within:ring-green-100"
                }`}
              >
                <Lock className={`w-4 h-4 mr-2 flex-shrink-0 ${errors.confirmPassword ? "text-red-400" : "text-green-500"}`} />
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={form.confirmPassword}
                  onChange={set("confirmPassword")}
                  autoComplete="new-password"
                  className="border-0 bg-transparent p-0 h-auto text-sm focus-visible:ring-0 placeholder:text-slate-400 flex-1"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="ml-2 text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
                  tabIndex={-1}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <AnimatePresence mode="wait">
                {errors.confirmPassword && (
                  <motion.p
                    key="cp-err"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-xs text-red-600 flex items-center gap-1"
                  >
                    <span className="w-1 h-1 rounded-full bg-red-500 inline-block flex-shrink-0" />
                    {errors.confirmPassword}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Terms */}
            <p className="text-xs text-slate-400 leading-relaxed">
              By creating an account you agree to our{" "}
              <a href="#" className="text-slate-600 underline underline-offset-2 hover:text-green-600 transition-colors">Terms of Service</a>
              {" "}and{" "}
              <a href="#" className="text-slate-600 underline underline-offset-2 hover:text-green-600 transition-colors">Privacy Policy</a>.
            </p>

            {/* Submit */}
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
                  Creating Account...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Create Account
                  <ArrowRight className="w-5 h-5" />
                </span>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Are you a tours & travels owner?{" "}
            <Link href="/agent-signup" className="text-green-600 font-bold hover:text-green-500 transition-colors">
              Register your business
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}