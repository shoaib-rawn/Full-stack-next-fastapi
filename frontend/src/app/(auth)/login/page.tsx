import Link from "next/link";
import { Suspense } from "react";

import { RegistrationMessage } from "@/components/auth/registration-message";
import { LoginForm } from "@/components/auth/login-form";
import { NotebookTeaser } from "@/features/notebook/notebook-teaser";
export default function LoginPage() {
  return (
    <section>
      <span className="inline-flex rounded-md bg-[#ffe3eb] px-3 py-1 text-xs font-black uppercase tracking-wider text-[#a3234c]">
        Secure login
      </span>

      <h1 className="mt-4 text-3xl font-black tracking-tight text-[#082d63] sm:text-4xl">
        Sign in to LedgerLite
      </h1>

      <p className="mt-3 leading-7 text-[#58718c]">
        Enter your details. The secure session will connect you only to your organization.
      </p>
      <Suspense fallback={null}>
        <RegistrationMessage />
      </Suspense>
      <LoginForm />

      <p className="mt-6 text-center text-sm text-[#58718c]">
        New to LedgerLite?{" "}
        <Link
          href="/signup"
          className="font-black text-[#1267c9] underline decoration-[#ffd65a] decoration-4 underline-offset-4"
        >
          Create an account
        </Link>
      </p>

      <NotebookTeaser />
    </section>
  );
}

