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
      labels: { boxWidth: 12, padding: 16, color: "#163e6b" },
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
      <div className="grid h-64 place-items-center rounded-2xl border-2 border-dashed border-[#b9def0] text-center font-bold text-[#58718c]">
        Create an invoice to see its lifecycle chart.
      </div>
    );
  }

  return (
    <div className="h-72" aria-label="Invoice status distribution chart">
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
