"use client";

import Link from "next/link";

import { ConceptStep, MiniFetch, MiniOneQuery, MiniSession } from "@/components/concept-visuals";
import { RequestAnimation } from "@/components/request-animation";
import { useCustomers } from "@/features/customers/hooks";
import { formatMoney } from "@/lib/money";

import { useDashboardSummary } from "../hooks";
import { InvoiceStatusChart } from "./invoice-status-chart";

type DashboardOverviewProps = {
  fullName: string;
  email: string;
  role: string;
};

export function DashboardOverview({ fullName, email, role }: DashboardOverviewProps) {
  const summary = useDashboardSummary();
  const customers = useCustomers(1, 5);
  const outstandingCount = summary.data
    ? summary.data.issued_invoices + summary.data.partially_paid_invoices
    : 0;

  return (
    <div className="mx-auto max-w-7xl">
      <section className="grid grid-cols-1 overflow-hidden rounded-[1.75rem] [&>*]:min-w-0 border-2 border-[#72c8f1] bg-white shadow-[0_8px_0_rgba(8,45,99,0.08)] lg:grid-cols-[1.15fr_0.85fr]">
        <div className="bg-linear-to-br from-[#e5f6ff] via-white to-[#f4fbff] p-6 sm:p-8">
          <span className="inline-flex rounded-md bg-[#1267c9] px-3 py-1 text-xs font-black uppercase tracking-wider text-white">Live workspace</span>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-[#082d63] md:text-5xl">Welcome back, {fullName}</h1>
          <p className="mt-3 font-medium text-[#58718c]">
            {email} <span className="px-2 text-[#1267c9]">•</span>
            <span className="capitalize">{role}</span>
          </p>
        </div>

        <div className="bg-[#073979] p-6 text-white sm:p-8">
          <p className="text-xs font-black uppercase tracking-widest text-[#ffd65a]">What this page proves</p>
          <div className="mt-5 grid gap-3">
            <ConceptStep number="1" title="Verify user" caption="Server side"><MiniSession /></ConceptStep>
            <ConceptStep number="2" title="Real data" caption="TanStack Query"><MiniFetch /></ConceptStep>
            <ConceptStep number="3" title="One request" caption="Counts + totals"><MiniOneQuery /></ConceptStep>
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard number="01" label="Total customers" value={summary.isFetching ? "..." : String(summary.data?.total_customers ?? 0)} tone="blue" />
        <MetricCard number="02" label="Total invoices" value={summary.isFetching ? "..." : String(summary.data?.total_invoices ?? 0)} tone="pink" />
        <MetricCard number="03" label="Invoices outstanding" value={summary.isFetching ? "..." : String(outstandingCount)} tone="green" />
      </section>

      {summary.isFetching && <div className="mt-6"><RequestAnimation flow="reports" /></div>}

      {summary.isError && (
        <section className="mt-6 rounded-3xl border-2 border-[#f1a8bc] bg-[#ffe3eb] p-6 text-center">
          <p className="font-black text-[#a3234c]">Could not load the accounting summary.</p>
          <button type="button" onClick={() => void summary.refetch()} className="mt-4 rounded-xl bg-[#a3234c] px-4 py-2 font-black text-white">Try again</button>
        </section>
      )}

      {summary.data && !summary.isFetching && (
        <section className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[0.9fr_1.1fr] [&>*]:min-w-0">
          <article className="rounded-3xl border-2 border-[#72c8f1] bg-white p-4 shadow-[0_8px_0_rgba(8,45,99,0.07)] sm:p-6">
            <span className="rounded-md bg-[#ccecff] px-2 py-1 text-xs font-black text-[#0759a8]">INVOICE LIFECYCLE</span>
            <h2 className="mt-3 text-xl font-black text-[#082d63] sm:text-2xl">Status distribution</h2>
            <p className="mt-1 text-sm text-[#58718c]">Chart.js renders the tenant-scoped invoice counts.</p>
            <div className="mt-4"><InvoiceStatusChart summary={summary.data} /></div>
          </article>

          <article className="rounded-3xl border-2 border-[#f1c75b] bg-[#fffdf4] p-4 shadow-[0_8px_0_rgba(8,45,99,0.07)] sm:p-6">
            <span className="rounded-md bg-[#ffe79c] px-2 py-1 text-xs font-black text-[#765603]">CURRENCY-SAFE TOTALS</span>
            <h2 className="mt-3 text-xl font-black text-[#082d63] sm:text-2xl">Money overview</h2>
            <p className="mt-1 text-sm text-[#58718c]">Different currencies remain separate to keep totals meaningful.</p>

            {summary.data.currency_totals.length === 0 ? (
              <div className="mt-5 rounded-2xl border-2 border-dashed border-[#e6c761] p-8 text-center font-bold text-[#765603]">Financial totals will appear after the first invoice.</div>
            ) : (
              <div className="mt-5 grid gap-4">
                {summary.data.currency_totals.map((totals) => (
                  <div key={totals.currency} className="min-w-0 rounded-2xl border-2 border-[#ead27f] bg-white p-3 sm:p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-lg font-black text-[#082d63]">{totals.currency}</p>
                      <span className="hidden rounded-full bg-[#fff1bc] px-3 py-1 text-xs font-black text-[#765603] min-[400px]:inline-flex">Accounting totals</span>
                    </div>
                    <dl className="mt-3 grid gap-2 sm:mt-4 sm:grid-cols-3 sm:gap-3">
                      <MoneyItem label="Invoiced" value={formatMoney(totals.total_invoiced, totals.currency)} />
                      <MoneyItem label="Paid" value={formatMoney(totals.total_paid, totals.currency)} />
                      <MoneyItem label="Outstanding" value={formatMoney(totals.total_outstanding, totals.currency)} />
                    </dl>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>
      )}

      <Link
        href="/customers"
        aria-label="Recent customers — open customer register"
        className="group mt-6 block overflow-hidden rounded-3xl border-2 border-[#9bd884] bg-white shadow-[0_8px_0_rgba(8,45,99,0.07)] transition hover:-translate-y-0.5 hover:border-[#1267c9] hover:shadow-[0_12px_0_rgba(8,45,99,0.09)] focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#ffd65a]"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 bg-[#e8f8dc] px-5 py-4 sm:px-6">
          <div>
            <span className="rounded-md bg-[#cceeb7] px-2 py-1 text-xs font-black text-[#286e30]">RECENT</span>
            <h2 className="mt-2 text-2xl font-black text-[#082d63]">Customers</h2>
          </div>
          <span className="rounded-xl bg-[#1267c9] px-4 py-2 text-sm font-black text-white shadow-[0_4px_0_#082d63] transition group-hover:bg-[#0759a8]">Open customer register →</span>
        </div>

        <div className="p-5 sm:p-6">
          {customers.isFetching && <RequestAnimation flow="customers" />}
          {customers.isError && <p className="rounded-xl bg-[#ffe3eb] p-4 font-bold text-[#a3234c]">Could not load recent customers.</p>}
          {!customers.isFetching && customers.data?.items.length === 0 && <p className="rounded-xl border-2 border-dashed border-[#b9def0] p-7 text-center text-[#58718c]">No customers yet.</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            {!customers.isFetching && customers.data?.items.map((customer) => (
              <div key={customer.id} className="rounded-2xl border-2 border-[#c9e6f4] bg-[#f7fcff] p-4">
                <p className="font-black text-[#082d63]">{customer.display_name}</p>
                <p className="mt-1 text-sm text-[#647d96]">{customer.email ?? "No email"}</p>
              </div>
            ))}
          </div>
        </div>
      </Link>
    </div>
  );
}

function MetricCard({ number, label, value, tone }: { number: string; label: string; value: string; tone: "blue" | "pink" | "green" }) {
  const colors = {
    blue: "border-[#72c8f1] bg-[#e5f6ff]",
    pink: "border-[#f4acc1] bg-[#ffe8ef]",
    green: "border-[#9bd884] bg-[#e8f8dc]",
  };
  return (
    <article className={`rounded-2xl border-2 p-5 shadow-[0_6px_0_rgba(8,45,99,0.07)] ${colors[tone]}`}>
      <div className="flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-full bg-[#1267c9] text-sm font-black text-white">{number}</span>
        <p className="text-sm font-black text-[#496680]">{label}</p>
      </div>
      <p className="mt-4 text-3xl font-black capitalize text-[#082d63]">{value}</p>
    </article>
  );
}

function MoneyItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 rounded-xl bg-[#fffaf0] px-3 py-2 sm:block sm:bg-transparent sm:p-0">
      <dt className="shrink-0 text-xs font-black uppercase tracking-wider text-[#6f7f8f]">{label}</dt>
      <dd className="ml-auto whitespace-nowrap sm:whitespace-normal text-right text-base font-black text-[#082d63] sm:mt-1 sm:ml-0 sm:text-left sm:text-lg">{value}</dd>
    </div>
  );
}
