"use client";

import { useQuery } from "@tanstack/react-query";

import { withMinDuration } from "@/lib/demo-delay";

import { getDashboardSummary } from "./api";

export const dashboardKeys = {
  all: ["dashboard-summary"] as const,
};

// The dashboard loads instantly; its request animation is replayed on demand
// (hover or tap) through fetchDashboardSummaryDemo below.
export function useDashboardSummary() {
  return useQuery({
    queryKey: dashboardKeys.all,
    queryFn: () => getDashboardSummary(),
    refetchOnMount: "always",
  });
}

export const fetchDashboardSummaryDemo = () =>
  withMinDuration(getDashboardSummary());
