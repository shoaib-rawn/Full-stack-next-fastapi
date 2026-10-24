import { QuietLoading } from "@/components/reveal-zone";

// Page changes stay calm; request animations play only when the user hovers
// or taps a section.
export default function DashboardLoading() {
  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-6">
      <QuietLoading />
    </main>
  );
}
