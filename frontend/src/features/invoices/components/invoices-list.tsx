"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { RequestAnimation } from "@/components/request-animation";
import { QuietLoading, RevealZone } from "@/components/reveal-zone";
import { formatMoney } from "@/lib/money";

import { invoiceKeys, useCustomerOptions, useInvoices } from "../hooks";
import type { InvoiceStatus } from "../types";
import { InvoiceStatusBadge } from "./status-badge";

const PAGE_SIZE = 10;
const invoiceStatuses: InvoiceStatus[] = [
  "issued",
  "partially_paid",
  "paid",
  "void",
];

export function InvoicesList() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [dismissedBanner, setDismissedBanner] = useState<string | null>(null);

  const requestedPage = Number(searchParams.get("page") ?? "1");
  const page =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const created = searchParams.get("created");
  const requestedStatus = searchParams.get("status");
  const status = invoiceStatuses.includes(requestedStatus as InvoiceStatus)
    ? (requestedStatus as InvoiceStatus)
    : undefined;
  const requestedCustomerId = Number(searchParams.get("customer"));
  const customerId =
    Number.isInteger(requestedCustomerId) && requestedCustomerId > 0
      ? requestedCustomerId
      : undefined;
  const { data, isPending, isError, error, isFetching, refetch } = useInvoices(
    page,
    PAGE_SIZE,
    { status, customerId },
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

  function changeFilter(name: "status" | "customer", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(name, value);
    else params.delete(name);
    params.set("page", "1");
    params.delete("created");
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearFilters() {
    router.push(pathname);
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

  const filters = (
    <section className="mt-6 grid gap-4 rounded-3xl border-2 border-[#f1c75b] bg-[#fff8dc] p-4 shadow-[0_6px_0_rgba(8,45,99,0.06)] sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <label className="grid gap-2 text-sm font-black text-[#082d63]">
        Invoice status
        <select
          value={status ?? ""}
          onChange={(event) => changeFilter("status", event.target.value)}
          className="rounded-xl border-2 border-[#d7ad3c] bg-white px-3 py-3 font-bold outline-none focus:border-[#1267c9]"
        >
          <option value="">All statuses</option>
          <option value="issued">Issued</option>
          <option value="partially_paid">Partially paid</option>
          <option value="paid">Paid</option>
          <option value="void">Void</option>
        </select>
      </label>

      <label className="grid gap-2 text-sm font-black text-[#082d63]">
        Customer
        <select
          value={customerId?.toString() ?? ""}
          onChange={(event) => changeFilter("customer", event.target.value)}
          className="rounded-xl border-2 border-[#d7ad3c] bg-white px-3 py-3 font-bold outline-none focus:border-[#1267c9]"
        >
          <option value="">All customers</option>
          {customers.data?.items.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.display_name}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        onClick={clearFilters}
        disabled={!status && !customerId}
        className="rounded-xl border-2 border-[#082d63] px-4 py-3 text-sm font-black text-[#082d63] disabled:cursor-not-allowed disabled:opacity-35"
      >
        Clear filters
      </button>
    </section>
  );

  if (isPending) {
    return (
      <>
        {banner}
        {filters}
        <QuietLoading className="mt-8" />
      </>
    );
  }

  const zoneKey = invoiceKeys.list(page, PAGE_SIZE, { status, customerId });

  if (isError) {
    return (
      <>
        {banner}
        {filters}
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
        {filters}
        <RevealZone id="invoices-list" flow="invoices" queryKey={zoneKey} className="mt-8">
        <div className="rounded-3xl border-2 border-dashed border-[#83cff4] bg-white p-10 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#e5f6ff] text-2xl">🧾</span>
          <h2 className="mt-4 text-xl font-black text-[#082d63]">
            {status || customerId ? "No invoices match these filters" : "No invoices yet"}
          </h2>
          <p className="mt-2 text-[#58718c]">
            {status || customerId
              ? "Change or clear the filters to see other invoices."
              : "Create your first invoice to start billing a customer."}
          </p>
          {!status && !customerId && (
            <Link
              href="/invoices/new"
              className="mt-5 inline-flex rounded-xl bg-[#159447] px-5 py-3 font-black text-white shadow-[0_4px_0_#17652f]"
            >
              + Create your first invoice
            </Link>
          )}
        </div>
        </RevealZone>
      </>
    );
  }

  return (
    <>
      {banner}
      {filters}
      <RevealZone id="invoices-list" flow="invoices" queryKey={zoneKey} className="mt-6">
      <section className="overflow-hidden rounded-3xl border-2 border-[#72c8f1] bg-white shadow-[0_8px_0_rgba(8,45,99,0.07)]">
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
      </RevealZone>
    </>
  );
}
