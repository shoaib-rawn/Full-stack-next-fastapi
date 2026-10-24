import { getApiHealth } from "@/lib/api";

export async function ApiStatus() {
  const health = await getApiHealth();

  if (!health.online) {
    return (
      <div
        className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-[#fbe8dc] px-2.5 py-1.5 text-[11px] font-bold text-[#9a4b24] ring-2 ring-white/70 sm:gap-2 sm:px-3 sm:py-2 sm:text-xs sm:ring-0"
        title={health.message}
      >
        <span className="size-2 rounded-full bg-[#d26732]" />
        API offline
      </div>
    );
  }

  // Online: a green "Welcome" pill with a live pulse; health detail stays in the tooltip.
  return (
    <div
      className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-linear-to-r from-[#159447] to-[#22b573] px-3 py-1.5 text-[11px] font-black text-white shadow-[0_3px_0_#0d6b33] ring-2 ring-white/70 sm:py-2 sm:text-xs sm:ring-white/40"
      title={`API connected · ${health.message}`}
    >
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-white" />
      </span>
      Welcome
    </div>
  );
}
