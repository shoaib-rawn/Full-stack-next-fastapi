import { httpClient } from "@/lib/http-client";

import type { InvoiceFormValues } from "./schemas";
import type {
  CreateInvoiceInput,
  Invoice,
  InvoiceFilters,
  InvoicePage,
  UpdateInvoiceInput,
} from "./types";

// Form values (camelCase strings) -> backend payload (snake_case). Money stays
// a string so no precision is lost.
export function toInvoicePayload(values: InvoiceFormValues): CreateInvoiceInput {
  return {
    customer_id: Number(values.customerId),
    currency: values.currency,
    tax_rate: values.taxRate,
    due_date: values.dueDate || null,
    notes: values.notes.trim() || null,
    line_items: values.lineItems.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
    })),
  };
}

export async function getInvoices(
  page: number,
  size: number,
  filters: InvoiceFilters = {},
): Promise<InvoicePage> {
  const response = await httpClient.get<InvoicePage>("/invoices", {
    params: {
      page,
      size,
      status: filters.status,
      customer_id: filters.customerId,
    },
  });

  return response.data;
}

export async function getInvoice(id: number): Promise<Invoice> {
  const response = await httpClient.get<Invoice>(`/invoices/${id}`);

  return response.data;
}

export async function createInvoice(values: InvoiceFormValues): Promise<Invoice> {
  const response = await httpClient.post<Invoice>("/invoices", toInvoicePayload(values));

  return response.data;
}

export async function updateInvoice(
  id: number,
  values: UpdateInvoiceInput,
): Promise<Invoice> {
  const response = await httpClient.patch<Invoice>(`/invoices/${id}`, values);

  return response.data;
}

export async function voidInvoice(id: number, reason: string): Promise<Invoice> {
  const response = await httpClient.post<Invoice>(`/invoices/${id}/void`, {
    reason,
  });

  return response.data;
}
