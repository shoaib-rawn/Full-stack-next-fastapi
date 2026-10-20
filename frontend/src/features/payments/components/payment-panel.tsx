"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { Invoice } from "@/features/invoices/types";
import { ApiError } from "@/lib/http-client";
import { formatMoney } from "@/lib/money";

import { useCreatePayment, usePayments, useReversePayment } from "../hooks";
import {
  paymentSchema,
  reversalSchema,
  type PaymentFormValues,
  type ReversalFormValues,
} from "../schemas";

const inputClass =
  "w-full rounded-xl border-2 border-[#b8dbea] bg-white px-3 py-2 text-[#0b2e59] outline-none focus:border-[#1267c9]";

function message(error: unknown) {
  return error instanceof ApiError ? error.message : "The request could not be completed.";
}

function ReversePayment({
  invoiceId,
  paymentId,
  onClose,
}: {
  invoiceId: number;
  paymentId: number;
  onClose: () => void;
}) {
  const reverse = useReversePayment(invoiceId, paymentId);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReversalFormValues>({
    resolver: zodResolver(reversalSchema),
    defaultValues: { reason: "" },
  });

  async function submit(values: ReversalFormValues) {
    try {
      await reverse.mutateAsync(values);
      onClose();
    } catch {
      // Mutation error is rendered below.
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="mt-3 rounded-xl bg-[#fff4c8] p-3">
      <label className="text-xs font-black text-[#7a5a05]" htmlFor={`reason-${paymentId}`}>
        Reversal reason
      </label>
      <input id={`reason-${paymentId}`} {...register("reason")} className={inputClass} />
      {errors.reason && <p className="mt-1 text-xs font-bold text-[#a3234c]">{errors.reason.message}</p>}
      {reverse.isError && <p className="mt-1 text-xs font-bold text-[#a3234c]">{message(reverse.error)}</p>}
      <div className="mt-2 flex gap-2">
        <button disabled={reverse.isPending} className="rounded-lg bg-[#d7344f] px-3 py-2 text-xs font-black text-white">
          {reverse.isPending ? "Reversing..." : "Confirm reversal"}
        </button>
        <button type="button" onClick={onClose} className="rounded-lg border-2 border-[#b8dbea] px-3 py-2 text-xs font-black text-[#58718c]">
          Cancel
        </button>
      </div>
    </form>
  );
}

export function PaymentPanel({ invoice, isOwner }: { invoice: Invoice; isOwner: boolean }) {
  const [paymentPage, setPaymentPage] = useState(1);
  const payments = usePayments(invoice.id, paymentPage, 10);
  const create = useCreatePayment(invoice.id);
  const [reversingId, setReversingId] = useState<number | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { amount: "", method: "bank_transfer", reference: "" },
  });

  async function submit(values: PaymentFormValues) {
    try {
      await create.mutateAsync(values);
      reset({ amount: "", method: "bank_transfer", reference: "" });
    } catch {
      // Mutation error is rendered below.
    }
  }

  const canPay = invoice.status !== "void" && Number(invoice.balance_due) > 0;

  return (
    <section className="border-t-2 border-[#c5e6f7] bg-[#f7fcff] p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-[#0f8a6d]">Payment history</p>
          <h3 className="text-xl font-black text-[#082d63]">Record and audit payments</h3>
        </div>
        <span className="rounded-full bg-[#e0f5ef] px-3 py-1 text-sm font-black text-[#0f8a6d]">
          Balance {formatMoney(invoice.balance_due, invoice.currency)}
        </span>
      </div>

      {canPay && (
        <form onSubmit={handleSubmit(submit)} className="mt-4 grid gap-3 rounded-2xl border-2 border-[#9bd884] bg-white p-4 md:grid-cols-4">
          <div>
            <label className="text-xs font-black text-[#58718c]" htmlFor="payment-amount">Amount</label>
            <input id="payment-amount" inputMode="decimal" {...register("amount")} className={inputClass} />
            {errors.amount && <p className="mt-1 text-xs font-bold text-[#a3234c]">{errors.amount.message}</p>}
          </div>
          <div>
            <label className="text-xs font-black text-[#58718c]" htmlFor="payment-method">Method</label>
            <select id="payment-method" {...register("method")} className={inputClass}>
              <option value="bank_transfer">Bank transfer</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-black text-[#58718c]" htmlFor="payment-reference">Reference</label>
            <input id="payment-reference" {...register("reference")} className={inputClass} />
          </div>
          <button disabled={create.isPending} className="self-end rounded-xl bg-[#159447] px-4 py-3 font-black text-white disabled:opacity-50">
            {create.isPending ? "Saving..." : "Record payment"}
          </button>
          {create.isError && <p className="md:col-span-4 text-sm font-bold text-[#a3234c]">{message(create.error)}</p>}
        </form>
      )}

      <div className="mt-4 grid gap-3">
        {payments.isPending && <p className="font-bold text-[#58718c]">Loading payments...</p>}
        {payments.isError && <p className="font-bold text-[#a3234c]">{message(payments.error)}</p>}
        {payments.data?.items.length === 0 && <p className="font-bold text-[#58718c]">No payments recorded yet.</p>}
        {payments.data?.items.map((payment) => (
          <article key={payment.id} className="rounded-2xl border-2 border-[#c5e6f7] bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-black text-[#082d63]">{formatMoney(payment.amount, invoice.currency)}</p>
                <p className="text-sm text-[#58718c]">{payment.method.replace("_", " ")} · {payment.reference || "No reference"}</p>
              </div>
              {payment.reversed_at ? (
                <span className="rounded-full bg-[#ffe3eb] px-3 py-1 text-xs font-black text-[#a3234c]">Reversed</span>
              ) : isOwner ? (
                <button type="button" onClick={() => setReversingId(payment.id)} className="rounded-lg border-2 border-[#d7344f] px-3 py-2 text-xs font-black text-[#d7344f]">
                  Reverse
                </button>
              ) : null}
            </div>
            {payment.reversal_reason && <p className="mt-2 text-sm font-bold text-[#a3234c]">Reason: {payment.reversal_reason}</p>}
            {reversingId === payment.id && (
              <ReversePayment invoiceId={invoice.id} paymentId={payment.id} onClose={() => setReversingId(null)} />
            )}
          </article>
        ))}
        {payments.data && payments.data.pages > 1 && (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-white p-3">
            <button
              type="button"
              disabled={paymentPage <= 1 || payments.isFetching}
              onClick={() => setPaymentPage((page) => page - 1)}
              className="rounded-lg border-2 border-[#1267c9] px-3 py-2 text-xs font-black text-[#1267c9] disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm font-black text-[#58718c]">
              Page {payments.data.page} of {payments.data.pages}
            </span>
            <button
              type="button"
              disabled={paymentPage >= payments.data.pages || payments.isFetching}
              onClick={() => setPaymentPage((page) => page + 1)}
              className="rounded-lg bg-[#1267c9] px-3 py-2 text-xs font-black text-white disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
