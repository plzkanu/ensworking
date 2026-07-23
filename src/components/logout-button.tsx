"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoading}
      className="w-full rounded-md border border-white/15 px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/10 disabled:opacity-60"
    >
      {isLoading ? "로그아웃 중..." : "로그아웃"}
    </button>
  );
}
