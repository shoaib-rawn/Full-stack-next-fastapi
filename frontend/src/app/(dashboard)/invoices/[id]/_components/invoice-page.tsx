import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { InvoiceDetail } from "@/features/invoices/components/invoice-detail";
import { InvoiceEdit } from "@/features/invoices/components/invoice-edit";
import { getCurrentUser } from "@/lib/server-auth";

type InvoicePageProps = {
  params: Promise<{ id: string }>;
  mode: "view" | "edit";
};

export function InvoicePage({ params, mode }: InvoicePageProps) {
  return (
    <Suspense fallback={<InvoicePageFallback />}>
      <InvoicePageContent params={params} mode={mode} />
    </Suspense>
  );
}

async function InvoicePageContent({ params, mode }: InvoicePageProps) {
  const { id } = await params;
  const invoiceId = Number(id);

  if (!Number.isInteger(invoiceId) || invoiceId <= 0) {
    notFound();
  }

  const isEdit = mode === "edit";
  // Backend allows void for owners only; the button is disabled for members.
  const user = isEdit ? null : await getCurrentUser();
  const canVoid = user?.role === "owner";

  return (
    <main className="mx-auto min-h-[calc(100vh-76px)] max-w-6xl p-4 sm:p-6 lg:min-h-screen">
      <Link
        href={isEdit ? `/invoices/${invoiceId}` : "/invoices"}
        className="inline-flex rounded-lg border-2 border-[#1267c9] px-3 py-2 text-sm font-black text-[#1267c9] hover:bg-[#e5f6ff]"
      >
        {isEdit ? "← Back to invoice" : "← Back to invoices"}
      </Link>

      <section className="mb-6 mt-5 grid overflow-hidden rounded-3xl border-2 border-[#f0c557] bg-white shadow-[0_7px_0_rgba(8,45,99,0.07)] md:grid-cols-[1.2fr_0.8fr]">
        <div className={isEdit ? "bg-[#fff4c8] p-6" : "bg-[#e5f6ff] p-6"}>
          <span className="rounded-md bg-[#ffd65a] px-3 py-1 text-xs font-black uppercase tracking-wider text-[#082d63]">
            Dynamic route /invoices/{invoiceId}{isEdit ? "/edit" : ""}
          </span>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-[#082d63]">
            {isEdit ? "Edit invoice" : "Invoice details"}
          </h1>
          <p className="mt-3 text-[#58718c]">
            {isEdit
              ? "Only an unpaid, issued invoice can be changed. Totals are recalculated by the server."
              : "Read-only view of one invoice with its line items and totals."}
          </p>
        </div>
        <div className="bg-[#073979] p-6 text-white">
          <p className="text-xs font-black uppercase tracking-widest text-[#ffd65a]">Invoice actions</p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-black">
            <span className={isEdit ? "rounded-lg bg-[#1267c9]/40 px-2 py-3" : "rounded-lg bg-[#1267c9] px-2 py-3 ring-2 ring-[#ffd65a]"}><span className="block text-lg">📥</span>GET<br />Load</span>
            <span className={isEdit ? "rounded-lg bg-[#e4a51d] px-2 py-3 text-[#082d63] ring-2 ring-[#ffd65a]" : "rounded-lg bg-[#e4a51d]/40 px-2 py-3 text-[#082d63]"}><span className="block text-lg">✏️</span>PATCH<br />Update</span>
            <span className="rounded-lg bg-[#d7344f]/40 px-2 py-3"><span className="block text-lg">🗑️</span>POST<br />Void</span>
          </div>
        </div>
      </section>

      {isEdit ? (
        <InvoiceEdit id={invoiceId} />
      ) : (
        <InvoiceDetail id={invoiceId} canVoid={canVoid} />
      )}
    </main>
  );
}

function InvoicePageFallback() {
  return (
    <main className="mx-auto max-w-6xl animate-pulse p-6">
      <div className="h-5 w-36 rounded bg-[#c5e6f7]" />
      <div className="mt-8 h-10 w-72 rounded bg-[#c5e6f7]" />
      <div className="mt-8 h-80 rounded-3xl border-2 border-[#c5e6f7] bg-white" />
    </main>
  );
}
