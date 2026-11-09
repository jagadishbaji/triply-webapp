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
  Car, Shield, TrendingUp, Users, AlertCircle
} from "lucide-react";
import Link from "next/link";
import { PageLoader } from "@/components/ui/loader";

const schema = z
  .object({
    businessName:  z.string().min(2, "Must be at least 2 characters"),
    ownerName:     z.string().min(2, "Must be at least 2 characters"),
    email:         z.string().email("Enter a valid email"),
    phoneNumber:   z.string().regex(/^[6-9][0-9]{9}$/, "Valid 10-digit number required"),
    address:       z.string().min(5, "Enter full address"),
    city:          z.string().min(2, "City is required"),
    licenseNumber: z.string().optional(),
    password:      z.string().min(8, "Min 8 chars, 1 uppercase, 1 number")
                     .regex(/[A-Z]/, "Needs 1 uppercase")
                     .regex(/[0-9]/, "Needs 1 number"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

const BENEFITS = [
  { icon: TrendingUp, title: "Grow Your Business",   desc: "Reach hundreds of customers looking for cabs every day." },
  { icon: Users,      title: "Zero Cost to Start",   desc: "No upfront fees, no commission for the first 3 months." },
  { icon: Shield,     title: "Verified & Trusted",   desc: "Verified badge builds customer trust and gets more bookings." },
  { icon: Car,        title: "Manage Everything",    desc: "Track bookings, update availability and prices easily." },
];

// Compact Field Component
function Field({ id, label, icon: Icon, error, ...props }: {
  id: string; label: string; icon: React.ElementType; error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1 w-full">
      <Label htmlFor={id} className="text-xs font-semibold text-slate-700">{label}</Label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className={`h-4 w-4 ${error ? "text-red-400" : "text-slate-400"}`} />
        </div>
        <Input 
          id={id} 
          {...props} 
          className={`pl-9 h-10 text-sm bg-white text-slate-900 rounded-lg transition-all focus-visible:ring-1 focus-visible:ring-green-500 focus-visible:border-green-500
            ${error ? "border-red-300 bg-red-50/30" : "border-slate-200"}`} 
        />
      </div>
      <AnimatePresence mode="wait">
        {error && (
          <motion.p key="e" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-[11px] text-red-600 font-medium pt-0.5 leading-tight">
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// Compact Password Field
function PasswordField({ id, label, error, show, onToggle, ...props }: any) {
  return (
    <div className="space-y-1 w-full">
      <Label htmlFor={id} className="text-xs font-semibold text-slate-700">{label}</Label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Lock className={`h-4 w-4 ${error ? "text-red-400" : "text-slate-400"}`} />
        </div>
        <Input 
          id={id} 
          type={show ? "text" : "password"} 
          {...props} 
          className={`pl-9 pr-9 h-10 text-sm bg-white text-slate-900 rounded-lg transition-all focus-visible:ring-1 focus-visible:ring-green-500 focus-visible:border-green-500
            ${error ? "border-red-300 bg-red-50/30" : "border-slate-200"}`} 
        />
        <button type="button" onClick={onToggle} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      <AnimatePresence mode="wait">
        {error && (
          <motion.p key="e" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-[11px] text-red-600 font-medium pt-0.5 leading-tight">
            {error}
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl p-10 text-center max-w-md shadow-xl border border-slate-100">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">Application Submitted</h2>
          <p className="text-slate-500 text-base mb-8 leading-relaxed">
            Our partner onboarding team will review your application. We will contact you within 24 hours. Redirecting to login…
          </p>
          <PageLoader />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex bg-white font-sans">
      
      {/* ── Left Pane: Branding ── */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-[45%] bg-[#02180d] relative overflow-hidden flex-col p-12 xl:p-16 fixed top-0 bottom-0 left-0">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-green-600/10 blur-[120px]" />
          <div className="absolute bottom-[10%] right-[10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[100px]" />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0 w-fit">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
              <span className="text-white font-black text-xl leading-none tracking-tight">R</span>
            </div>
            <div className="leading-none flex items-center tracking-tight">
              <span className="font-black text-2xl text-white">RIDE</span>
              <span className="font-black text-2xl text-green-400">VO</span>
            </div>
          </Link>
        </div>

        {/* Hero Text & Benefits (Shifted Higher) */}
        <div className="relative z-10 mt-16 max-w-lg">
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-[1.1] tracking-tight mb-8">
            Partner with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">
              RIDEVO
            </span>
          </h1>
          
          <div className="space-y-6">
            {BENEFITS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4 items-start">
                <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <div className="text-white font-semibold text-sm mb-0.5">{title}</div>
                  <div className="text-emerald-100/60 text-sm leading-relaxed pr-4">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer text */}
        <div className="relative z-10 mt-auto text-emerald-100/40 text-sm">
          © {new Date().getFullYear()} RIDEVO Technologies. All rights reserved.
        </div>
      </div>

      {/* ── Right Pane: Form ── */}
      <div className="w-full lg:w-7/12 xl:w-[55%] lg:ml-auto flex flex-col justify-center items-center py-10 px-6 sm:px-12 relative min-h-screen">
        
        {/* Mobile Logo */}
        <div className="lg:hidden absolute top-6 left-6">
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-700 rounded-lg flex items-center justify-center shadow-md shadow-green-600/20">
              <span className="text-white font-black text-base leading-none tracking-tight">R</span>
            </div>
            <div className="leading-none flex items-center tracking-tight">
              <span className="font-black text-xl text-slate-900">RIDE</span>
              <span className="font-black text-xl text-green-600">VO</span>
            </div>
          </Link>
        </div>

        <div className="w-full max-w-[500px] mx-auto mt-12 lg:mt-0">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Operator Registration</h2>
            <p className="text-slate-500 mt-1 text-sm">Fill in your business details to apply for the partner program.</p>
          </div>

          {serverError && (
            <div className="mb-5 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <span className="font-medium leading-relaxed">{serverError}</span>
            </div>
          )}

          {/* Form with reduced spacing */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
            <Field id="businessName" label="Business / Shop Name" icon={Building2}
              placeholder="Sri Basaveshwara Tours and Travels"
              error={errors.businessName?.message} {...register("businessName")} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Field id="ownerName" label="Owner Name" icon={Users}
                placeholder="Rajesh Kumar"
                error={errors.ownerName?.message} {...register("ownerName")} />
              <Field id="phoneNumber" label="Mobile Number" icon={Phone}
                placeholder="9876543210" maxLength={10}
                error={errors.phoneNumber?.message} {...register("phoneNumber")} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="sm:col-span-2">
                <Field id="address" label="Business Address" icon={MapPin}
                  placeholder="Shop No. 5, Keshwapur"
                  error={errors.address?.message} {...register("address")} />
              </div>
              <Field id="city" label="City" icon={MapPin}
                placeholder="Hubli"
                error={errors.city?.message} {...register("city")} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Field id="email" label="Email Address" icon={Mail}
                type="email" placeholder="you@company.com"
                error={errors.email?.message} {...register("email")} />
              <Field id="licenseNumber" label="Permit No. (Optional)" icon={CreditCard}
                placeholder="KA-35-T-12345"
                error={errors.licenseNumber?.message} {...register("licenseNumber")} />
            </div>

            {/* Passwords side-by-side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <PasswordField id="password" label="Password" placeholder="••••••••" 
                error={errors.password?.message} show={showPassword} onToggle={() => setShowPassword(!showPassword)} {...register("password")} />
              <PasswordField id="confirmPassword" label="Confirm Password" placeholder="••••••••" 
                error={errors.confirmPassword?.message} show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} {...register("confirmPassword")} />
            </div>

            <Button type="submit" disabled={isSubmitting}
              className="w-full h-11 mt-4 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-all group">
              {isSubmitting ? "Submitting Application..." : (
                <span className="flex items-center justify-center">
                  Submit Application <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              Already have an operator account?{" "}
              <Link href="/login" className="text-green-600 font-semibold hover:text-green-700 hover:underline underline-offset-4">
                Sign in
              </Link>
            </p>
          </div>
          
        </div>
      </div>
    </div>
  );
}