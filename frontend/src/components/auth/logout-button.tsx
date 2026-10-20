"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { RequestOverlay } from "@/components/request-animation";
import { withMinDuration } from "@/lib/demo-delay";
import { trackedFetch } from "@/lib/request-tracker";

export function LogoutButton({ fullWidth = false }: { fullWidth?: boolean }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogout() {
    setIsLoading(true);
    setError("");

    try {
      const response = await withMinDuration(
        trackedFetch("logout", "/api/auth/logout", {
          method: "POST",
        }),
      );

      if (!response.ok) {
        const data = await response.json();

        throw new Error(
          data.detail ?? "Could not log out.",
        );
      }
      queryClient.clear();
      try {
        localStorage.removeItem("ledgerlite:last-activity");
      } catch {
        // Storage may be blocked; the server session is already revoked.
      }

      router.replace("/login");
      router.refresh();
      
    } catch (logoutError) {
      setError(
        logoutError instanceof Error
          ? logoutError.message
          : "Could not log out.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoading}
        className={`rounded-lg border-2 border-[#ffd65a] px-3 py-2 text-sm font-black text-[#ffd65a] transition hover:bg-[#ffd65a] hover:text-[#082d63] disabled:opacity-60 sm:px-4 ${fullWidth ? "w-full" : ""}`}
      >
        {isLoading ? "Logging out..." : "Log out"}
        
      </button>

      {error && (
        <p className="mt-2 rounded-lg bg-[#ffe3eb] px-2 py-1 text-xs font-bold text-[#a3234c]">
          {error}
        </p>
      )}

      <RequestOverlay flow="logout" active={isLoading} error={error} />
    </div>
  );
}

