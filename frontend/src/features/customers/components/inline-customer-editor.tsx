"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { RequestOverlay } from "@/components/request-animation";

import { useDeleteCustomer, useUpdateCustomer } from "../hooks";
import {
  customerFormSchema,
  type CustomerFormValues,
} from "../schemas";
import type { Customer } from "../types";

type InlineCustomerEditorProps = {
  customer: Customer;
  canDelete: boolean;
  onClose: () => void;
};

// Edits a customer right inside its list row: inputs plus small icon actions.
export function InlineCustomerEditor({
  customer,
  canDelete,
  onClose,
}: InlineCustomerEditorProps) {
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      displayName: customer.display_name,
      email: customer.email ?? "",
    },
  });

  async function onSubmit(values: CustomerFormValues) {
    try {
      await updateCustomer.mutateAsync({
        id: customer.id,
        values: {
          display_name: values.displayName,
          email: values.email || null,
        },
      });
      onClose();
    } catch {
      // Mutation state displays the error.
    }
  }

  async function handleToggleActive() {
    try {
      await updateCustomer.mutateAsync({
        id: customer.id,
        values: { is_active: !customer.is_active },
      });
    } catch {
      // Mutation state displays the error.
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Permanently delete ${customer.display_name}?\n\nThis only works for customers with no invoices. To keep history, deactivate instead.`,
    );

    if (!confirmed) return;

    try {
      await deleteCustomer.mutateAsync(customer.id);
      onClose();
    } catch {
      // Mutation state displays the error.
    }
  }

  const isBusy = updateCustomer.isPending || deleteCustomer.isPending;
  const requestError =
    updateCustomer.error?.message ?? deleteCustomer.error?.message;
  const fieldError = errors.displayName?.message ?? errors.email?.message;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
      className="rounded-2xl border-2 border-[#ffd65a] bg-[#fffaf0] p-3"
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <span className="font-black text-[#1267c9] md:w-14">#{customer.id}</span>

        <input
          {...register("displayName")}
          aria-label="Customer name"
          autoFocus
          className="min-w-0 flex-1 rounded-lg border-2 border-[#b8dbea] bg-white px-3 py-2 text-sm font-bold text-[#082d63] outline-none focus:border-[#1267c9]"
        />

        <input
          {...register("email")}
          type="email"
          aria-label="Email"
          placeholder="No email"
          className="min-w-0 flex-1 rounded-lg border-2 border-[#b8dbea] bg-white px-3 py-2 text-sm text-[#0b2e59] outline-none focus:border-[#1267c9]"
        />

        <div className="flex items-center justify-end gap-1.5">
          <IconButton
            type="button"
            label={customer.is_active ? "Deactivate (soft)" : "Reactivate"}
            onClick={handleToggleActive}
            disabled={isBusy}
            className={customer.is_active
              ? "border-2 border-[#657382] bg-white text-[#3d4b59]"
              : "bg-[#159447] text-white"
            }
          >
            {customer.is_active ? "⏸" : "▶"}
          </IconButton>

          {canDelete && (
            <IconButton
              type="button"
              label="Delete permanently"
              onClick={handleDelete}
              disabled={isBusy}
              className="bg-[#d7344f] text-white"
            >
              🗑
            </IconButton>
          )}

          <IconButton
            type="button"
            label="Cancel (Esc)"
            onClick={onClose}
            disabled={isBusy}
            className="border-2 border-[#b8dbea] bg-white text-[#58718c]"
          >
            ✕
          </IconButton>

          <IconButton
            type="submit"
            label="Save changes"
            disabled={isBusy}
            className="bg-[#1267c9] text-white"
          >
            ✓
          </IconButton>
        </div>
      </div>

      {(fieldError || requestError) && (
        <p className="mt-2 rounded-lg bg-[#ffe3eb] px-3 py-1.5 text-xs font-bold text-[#a3234c]">
          {fieldError ?? requestError}
        </p>
      )}

      <RequestOverlay
        flow="update"
        active={updateCustomer.isPending}
        error={updateCustomer.error?.message}
      />
      <RequestOverlay
        flow="delete"
        active={deleteCustomer.isPending}
        error={deleteCustomer.error?.message}
      />
    </form>
  );
}

function IconButton({
  label,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      {...props}
      title={label}
      aria-label={label}
      className={`grid size-9 place-items-center rounded-lg text-sm font-black transition hover:-translate-y-0.5 disabled:opacity-50 ${className ?? ""}`}
    >
      {children}
    </button>
  );
}
