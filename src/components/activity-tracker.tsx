"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const HEARTBEAT_MS = 5 * 60 * 1000;

function sendActivityLog(body: {
  action: string;
  resource: string;
}) {
  void fetch("/api/activity/log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function ActivityTracker() {
  const pathname = usePathname();
  const lastLoggedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/login")) {
      return;
    }
    if (lastLoggedPath.current === pathname) {
      return;
    }
    lastLoggedPath.current = pathname;

    sendActivityLog({
      action: "page_view",
      resource: pathname,
    });
  }, [pathname]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      sendActivityLog({
        action: "session_active",
        resource: pathname || "/dashboard",
      });
    }, HEARTBEAT_MS);

    return () => window.clearInterval(timer);
  }, [pathname]);

  return null;
}
