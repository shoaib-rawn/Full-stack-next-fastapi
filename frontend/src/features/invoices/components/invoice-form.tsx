"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";

import { RequestOverlay } from "@/components/request-animation";
import { ApiError } from "@/lib/http-client";
import { formatMoney } from "@/lib/money";

import { previewTotals } from "../calc";
import { useCreateInvoice, useCustomerSearch, useUpdateInvoice } from "../hooks";
import { CURRENCIES, invoiceFormSchema, type InvoiceFormValues } from "../schemas";
import type { Invoice } from "../types";

const inputClass =
  "w-full rounded-xl border-2 border-[#b8dbea] bg-[#f7fcff] px-4 py-3 text-[#0b2e59] outline-none focus:border-[#1267c9]";
const labelClass = "mb-2 block text-sm font-black text-[#163e6b]";

const emptyLine = { description: "", quantity: "1", unitPrice: "" };

type InvoiceFormProps =
  | { mode: "create" }
  | { mode: "edit"; invoice: Invoice };

function defaultsFor(props: InvoiceFormProps): InvoiceFormValues {
  if (props.mode === "edit") {
    const { invoice } = props;

    return {
      customerId: String(invoice.customer_id),
      currency: invoice.currency,
      taxRate: invoice.tax_rate,
      dueDate: invoice.due_date ?? "",
      notes: invoice.notes ?? "",
      lineItems: invoice.line_items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unit_price,
      })),
    };
  }

  return {
    customerId: "",
    currency: "PKR",
    taxRate: "0",
    dueDate: "",
    notes: "",
    lineItems: [{ ...emptyLine }],
  };
}

function errorMessage(error: unknown) {
  if (error instanceof ApiError) {
    // FastAPI sends a list for 422, so the field messages are shown inline.
    if (error.status === 422) return "Some fields are not valid. Check the highlighted fields.";
    return error.message;
  }

  return "Could not save the invoice.";
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <p className="mt-2 rounded-lg bg-[#ffe3eb] px-3 py-2 text-sm font-bold text-[#a3234c]">
      {message}
    </p>
  );
}

export function InvoiceForm(props: InvoiceFormProps) {
  const router = useRouter();
  const isEdit = props.mode === "edit";
  const invoiceId = props.mode === "edit" ? props.invoice.id : 0;

  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice(invoiceId);
  const mutation = isEdit ? updateInvoice : createInvoice;
  const [customerSearch, setCustomerSearch] = useState("");
  const customers = useCustomerSearch(customerSearch);
  const customerItems =
    customers.data?.pages.flatMap((page) => page.items) ?? [];

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: defaultsFor(props),
  });

  const { fields, append, remove } = useFieldArray({ control, name: "lineItems" });

  const lineItems = useWatch({ control, name: "lineItems" });
  const taxRate = useWatch({ control, name: "taxRate" });
  const currency = useWatch({ control, name: "currency" });
  const preview = previewTotals(lineItems ?? [], taxRate ?? "0");

  async function onSubmit(values: InvoiceFormValues) {
    try {
      const invoice = await mutation.mutateAsync(values);

      router.push(
        isEdit
          ? `/invoices/${invoice.id}`
          : `/invoices?created=${encodeURIComponent(invoice.invoice_number)}`,
      );
    } catch {
      // The error is shown above the buttons through mutation.error.
    }
  }

  const lineItemsError =
    typeof errors.lineItems?.message === "string"
      ? errors.lineItems.message
      : errors.lineItems?.root?.message;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="overflow-hidden rounded-3xl border-2 border-[#9bd884] bg-white p-5 shadow-[0_7px_0_rgba(8,45,99,0.07)] sm:p-6"
    >
      <div className="mb-5 flex items-center gap-3 border-b-2 border-dashed border-[#cfe7c1] pb-4">
        <span className="grid size-10 place-items-center rounded-full bg-[#159447] font-black text-white">
          {isEdit ? "✎" : "+"}
        </span>
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-[#28712f]">
            {isEdit ? "Update operation" : "Create operation"}
          </p>
          <h2 className="text-xl font-black text-[#082d63]">
            {isEdit ? "Edit invoice" : "New invoice"}
          </h2>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label htmlFor="customerSearch" className={labelClass}>Find customer</label>
          <input
            id="customerSearch"
            value={customerSearch}
            onChange={(event) => setCustomerSearch(event.target.value)}
            placeholder="Search name or email"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="customerId" className={labelClass}>Customer</label>
          <select id="customerId" {...register("customerId")} className={inputClass}>
            <option value="">
              {customers.isPending ? "Loading customers..." : "Choose a customer"}
            </option>
            {props.mode === "edit" &&
              !customerItems.some((customer) => customer.id === props.invoice.customer_id) && (
                <option value={props.invoice.customer_id}>
                  Current customer #{props.invoice.customer_id}
                </option>
              )}
            {customerItems.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.display_name}
              </option>
            ))}
          </select>
          {customers.isError && (
            <p className="mt-2 text-sm font-bold text-[#a3234c]">Could not load customers.</p>
          )}
          {customers.data && customerItems.length === 0 && (
            <p className="mt-2 text-sm font-bold text-[#58718c]">
              No customers yet. <Link href="/customers" className="text-[#1267c9] underline">Create one first</Link>.
            </p>
          )}
          {customers.hasNextPage && (
            <button
              type="button"
              onClick={() => void customers.fetchNextPage()}
              disabled={customers.isFetchingNextPage}
              className="mt-2 rounded-lg border-2 border-[#1267c9] px-3 py-2 text-sm font-black text-[#1267c9] disabled:opacity-50"
            >
              {customers.isFetchingNextPage ? "Loading..." : "Load more customers"}
            </button>
          )}
          <FieldError message={errors.customerId?.message} />
        </div>

        <div>
          <label htmlFor="currency" className={labelClass}>Currency</label>
          <select id="currency" {...register("currency")} className={inputClass}>
            {CURRENCIES.map((code) => (
              <option key={code} value={code}>{code}</option>
            ))}
            {isEdit && !CURRENCIES.some((code) => code === props.invoice.currency) && (
              <option value={props.invoice.currency}>{props.invoice.currency}</option>
            )}
          </select>
          <FieldError message={errors.currency?.message} />
        </div>

        <div>
          <label htmlFor="taxRate" className={labelClass}>Tax rate (%)</label>
          <input
            id="taxRate"
            inputMode="decimal"
            {...register("taxRate")}
            placeholder="0"
            className={inputClass}
          />
          <FieldError message={errors.taxRate?.message} />
        </div>

        <div>
          <label htmlFor="dueDate" className={labelClass}>Due date (optional)</label>
          <input id="dueDate" type="date" {...register("dueDate")} className={inputClass} />
        </div>

        <div>
          <label htmlFor="notes" className={labelClass}>Notes (optional)</label>
          <textarea
            id="notes"
            rows={1}
            {...register("notes")}
            placeholder="Thank you for your business."
            className={inputClass}
          />
          <FieldError message={errors.notes?.message} />
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-black text-[#082d63]">Line items</h3>
          <button
            type="button"
            onClick={() => append({ ...emptyLine })}
            disabled={fields.length >= 100}
            className="rounded-lg bg-[#1267c9] px-3 py-2 text-sm font-black text-white disabled:opacity-40"
          >
            + Add line
          </button>
        </div>
        <FieldError message={lineItemsError} />

        <div className="mt-4 grid gap-3">
          {fields.map((field, index) => {
            const rowErrors = errors.lineItems?.[index];

            return (
              <div
                key={field.id}
                className="rounded-2xl border-2 border-[#c5e6f7] bg-[#f7fcff] p-4"
              >
                <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto]">
                  <div>
                    <label htmlFor={`desc-${index}`} className="mb-1 block text-xs font-black text-[#58718c]">
                      Description
                    </label>
                    <input
                      id={`desc-${index}`}
                      {...register(`lineItems.${index}.description`)}
                      placeholder="Website development"
                      className={inputClass}
                    />
                    <FieldError message={rowErrors?.description?.message} />
                  </div>
                  <div>
                    <label htmlFor={`qty-${index}`} className="mb-1 block text-xs font-black text-[#58718c]">
                      Quantity
                    </label>
                    <input
                      id={`qty-${index}`}
                      inputMode="decimal"
                      {...register(`lineItems.${index}.quantity`)}
                      className={inputClass}
                    />
                    <FieldError message={rowErrors?.quantity?.message} />
                  </div>
                  <div>
                    <label htmlFor={`price-${index}`} className="mb-1 block text-xs font-black text-[#58718c]">
                      Unit price
                    </label>
                    <input
                      id={`price-${index}`}
                      inputMode="decimal"
                      {...register(`lineItems.${index}.unitPrice`)}
                      placeholder="0.00"
                      className={inputClass}
                    />
                    <FieldError message={rowErrors?.unitPrice?.message} />
                  </div>
                  <div className="flex items-end justify-between gap-3 md:flex-col md:items-end md:justify-end">
                    <p className="text-sm font-black text-[#082d63]">
                      {formatMoney(preview.lineTotals[index] ?? 0, currency || "PKR")}
                    </p>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      disabled={fields.length <= 1}
                      className="rounded-lg border-2 border-[#d7344f] px-3 py-1.5 text-xs font-black text-[#d7344f] disabled:opacity-30"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border-2 border-dashed border-[#83cff4] bg-[#e5f6ff] p-4">
        <p className="text-xs font-black uppercase tracking-wider text-[#0759a8]">
          Estimated — the final amounts come from the server
        </p>
        <dl className="mt-3 grid gap-1 text-sm font-bold text-[#163e6b] sm:max-w-xs">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatMoney(preview.subtotal, currency || "PKR")}</dd></div>
          <div className="flex justify-between"><dt>Tax</dt><dd>{formatMoney(preview.tax, currency || "PKR")}</dd></div>
          <div className="flex justify-between border-t-2 border-[#83cff4] pt-1 text-base font-black text-[#082d63]">
            <dt>Total</dt><dd>{formatMoney(preview.total, currency || "PKR")}</dd>
          </div>
        </dl>
      </div>

      {mutation.isError && (
        <p className="mt-4 rounded-lg bg-[#ffe3eb] p-3 text-sm font-bold text-[#a3234c]">
          {errorMessage(mutation.error)}
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded-xl bg-[#159447] px-5 py-3 font-black text-white shadow-[0_4px_0_#17652f] disabled:opacity-60"
        >
          {mutation.isPending ? "Saving..." : isEdit ? "Save changes" : "Create invoice"}
        </button>
        <Link
          href={isEdit ? `/invoices/${invoiceId}` : "/invoices"}
          className="rounded-xl border-2 border-[#b8dbea] px-5 py-3 font-black text-[#58718c]"
        >
          Cancel
        </Link>
      </div>

      <RequestOverlay
        flow={isEdit ? "invoice-update" : "invoice-create"}
        active={mutation.isPending}
        error={mutation.error ? errorMessage(mutation.error) : null}
      />
    </form>
  );
}
