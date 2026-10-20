import { Suspense } from "react";
import { redirect } from "next/navigation";

import { RequestAnimation } from "@/components/request-animation";
import { DashboardOverview } from "@/features/dashboard/components/dashboard-overview";
import { withMinDuration } from "@/lib/demo-delay";
import { getCurrentUser } from "@/lib/server-auth";

export default function DashboardPage() {
  return (
    <main className="min-h-[calc(100vh-76px)] bg-[#f5faff] p-4 text-[#0b2e59] sm:p-6 lg:min-h-screen">
      <Suspense fallback={<DashboardFallback />}>
        <DashboardContent />
      </Suspense>
    </main>
  );
}

async function DashboardContent() {
  const user = await withMinDuration(getCurrentUser());

  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardOverview
      fullName={user.full_name}
      email={user.email}
      role={user.role}
    />
  );
}

function DashboardFallback() {
  return (
    <section className="mx-auto max-w-3xl">
      <RequestAnimation flow="session" />
    </section>
  );
}

