"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { RequestAnimation } from "@/components/request-animation";
import { formatMoney } from "@/lib/money";

import { useCustomerOptions, useInvoices } from "../hooks";
import { InvoiceStatusBadge } from "./status-badge";

const PAGE_SIZE = 10;

export function InvoicesList() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [dismissedBanner, setDismissedBanner] = useState<string | null>(null);

  const requestedPage = Number(searchParams.get("page") ?? "1");
  const page =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const created = searchParams.get("created");
  const { data, isPending, isError, error, isFetching, refetch } = useInvoices(
    page,
    PAGE_SIZE,
  );
  const customers = useCustomerOptions();

  // The invoice API returns only customer_id, so names come from the customer list.
  const customerName = (id: number) =>
    customers.data?.items.find((customer) => customer.id === id)?.display_name ??
    `Customer #${id}`;

  function changePage(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", nextPage.toString());
    params.delete("created");
    router.push(`${pathname}?${params.toString()}`);
  }

  const banner =
    created && dismissedBanner !== created ? (
      <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border-2 border-[#9bd884] bg-[#e8f8dc] px-4 py-3">
        <p className="font-black text-[#28712f]">Invoice {created} created.</p>
        <button
          type="button"
          onClick={() => setDismissedBanner(created)}
          className="rounded-lg px-2 py-1 text-sm font-black text-[#28712f] hover:bg-white/60"
        >
          Dismiss
        </button>
      </div>
    ) : null;

  // Every fetch (first load, revisit, refetch after a change) shows the
  // request animation for the same demo duration, like customers.
  if (isPending || isFetching) {
    return (
      <>
        {banner}
        <div className="mt-8">
          <RequestAnimation flow="invoices" />
        </div>
      </>
    );
  }

  if (isError) {
    return (
      <>
        {banner}
        <div className="mt-8">
          <RequestAnimation
            flow="invoices"
            error={error instanceof Error ? error.message : "Could not load invoices."}
          />
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => void refetch()}
              className="rounded-lg bg-[#1267c9] px-4 py-2 text-sm font-black text-white"
            >
              Try again
            </button>
          </div>
        </div>
      </>
    );
  }

  if (data.items.length === 0) {
    return (
      <>
        {banner}
        <div className="mt-8 rounded-3xl border-2 border-dashed border-[#83cff4] bg-white p-10 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#e5f6ff] text-2xl">🧾</span>
          <h2 className="mt-4 text-xl font-black text-[#082d63]">No invoices yet</h2>
          <p className="mt-2 text-[#58718c]">Create your first invoice to start billing a customer.</p>
          <Link
            href="/invoices/new"
            className="mt-5 inline-flex rounded-xl bg-[#159447] px-5 py-3 font-black text-white shadow-[0_4px_0_#17652f]"
          >
            + Create your first invoice
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      {banner}
      <section className="mt-6 overflow-hidden rounded-3xl border-2 border-[#72c8f1] bg-white shadow-[0_8px_0_rgba(8,45,99,0.07)]">
        <div className="flex items-center justify-between gap-4 bg-[#e5f6ff] px-5 py-4">
          <div>
            <span className="rounded-md bg-[#ccecff] px-2 py-1 text-xs font-black text-[#0759a8]">RESULT</span>
            <p className="mt-2 font-black text-[#082d63]">{data.total} {data.total === 1 ? "invoice" : "invoices"}</p>
          </div>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-y-2 border-[#c5e6f7] bg-[#f7fcff] text-xs font-black uppercase tracking-wider text-[#58718c]">
                <th className="px-5 py-4">Number</th>
                <th className="px-5 py-4">Customer</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Due</th>
                <th className="px-5 py-4 text-right">Total</th>
                <th className="px-5 py-4 text-right">Balance due</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((invoice) => (
                <tr key={invoice.id} className="border-b border-[#d9edf7] transition hover:bg-[#f1faff]">
                  <td className="px-5 py-4 font-black text-[#1267c9]">{invoice.invoice_number}</td>
                  <td className="px-5 py-4 font-black text-[#082d63]">{customerName(invoice.customer_id)}</td>
                  <td className="px-5 py-4"><InvoiceStatusBadge status={invoice.status} /></td>
                  <td className="px-5 py-4 text-[#58718c]">{invoice.due_date ?? "—"}</td>
                  <td className="px-5 py-4 text-right font-black text-[#082d63]">{formatMoney(invoice.total, invoice.currency)}</td>
                  <td className="px-5 py-4 text-right font-black text-[#082d63]">{formatMoney(invoice.balance_due, invoice.currency)}</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end">
                      <Link href={`/invoices/${invoice.id}`} className="rounded-lg bg-[#1267c9] px-3 py-2 text-xs font-black text-white">View</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-3 p-4 md:hidden">
          {data.items.map((invoice) => (
            <article key={invoice.id} className="rounded-2xl border-2 border-[#c5e6f7] bg-[#f7fcff] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-[#1267c9]">{invoice.invoice_number}</p>
                  <h2 className="mt-1 text-lg font-black text-[#082d63]">{customerName(invoice.customer_id)}</h2>
                  <p className="mt-1 text-sm text-[#58718c]">Due {invoice.due_date ?? "—"}</p>
                </div>
                <InvoiceStatusBadge status={invoice.status} />
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div><dt className="text-xs font-black text-[#58718c]">Total</dt><dd className="font-black text-[#082d63]">{formatMoney(invoice.total, invoice.currency)}</dd></div>
                <div><dt className="text-xs font-black text-[#58718c]">Balance due</dt><dd className="font-black text-[#082d63]">{formatMoney(invoice.balance_due, invoice.currency)}</dd></div>
              </dl>
              <Link href={`/invoices/${invoice.id}`} className="mt-4 block rounded-lg bg-[#1267c9] px-3 py-2 text-center text-sm font-black text-white">View</Link>
            </article>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 border-t-2 border-[#c5e6f7] bg-[#f7fcff] p-4">
          <button
            type="button"
            disabled={page <= 1 || isFetching}
            onClick={() => changePage(page - 1)}
            className="rounded-lg border-2 border-[#1267c9] px-3 py-2 text-sm font-black text-[#1267c9] disabled:opacity-35 sm:px-4"
          >
            ← Previous
          </button>
          <p className="text-center text-sm font-black text-[#58718c]">
            Page <span className="text-[#1267c9]">{data.page}</span> of {Math.max(data.pages, 1)}
          </p>
          <button
            type="button"
            disabled={page >= data.pages || isFetching}
            onClick={() => changePage(page + 1)}
            className="rounded-lg bg-[#1267c9] px-3 py-2 text-sm font-black text-white disabled:opacity-35 sm:px-4"
          >
            Next →
          </button>
        </div>
      </section>
    </>
  );
}
