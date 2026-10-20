import { RequestAnimation } from "@/components/request-animation";

export default function DashboardLoading() {
  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-6">
      <RequestAnimation flow="page" />
    </main>
  );
}
