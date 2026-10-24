"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { withMinDuration } from "@/lib/demo-delay";
import { dashboardKeys } from "@/features/dashboard/hooks";

import {
  createCustomer,
  deleteCustomer,
  getCustomer,
  getCustomers,
  updateCustomer,
} from "./api";
import type { CustomerFormValues } from "./schemas";
import type { UpdateCustomerInput } from "./types";
export const customerKeys = {
  all: ["customers"] as const,

  list: (page: number, size: number) =>
    ["customers", "list", page, size] as const,
  detail: (id: number) => ["customers", "detail", id] as const,
};

// Learning mode: every fetch takes the same demo duration, and opening a page
// always refetches (instead of reusing the 60s cache) so the request
// animation is visible on every visit.
// Pass { animate: false } to load without the demo delay (the dashboard
// replays the animation on hover or tap instead).
export function useCustomers(
  page: number,
  size: number,
  { animate = true }: { animate?: boolean } = {},
) {
  return useQuery({
    queryKey: customerKeys.list(page, size),
    queryFn: () =>
      animate ? withMinDuration(getCustomers(page, size)) : getCustomers(page, size),
    refetchOnMount: "always",
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: CustomerFormValues) =>
      withMinDuration(createCustomer(values)),

    // Not awaited: the mutation's own animation stays 5s, and the list
    // refetch then shows its own 5s request animation.
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: customerKeys.all,
      });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}
export function useCustomer(id: number) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => withMinDuration(getCustomer(id)),
    refetchOnMount: "always",
    enabled: Number.isInteger(id) && id > 0,
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: UpdateCustomerInput }) =>
      withMinDuration(updateCustomer(id, values)),

    onSuccess: (updatedCustomer) => {
      queryClient.setQueryData(
        customerKeys.detail(updatedCustomer.id),
        updatedCustomer,
      );

      void queryClient.invalidateQueries({
        queryKey: customerKeys.all,
      });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => withMinDuration(deleteCustomer(id)),

    onSuccess: (_data, id) => {
      queryClient.removeQueries({
        queryKey: customerKeys.detail(id),
      });

      void queryClient.invalidateQueries({
        queryKey: customerKeys.all,
      });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}
