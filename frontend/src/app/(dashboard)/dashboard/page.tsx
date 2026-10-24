import { Suspense } from "react";
import { redirect } from "next/navigation";

import { RequestAnimation } from "@/components/request-animation";
import { DashboardOverview } from "@/features/dashboard/components/dashboard-overview";
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
  // No demo delay here: the dashboard should open right away. Its request
  // animations play when the user hovers or taps a section.
  const user = await getCurrentUser();

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

