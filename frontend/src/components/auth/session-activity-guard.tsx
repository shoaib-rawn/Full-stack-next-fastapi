"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

const IDLE_LIMIT_MS = 2 * 60 * 60 * 1000;
const LAST_ACTIVITY_KEY = "ledgerlite:last-activity";

export function SessionActivityGuard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isLoggingOut = useRef(false);

  useEffect(() => {
    async function logoutIdleUser() {
      if (isLoggingOut.current) {
        return;
      }

      isLoggingOut.current = true;
      localStorage.removeItem(LAST_ACTIVITY_KEY);

      try {
        await fetch("/api/auth/logout", {
          method: "POST",
        });
      } finally {
        queryClient.clear();
        router.replace("/login?reason=idle");
        router.refresh();
      }
    }

    function checkIdleTime() {
      const storedValue =
        localStorage.getItem(LAST_ACTIVITY_KEY);

      if (!storedValue) {
        localStorage.setItem(
          LAST_ACTIVITY_KEY,
          Date.now().toString(),
        );
        return false;
      }

      const lastActivity = Number(storedValue);
      const idleTime = Date.now() - lastActivity;

      if (idleTime >= IDLE_LIMIT_MS) {
        void logoutIdleUser();
        return true;
      }

      return false;
    }

    function recordActivity() {
      if (!checkIdleTime()) {
        localStorage.setItem(
          LAST_ACTIVITY_KEY,
          Date.now().toString(),
        );
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        checkIdleTime();
      }
    }

    checkIdleTime();

    const events = [
      "pointerdown",
      "keydown",
      "scroll",
      "touchstart",
    ] as const;

    events.forEach((eventName) => {
      window.addEventListener(
        eventName,
        recordActivity,
        { passive: true },
      );
    });

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    window.addEventListener("storage", checkIdleTime);

    const intervalId = window.setInterval(
      checkIdleTime,
      60_000,
    );

    return () => {
      events.forEach((eventName) => {
        window.removeEventListener(
          eventName,
          recordActivity,
        );
      });

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );

      window.removeEventListener(
        "storage",
        checkIdleTime,
      );

      window.clearInterval(intervalId);
    };
  }, [queryClient, router]);

  return null;
}
