import { getApiHealth } from "@/lib/api";

export async function ApiStatus() {
  const health = await getApiHealth();

  return (
    <div
      className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5 text-[11px] font-bold ring-2 ring-white/70 sm:gap-2 sm:px-3 sm:py-2 sm:text-xs sm:font-semibold sm:ring-0 ${
        health.online
          ? "bg-[#daf1e9] text-[#176252]"
          : "bg-[#fbe8dc] text-[#9a4b24]"
      }`}
      title={health.message}
    >
      <span
        className={`size-2 rounded-full ${
          health.online ? "bg-[#1d9b78]" : "bg-[#d26732]"
        }`}
      />
      {health.online ? "API connected" : "API offline"}
    </div>
  );
}
