import { Suspense } from "react";

import { ConceptStep, MiniSync } from "@/components/concept-visuals";
import { RequestAnimation } from "@/components/request-animation";
import { CustomersList } from "@/features/customers/components/customers-list";
import { CreateCustomerForm } from "@/features/customers/components/create-customer-form";
import { getCurrentUser } from "@/lib/server-auth";
export default function CustomersPage() {
  return (
    <main className="mx-auto min-h-[calc(100vh-76px)] max-w-7xl p-4 sm:p-6 lg:min-h-screen">
      <section className="grid overflow-hidden rounded-3xl border-2 border-[#72c8f1] bg-white shadow-[0_8px_0_rgba(8,45,99,0.07)] lg:grid-cols-[1.2fr_0.8fr]">
        <div className="bg-[#e5f6ff] p-6 sm:p-8">
          <span className="inline-flex rounded-md bg-[#1267c9] px-3 py-1 text-xs font-black uppercase tracking-wider text-white">
            Customer register
          </span>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-[#082d63]">
            Customers
          </h1>
          <p className="mt-3 max-w-xl leading-7 text-[#58718c]">
            Create a record, open its details, update information or remove it from one clear workflow.
          </p>
        </div>
        <div className="bg-[#073979] p-6 text-white sm:p-8">
          <p className="text-xs font-black uppercase tracking-widest text-[#ffd65a]">Data journey</p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm font-black">
            <span className="rounded-lg bg-[#159447] px-3 py-2">+ Create</span>
            <span className="text-[#ffd65a]">→</span>
            <span className="rounded-lg bg-[#1267c9] px-3 py-2">👁 View</span>
            <span className="text-[#ffd65a]">→</span>
            <span className="rounded-lg bg-[#e4a51d] px-3 py-2 text-[#082d63]">✎ Edit</span>
            <span className="text-[#ffd65a]">→</span>
            <span className="rounded-lg bg-[#d7344f] px-3 py-2">🗑 Delete</span>
          </div>
          <div className="mt-5">
            <ConceptStep number="↻" title="Auto sync" caption="TanStack Query">
              <MiniSync />
            </ConceptStep>
          </div>
        </div>
      </section>
      <div className="mt-6">
        <CreateCustomerForm />
      </div>
      <Suspense fallback={<CustomersFallback />}>
        <CustomersSection />
      </Suspense>
    </main>
  );
}

// Backend allows DELETE for owners only, so the list hides it for members.
async function CustomersSection() {
  const user = await getCurrentUser();

  return <CustomersList canDelete={user?.role === "owner"} />;
}

function CustomersFallback() {
  return (
    <div className="mt-8">
      <RequestAnimation flow="customers" />
    </div>
  );
}

