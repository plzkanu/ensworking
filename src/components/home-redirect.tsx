"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function HomeRedirect() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((data) => {
        if (cancelled) return;
        if (!data.user) {
          router.replace("/login");
          return;
        }
        if (data.mustChangePassword) {
          router.replace("/change-password");
          return;
        }
        router.replace("/dashboard");
      })
      .catch(() => {
        if (!cancelled) router.replace("/login");
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="flex min-h-full flex-1 items-center justify-center text-sm text-slate-500">
      이동 중…
    </div>
  );
}
