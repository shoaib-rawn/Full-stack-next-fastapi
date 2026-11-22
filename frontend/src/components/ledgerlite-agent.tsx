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
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={open ? "Close LedgerBot" : "Open LedgerBot"} className="group grid size-20 place-items-center rounded-full bg-transparent transition-transform hover:scale-110 focus-visible:outline-4 focus-visible:outline-[#ffd65a]">
        <span className="ll-agent-float relative block h-[76px] w-[72px] drop-shadow-[0_8px_9px_rgba(4,32,64,.3)]" aria-hidden="true">
          <span className="absolute left-[35px] top-0 h-3 w-0.5 bg-white" />
          <span className="absolute left-[33px] top-0 size-1.5 rounded-full bg-[#ffd65a]" />
          <span className="absolute left-1 top-8 h-7 w-2 -rotate-[30deg] rounded-full bg-white" />
          <span className="absolute right-1 top-8 h-7 w-2 rotate-[30deg] rounded-full bg-white" />
          <span className="absolute left-4 top-[42px] h-8 w-10 rounded-b-2xl rounded-t-lg border-2 border-[#cfebf4] bg-white" />
          <span className="absolute left-[7px] top-2 grid h-[48px] w-[58px] place-items-center rounded-[20px] border-[5px] border-white bg-[#182943] shadow-[inset_0_0_0_2px_#93c7d8]">
            <span className="absolute top-[18px] flex gap-3"><i className="size-1.5 rounded-full bg-[#26e99c]" /><i className="size-1.5 rounded-full bg-[#26e99c]" /></span>
            <span className="absolute bottom-[9px] h-2 w-4 rounded-b-full border-b-[3px] border-[#26e99c]" />
          </span>
        </span>
      </button>
    </aside>
  );
}
