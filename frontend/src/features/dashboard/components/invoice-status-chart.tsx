"use client";

import {
  ArcElement,
  Chart as ChartJS,
  Legend,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";

import type { DashboardSummary } from "../types";

ChartJS.register(ArcElement, Tooltip, Legend);

const options: ChartOptions<"doughnut"> = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "66%",
  plugins: {
    legend: {
      position: "bottom",
      labels: { boxWidth: 12, padding: 12, color: "#163e6b", font: { size: 12, weight: "bold" } },
    },
  },
};

export function InvoiceStatusChart({ summary }: { summary: DashboardSummary }) {
  const values = [
    summary.issued_invoices,
    summary.partially_paid_invoices,
    summary.paid_invoices,
    summary.void_invoices,
  ];

  if (values.every((value) => value === 0)) {
    return (
      <div className="grid h-48 place-items-center rounded-2xl border-2 p-4 sm:h-64 border-dashed border-[#b9def0] text-center font-bold text-[#58718c]">
        Create an invoice to see its lifecycle chart.
      </div>
    );
  }

  return (
    <div className="relative h-64 w-full min-w-0 sm:h-72" aria-label="Invoice status distribution chart">
      <Doughnut
        options={options}
        data={{
          labels: ["Issued", "Partially paid", "Paid", "Void"],
          datasets: [
            {
              data: values,
              backgroundColor: ["#1267c9", "#e4a51d", "#159447", "#d7344f"],
              borderColor: "#ffffff",
              borderWidth: 4,
            },
          ],
        }}
      />
    </div>
  );
}
