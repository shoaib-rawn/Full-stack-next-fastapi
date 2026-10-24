"use client";

import { useState } from "react";
import Link from "next/link";

import { RequestAnimation, RequestOverlay } from "@/components/request-animation";
import { QuietLoading, RevealZone } from "@/components/reveal-zone";
import { formatMoney } from "@/lib/money";
import { PaymentPanel } from "@/features/payments/components/payment-panel";

import { invoiceKeys, useCustomerOptions, useInvoice, useVoidInvoice } from "../hooks";
import type { Invoice } from "../types";
import { InvoiceStatusBadge } from "./status-badge";

type InvoiceDetailProps = {
  id: number;
  canVoid: boolean;
};

export function InvoiceDetail({ id, canVoid }: InvoiceDetailProps) {
  const invoiceQuery = useInvoice(id);
  const customers = useCustomerOptions();

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
  const customerName =
    customers.data?.items.find((customer) => customer.id === invoice.customer_id)
      ?.display_name ?? `Customer #${invoice.customer_id}`;

  return (
    <RevealZone id={`invoice-${id}`} flow="invoice" queryKey={invoiceKeys.detail(id)}>
      <InvoiceSummary
        invoice={invoice}
        customerName={customerName}
        canVoid={canVoid}
      />
    </RevealZone>
  );
}

function InvoiceSummary({
  invoice,
  customerName,
  canVoid,
}: {
  invoice: Invoice;
  customerName: string;
  canVoid: boolean;
}) {
  const voidInvoice = useVoidInvoice(invoice.id);
  const [confirming, setConfirming] = useState(false);

  // Backend rule: only an issued invoice with no payments can be edited.
  const editable = invoice.status === "issued" && Number(invoice.amount_paid) === 0;
  const voidable = invoice.status !== "void";
  const money = (value: string) => formatMoney(value, invoice.currency);

  return (
    <section className="overflow-hidden rounded-3xl border-2 border-[#72c8f1] bg-white shadow-[0_8px_0_rgba(8,45,99,0.07)]">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-dashed border-[#c5e6f7] bg-[#e5f6ff] p-5 sm:p-6">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-[#1267c9]">Invoice</p>
          <h2 className="text-2xl font-black text-[#082d63]">{invoice.invoice_number}</h2>
          <p className="mt-1 font-bold text-[#58718c]">{customerName}</p>
        </div>
        <InvoiceStatusBadge status={invoice.status} />
      </div>

      <dl className="grid gap-4 p-5 sm:grid-cols-3 sm:p-6">
        <div><dt className="text-xs font-black uppercase tracking-wider text-[#58718c]">Currency</dt><dd className="font-black text-[#082d63]">{invoice.currency}</dd></div>
        <div><dt className="text-xs font-black uppercase tracking-wider text-[#58718c]">Due date</dt><dd className="font-black text-[#082d63]">{invoice.due_date ?? "—"}</dd></div>
        <div><dt className="text-xs font-black uppercase tracking-wider text-[#58718c]">Tax rate</dt><dd className="font-black text-[#082d63]">{invoice.tax_rate}%</dd></div>
      </dl>

      <div className="px-5 sm:px-6">
        <h3 className="text-lg font-black text-[#082d63]">Line items</h3>

        <div className="mt-3 hidden overflow-x-auto md:block">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-y-2 border-[#c5e6f7] bg-[#f7fcff] text-xs font-black uppercase tracking-wider text-[#58718c]">
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Quantity</th>
                <th className="px-4 py-3 text-right">Unit price</th>
                <th className="px-4 py-3 text-right">Line total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.line_items.map((item) => (
                <tr key={item.id} className="border-b border-[#d9edf7]">
                  <td className="px-4 py-3 font-bold text-[#082d63]">{item.description}</td>
                  <td className="px-4 py-3 text-right text-[#58718c]">{item.quantity}</td>
                  <td className="px-4 py-3 text-right text-[#58718c]">{money(item.unit_price)}</td>
                  <td className="px-4 py-3 text-right font-black text-[#082d63]">{money(item.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 grid gap-3 md:hidden">
          {invoice.line_items.map((item) => (
            <article key={item.id} className="rounded-2xl border-2 border-[#c5e6f7] bg-[#f7fcff] p-4">
              <p className="font-black text-[#082d63]">{item.description}</p>
              <p className="mt-1 text-sm text-[#58718c]">{item.quantity} × {money(item.unit_price)}</p>
              <p className="mt-1 font-black text-[#082d63]">{money(item.line_total)}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="grid gap-6 p-5 sm:p-6 md:grid-cols-2">
        <div>
          {invoice.notes && (
            <>
              <h3 className="text-sm font-black uppercase tracking-wider text-[#58718c]">Notes</h3>
              <p className="mt-1 whitespace-pre-wrap text-[#163e6b]">{invoice.notes}</p>
            </>
          )}
        </div>
        <dl className="grid gap-1 rounded-2xl border-2 border-[#c5e6f7] bg-[#f7fcff] p-4 text-sm font-bold text-[#163e6b]">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{money(invoice.subtotal)}</dd></div>
          <div className="flex justify-between"><dt>Tax ({invoice.tax_rate}%)</dt><dd>{money(invoice.tax_amount)}</dd></div>
          <div className="flex justify-between border-t-2 border-[#c5e6f7] pt-1 text-base font-black text-[#082d63]"><dt>Total</dt><dd>{money(invoice.total)}</dd></div>
          <div className="flex justify-between"><dt>Amount paid</dt><dd>{money(invoice.amount_paid)}</dd></div>
          <div className="flex justify-between text-base font-black text-[#082d63]"><dt>Balance due</dt><dd>{money(invoice.balance_due)}</dd></div>
        </dl>
      </div>

      <PaymentPanel invoice={invoice} isOwner={canVoid} />

      {voidInvoice.isError && (
        <p className="mx-5 mb-4 rounded-lg bg-[#ffe3eb] p-3 text-sm font-bold text-[#a3234c] sm:mx-6">
          {voidInvoice.error.message}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t-2 border-[#c5e6f7] bg-[#f7fcff] p-5 sm:p-6">
        {editable ? (
          <Link
            href={`/invoices/${invoice.id}/edit`}
            className="rounded-xl bg-[#ffd65a] px-5 py-3 font-black text-[#082d63] shadow-[0_4px_0_#be850b]"
          >
            ✎ Edit
          </Link>
        ) : (
          <span
            title="Only an unpaid, issued invoice can be edited."
            className="cursor-not-allowed rounded-xl bg-[#eef1f4] px-5 py-3 font-black text-[#9aa7b4]"
          >
            ✎ Edit
          </span>
        )}

        {voidable &&
          (confirming ? (
            <>
              <button
                type="button"
                disabled={voidInvoice.isPending}
                onClick={() =>
                  voidInvoice.mutate(undefined, { onSettled: () => setConfirming(false) })
                }
                className="rounded-xl bg-[#d7344f] px-5 py-3 font-black text-white disabled:opacity-60"
              >
                {voidInvoice.isPending ? "Voiding..." : "Yes, void this invoice"}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="rounded-xl border-2 border-[#b8dbea] px-5 py-3 font-black text-[#58718c]"
              >
                Keep invoice
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={!canVoid}
              title={canVoid ? undefined : "Only the organization owner can void invoices."}
              onClick={() => setConfirming(true)}
              className="rounded-xl border-2 border-[#d7344f] px-5 py-3 font-black text-[#d7344f] disabled:cursor-not-allowed disabled:opacity-40"
            >
              🗑 Void
            </button>
          ))}
      </div>

      <RequestOverlay
        flow="invoice-void"
        active={voidInvoice.isPending}
        error={voidInvoice.error?.message}
      />
    </section>
  );
}
