import { getApiHealth } from "@/lib/api";

export async function ApiStatus() {
  const health = await getApiHealth();

  return (
    <div
      className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${
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
