"use client";

import { useQuery } from "@tanstack/react-query";

import { getDashboardSummary } from "./api";

export const dashboardKeys = {
  all: ["dashboard-summary"] as const,
};

export function useDashboardSummary() {
  return useQuery({
    queryKey: dashboardKeys.all,
    queryFn: () => getDashboardSummary(),
    refetchOnMount: "always",
  });
}
