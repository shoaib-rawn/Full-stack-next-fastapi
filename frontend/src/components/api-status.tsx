import { getApiHealth } from "@/lib/api";

export async function ApiStatus() {
  const health = await getApiHealth();

  return (
    <div
      className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-2.5 py-2 text-xs font-semibold sm:px-3 ${
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
      <span className="sm:hidden">
        API
        <span className="sr-only">{health.online ? " connected" : " offline"}</span>
      </span>
      <span className="hidden sm:inline">
        {health.online ? "API connected" : "API offline"}
      </span>
    </div>
  );
}
