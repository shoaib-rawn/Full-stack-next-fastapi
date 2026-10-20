export type Customer = {
  id: number;
  organization_id: number;
  display_name: string;
  email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CustomerPage = {
  items: Customer[];
  page: number;
  size: number;
  total: number;
  pages: number;
};

export type CreateCustomerInput = {
  display_name: string;
  email: string | null;
};

export type UpdateCustomerInput = {
  display_name?: string;
  email?: string | null;
  is_active?: boolean;
};
