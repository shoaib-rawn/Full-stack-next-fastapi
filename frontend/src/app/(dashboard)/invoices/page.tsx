import { Suspense } from "react";
import Link from "next/link";

import { InvoicesList } from "@/features/invoices/components/invoices-list";

export default function InvoicesPage() {
  return (
    <main className="mx-auto min-h-[calc(100vh-76px)] max-w-7xl p-4 sm:p-6 lg:min-h-screen">
      <section className="grid overflow-hidden rounded-3xl border-2 border-[#72c8f1] bg-white shadow-[0_8px_0_rgba(8,45,99,0.07)] lg:grid-cols-[1.2fr_0.8fr]">
        <div className="bg-[#e5f6ff] p-6 sm:p-8">
          <span className="inline-flex rounded-md bg-[#1267c9] px-3 py-1 text-xs font-black uppercase tracking-wider text-white">
            Invoice register
          </span>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-[#082d63]">
            Invoices
          </h1>
          <p className="mt-3 max-w-xl leading-7 text-[#58718c]">
            Create an invoice, review its line items and totals, edit it while it is unpaid, or void it.
          </p>
        </div>
        <div className="bg-[#073979] p-6 text-white sm:p-8">
          <p className="text-xs font-black uppercase tracking-widest text-[#ffd65a]">Invoice lifecycle</p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm font-black">
            <span className="rounded-lg bg-[#1267c9] px-3 py-2">Issued</span>
            <span className="text-[#ffd65a]">→</span>
            <span className="rounded-lg bg-[#e4a51d] px-3 py-2 text-[#082d63]">Partially paid</span>
            <span className="text-[#ffd65a]">→</span>
            <span className="rounded-lg bg-[#159447] px-3 py-2">Paid</span>
          </div>
          <p className="mt-4 text-sm text-[#cceaff]">Totals are always calculated by the server.</p>
        </div>
      </section>

      <div className="mt-6">
        <Link
          href="/invoices/new"
          className="inline-flex rounded-xl bg-[#159447] px-5 py-3 font-black text-white shadow-[0_4px_0_#17652f] transition hover:-translate-y-0.5 active:translate-y-1 active:shadow-none"
        >
          + Create invoice
        </Link>
      </div>

      <Suspense fallback={<ListFallback />}>
        <InvoicesList />
      </Suspense>
    </main>
  );
}

function ListFallback() {
  return (
    <div className="mt-8 animate-pulse rounded-3xl border-2 border-[#c5e6f7] bg-white p-10 text-center font-black text-[#58718c]">
      Loading invoices...
    </div>
  );
}
