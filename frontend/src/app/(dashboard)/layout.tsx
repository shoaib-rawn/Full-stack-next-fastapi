import { Suspense } from "react";
import { connection } from "next/server";
import { SessionActivityGuard } from "@/components/auth/session-activity-guard";
import { DashboardNav, DashboardNavSkeleton } from "@/components/dashboard-nav";
import { getCurrentUser } from "@/lib/server-auth";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-[#f5faff] text-[#0b2e59]">
      <SessionActivityGuard />

      <Suspense fallback={<DashboardNavSkeleton />}>
        <RoleAwareNavigation />
      </Suspense>

      {/* The desktop sidebar is fixed and 16rem wide, so content starts after it. */}
      <div className="min-w-0 lg:pl-64">{children}</div>
    </div>
  );
}

async function RoleAwareNavigation() {
  // The navigation depends on the current request's HttpOnly cookie and a
  // live FastAPI response. Make that request-time boundary explicit so Cache
  // Components never try to prerender it with an unstable internal clock.
  await connection();
  const user = await getCurrentUser();

  return (
    <DashboardNav
      isOwner={user?.role === "owner"}
      user={
        user
          ? { fullName: user.full_name, email: user.email, role: user.role }
          : undefined
      }
    />
  );
}
