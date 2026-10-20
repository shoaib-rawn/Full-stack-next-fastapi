import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CustomerDetail } from "@/features/customers/components/customer-detail";
import { getCurrentUser } from "@/lib/server-auth";

type CustomerRouteParams = Promise<{
  id: string;
}>;

type CustomerPageProps = {
  params: CustomerRouteParams;
  mode: "view" | "edit";
};

export function CustomerPage({
  params,
  mode,
}: CustomerPageProps) {
  return (
    <Suspense fallback={<CustomerPageFallback />}>
      <CustomerPageContent params={params} mode={mode} />
    </Suspense>
  );
}

async function CustomerPageContent({
  params,
  mode,
}: CustomerPageProps) {
  const { id } = await params;
  const customerId = Number(id);

  if (!Number.isInteger(customerId) || customerId <= 0) {
    notFound();
  }

  const isEdit = mode === "edit";
  // Backend allows DELETE for owners only; hide the button for members.
  const user = isEdit ? await getCurrentUser() : null;
  const canDelete = user?.role === "owner";

  return (
    <main className="mx-auto min-h-[calc(100vh-76px)] max-w-6xl p-4 sm:p-6 lg:min-h-screen">
      <Link
        href={isEdit ? `/customers/${customerId}` : "/customers"}
        className="inline-flex rounded-lg border-2 border-[#1267c9] px-3 py-2 text-sm font-black text-[#1267c9] hover:bg-[#e5f6ff]"
      >
        {isEdit ? "← Back to customer" : "← Back to customers"}
      </Link>

      <section className="mb-6 mt-5 grid overflow-hidden rounded-3xl border-2 border-[#f0c557] bg-white shadow-[0_7px_0_rgba(8,45,99,0.07)] md:grid-cols-[1.2fr_0.8fr]">
        <div className={isEdit ? "bg-[#fff4c8] p-6" : "bg-[#e5f6ff] p-6"}>
          <span className="rounded-md bg-[#ffd65a] px-3 py-1 text-xs font-black uppercase tracking-wider text-[#082d63]">
            Dynamic route /customers/{customerId}{isEdit ? "/edit" : ""}
          </span>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-[#082d63]">
            {isEdit ? "Edit customer" : "Customer details"}
          </h1>
          <p className="mt-3 text-[#58718c]">
            {isEdit
              ? "Update or delete this record. Changes are saved through PATCH and DELETE."
              : "Read-only view of one record. Open Edit to change it."}
          </p>
        </div>
        <div className="bg-[#073979] p-6 text-white">
          <p className="text-xs font-black uppercase tracking-widest text-[#ffd65a]">Record lifecycle</p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-black">
            <span className={isEdit ? "rounded-lg bg-[#1267c9]/40 px-2 py-3" : "rounded-lg bg-[#1267c9] px-2 py-3 ring-2 ring-[#ffd65a]"}><span className="block text-lg">📥</span>GET<br />Load</span>
            <span className={isEdit ? "rounded-lg bg-[#e4a51d] px-2 py-3 text-[#082d63] ring-2 ring-[#ffd65a]" : "rounded-lg bg-[#e4a51d]/40 px-2 py-3 text-[#082d63]"}><span className="block text-lg">✏️</span>PATCH<br />Update</span>
            <span className={isEdit ? "rounded-lg bg-[#d7344f] px-2 py-3 ring-2 ring-[#ffd65a]" : "rounded-lg bg-[#d7344f]/40 px-2 py-3"}><span className="block text-lg">🗑️</span>DELETE<br />Remove</span>
          </div>
        </div>
      </section>

      <CustomerDetail id={customerId} mode={mode} canDelete={canDelete} />
    </main>
  );
}

function CustomerPageFallback() {
  return (
    <main className="mx-auto max-w-6xl animate-pulse p-6">
      <div className="h-5 w-36 rounded bg-[#c5e6f7]" />
      <div className="mt-8 h-10 w-72 rounded bg-[#c5e6f7]" />
      <div className="mt-8 h-80 rounded-3xl border-2 border-[#c5e6f7] bg-white" />
    </main>
  );
}
