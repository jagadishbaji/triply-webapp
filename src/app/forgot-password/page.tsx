"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { API_BASE_URL } from "@/lib/api";
import { Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/Auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const errText = await res.json();
        throw new Error(errText.msg || "Failed to send reset link");
      }

      setMessage("Password reset link has been sent to your email.");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
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
              <Mail className="w-8 h-8 text-white" />
            </span>
            <h1 className="text-3xl font-extrabold text-gray-900">
              Forgot Password
            </h1>
            <p className="text-muted-foreground text-base">
              Enter your email to receive a reset link
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

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white font-bold rounded-xl h-12 text-lg shadow-lg transition"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
