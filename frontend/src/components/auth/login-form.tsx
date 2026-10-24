"use client";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";

import { RequestOverlay } from "@/components/request-animation";
import { login } from "@/lib/auth";
import { withMinDuration } from "@/lib/demo-delay";
import { clearSeen } from "@/lib/seen-sections";
import {
  loginSchema,
  type LoginFormValues,
} from "@/lib/validations/auth";

export function LoginForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const [serverError, setServerError] = useState("");
  // Set once login succeeds: the overlay stays up until the dashboard is
  // shown, so /login never flashes in between.
  const [isOpeningDashboard, setIsOpeningDashboard] = useState(false);

  // Next.js keeps a page you left alive in the background (hidden) and shows
  // it again with its old state when you come back. Without this reset, the
  // login page came back after logout still "opening the dashboard", with
  // the finished overlay stuck on screen and the button disabled.
  // Effect cleanups run when the page is hidden, so reset there.
  useEffect(() => {
    return () => setIsOpeningDashboard(false);
  }, []);

  // Safety net: if the dashboard has not replaced this page after a while
  // (slow or failed navigation), do a full page load instead of waiting.
  useEffect(() => {
    if (!isOpeningDashboard) return;
    // A full load is the point here, since the client-side navigation stalled.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    const timer = setTimeout(() => window.location.assign("/dashboard"), 12000);
    return () => clearTimeout(timer);
  }, [isOpeningDashboard]);
  // Remove credentials from a URL produced by an older/default GET form
  // submission. New submissions use POST even before React hydrates.
  useEffect(() => {
    const url = new URL(window.location.href);
    const hadSensitiveQuery =
      url.searchParams.has("email") || url.searchParams.has("password");

    if (hadSensitiveQuery) {
      url.searchParams.delete("email");
      url.searchParams.delete("password");
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    }
  }, []);

  async function onSubmit(values: LoginFormValues) {
    setServerError("");

    try {
      await withMinDuration(login(values));

      queryClient.clear();
      clearSeen();
      localStorage.removeItem("ledgerlite:last-activity");

      setIsOpeningDashboard(true);
      // A single navigation. The old extra router.refresh() re-rendered
      // /login at the same time and delayed the switch.
      router.replace("/dashboard");
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "Could not log in.",
      );
    }
  }
  return (
    <form
      action="/api/auth/login"
      method="post"
      onSubmit={handleSubmit(onSubmit)}
      className="mt-7 space-y-5 rounded-2xl border-2 border-[#c5e6f7] bg-[#f7fcff] p-5"
    >
      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-black text-[#163e6b]">
          Email address
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={320}
          required
          placeholder="owner@ledgerlite.com"
          {...register("email")}
          className="w-full rounded-xl border-2 border-[#b8dbea] bg-white px-4 py-3 text-[#0b2e59] outline-none transition focus:border-[#1267c9]"
        />
        {errors.email && (
          <p className="mt-2 rounded-lg bg-[#ffe3eb] px-3 py-2 text-sm font-bold text-[#a3234c]">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-black text-[#163e6b]">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          minLength={8}
          maxLength={128}
          required
          placeholder="Minimum 8 characters"
          {...register("password")}
          className="w-full rounded-xl border-2 border-[#b8dbea] bg-white px-4 py-3 text-[#0b2e59] outline-none transition focus:border-[#1267c9]"
        />
        {errors.password && (
          <p className="mt-2 rounded-lg bg-[#ffe3eb] px-3 py-2 text-sm font-bold text-[#a3234c]">
            {errors.password.message}
          </p>
        )}
      </div>

      {serverError && (
        <p className="rounded-xl border border-[#f2a8bd] bg-[#ffe3eb] p-3 text-sm font-bold text-[#a3234c]">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting || isOpeningDashboard}
        className="w-full rounded-xl bg-[#1267c9] px-4 py-3 font-black text-white shadow-[0_4px_0_#082d63] transition hover:-translate-y-0.5 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isOpeningDashboard ? "Opening dashboard..." : isSubmitting ? "Signing in..." : "Sign in"}
      </button>

      <RequestOverlay flow="login" active={isSubmitting || isOpeningDashboard} error={serverError} />
    </form>
  );
}

