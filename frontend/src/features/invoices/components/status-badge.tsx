import type { InvoiceStatus } from "../types";

const badges: Record<InvoiceStatus, { label: string; className: string }> = {
  issued: { label: "Issued", className: "bg-[#ccecff] text-[#0759a8]" },
  partially_paid: { label: "Partially paid", className: "bg-[#fff0c2] text-[#8a5a00]" },
  paid: { label: "Paid", className: "bg-[#dff4cf] text-[#28712f]" },
  void: { label: "Void", className: "bg-[#eef1f4] text-[#657382]" },
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const badge = badges[status] ?? badges.issued;

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-black ${badge.className}`}
    >
      {badge.label}
    </span>
  );
}
