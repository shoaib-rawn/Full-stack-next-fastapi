"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { withMinDuration } from "@/lib/demo-delay";

import {
  createMember,
  getMembers,
  getOrganization,
  updateMember,
  updateOrganization,
} from "./api";
import type { MemberCreateValues, OrganizationFormValues } from "./schemas";
import type { MemberUpdate } from "./types";

export const workspaceKeys = {
  organization: ["workspace", "organization"] as const,
  members: ["workspace", "members"] as const,
  memberPage: (page: number, size: number) =>
    ["workspace", "members", page, size] as const,
};

export function useOrganization() {
  return useQuery({
    queryKey: workspaceKeys.organization,
    queryFn: () => getOrganization(),
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: OrganizationFormValues) =>
      withMinDuration(updateOrganization(values)),
    onSuccess: (organization) => {
      queryClient.setQueryData(workspaceKeys.organization, organization);
    },
  });
}

export function useMembers(page: number, size: number) {
  return useQuery({
    queryKey: workspaceKeys.memberPage(page, size),
    queryFn: () => getMembers(page, size),
  });
}

export function useCreateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: MemberCreateValues) =>
      withMinDuration(createMember(values)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workspaceKeys.members });
    },
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: MemberUpdate }) =>
      withMinDuration(updateMember(id, values)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workspaceKeys.members });
    },
  });
}
