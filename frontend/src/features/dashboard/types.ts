export type CurrencyTotals = {
  currency: string;
  total_invoiced: string;
  total_paid: string;
  total_outstanding: string;
};

export type DashboardSummary = {
  total_customers: number;
  total_invoices: number;
  issued_invoices: number;
  partially_paid_invoices: number;
  paid_invoices: number;
  void_invoices: number;
  currency_totals: CurrencyTotals[];
};
