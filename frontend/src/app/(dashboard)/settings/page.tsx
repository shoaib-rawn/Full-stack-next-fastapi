import { Suspense } from "react";

import { WorkspaceSettings } from "@/features/workspace/components/workspace-settings";
import { getCurrentUser } from "@/lib/server-auth";

export default function SettingsPage() {
  return (
    <main className="mx-auto min-h-[calc(100vh-76px)] max-w-7xl p-4 sm:p-6 lg:min-h-screen">
      <header className="mb-6 rounded-3xl bg-linear-to-r from-[#073979] to-[#1267c9] p-6 text-white shadow-[0_8px_0_rgba(8,45,99,0.12)] sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-[#ffd65a]">Workspace administration</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">Organization settings</h1>
        <p className="mt-3 max-w-2xl leading-7 text-[#ddecff]">
          Keep the tenant identity clear and manage session security from one place.
        </p>
      </header>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-[#dcecf5]" />}>
        <SettingsSection />
      </Suspense>
    </main>
  );
}

async function SettingsSection() {
  const user = await getCurrentUser();
  return <WorkspaceSettings isOwner={user?.role === "owner"} />;
}
