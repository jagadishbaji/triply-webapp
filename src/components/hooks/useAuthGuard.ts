"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getCookie } from "cookies-next";

export function useAuthGuard() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = getCookie("accessToken") as string | undefined;
    if (!token) {
      const redirect = encodeURIComponent(pathname || "/");
      router.push(`/login?redirect=${redirect}`);
    }
  }, [router, pathname]);
}

export default useAuthGuard;