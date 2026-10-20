"use client";

import { useSearchParams } from "next/navigation";

export function RegistrationMessage() {
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");

  if (registered !== "1") {
    return null;
  }

  return (
    <p className="mt-6 rounded-xl border border-[#9bd884] bg-[#e5f7d7] p-3 text-sm font-bold text-[#28712f]">
      Account created successfully. You can now sign in.
    </p>
  );
}

