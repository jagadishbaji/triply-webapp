"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { createAgent } from "@/services/admin/agentsService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Building2, Mail, Phone, MapPin, CreditCard,
  Lock, CheckCircle2, ArrowRight, Eye, EyeOff,
  Car, Shield, TrendingUp, Users,
} from "lucide-react";
import Link from "next/link";

// ─── Validation schema ─────────────────────────────────────────────────────
const schema = z
  .object({
    name: z.string().min(2, "Business name must be at least 2 characters"),
    email: z.string().email("Enter a valid email address"),
    phoneNumber: z
      .string()
      .regex(/^[6-9][0-9]{9}$/, "Enter a valid 10-digit Indian mobile number"),
    address: z.string().min(5, "Enter your full business address"),
    licenseNumber: z
      .string()
      .min(3, "Enter a valid license or registration number"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

// ─── Left-panel benefit cards ──────────────────────────────────────────────
const BENEFITS = [
  {
    icon: TrendingUp,
    title: "Grow Your Business",
    desc: "Reach hundreds of customers in Hubli–Dharwad looking for cabs every day.",
  },
  {
    icon: Users,
    title: "Zero Cost to Start",
    desc: "List your vehicles for free. No upfront fees, no commission for 3 months.",
  },
  {
    icon: Shield,
    title: "Verified & Trusted",
    desc: "Verified badge builds customer trust and gets you more bookings.",
  },
  {
    icon: Car,
    title: "Manage Everything",
    desc: "Track bookings, update availability and prices from your dashboard.",
  },
];

// ─── Single form field component ───────────────────────────────────────────
function Field({
  id,
  label,
  icon: Icon,
  error,
  ...props
}: {
  id: string;
  label: string;
  icon: React.ElementType;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-sm font-semibold text-slate-700">
        {label}
      </Label>
      <div
        className={`flex items-center bg-slate-50 border rounded-xl px-3 h-12 transition-all duration-200
          focus-within:bg-white focus-within:ring-2 focus-within:ring-green-100
          ${error ? "border-red-400 bg-red-50/30 focus-within:ring-red-100" : "border-slate-200 focus-within:border-green-500"}`}
      >
        <Icon className={`w-4 h-4 mr-2 flex-shrink-0 ${error ? "text-red-400" : "text-green-500"}`} />
        <Input
          id={id}
          {...props}
          className="border-0 bg-transparent p-0 h-auto text-sm focus-visible:ring-0 placeholder:text-slate-400 text-slate-800"
        />
      </div>
      <AnimatePresence mode="wait">
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="text-xs text-red-600 flex items-center gap-1"
          >
            <span className="inline-block w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────
export default function AgentSignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  // Password strength indicator
  const password = watch("password", "");
  const strength = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const strengthScore = strength.filter(Boolean).length;
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strengthScore];
  const strengthColor = ["", "bg-red-400", "bg-amber-400", "bg-blue-400", "bg-green-500"][strengthScore];

  const onSubmit = async (data: FormData) => {
    setSubmitError("");
    try {
      await createAgent({
        name: data.name,
        email: data.email,
        phoneNumber: data.phoneNumber,
        address: data.address,
        licenseNumber: data.licenseNumber,
        password: data.password,
        isActive: false,
      });
      reset();
      setSuccess(true);
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("already") || msg.includes("exist") || msg.includes("duplicate")) {
        setSubmitError("An account with this email already exists. Please login instead.");
      } else if (msg.includes("401") || msg.includes("403")) {
        setSubmitError("Request not authorised. Please try again.");
      } else {
        setSubmitError(msg || "Registration failed. Please check your details and try again.");
      }
    }
  };

  // ── Success screen ──────────────────────────────────────────────────────
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
          <h2 className="text-2xl font-black text-slate-900 mb-3">
            Registration Submitted!
          </h2>
          <p className="text-slate-500 leading-relaxed mb-2">
            Thank you for registering with <span className="font-semibold text-green-600">Triply Cars</span>.
          </p>
          <p className="text-slate-500 leading-relaxed mb-8">
            Our team will review and approve your account within <strong className="text-slate-700">24 hours</strong>. You'll receive a confirmation on your registered email.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-8 text-sm text-amber-700 text-left">
            <strong>Next step:</strong> Once approved, you can login and start listing your vehicles to receive bookings.
          </div>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => router.push("/")}
              className="w-full h-12 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl text-base"
            >
              Go to Home
            </Button>
            <Link href="/login">
              <Button variant="outline" className="w-full h-12 border-slate-200 text-slate-600 rounded-xl font-semibold">
                Already approved? Login
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Main form ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* ── LEFT PANEL (desktop only) ──────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[42%] bg-gradient-to-br from-slate-950 via-green-950 to-slate-900 flex-col justify-between p-12 relative overflow-hidden flex-shrink-0">
        {/* Background glow */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
          backgroundImage: `radial-gradient(circle at 20% 40%, #16a34a 0%, transparent 55%),
                            radial-gradient(circle at 80% 70%, #166534 0%, transparent 50%)`
        }} />

        <div className="relative z-10">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mb-16 group">
            <span className="text-2xl font-black text-white group-hover:text-green-400 transition-colors">
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
              For Tours & Travels Owners
            </div>
            <h1 className="text-4xl font-black text-white leading-tight mb-4">
              List Your Cabs.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">
                Grow Your Business.
              </span>
            </h1>
            <p className="text-slate-400 text-base leading-relaxed mb-10">
              Join Hubli's first cab marketplace. Get bookings from customers who are already searching for rides in your city.
            </p>
          </motion.div>

          {/* Benefit cards */}
          <div className="flex flex-col gap-4">
            {BENEFITS.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                className="flex items-start gap-4 bg-white/5 border border-white/8 rounded-2xl px-5 py-4 hover:bg-white/8 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-green-500/15 border border-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <b.icon className="w-4.5 h-4.5 text-green-400 w-[18px] h-[18px]" />
                </div>
                <div>
                  <div className="text-white font-bold text-sm mb-0.5">{b.title}</div>
                  <div className="text-slate-400 text-xs leading-relaxed">{b.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom note */}
        <div className="relative z-10 text-slate-500 text-xs mt-8">
          Already registered?{" "}
          <Link href="/login" className="text-green-400 hover:text-green-300 font-semibold transition-colors">
            Login to your dashboard
          </Link>
        </div>
      </div>

      {/* ── RIGHT PANEL — form ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16 overflow-y-auto">

        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <Link href="/" className="text-2xl font-black text-slate-900">
            Triply Cars
          </Link>
          <p className="text-slate-500 text-sm mt-1">Agent & Operator Registration</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-lg mx-auto"
        >
          <div className="mb-8">
            <h2 className="text-3xl font-black text-slate-900 mb-2">Create your account</h2>
            <p className="text-slate-500">
              Fill in your business details to get started.
              <span className="text-slate-400 text-sm block mt-0.5">All fields are required.</span>
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

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

            {/* Business name */}
            <Field
              id="name"
              label="Business / Full Name"
              icon={Building2}
              placeholder="e.g. Sri Basaveshwara Tours & Travels"
              error={errors.name?.message}
              {...register("name")}
            />

            {/* Email */}
            <Field
              id="email"
              label="Email Address"
              icon={Mail}
              type="email"
              placeholder="you@yourbusiness.com"
              error={errors.email?.message}
              {...register("email")}
            />

            {/* Phone */}
            <Field
              id="phoneNumber"
              label="Mobile Number"
              icon={Phone}
              type="tel"
              maxLength={10}
              placeholder="10-digit mobile number"
              error={errors.phoneNumber?.message}
              {...register("phoneNumber")}
            />

            {/* Address */}
            <Field
              id="address"
              label="Business Address"
              icon={MapPin}
              placeholder="e.g. Keshwapur, Hubli, Karnataka 580023"
              error={errors.address?.message}
              {...register("address")}
            />

            {/* License number */}
            <Field
              id="licenseNumber"
              label="License / Registration Number"
              icon={CreditCard}
              placeholder="e.g. KA-29-XXXXXX or Tourist Permit No."
              error={errors.licenseNumber?.message}
              {...register("licenseNumber")}
            />

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                Password
              </Label>
              <div
                className={`flex items-center bg-slate-50 border rounded-xl px-3 h-12 transition-all duration-200
                  focus-within:bg-white focus-within:ring-2 focus-within:ring-green-100
                  ${errors.password ? "border-red-400 bg-red-50/30 focus-within:ring-red-100" : "border-slate-200 focus-within:border-green-500"}`}
              >
                <Lock className={`w-4 h-4 mr-2 flex-shrink-0 ${errors.password ? "text-red-400" : "text-green-500"}`} />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  {...register("password")}
                  className="border-0 bg-transparent p-0 h-auto text-sm focus-visible:ring-0 placeholder:text-slate-400 flex-1"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="ml-2 text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength bar */}
              {password.length > 0 && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex gap-1 flex-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          i < strengthScore ? strengthColor : "bg-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                  <span className={`text-xs font-semibold ${
                    strengthScore <= 1 ? "text-red-500" :
                    strengthScore === 2 ? "text-amber-500" :
                    strengthScore === 3 ? "text-blue-500" : "text-green-600"
                  }`}>
                    {strengthLabel}
                  </span>
                </div>
              )}

              <AnimatePresence mode="wait">
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-xs text-red-600 flex items-center gap-1"
                  >
                    <span className="inline-block w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
                    {errors.password.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Confirm password */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700">
                Confirm Password
              </Label>
              <div
                className={`flex items-center bg-slate-50 border rounded-xl px-3 h-12 transition-all duration-200
                  focus-within:bg-white focus-within:ring-2 focus-within:ring-green-100
                  ${errors.confirmPassword ? "border-red-400 bg-red-50/30 focus-within:ring-red-100" : "border-slate-200 focus-within:border-green-500"}`}
              >
                <Lock className={`w-4 h-4 mr-2 flex-shrink-0 ${errors.confirmPassword ? "text-red-400" : "text-green-500"}`} />
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter your password"
                  {...register("confirmPassword")}
                  className="border-0 bg-transparent p-0 h-auto text-sm focus-visible:ring-0 placeholder:text-slate-400 flex-1"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((p) => !p)}
                  className="ml-2 text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <AnimatePresence mode="wait">
                {errors.confirmPassword && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-xs text-red-600 flex items-center gap-1"
                  >
                    <span className="inline-block w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
                    {errors.confirmPassword.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Terms note */}
            <p className="text-xs text-slate-400 leading-relaxed">
              By registering, you agree that your account will be reviewed and approved by the Triply Cars team before activation. Providing false information may result in rejection.
            </p>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-13 bg-green-600 hover:bg-green-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black text-base rounded-xl shadow-lg shadow-green-500/20 transition-all duration-200 hover:scale-[1.01] mt-2 h-12"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Submitting Registration...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Register Your Business
                  <ArrowRight className="w-5 h-5" />
                </span>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="text-green-600 font-bold hover:text-green-500 transition-colors">
              Login here
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}