"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { invoiceKeys } from "@/features/invoices/hooks";
import { withMinDuration } from "@/lib/demo-delay";

import { createPayment, getPayments, reversePayment } from "./api";
import type { PaymentFormValues, ReversalFormValues } from "./schemas";

export const paymentKeys = {
  all: ["payments"] as const,
  invoice: (invoiceId: number, page: number, size: number) =>
    ["payments", "invoice", invoiceId, page, size] as const,
};

export function usePayments(invoiceId: number, page = 1, size = 50) {
  return useQuery({
    queryKey: paymentKeys.invoice(invoiceId, page, size),
    queryFn: () => withMinDuration(getPayments(invoiceId, page, size)),
    enabled: Number.isInteger(invoiceId) && invoiceId > 0,
  });
}

export function useCreatePayment(invoiceId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: PaymentFormValues) =>
      withMinDuration(createPayment(invoiceId, values)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: paymentKeys.all });
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
    },
  });
}

export function useReversePayment(invoiceId: number, paymentId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: ReversalFormValues) =>
      withMinDuration(reversePayment(paymentId, values)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: paymentKeys.all });
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(invoiceId) });
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
    },
  });
}
