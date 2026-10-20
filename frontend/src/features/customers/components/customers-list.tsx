"use client";

import { useState } from "react";
import Link from "next/link";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

import { RequestAnimation } from "@/components/request-animation";

import { useCustomers } from "../hooks";
import { InlineCustomerEditor } from "./inline-customer-editor";

const PAGE_SIZE = 10;

export function CustomersList({ canDelete }: { canDelete: boolean }) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const requestedPage = Number(searchParams.get("page") ?? "1");
  const page =
    Number.isInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;

  const {
    data,
    isPending,
    isError,
    error,
    isFetching,
  } = useCustomers(page, PAGE_SIZE);

  function changePage(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", nextPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  }

  // Every fetch (first load, revisit, refetch after a change) shows the
  // request animation for the same demo duration.
  if (isPending || isFetching) {
    return (
      <div className="mt-8">
        <RequestAnimation flow="customers" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mt-8">
        <RequestAnimation
          flow="customers"
          error={error instanceof Error ? error.message : "Could not load customers."}
        />
      </div>
    );
  }

  if (data.items.length === 0) {
    return (
      <div className="mt-8 rounded-3xl border-2 border-dashed border-[#83cff4] bg-white p-10 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#e5f6ff] text-2xl">👤</span>
        <h2 className="mt-4 text-xl font-black text-[#082d63]">No customers yet</h2>
        <p className="mt-2 text-[#58718c]">Use the Create button to add your first customer record.</p>
      </div>
    );
  }

  return (
    <section className="mt-8 overflow-hidden rounded-3xl border-2 border-[#72c8f1] bg-white shadow-[0_8px_0_rgba(8,45,99,0.07)]">
      <div className="flex items-center justify-between gap-4 bg-[#e5f6ff] px-5 py-4">
        <div>
          <span className="rounded-md bg-[#ccecff] px-2 py-1 text-xs font-black text-[#0759a8]">RESULT</span>
          <p className="mt-2 font-black text-[#082d63]">{data.total} customer records</p>
        </div>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-y-2 border-[#c5e6f7] bg-[#f7fcff] text-xs font-black uppercase tracking-wider text-[#58718c]">
              <th className="px-5 py-4">ID</th>
              <th className="px-5 py-4">Name</th>
              <th className="px-5 py-4">Email</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((customer) => editingId === customer.id ? (
              <tr key={customer.id} className="border-b border-[#d9edf7]">
                <td colSpan={5} className="px-3 py-2">
                  <InlineCustomerEditor
                    customer={customer}
                    canDelete={canDelete}
                    onClose={() => setEditingId(null)}
                  />
                </td>
              </tr>
            ) : (
              <tr key={customer.id} className="border-b border-[#d9edf7] transition hover:bg-[#f1faff]">
                <td className="px-5 py-4 font-black text-[#1267c9]">#{customer.id}</td>
                <td className="px-5 py-4 font-black text-[#082d63]">{customer.display_name}</td>
                <td className="px-5 py-4 text-[#58718c]">{customer.email ?? "No email"}</td>
                <td className="px-5 py-4">
                  <StatusBadge active={customer.is_active} />
                </td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <Link href={`/customers/${customer.id}`} className="rounded-lg bg-[#1267c9] px-3 py-2 text-xs font-black text-white">View</Link>
                    <button type="button" onClick={() => setEditingId(customer.id)} className="rounded-lg bg-[#ffd65a] px-3 py-2 text-xs font-black text-[#082d63]">Edit</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-4 md:hidden">
        {data.items.map((customer) => editingId === customer.id ? (
          <InlineCustomerEditor
            key={customer.id}
            customer={customer}
            canDelete={canDelete}
            onClose={() => setEditingId(null)}
          />
        ) : (
          <article key={customer.id} className="rounded-2xl border-2 border-[#c5e6f7] bg-[#f7fcff] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black text-[#1267c9]">CUSTOMER #{customer.id}</p>
                <h2 className="mt-1 text-lg font-black text-[#082d63]">{customer.display_name}</h2>
                <p className="mt-1 text-sm text-[#58718c]">{customer.email ?? "No email"}</p>
              </div>
              <StatusBadge active={customer.is_active} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link href={`/customers/${customer.id}`} className="rounded-lg bg-[#1267c9] px-3 py-2 text-center text-sm font-black text-white">View</Link>
              <button type="button" onClick={() => setEditingId(customer.id)} className="rounded-lg bg-[#ffd65a] px-3 py-2 text-center text-sm font-black text-[#082d63]">Edit</button>
            </div>
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
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={active
      ? "inline-flex rounded-full bg-[#dff4cf] px-3 py-1 text-xs font-black text-[#28712f]"
      : "inline-flex rounded-full bg-[#eef1f4] px-3 py-1 text-xs font-black text-[#657382]"
    }>
      {active ? "Active" : "Inactive"}
    </span>
  );
}

