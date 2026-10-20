import { Suspense } from "react";
import Link from "next/link";

import { ApiStatus } from "@/components/api-status";
import {
  ConceptStep,
  MiniCompanyCache,
  MiniCookie,
  MiniSync,
  MiniValidate,
} from "@/components/concept-visuals";

const workflow = [
  {
    number: "01",
    title: "Customers",
    description:
      "Keep each organization’s customer records separate and searchable.",
  },
  {
    number: "02",
    title: "Invoices",
    description:
      "Create line-item invoices with totals calculated by the backend.",
  },
  {
    number: "03",
    title: "Payments",
    description:
      "Record payments and follow every balance through its full history.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f5faff] text-[#0b2e59]">
      <section className="relative isolate border-b-4 border-[#ffd65a] bg-linear-to-br from-[#073979] via-[#0e61b8] to-[#082d63] px-5 pb-16 pt-6 text-white sm:px-8 lg:px-12 lg:pb-20">
        <div className="pointer-events-none absolute -right-36 -top-44 -z-10 size-136 rounded-full bg-[#69ccf5]/30 blur-3xl" />
        <div className="pointer-events-none absolute -left-44 top-72 -z-10 size-96 rounded-full bg-[#ffd65a]/20 blur-3xl" />

        <nav className="mx-auto flex max-w-6xl items-center justify-between rounded-2xl border border-white/25 bg-white/10 px-4 py-3 shadow-xl backdrop-blur sm:px-5">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl border-2 border-white/70 bg-white/10 text-sm font-black text-white">
              LL
            </span>
            <div>
              <p className="font-black tracking-[-0.02em]">LedgerLite</p>
              <p className="text-xs text-[#cceaff]">Accounting workspace</p>
            </div>
          </div>

          <Suspense fallback={<StatusFallback />}>
            <ApiStatus />
          </Suspense>
        </nav>

        <div className="mx-auto grid max-w-6xl gap-12 pb-4 pt-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:pt-28">
          <div>
            <p className="mb-5 inline-flex rounded-md bg-[#ffd65a] px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-[#082d63]">
              My LedgerLite Journey
            </p>
            <h1 className="max-w-4xl text-5xl font-black leading-[0.98] tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl">
              Clear accounts.
              <span className="block text-[#ffd65a]">Calmer decisions.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#d7edff] sm:text-xl">
              A multi-tenant workspace for customers, invoices, payments, and the
              complete story behind every balance.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/login" className="rounded-xl bg-[#ffd65a] px-5 py-3 font-black text-[#082d63] shadow-[0_4px_0_#be850b]">
                Sign in
              </Link>
              <Link href="/signup" className="rounded-xl border-2 border-white/60 bg-white/10 px-5 py-3 font-black text-white">
                Create workspace
              </Link>
            </div>
          </div>

          <div className="rounded-4xl border-2 border-white/30 bg-white/10 p-6 text-white shadow-[0_14px_0_rgba(4,30,68,0.2)] backdrop-blur sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#ffd65a]">
              Request journey
            </p>
            <div className="mt-5 grid gap-3">
              <ConceptStep number="1" title="Validate input" caption="Zod schema">
                <MiniValidate />
              </ConceptStep>
              <ConceptStep number="2" title="Protect session" caption="HttpOnly cookies">
                <MiniCookie />
              </ConceptStep>
              <ConceptStep number="3" title="Load tenant data" caption="Per company">
                <MiniCompanyCache />
              </ConceptStep>
              <ConceptStep number="4" title="Synchronize UI" caption="TanStack Query">
                <MiniSync />
              </ConceptStep>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="inline-flex rounded-md bg-[#ffe3eb] px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-[#a3234c]">
              Core workflow
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[#082d63] sm:text-4xl">
              One simple accounting flow, protected at every step.
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {workflow.map((item) => (
              <article
                key={item.number}
                className="group rounded-3xl border-2 border-[#83cff4] bg-white p-6 shadow-[0_7px_0_rgba(8,45,99,0.07)] transition duration-300 hover:-translate-y-1 hover:border-[#1267c9]"
              >
                <span className="grid size-10 place-items-center rounded-full bg-[#1267c9] text-sm font-black text-white">
                  {item.number}
                </span>
                <h3 className="mt-6 text-2xl font-black tracking-[-0.03em] text-[#082d63]">
                  {item.title}
                </h3>
                <p className="mt-3 leading-7 text-[#58718c]">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function StatusFallback() {
  return (
    <span className="rounded-full bg-white/15 px-3 py-2 text-xs font-bold text-white">
      Checking API…
    </span>
  );
}

