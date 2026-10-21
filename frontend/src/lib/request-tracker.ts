import {
  parseTrace,
  TRACE_HEADER,
  type RequestTrace,
} from "@/lib/request-trace";

// Records real request events in the browser (sent, answered, HTTP status,
// BFF trace) so the request animation can replay what actually happened.

export type TrackedFlow =
  | "login"
  | "signup"
  | "logout"
  | "customers"
  | "customer"
  | "create"
  | "update"
  | "delete"
  | "invoices"
  | "invoice"
  | "invoice-create"
  | "invoice-update"
  | "invoice-void"
  | "reports"
  | "organization"
  | "organization-update"
  | "members"
  | "member-create"
  | "member-update"
  | "logout-all";

export type RequestRun = {
  id: number;
  flow: TrackedFlow;
  startedAt: number;
  finishedAt?: number;
  // HTTP status the browser received; 0 means no response (network error).
  status?: number;
  trace?: RequestTrace;
};

const latestRuns = new Map<TrackedFlow, RequestRun>();
const listeners = new Set<() => void>();
let nextId = 1;

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribeRuns(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getLatestRun(flow: TrackedFlow) {
  return latestRuns.get(flow);
}

export function startRun(flow: TrackedFlow) {
  const run: RequestRun = { id: nextId++, flow, startedAt: Date.now() };
  latestRuns.set(flow, run);
  emit();
  return run.id;
}

export function finishRun(
  flow: TrackedFlow,
  id: number,
  status: number,
  trace: RequestTrace | undefined,
) {
  const run = latestRuns.get(flow);

  // A newer request for the same flow already replaced this one.
  if (!run || run.id !== id) return;

  latestRuns.set(flow, { ...run, finishedAt: Date.now(), status, trace });
  emit();
}

// Maps an API call (as the browser sends it to the BFF) to its animation.
export function flowForRequest(
  method: string | undefined,
  path: string | undefined,
): TrackedFlow | undefined {
  const verb = method?.toUpperCase() ?? "GET";
  const url = (path ?? "").split("?")[0].replace(/^\/api/, "");

  if (url === "/customers") return verb === "POST" ? "create" : "customers";

  if (/^\/customers\/\d+$/.test(url)) {
    if (verb === "PATCH") return "update";
    if (verb === "DELETE") return "delete";
    return "customer";
  }

  if (url === "/invoices") return verb === "POST" ? "invoice-create" : "invoices";

  if (/^\/invoices\/\d+$/.test(url)) {
    return verb === "PATCH" ? "invoice-update" : "invoice";
  }

  if (/^\/invoices\/\d+\/void$/.test(url)) return "invoice-void";

  if (url === "/reports/summary") return "reports";

  if (url === "/organizations/current") {
    return verb === "PATCH" ? "organization-update" : "organization";
  }

  if (url === "/members") {
    return verb === "POST" ? "member-create" : "members";
  }

  if (/^\/members\/\d+$/.test(url) && verb === "PATCH") {
    return "member-update";
  }

  if (url === "/auth/login") return "login";
  if (url === "/auth/signup") return "signup";
  if (url === "/auth/logout") return "logout";
  if (url === "/auth/logout-all") return "logout-all";

  return undefined;
}

export function traceFromHeaders(
  headers: { get?: (name: string) => unknown } | Record<string, unknown> | undefined,
) {
  if (!headers) return undefined;

  const value =
    typeof headers.get === "function"
      ? headers.get(TRACE_HEADER)
      : (headers as Record<string, unknown>)[TRACE_HEADER];

  return parseTrace(typeof value === "string" ? value : undefined);
}

// fetch() that reports its real lifecycle to the tracker.
export async function trackedFetch(
  flow: TrackedFlow,
  input: string,
  init?: RequestInit,
) {
  const id = startRun(flow);

  try {
    const response = await fetch(input, init);
    finishRun(flow, id, response.status, traceFromHeaders(response.headers));
    return response;
  } catch (error) {
    finishRun(flow, id, 0, undefined);
    throw error;
  }
}
