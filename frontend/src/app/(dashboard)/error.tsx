"use client";

type DashboardErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function DashboardError({
  error,
  reset,
}: DashboardErrorProps) {
  return (
    <main className="mx-auto max-w-3xl p-6 text-[#0b2e59]">
      <section className="rounded-3xl border-2 border-[#f1a8bc] bg-[#ffe3eb] p-8 shadow-[0_8px_0_rgba(163,35,76,0.1)]">
        <p className="inline-flex rounded-md bg-[#d7344f] px-3 py-1 text-xs font-black uppercase tracking-widest text-white">
          Something went wrong
        </p>

        <h1 className="mt-4 text-2xl font-black text-[#082d63]">
          Dashboard could not be loaded
        </h1>

        <p className="mt-3 text-[#7d4255]">
          {error.message}
        </p>

        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-xl bg-[#1267c9] px-4 py-2 font-black text-white shadow-[0_4px_0_#082d63]"
        >
          Try again
        </button>
      </section>
    </main>
  );
}
