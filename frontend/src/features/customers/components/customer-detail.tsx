"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  RequestAnimation,
  RequestOverlay,
} from "@/components/request-animation";

import {
  useCustomer,
  useDeleteCustomer,
  useUpdateCustomer,
} from "../hooks";
import {
  customerFormSchema,
  type CustomerFormValues,
} from "../schemas";
import type { Customer } from "../types";

type CustomerDetailProps = {
  id: number;
  mode: "view" | "edit";
  canDelete: boolean;
};

export function CustomerDetail({
  id,
  mode,
  canDelete,
}: CustomerDetailProps) {
  const customerQuery = useCustomer(id);

  if (customerQuery.isPending || customerQuery.isFetching) {
    return <RequestAnimation flow="customer" />;
  }

  if (customerQuery.isError) {
    return (
      <RequestAnimation
        flow="customer"
        error={customerQuery.error.message || "Could not load this customer."}
      />
    );
  }

  if (mode === "view") {
    return <CustomerSummary customer={customerQuery.data} />;
  }

  return (
    <CustomerEditor
      key={customerQuery.data.updated_at}
      customer={customerQuery.data}
      canDelete={canDelete}
    />
  );
}

function CustomerHeader({
  customer,
}: {
  customer: Customer;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b-2 border-dashed border-[#c5e6f7] pb-5">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-full bg-[#1267c9] font-black text-white">
          {customer.id}
        </span>
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-[#1267c9]">Database record</p>
          <h2 className="text-xl font-black text-[#082d63]">{customer.display_name}</h2>
        </div>
      </div>
      <span className={customer.is_active
        ? "rounded-full bg-[#dff4cf] px-3 py-1 text-xs font-black text-[#28712f]"
        : "rounded-full bg-[#eef1f4] px-3 py-1 text-xs font-black text-[#657382]"
      }>
        {customer.is_active ? "Active" : "Inactive"}
      </span>
    </div>
  );
}

function CustomerSummary({
  customer,
}: {
  customer: Customer;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border-2 border-[#72c8f1] bg-white p-5 shadow-[0_8px_0_rgba(8,45,99,0.07)] sm:p-7">
      <CustomerHeader customer={customer} />

      <dl className="grid gap-5 md:grid-cols-2">
        <ReadOnlyField label="Customer name" value={customer.display_name} />
        <ReadOnlyField label="Email" value={customer.email ?? "No email"} />
      </dl>
    </section>
  );
}

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="mb-2 text-sm font-black text-[#163e6b]">{label}</dt>
      <dd className="rounded-xl border-2 border-[#d9edf7] bg-[#f7fcff] px-4 py-3 text-[#0b2e59]">
        {value}
      </dd>
    </div>
  );
}

function CustomerEditor({
  customer,
  canDelete,
}: {
  customer: Customer;
  canDelete: boolean;
}) {
  const router = useRouter();
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

  async function onSubmit(
    values: CustomerFormValues,
  ) {
    try {
      await updateCustomer.mutateAsync({
        id: customer.id,
        values: {
          display_name: values.displayName,
          email: values.email || null,
        },
      });
    } catch {
      // Mutation state displays the error.
    }
  }

  // Soft action: the record and its history stay; only the status changes.
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

  // Hard action: the backend removes the row, and refuses (409)
  // when the customer has invoices.
  async function handleDelete() {
    const confirmed = window.confirm(
      `Permanently delete ${customer.display_name}?\n\nThis only works for customers with no invoices. To keep history, deactivate instead.`,
    );

    if (!confirmed) return;

    try {
      await deleteCustomer.mutateAsync(
        customer.id,
      );

      router.push("/customers");
      router.refresh();
    } catch {
      // Mutation state displays the error.
    }
  }

  const requestError =
    updateCustomer.error?.message ?? deleteCustomer.error?.message;

  return (
    <div className="space-y-5">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="overflow-hidden rounded-3xl border-2 border-[#72c8f1] bg-white p-5 shadow-[0_8px_0_rgba(8,45,99,0.07)] sm:p-7"
      >
        <CustomerHeader customer={customer} />
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="displayName"
              className="mb-2 block text-sm font-black text-[#163e6b]"
            >
              Customer name
            </label>
  
            <input
              id="displayName"
              {...register("displayName")}
              className="w-full rounded-xl border-2 border-[#b8dbea] bg-[#f7fcff] px-4 py-3 text-[#0b2e59] outline-none focus:border-[#1267c9]"
            />
  
            {errors.displayName && (
              <p className="mt-2 rounded-lg bg-[#ffe3eb] px-3 py-2 text-sm font-bold text-[#a3234c]">
                {errors.displayName.message}
              </p>
            )}
          </div>
  
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-black text-[#163e6b]"
            >
              Email
            </label>
  
            <input
              id="email"
              type="email"
              {...register("email")}
              className="w-full rounded-xl border-2 border-[#b8dbea] bg-[#f7fcff] px-4 py-3 text-[#0b2e59] outline-none focus:border-[#1267c9]"
            />
  
            {errors.email && (
              <p className="mt-2 rounded-lg bg-[#ffe3eb] px-3 py-2 text-sm font-bold text-[#a3234c]">
                {errors.email.message}
              </p>
            )}
          </div>
        </div>
  
        {updateCustomer.isSuccess && (
          <p className="mt-5 rounded-xl border border-[#9bd884] bg-[#e5f7d7] p-3 text-sm font-bold text-[#28712f]">
            ✓ Customer updated successfully.
          </p>
        )}
  
        {requestError && (
          <p className="mt-5 rounded-xl border border-[#f1a8bc] bg-[#ffe3eb] p-3 text-sm font-bold text-[#a3234c]">
            {requestError}
          </p>
        )}
  
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/customers/${customer.id}`}
            className="rounded-xl border-2 border-[#1267c9] px-5 py-3 font-black text-[#1267c9]"
          >
            Cancel
          </Link>
  
          <button
            type="submit"
            disabled={updateCustomer.isPending}
            className="rounded-xl bg-[#e4a51d] px-5 py-3 font-black text-[#082d63] shadow-[0_4px_0_#a87309] disabled:opacity-60"
          >
            {updateCustomer.isPending
              ? "Saving..."
              : "Save changes"}
          </button>
        </div>
      </form>

      <section className="grid gap-5 md:grid-cols-2">
        <div className="rounded-3xl border-2 border-[#9bd884] bg-white p-5 shadow-[0_6px_0_rgba(8,45,99,0.06)]">
          <p className="text-xs font-black uppercase tracking-wider text-[#28712f]">Status · soft</p>
          <h3 className="mt-1 text-lg font-black text-[#082d63]">
            {customer.is_active ? "Deactivate customer" : "Reactivate customer"}
          </h3>
          <p className="mt-2 text-sm text-[#58718c]">
            {customer.is_active
              ? "Hide from daily work but keep the record and its invoices. It stays in the list as Inactive."
              : "Make this customer active again for new work."}
          </p>
          <button
            type="button"
            onClick={handleToggleActive}
            disabled={updateCustomer.isPending}
            className={customer.is_active
              ? "mt-4 rounded-xl border-2 border-[#657382] px-5 py-3 font-black text-[#3d4b59] disabled:opacity-60"
              : "mt-4 rounded-xl bg-[#159447] px-5 py-3 font-black text-white shadow-[0_4px_0_#17652f] disabled:opacity-60"
            }
          >
            {customer.is_active ? "Deactivate" : "Reactivate"}
          </button>
        </div>

        <div className="rounded-3xl border-2 border-[#f1a8bc] bg-white p-5 shadow-[0_6px_0_rgba(8,45,99,0.06)]">
          <p className="text-xs font-black uppercase tracking-wider text-[#a3234c]">Danger zone · hard</p>
          <h3 className="mt-1 text-lg font-black text-[#082d63]">Delete permanently</h3>
          <p className="mt-2 text-sm text-[#58718c]">
            Only for records created by mistake. Customers with invoices cannot be deleted. Deactivate them instead.
          </p>
          {canDelete ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteCustomer.isPending}
              className="mt-4 rounded-xl bg-[#d7344f] px-5 py-3 font-black text-white shadow-[0_4px_0_#991d34] disabled:opacity-60"
            >
              {deleteCustomer.isPending
                ? "Deleting..."
                : "Delete customer"}
            </button>
          ) : (
            <p className="mt-4 rounded-xl bg-[#eef1f4] p-3 text-sm font-bold text-[#657382]">
              🔒 Only the organization owner can delete customers.
            </p>
          )}
        </div>
      </section>

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
    </div>
  );
}
