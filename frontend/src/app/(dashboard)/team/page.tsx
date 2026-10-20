import { Suspense } from "react";
import Link from "next/link";

import { TeamManager } from "@/features/workspace/components/team-manager";
import { getCurrentUser } from "@/lib/server-auth";

export default function TeamPage() {
  return (
    <main className="mx-auto min-h-[calc(100vh-76px)] max-w-7xl p-4 sm:p-6 lg:min-h-screen">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-[#dcecf5]" />}>
        <TeamSection />
      </Suspense>
    </main>
  );
}

async function TeamSection() {
  const user = await getCurrentUser();

  if (!user || user.role !== "owner") {
    return (
      <section className="mx-auto max-w-2xl rounded-3xl border-2 border-[#f0c557] bg-[#fff9df] p-8 text-center shadow-[0_8px_0_rgba(8,45,99,0.07)]">
        <span className="text-5xl">🔒</span>
        <h1 className="mt-4 text-3xl font-black text-[#082d63]">Owner access required</h1>
        <p className="mt-3 leading-7 text-[#58718c]">Only an organization owner can create members or change roles.</p>
        <Link href="/dashboard" className="mt-6 inline-flex rounded-xl bg-[#073979] px-5 py-3 font-black text-white">Back to dashboard</Link>
      </section>
    );
  }

  return <TeamManager currentUserId={user.id} />;
}
