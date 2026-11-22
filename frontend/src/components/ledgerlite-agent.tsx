"use client";

import { useState } from "react";

export function LedgerLiteAgent() {
  const [open, setOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadSnapshot() {
    setLoading(true);
    try {
      const response = await fetch("/api/assistant/context", { cache: "no-store" });
      const data = await response.json() as { invoiceCount?: number; detail?: string };
      setSnapshot(response.ok ? `Your workspace has ${data.invoiceCount ?? 0} invoices.` : (data.detail ?? "Could not load your data."));
    } catch {
      setSnapshot("Could not connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
      {open && (
        <div className="mb-3 w-[min(21rem,calc(100vw-2rem))] rounded-3xl border border-[#83cff4] bg-white p-5 text-[#082d63] shadow-2xl" role="dialog" aria-label="LedgerLite assistant preview">
          <div className="flex items-center justify-between gap-3">
            <strong className="text-lg">Meet LedgerBot</strong>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close assistant" className="grid size-8 place-items-center rounded-full bg-[#e5f6ff] text-xl">×</button>
          </div>
          <p className="mt-2 text-sm leading-6 text-[#58718c]">Your accounting assistant is being prepared. Soon you will be able to ask about your invoices, payments, and balances here.</p>
          <button type="button" onClick={loadSnapshot} disabled={loading} className="mt-3 rounded-xl bg-[#082d63] px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{loading ? "Loading..." : "Show my invoice snapshot"}</button>
          {snapshot && <p className="mt-3 rounded-xl bg-[#e5f6ff] p-3 text-sm font-semibold" role="status">{snapshot}</p>}
          <p className="mt-3 rounded-xl bg-[#fff4c8] px-3 py-2 text-xs font-semibold">Preview only · No financial data is sent to an AI model yet.</p>
        </div>
      )}
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={open ? "Close LedgerBot" : "Open LedgerBot"} className="group flex items-end gap-2 rounded-2xl bg-[#082d63] p-2 pr-3 text-white shadow-[0_8px_24px_rgba(8,45,99,.3)] transition hover:-translate-y-1 focus-visible:outline-4 focus-visible:outline-[#ffd65a]">
        <span className="ll-agent-float relative grid h-14 w-14 place-items-center rounded-2xl border-4 border-[#d9edf7] bg-[#182943] shadow-inner" aria-hidden="true">
          <span className="absolute -top-3 left-1/2 h-2 w-0.5 -translate-x-1/2 bg-[#d9edf7]" />
          <span className="absolute -top-4 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-[#ffd65a]" />
          <span className="flex gap-2"><i className="size-1.5 rounded-full bg-[#26e99c]" /><i className="size-1.5 rounded-full bg-[#26e99c]" /></span>
          <span className="absolute bottom-2 h-2 w-4 rounded-b-full border-b-4 border-[#26e99c]" />
        </span>
        <span className="pb-2 text-left text-xs font-black leading-4">Ask<br />LedgerBot</span>
      </button>
    </aside>
  );
}
