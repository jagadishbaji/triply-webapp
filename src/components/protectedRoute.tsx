"use client";
import { useAuth } from "@/context/authContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({ children, role }: { children: React.ReactNode, role: string }) {
  const { user, userRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
    } else if (role && userRole !== role) {
      router.push("/dashboard"); // fallback
    }
  }, [user, userRole, role, router]);

  return <>{children}</>;
}
