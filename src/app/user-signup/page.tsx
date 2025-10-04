"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Mail, User, Lock, Phone } from "lucide-react";
import { register } from "@/services/authService";

export default function UserSignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!form.name || !form.email || !form.phone || !form.password || !form.confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await register({
        fullname: form.name,
        email: form.email,
        mobile: form.phone,
        password: form.password
       
      });
      if (res?.success === false) {
        throw new Error(res?.error || "Registration failed");
      }
      setMessage("Registration successful! Redirecting to login...");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-100 via-white to-green-200 relative overflow-hidden">
      {/* Decorative Blobs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-green-200 rounded-full opacity-30 blur-3xl z-0" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-green-400 rounded-full opacity-20 blur-3xl z-0" />
      <Card className="w-full max-w-md shadow-2xl border-0 rounded-3xl bg-white/90 backdrop-blur-lg relative z-10">
        <CardHeader>
          <div className="flex flex-col items-center text-center gap-2">
            <span className="inline-flex items-center justify-center bg-gradient-to-br from-green-500 to-green-700 rounded-full w-16 h-16 shadow-lg mb-2">
              <User className="w-8 h-8 text-white" />
            </span>
            <h1 className="text-3xl font-extrabold text-gray-900">Create Your Account</h1>
            <p className="text-muted-foreground text-base">
              Sign up to book your next ride with <span className="text-green-700 font-semibold">Triply Cars</span>
            </p>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                {error}
              </p>
            )}
            {message && (
              <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded p-2">
                {message}
              </p>
            )}
            <div className="grid gap-3">
              <Label htmlFor="name" className="text-green-700 font-semibold">Name</Label>
              <div className="flex items-center bg-green-50 rounded-xl px-3">
                <User className="w-5 h-5 text-green-400 mr-2" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Your name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="border-0 bg-transparent focus:ring-0 text-base"
                />
              </div>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="email" className="text-green-700 font-semibold">Email</Label>
              <div className="flex items-center bg-green-50 rounded-xl px-3">
                <Mail className="w-5 h-5 text-green-400 mr-2" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="border-0 bg-transparent focus:ring-0 text-base"
                />
              </div>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="phone" className="text-green-700 font-semibold">Phone</Label>
              <div className="flex items-center bg-green-50 rounded-xl px-3">
                <Phone className="w-5 h-5 text-green-400 mr-2" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="Phone number"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  pattern="[0-9]{10}"
                  className="border-0 bg-transparent focus:ring-0 text-base"
                />
              </div>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="password" className="text-green-700 font-semibold">Password</Label>
              <div className="flex items-center bg-green-50 rounded-xl px-3">
                <Lock className="w-5 h-5 text-green-400 mr-2" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="border-0 bg-transparent focus:ring-0 text-base"
                />
              </div>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="confirmPassword" className="text-green-700 font-semibold">Confirm Password</Label>
              <div className="flex items-center bg-green-50 rounded-xl px-3">
                <Lock className="w-5 h-5 text-green-400 mr-2" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  className="border-0 bg-transparent focus:ring-0 text-base"
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white font-bold rounded-xl h-12 text-lg shadow-lg transition"
              disabled={loading}
            >
              {loading ? "Signing up..." : "Sign Up"}
            </Button>
            <div className="text-center text-sm">
              Already have an account?{" "}
              <a href="/login" className="underline underline-offset-4 text-green-700 font-semibold">
                Login
              </a>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}