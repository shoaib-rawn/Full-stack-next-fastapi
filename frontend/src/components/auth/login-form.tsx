"use client";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";

import { RequestOverlay } from "@/components/request-animation";
import { login } from "@/lib/auth";
import { withMinDuration } from "@/lib/demo-delay";
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
  const [successMessage, setSuccessMessage] = useState("");

  async function onSubmit(values: LoginFormValues) {
    setServerError("");
    setSuccessMessage("");

    try {
      await withMinDuration(login(values));

      queryClient.clear();
      localStorage.removeItem("ledgerlite:last-activity");

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "Could not log in.",
      );
    }
  }
  return (
    <form
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

      {successMessage && (
        <p className="rounded-xl border border-[#9bd884] bg-[#e5f7d7] p-3 text-sm font-bold text-[#28712f]">
          {successMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-[#1267c9] px-4 py-3 font-black text-white shadow-[0_4px_0_#082d63] transition hover:-translate-y-0.5 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>

      <RequestOverlay flow="login" active={isSubmitting} error={serverError} />
    </form>
  );
}

