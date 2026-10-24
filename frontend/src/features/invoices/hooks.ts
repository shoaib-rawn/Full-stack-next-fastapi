"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { getCustomers } from "@/features/customers/api";
import { customerKeys } from "@/features/customers/hooks";
import { dashboardKeys } from "@/features/dashboard/hooks";
import { withMinDuration } from "@/lib/demo-delay";

import {
  createInvoice,
  getInvoice,
  getInvoices,
  toInvoicePayload,
  updateInvoice,
  voidInvoice,
} from "./api";
import type { InvoiceFormValues } from "./schemas";
import type { InvoiceFilters } from "./types";

export const invoiceKeys = {
  all: ["invoices"] as const,
  list: (page: number, size: number, filters: InvoiceFilters = {}) =>
    ["invoices", "list", page, size, filters.status ?? "all", filters.customerId ?? "all"] as const,
  detail: (id: number) => ["invoices", "detail", id] as const,
};

// Backend page-size cap for customers is 100.
const CUSTOMER_OPTIONS_SIZE = 100;

// Learning mode, same as customers: every fetch takes the demo duration and
// opening a page always refetches, so the request animation is visible.
export function useInvoices(
  page: number,
  size: number,
  filters: InvoiceFilters = {},
) {
  return useQuery({
    queryKey: invoiceKeys.list(page, size, filters),
    queryFn: () => getInvoices(page, size, filters),
    refetchOnMount: "always",
  });
}

export function useInvoice(id: number) {
  return useQuery({
    queryKey: invoiceKeys.detail(id),
    queryFn: () => getInvoice(id),
    refetchOnMount: "always",
    enabled: Number.isInteger(id) && id > 0,
  });
}

// Customers for the form's dropdown and for showing names (the invoice API
// only returns customer_id). It lives under the "customers" key prefix, so
// creating or editing a customer refreshes it.
export function useCustomerOptions() {
  return useQuery({
    queryKey: [...customerKeys.all, "options"],
    queryFn: () => getCustomers(1, CUSTOMER_OPTIONS_SIZE),
  });
}

export function useCustomerSearch(search: string) {
  return useInfiniteQuery({
    queryKey: [...customerKeys.all, "invoice-options", search.trim()],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      getCustomers(pageParam, CUSTOMER_OPTIONS_SIZE, search.trim() || undefined),
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.pages ? lastPage.page + 1 : undefined,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: InvoiceFormValues) =>
      withMinDuration(createInvoice(values)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

export function useUpdateInvoice(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: InvoiceFormValues) =>
      withMinDuration(updateInvoice(id, toInvoicePayload(values))),
    onSuccess: (invoice) => {
      queryClient.setQueryData(invoiceKeys.detail(invoice.id), invoice);
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

export function useVoidInvoice(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => withMinDuration(voidInvoice(id)),
    onSuccess: (invoice) => {
      queryClient.setQueryData(invoiceKeys.detail(invoice.id), invoice);
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}
