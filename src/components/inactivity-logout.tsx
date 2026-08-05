"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_INACTIVITY_TIMEOUT_MINUTES } from "@/lib/session-settings-constants";

const CHECK_INTERVAL_MS = 30 * 1000;
const ACTIVITY_EVENTS = [
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
  "click",
] as const;

export function InactivityLogout() {
  const router = useRouter();
  const [timeoutMinutes, setTimeoutMinutes] = useState(
    DEFAULT_INACTIVITY_TIMEOUT_MINUTES,
  );
  const lastActivityRef = useRef(Date.now());
  const loggingOutRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        const response = await fetch("/api/session/settings", {
          cache: "no-store",
        });
        const data = (await response.json()) as {
          inactivityTimeoutMinutes?: number;
        };
        if (!cancelled && response.ok && data.inactivityTimeoutMinutes) {
          setTimeoutMinutes(data.inactivityTimeoutMinutes);
        }
      } catch {
        // 기본값 유지
      }
    }

    void loadSettings();
    const refreshTimer = window.setInterval(() => {
      void loadSettings();
    }, 5 * 60 * 1000);

    return () => {
      cancelled = true;
      window.clearInterval(refreshTimer);
    };
  }, []);

  useEffect(() => {
    function markActive() {
      lastActivityRef.current = Date.now();
    }

    for (const eventName of ACTIVITY_EVENTS) {
      window.addEventListener(eventName, markActive, { passive: true });
    }

    const timer = window.setInterval(() => {
      if (loggingOutRef.current) {
        return;
      }

      const idleMs = Date.now() - lastActivityRef.current;
      if (idleMs >= timeoutMinutes * 60 * 1000) {
        loggingOutRef.current = true;
        void fetch("/api/auth/logout", { method: "POST" })
          .catch(() => undefined)
          .finally(() => {
            router.replace("/login?reason=timeout");
            router.refresh();
          });
      }
    }, CHECK_INTERVAL_MS);

    markActive();

    return () => {
      for (const eventName of ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, markActive);
      }
      window.clearInterval(timer);
    };
  }, [router, timeoutMinutes]);

  return null;
}
