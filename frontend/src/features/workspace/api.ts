import { httpClient } from "@/lib/http-client";

import type {
  Member,
  MemberPage,
  MemberUpdate,
  Organization,
} from "./types";
import type {
  MemberCreateValues,
  OrganizationFormValues,
} from "./schemas";

export async function getOrganization(): Promise<Organization> {
  const response = await httpClient.get<Organization>("/organizations/current");
  return response.data;
}

export async function updateOrganization(
  values: OrganizationFormValues,
): Promise<Organization> {
  const response = await httpClient.patch<Organization>(
    "/organizations/current",
    values,
  );
  return response.data;
}

export async function getMembers(page = 1, size = 10): Promise<MemberPage> {
  const response = await httpClient.get<MemberPage>("/members", {
    params: { page, size },
  });
  return response.data;
}

export async function createMember(values: MemberCreateValues): Promise<Member> {
  const response = await httpClient.post<Member>("/members", values);
  return response.data;
}

export async function updateMember(
  memberId: number,
  values: MemberUpdate,
): Promise<Member> {
  const response = await httpClient.patch<Member>(`/members/${memberId}`, values);
  return response.data;
}
