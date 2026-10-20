export type PaymentMethod = "cash" | "bank_transfer" | "card" | "other";

export type Payment = {
  id: number;
  organization_id: number;
  invoice_id: number;
  amount: string;
  method: PaymentMethod;
  reference: string | null;
  paid_at: string;
  reversed_at: string | null;
  reversal_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type PaymentPage = {
  items: Payment[];
  page: number;
  size: number;
  total: number;
  pages: number;
};

export type PaymentReceipt = {
  payment: Payment;
  invoice_status: string;
  amount_paid: string;
  balance_due: string;
};

export type PaymentReversal = PaymentReceipt;
