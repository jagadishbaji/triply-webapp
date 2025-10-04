"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { API_BASE_URL } from "@/lib/api";
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
      const res = await fetch(`${API_BASE_URL}/api/Auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errText = await res.json();
        throw new Error(errText.msg || "Login failed");
      }

      const data = await res.json();

      if (data?.accessToken && data?.profile.role) {
        setCookie("accessToken", data.accessToken, {
          maxAge: 60 * 60 * 24,
          path: "/",
        });
        setCookie("role", data.profile.role, {
          maxAge: 60 * 60 * 24,
          path: "/",
        });
        setCookie("loginId", data?.user.id, {
          maxAge: 60 * 60 * 24,
          path: "/",
        });
        setCookie("loggedName", data?.profile.fullName, {
          maxAge: 60 * 60 * 24,
          path: "/",
        });

        if (data.profile.role === "admin") {
          router.push("/admin/dashboard");
        } else if (data.profile.role === "agent") {
          router.push("/agent/dashboard");
        } else {
          router.push("/user/dashboard");
        }
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Login failed");
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
              <Lock className="w-8 h-8 text-white" />
            </span>
            <h1 className="text-3xl font-extrabold text-gray-900">
              Welcome Back
            </h1>
            <p className="text-muted-foreground text-base">
              Login to your{" "}
              <span className="text-green-700 font-semibold">Triply Cars</span>{" "}
              account
            </p>
          </div>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-5">
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                {error}
              </p>
            )}
            <div className="grid gap-3">
              <Label
                htmlFor="email"
                className="text-green-700 font-semibold"
              >
                Email
              </Label>
              <div className="flex items-center bg-green-50 rounded-xl px-3">
                <Mail className="w-5 h-5 text-green-400 mr-2" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-0 bg-transparent focus:ring-0 text-base"
                />
              </div>
            </div>
            <div className="grid gap-3">
              <div className="flex items-center">
                <Label
                  htmlFor="password"
                  className="text-green-700 font-semibold"
                >
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="ml-auto text-sm underline-offset-2 hover:underline text-green-600"
                >
                  Forgot your password?
                </Link>
              </div>
              <div className="flex items-center bg-green-50 rounded-xl px-3">
                <Lock className="w-5 h-5 text-green-400 mr-2" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              {loading ? "Logging in..." : "Login"}
            </Button>
            <div className="text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="underline underline-offset-4 text-green-700 font-semibold"
              >
                Sign up
              </Link>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
