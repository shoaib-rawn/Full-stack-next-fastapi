export type WorkspaceRole = "owner" | "member";

export type Organization = {
  id: number;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
};

export type Member = {
  id: number;
  organization_id: number;
  full_name: string;
  email: string;
  role: WorkspaceRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type MemberPage = {
  items: Member[];
  page: number;
  size: number;
  total: number;
  pages: number;
};

export type MemberUpdate = {
  full_name?: string;
  role?: WorkspaceRole;
  is_active?: boolean;
};
