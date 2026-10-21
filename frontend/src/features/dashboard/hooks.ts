"use client";

import { useQuery } from "@tanstack/react-query";

import { withMinDuration } from "@/lib/demo-delay";

import { getDashboardSummary } from "./api";

export const dashboardKeys = {
  all: ["dashboard-summary"] as const,
};

export function useDashboardSummary() {
  return useQuery({
    queryKey: dashboardKeys.all,
    queryFn: () => withMinDuration(getDashboardSummary()),
    refetchOnMount: "always",
  });
}
