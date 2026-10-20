// What the Next.js BFF reports about a request it handled. The browser cannot
// see the BFF -> FastAPI hop, so the BFF sends this back in a response header
// and the request animation replays these real events.
export const TRACE_HEADER = "x-ledgerlite-trace";

export type RequestTrace = {
  // The BFF answered by itself (e.g. no access cookie) without calling FastAPI.
  bffStopped?: { status: number };
  // The real FastAPI call. status 0 means FastAPI could not be reached.
  // detail is FastAPI's error message for a failed call, so the animation can
  // stop on the exact check that rejected it (two checks can share a status).
  api?: { status: number; ms: number; detail?: string };
  // Cookie work the BFF did after FastAPI answered.
  cookies?: "set" | "cleared";
  // Total time spent inside the BFF route handler.
  bffMs: number;
};

export function parseTrace(value: string | null | undefined) {
  if (!value) return undefined;

  try {
    return JSON.parse(value) as RequestTrace;
  } catch {
    return undefined;
  }
}
