import Link from "next/link";

import { InvoiceForm } from "@/features/invoices/components/invoice-form";

export default function NewInvoicePage() {
  return (
    <main className="mx-auto min-h-[calc(100vh-76px)] max-w-6xl p-4 sm:p-6 lg:min-h-screen">
      <Link
        href="/invoices"
        className="inline-flex rounded-lg border-2 border-[#1267c9] px-3 py-2 text-sm font-black text-[#1267c9] hover:bg-[#e5f6ff]"
      >
        ← Back to invoices
      </Link>

      <section className="mb-6 mt-5 overflow-hidden rounded-3xl border-2 border-[#9bd884] bg-white shadow-[0_7px_0_rgba(8,45,99,0.07)]">
        <div className="bg-[#e8f8dc] p-6">
          <span className="rounded-md bg-[#159447] px-3 py-1 text-xs font-black uppercase tracking-wider text-white">
            POST /invoices
          </span>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-[#082d63]">New invoice</h1>
          <p className="mt-3 text-[#58718c]">
            Pick a customer, add line items and save. The server calculates and stores the final totals.
          </p>
        </div>
      </section>

      <InvoiceForm mode="create" />
    </main>
  );
}
