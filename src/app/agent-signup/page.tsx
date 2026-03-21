"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { agentSignup } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Building2, Mail, Phone, MapPin, CreditCard,
  Lock, CheckCircle2, ArrowRight, Eye, EyeOff,
  Car, Shield, TrendingUp, Users,
} from "lucide-react";
import Link from "next/link";

const schema = z
  .object({
    businessName:  z.string().min(2, "Business name must be at least 2 characters"),
    ownerName:     z.string().min(2, "Owner name must be at least 2 characters"),
    email:         z.string().email("Enter a valid email address"),
    phoneNumber:   z.string().regex(/^[6-9][0-9]{9}$/, "Enter a valid 10-digit Indian mobile number"),
    address:       z.string().min(5, "Enter your full business address"),
    city:          z.string().min(2, "City is required"),
    licenseNumber: z.string().min(3, "Enter a valid license or registration number").optional().or(z.literal("")),
    password:      z.string().min(8, "Password must be at least 8 characters")
                     .regex(/[A-Z]/, "Must contain at least one uppercase letter")
                     .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

const BENEFITS = [
  { icon: TrendingUp, title: "Grow Your Business",   desc: "Reach hundreds of customers in Hubli–Dharwad looking for cabs every day." },
  { icon: Users,      title: "Zero Cost to Start",   desc: "List your vehicles for free. No upfront fees, no commission for 3 months." },
  { icon: Shield,     title: "Verified & Trusted",   desc: "Verified badge builds customer trust and gets you more bookings." },
  { icon: Car,        title: "Manage Everything",    desc: "Track bookings, update availability and prices from your dashboard." },
];

function Field({ id, label, icon: Icon, error, ...props }: {
  id: string; label: string; icon: React.ElementType; error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-sm font-semibold text-slate-700">{label}</Label>
      <div className={`flex items-center bg-slate-50 border rounded-xl px-3 h-12 transition-all
        focus-within:bg-white focus-within:ring-2
        ${error ? "border-red-400 bg-red-50/30 focus-within:ring-red-100" : "border-slate-200 focus-within:border-green-500 focus-within:ring-green-100"}`}>
        <Icon className={`w-4 h-4 mr-2 flex-shrink-0 ${error ? "text-red-400" : "text-green-500"}`} />
        <Input id={id} {...props} className="border-0 bg-transparent p-0 h-auto text-sm focus-visible:ring-0 placeholder:text-slate-400 text-slate-800 flex-1" />
      </div>
      <AnimatePresence mode="wait">
        {error && (
          <motion.p key="e" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-xs text-red-600 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-red-500 inline-block" />{error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AgentSignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [success,      setSuccess]      = useState(false);
  const [serverError,  setServerError]  = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setServerError("");
    try {
      await agentSignup({
        email:    data.email,
        password: data.password,
        agentData: {
          businessName:  data.businessName,
          ownerName:     data.ownerName,
          phoneNumber:   data.phoneNumber,
          address:       data.address,
          city:          data.city,
          licenseNumber: data.licenseNumber || undefined,
        },
      });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: any) {
      setServerError(err?.message || "Signup failed. Please try again.");
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl p-10 text-center max-w-sm shadow-xl">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-slate-900 mb-2">Application Submitted!</h2>
          <p className="text-slate-600 text-sm">Our team will review your application and get back to you within 24 hours. Redirecting to login…</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-green-700 via-green-800 to-emerald-900 flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-2 mb-12">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Car className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-black text-xl">NammaCab</span>
          </div>
          <h1 className="text-4xl font-black text-white leading-tight mb-4">
            Partner with<br />NammaCab
          </h1>
          <p className="text-green-200 text-lg leading-relaxed mb-10">
            Join Hubli's fastest-growing cab marketplace and grow your tours & travels business.
          </p>
          <div className="space-y-4">
            {BENEFITS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-green-200" />
                </div>
                <div>
                  <div className="text-white font-bold text-sm">{title}</div>
                  <div className="text-green-300 text-xs leading-relaxed">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-green-400 text-xs">
          Already a partner?{" "}
          <Link href="/login" className="text-white font-semibold underline">Sign in here</Link>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl font-black text-slate-900">Create your operator account</h2>
            <p className="text-slate-500 text-sm mt-1">Fill in your business details to get started.</p>
          </div>

          {serverError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field id="businessName" label="Business / Shop Name" icon={Building2}
              placeholder="Sri Basaveshwara Tours and Travels"
              error={errors.businessName?.message} {...register("businessName")} />

            <Field id="ownerName" label="Owner Name" icon={Users}
              placeholder="Rajesh Kumar"
              error={errors.ownerName?.message} {...register("ownerName")} />

            <div className="grid grid-cols-2 gap-3">
              <Field id="city" label="City" icon={MapPin}
                placeholder="Hubli"
                error={errors.city?.message} {...register("city")} />
              <Field id="phoneNumber" label="Mobile Number" icon={Phone}
                placeholder="9876543210" maxLength={10}
                error={errors.phoneNumber?.message} {...register("phoneNumber")} />
            </div>

            <Field id="address" label="Business Address" icon={MapPin}
              placeholder="Shop No. 5, Keshwapur, Hubli – 580023"
              error={errors.address?.message} {...register("address")} />

            <Field id="email" label="Email Address" icon={Mail}
              type="email" placeholder="you@example.com"
              error={errors.email?.message} {...register("email")} />

            <Field id="licenseNumber" label="License / Permit Number (optional)" icon={CreditCard}
              placeholder="KA-35-T-12345"
              error={errors.licenseNumber?.message} {...register("licenseNumber")} />

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</Label>
              <div className={`flex items-center bg-slate-50 border rounded-xl px-3 h-12 transition-all focus-within:bg-white focus-within:ring-2
                ${errors.password ? "border-red-400 focus-within:ring-red-100" : "border-slate-200 focus-within:border-green-500 focus-within:ring-green-100"}`}>
                <Lock className={`w-4 h-4 mr-2 flex-shrink-0 ${errors.password ? "text-red-400" : "text-green-500"}`} />
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="Min 8 chars, 1 uppercase, 1 number"
                  className="border-0 bg-transparent p-0 h-auto text-sm focus-visible:ring-0 placeholder:text-slate-400 flex-1"
                  {...register("password")} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="ml-1">
                  {showPassword ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700">Confirm Password</Label>
              <div className={`flex items-center bg-slate-50 border rounded-xl px-3 h-12 transition-all focus-within:bg-white focus-within:ring-2
                ${errors.confirmPassword ? "border-red-400 focus-within:ring-red-100" : "border-slate-200 focus-within:border-green-500 focus-within:ring-green-100"}`}>
                <Lock className={`w-4 h-4 mr-2 flex-shrink-0 ${errors.confirmPassword ? "text-red-400" : "text-green-500"}`} />
                <Input id="confirmPassword" type={showConfirm ? "text" : "password"} placeholder="Re-enter password"
                  className="border-0 bg-transparent p-0 h-auto text-sm focus-visible:ring-0 placeholder:text-slate-400 flex-1"
                  {...register("confirmPassword")} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="ml-1">
                  {showConfirm ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-600">{errors.confirmPassword.message}</p>}
            </div>

            <Button type="submit" disabled={isSubmitting}
              className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl flex items-center justify-center gap-2">
              {isSubmitting ? "Submitting…" : (<>Submit Application <ArrowRight className="w-4 h-4" /></>)}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-green-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
