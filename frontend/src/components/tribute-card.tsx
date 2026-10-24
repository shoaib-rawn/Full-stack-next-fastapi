"use client";

import { useEffect, useState } from "react";

const tributeUrl = "https://internshipdays-wishes.vercel.app/index.html";

// "Tribute to PSEB" card. Opens the tribute page inside a framed box on
// this page instead of a new browser tab.
export function TributeCard() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setLoaded(false);
          setOpen(true);
        }}
        className="group rounded-4xl border-2 border-[#082d63] bg-linear-to-br from-[#073979] via-[#0e61b8] to-[#082d63] p-6 text-left sm:p-8 text-white shadow-[0_10px_0_#041a3a] transition hover:-translate-y-1 hover:shadow-[0_14px_0_#041a3a]"
      >
        <div className="flex items-center gap-3">
          <span className="grid size-14 place-items-center rounded-2xl bg-white text-3xl" aria-hidden>
            🎓
          </span>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#ffd65a]">
            Internship days
          </p>
        </div>
        <p className="mt-6 text-3xl font-black tracking-[-0.03em]">Tribute to PSEB</p>
        <p className="mt-3 leading-7 text-[#d7edff]">
          A small page of wishes and memories from my internship days.
        </p>
        <span className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#ffd65a] px-5 py-3 font-black text-[#082d63] shadow-[0_4px_0_#be850b]">
          Open tribute
          <span className="transition-transform group-hover:translate-x-1" aria-hidden>→</span>
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Tribute to PSEB"
          className="ll-row-in fixed inset-0 z-50 grid place-items-center bg-[#041a3a]/70 p-3 backdrop-blur-sm sm:p-6"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex h-[88dvh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border-4 border-[#ffd65a] bg-white shadow-[0_24px_60px_rgba(4,26,58,0.55)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 bg-linear-to-r from-[#073979] via-[#0e61b8] to-[#082d63] px-4 py-3 text-white sm:px-6">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-white text-xl" aria-hidden>
                  🎓
                </span>
                <div className="leading-tight">
                  <p className="font-black">Tribute to PSEB</p>
                  <p className="hidden text-xs text-[#cceaff] sm:block">Internship days · wishes and memories</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={tributeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex rounded-lg border border-white/40 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-white/10 sm:px-3"
                  aria-label="Open in new tab"
                >
                  <span className="hidden sm:inline">Open in new tab&nbsp;</span>↗
                </a>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="grid size-9 place-items-center rounded-xl bg-[#ffd65a] text-lg font-black text-[#082d63] shadow-[0_3px_0_#be850b] transition hover:-translate-y-0.5"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="relative flex-1 bg-[#f5faff]">
              {!loaded && (
                <div className="absolute inset-0 grid place-items-center">
                  <p className="flex items-center gap-2 font-black text-[#082d63]">
                    <span className="inline-block size-5 animate-spin rounded-full border-2 border-[#1267c9] border-t-transparent" />
                    Opening tribute...
                  </p>
                </div>
              )}
              <iframe
                src={tributeUrl}
                title="Tribute to PSEB"
                onLoad={() => setLoaded(true)}
                className="relative size-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
