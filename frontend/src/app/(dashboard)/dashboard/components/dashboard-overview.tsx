"use client";

import Link from "next/link";

import { useCustomers } from "@/features/customers/hooks";

type DashboardOverviewProps = {
  fullName: string;
  email: string;
  role: string;
};

export function DashboardOverview({
  fullName,
  email,
  role,
}: DashboardOverviewProps) {
  const customers = useCustomers(1, 5);

  return (
    <div className="mx-auto max-w-6xl">
      <section className="overflow-hidden rounded-3xl border border-emerald-400/20 bg-linear-to-br from-emerald-400/15 via-white/5 to-cyan-400/10 p-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
          LedgerLite workspace
        </p>

        <h1 className="mt-3 text-4xl font-bold md:text-5xl">
          Welcome back, {fullName}
        </h1>

        <p className="mt-3 text-slate-400">
          {email} · {role}
        </p>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardCard
          label="Total customers"
          value={
            customers.isPending
              ? "..."
              : String(customers.data?.total ?? 0)
          }
        />

        <DashboardCard
          label="Customer pages"
          value={
            customers.isPending
              ? "..."
              : String(customers.data?.pages ?? 0)
          }
        />

        <DashboardCard
          label="Workspace role"
          value={role}
        />
      </section>

      <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
              Recent records
            </p>
            <h2 className="mt-2 text-2xl font-bold">
              Customers
            </h2>
          </div>

          <Link
            href="/customers"
            className="rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/10"
          >
            View all
          </Link>
        </div>

        {customers.isError && (
          <p className="mt-6 text-red-400">
            Could not load customer summary.
          </p>
        )}

        {customers.data?.items.length === 0 && (
          <p className="mt-6 text-slate-400">
            No customers yet.
          </p>
        )}

        <div className="mt-6 grid gap-3">
          {customers.data?.items.map((customer) => (
            <Link
              key={customer.id}
              href={`/customers/${customer.id}`}
              className="flex items-center justify-between rounded-2xl border border-white/10 p-4 transition hover:border-emerald-400/40 hover:bg-white/5"
            >
              <div>
                <p className="font-semibold">
                  {customer.display_name}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  {customer.email ?? "No email"}
                </p>
              </div>

              <span className="text-emerald-400">
                →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function DashboardCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <p className="text-sm text-slate-400">
        {label}
      </p>
      <p className="mt-3 text-3xl font-bold capitalize">
        {value}
      </p>
    </article>
  );
}