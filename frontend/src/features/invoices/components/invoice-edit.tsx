"use client";

import Link from "next/link";

import { RequestAnimation } from "@/components/request-animation";
import { QuietLoading, RevealZone } from "@/components/reveal-zone";

import { invoiceKeys, useInvoice } from "../hooks";
import { InvoiceForm } from "./invoice-form";

export function InvoiceEdit({ id }: { id: number }) {
  const invoiceQuery = useInvoice(id);

  if (invoiceQuery.isPending) {
    return <QuietLoading />;
  }

  if (invoiceQuery.isError) {
    return (
      <RequestAnimation
        flow="invoice"
        error={invoiceQuery.error.message || "Could not load this invoice."}
      />
    );
  }

  const invoice = invoiceQuery.data;

  // Backend rule: only an issued invoice with no payments can be updated.
  if (invoice.status !== "issued" || Number(invoice.amount_paid) !== 0) {
    return (
      <div className="rounded-3xl border-2 border-[#f0c557] bg-[#fff4c8] p-8 text-center">
        <p className="font-black text-[#082d63]">Only an unpaid, issued invoice can be edited.</p>
        <Link
          href={`/invoices/${invoice.id}`}
          className="mt-4 inline-flex rounded-lg bg-[#1267c9] px-4 py-2 text-sm font-black text-white"
        >
          Back to invoice
        </Link>
      </div>
    );
  }

  return (
    <RevealZone id={`invoice-${id}-edit`} flow="invoice" queryKey={invoiceKeys.detail(id)}>
      <InvoiceForm key={invoice.updated_at} mode="edit" invoice={invoice} />
    </RevealZone>
  );
}
