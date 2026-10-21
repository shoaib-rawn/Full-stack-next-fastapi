import { httpClient } from "@/lib/http-client";

import type { DashboardSummary } from "./types";

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const response = await httpClient.get<DashboardSummary>("/reports/summary");
  return response.data;
}
