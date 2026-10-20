"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { RequestOverlay } from "@/components/request-animation";

import { useCreateCustomer } from "../hooks";
import {
  customerFormSchema,
  type CustomerFormValues,
} from "../schemas";

export function CreateCustomerForm() {
  const [isOpen, setIsOpen] = useState(false);
  const createCustomer = useCreateCustomer();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      displayName: "",
      email: "",
    },
  });

  async function onSubmit(
    values: CustomerFormValues,
  ) {
    await createCustomer.mutateAsync(values);

    reset();
    setIsOpen(false);
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-xl bg-[#159447] px-5 py-3 font-black text-white shadow-[0_4px_0_#17652f] transition hover:-translate-y-0.5 active:translate-y-1 active:shadow-none"
      >
        + Create customer
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="overflow-hidden rounded-3xl border-2 border-[#9bd884] bg-white p-5 shadow-[0_7px_0_rgba(8,45,99,0.07)] sm:p-6"
    >
      <div className="mb-5 flex items-center gap-3 border-b-2 border-dashed border-[#cfe7c1] pb-4">
        <span className="grid size-10 place-items-center rounded-full bg-[#159447] font-black text-white">+</span>
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-[#28712f]">Create operation</p>
          <h2 className="text-xl font-black text-[#082d63]">New customer record</h2>
        </div>
      </div>
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
            placeholder="Ali Traders"
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
            Email (optional)
          </label>

          <input
            id="email"
            type="email"
            {...register("email")}
            placeholder="ali@example.com"
            className="w-full rounded-xl border-2 border-[#b8dbea] bg-[#f7fcff] px-4 py-3 text-[#0b2e59] outline-none focus:border-[#1267c9]"
          />

          {errors.email && (
            <p className="mt-2 rounded-lg bg-[#ffe3eb] px-3 py-2 text-sm font-bold text-[#a3234c]">
              {errors.email.message}
            </p>
          )}
        </div>
      </div>

      {createCustomer.isError && (
        <p className="mt-4 rounded-lg bg-[#ffe3eb] p-3 text-sm font-bold text-[#a3234c]">
          Could not create customer.
        </p>
      )}

      <div className="mt-6 flex gap-3">
        <button
          type="submit"
          disabled={createCustomer.isPending}
          className="rounded-xl bg-[#159447] px-5 py-3 font-black text-white shadow-[0_4px_0_#17652f] disabled:opacity-60"
        >
          {createCustomer.isPending
            ? "Saving..."
            : "Save customer"}
        </button>

        <button
          type="button"
          onClick={() => {
            reset();
            createCustomer.reset();
            setIsOpen(false);
          }}
          className="rounded-xl border-2 border-[#b8dbea] px-5 py-3 font-black text-[#58718c]"
        >
          Cancel
        </button>
      </div>

      <RequestOverlay
        flow="create"
        active={createCustomer.isPending}
        error={createCustomer.error?.message}
      />
    </form>
  );
}
