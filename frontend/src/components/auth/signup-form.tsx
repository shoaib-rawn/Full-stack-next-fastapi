"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { RequestOverlay } from "@/components/request-animation";
import { signup } from "@/lib/auth";
import { withMinDuration } from "@/lib/demo-delay";
import {
  signupSchema,
  type SignupFormValues,
} from "@/lib/validations/auth";

export function SignupForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  async function onSubmit(values: SignupFormValues) {
    setServerError("");

    try {
      await withMinDuration(signup(values));
      router.push("/login?registered=1");
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : "Could not create account.",
      );
    }
  }

  const fields = [
  {
    name: "organizationName",
    label: "Organization name",
    placeholder: "Shoaib Traders",
    type: "text",
  },
  {
    name: "organizationSlug",
    label: "Organization slug",
    placeholder: "shoaib-traders",
    type: "text",
  },
  {
    name: "fullName",
    label: "Full name",
    placeholder: "Shoaib Hassan",
    type: "text",
  },
  {
    name: "email",
    label: "Email address",
    placeholder: "shoaib@example.com",
    type: "email",
  },
  {
    name: "password",
    label: "Password",
    placeholder: "Minimum 8 characters",
    type: "password",
  },
] as const;
  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mt-7 space-y-5 rounded-2xl border-2 border-[#c5e6f7] bg-[#f7fcff] p-5"
    >
      {fields.map((field) => (
        <div key={field.name}>
          <label
            htmlFor={field.name}
            className="mb-2 block text-sm font-black text-[#163e6b]"
          >
            {field.label}
          </label>

          <input
            id={field.name}
            type={field.type ?? "text"}
            placeholder={field.placeholder}
            {...register(field.name)}
            className="w-full rounded-xl border-2 border-[#b8dbea] bg-white px-4 py-3 text-[#0b2e59] outline-none transition focus:border-[#1267c9]"
          />

          {errors[field.name] && (
            <p className="mt-2 rounded-lg bg-[#ffe3eb] px-3 py-2 text-sm font-bold text-[#a3234c]">
              {errors[field.name]?.message}
            </p>
          )}
        </div>
      ))}

      {serverError && (
        <p className="rounded-xl border border-[#f2a8bd] bg-[#ffe3eb] p-3 text-sm font-bold text-[#a3234c]">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-[#159447] px-4 py-3 font-black text-white shadow-[0_4px_0_#17652f] transition hover:-translate-y-0.5 active:translate-y-1 active:shadow-none disabled:opacity-60"
      >
        {isSubmitting ? "Creating account..." : "Create account"}
      </button>

      <RequestOverlay flow="signup" active={isSubmitting} error={serverError} />
    </form>
  );
}

