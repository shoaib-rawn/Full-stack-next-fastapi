// LedgerLite logo mark: the same ledger book as the browser-tab icon.
export function LedgerLogo({ className = "size-10" }: { className?: string }) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-xl bg-white shadow-[0_3px_0_rgba(4,30,68,0.35)] ring-2 ring-[#ffd65a]/80 ${className}`}
    >
      <svg viewBox="0 0 64 64" aria-hidden className="size-[72%]">
        <rect x="10" y="6" width="44" height="52" rx="6" fill="#ffd65a" />
        <rect x="10" y="6" width="10" height="52" rx="4" fill="#be850b" />
        <rect x="16" y="6" width="4" height="52" fill="#082d63" opacity="0.35" />
        <rect x="26" y="16" width="22" height="5" rx="2.5" fill="#082d63" />
        <rect x="26" y="26" width="18" height="4" rx="2" fill="#082d63" opacity="0.55" />
        <rect x="26" y="34" width="20" height="4" rx="2" fill="#082d63" opacity="0.55" />
        <rect x="26" y="42" width="14" height="4" rx="2" fill="#082d63" opacity="0.55" />
      </svg>
    </span>
  );
}
