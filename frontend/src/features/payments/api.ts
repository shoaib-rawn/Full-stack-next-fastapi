import { httpClient } from "@/lib/http-client";

import type { PaymentFormValues, ReversalFormValues } from "./schemas";
import type { PaymentPage, PaymentReceipt, PaymentReversal } from "./types";

export async function getPayments(
  invoiceId: number,
  page = 1,
  size = 50,
): Promise<PaymentPage> {
  const response = await httpClient.get<PaymentPage>(
    `/invoices/${invoiceId}/payments`,
    { params: { page, size } },
  );
  return response.data;
}

export async function createPayment(
  invoiceId: number,
  values: PaymentFormValues,
): Promise<PaymentReceipt> {
  const response = await httpClient.post<PaymentReceipt>(
    `/invoices/${invoiceId}/payments`,
    {
      amount: values.amount,
      method: values.method,
      reference: values.reference || null,
    },
  );
  return response.data;
}

export async function reversePayment(
  paymentId: number,
  values: ReversalFormValues,
): Promise<PaymentReversal> {
  const response = await httpClient.post<PaymentReversal>(
    `/payments/${paymentId}/reverse`,
    values,
  );
  return response.data;
}
