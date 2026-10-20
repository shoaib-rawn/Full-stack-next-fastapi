import Link from "next/link";

import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <section>
      <span className="inline-flex rounded-md bg-[#e5f7d7] px-3 py-1 text-xs font-black uppercase tracking-wider text-[#28712f]">
        Organization setup
      </span>

      <h1 className="mt-4 text-3xl font-black tracking-tight text-[#082d63] sm:text-4xl">
        Create a LedgerLite account
      </h1>

      <p className="mt-3 leading-7 text-[#58718c]">
        One organization, one owner account, and an isolated accounting workspace.
      </p>

      <SignupForm />

      <p className="mt-6 text-center text-sm text-[#58718c]">
        Already registered?{" "}
        <Link
          href="/login"
          className="font-black text-[#1267c9] underline decoration-[#ffd65a] decoration-4 underline-offset-4"
        >
          Sign in
        </Link>
      </p>
    </section>
  );
}

