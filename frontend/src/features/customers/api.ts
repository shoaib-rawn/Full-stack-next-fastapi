import { httpClient } from "@/lib/http-client";

import type {
  Customer,
  CustomerPage,
  CreateCustomerInput,
  UpdateCustomerInput,
} from "./types";
import type { CustomerFormValues } from "./schemas";

export async function getCustomers(
  page: number,
  size: number,
  search?: string,
): Promise<CustomerPage> {
  const response = await httpClient.get<CustomerPage>("/customers", {
    params: { page, size, search: search || undefined },
  });

  return response.data;
}

export async function createCustomer(
  values: CustomerFormValues,
): Promise<Customer> {
  const payload: CreateCustomerInput = {
    display_name: values.displayName,
    email: values.email || null,
  };

  const response = await httpClient.post<Customer>("/customers", payload);

  return response.data;
}
export async function getCustomer(id: number): Promise<Customer> {
  const response = await httpClient.get<Customer>(`/customers/${id}`);

  return response.data;
}

export async function updateCustomer(
  id: number,
  values: UpdateCustomerInput,
): Promise<Customer> {
  const response = await httpClient.patch<Customer>(`/customers/${id}`, values);

  return response.data;
}

export async function deleteCustomer(id: number): Promise<void> {
  await httpClient.delete(`/customers/${id}`);
}
