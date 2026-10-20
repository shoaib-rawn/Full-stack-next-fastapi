import "server-only";

import { cookies } from "next/headers";

export type CurrentUser = {
  id: number;
  organization_id: number;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

const apiUrl = process.env.API_URL ?? "http://127.0.0.1:8000";

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    return null;
  }

  const response = await fetch(`${apiUrl}/auth/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as CurrentUser;
}
