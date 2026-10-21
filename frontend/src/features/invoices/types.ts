// Money fields are decimal strings ("28.60"), exactly as the backend sends
// them. They are formatted for display and never used for arithmetic, except
// in the form's estimated preview.

export type InvoiceStatus = "issued" | "partially_paid" | "paid" | "void";

export type InvoiceLineItem = {
  id: number;
  invoice_id: number;
  description: string;
  quantity: string;
  unit_price: string;
  line_total: string;
  created_at: string;
  updated_at: string;
};

export type Invoice = {
  id: number;
  organization_id: number;
  customer_id: number;
  invoice_number: string;
  status: InvoiceStatus;
  currency: string;
  subtotal: string;
  tax_rate: string;
  tax_amount: string;
  total: string;
  amount_paid: string;
  balance_due: string;
  due_date: string | null;
  notes: string | null;
  line_items: InvoiceLineItem[];
  created_at: string;
  updated_at: string;
};

export type InvoicePage = {
  items: Invoice[];
  page: number;
  size: number;
  total: number;
  pages: number;
};

export type InvoiceFilters = {
  status?: InvoiceStatus;
  customerId?: number;
};

export type InvoiceLineItemInput = {
  description: string;
  quantity: string;
  unit_price: string;
};

export type CreateInvoiceInput = {
  customer_id: number;
  currency: string;
  tax_rate: string;
  due_date: string | null;
  notes: string | null;
  line_items: InvoiceLineItemInput[];
};

export type UpdateInvoiceInput = Partial<CreateInvoiceInput>;
