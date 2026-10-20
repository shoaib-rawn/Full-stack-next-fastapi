"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { REQUEST_DEMO_MS } from "@/lib/demo-delay";
import {
  getLatestRun,
  subscribeRuns,
  type RequestRun,
  type TrackedFlow,
} from "@/lib/request-tracker";
type FlowNode = {
  icon: string;
  label: string;
  sub: string;
  detail: string;
  tone: "blue" | "dark" | "green" | "db" | "yellow" | "red";
  // HTTP statuses from FastAPI that mean the request was stopped at this
  // step (e.g. the auth guard stops 401, the owner guard stops 403).
  stops?: Stop[];
};

// A status, or a status plus a phrase from FastAPI's message when two steps
// can return the same status.
type Stop = number | { status: number; when: string };

type Flow = {
  title: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  packet: string;
  preview?: "table" | "record";
  nodes: FlowNode[];
};

// Shared backend steps. Each one is a real check in FastAPI, so a failed
// request stops on the step that actually rejected it.
const bff = (path: string, detail: string): FlowNode => ({
  icon: "N",
  label: path,
  sub: "Next.js BFF",
  detail,
  tone: "dark",
});

const authGuard: FlowNode = {
  icon: "🛡️",
  label: "Auth guard",
  sub: "get_current_user",
  detail: "FastAPI verifies the JWT and reloads you from the database (active, role, token version).",
  tone: "yellow",
  stops: [401],
};

const ownerGuard: FlowNode = {
  icon: "👑",
  label: "Owner guard",
  sub: "get_current_owner",
  detail: "Only the organization owner may do this; members are stopped with 403.",
  tone: "red",
  stops: [403],
};

const pydantic = (detail: string): FlowNode => ({
  icon: "🧪",
  label: "Pydantic",
  sub: "DTO check",
  detail,
  tone: "green",
  stops: [422],
});

const tenantLookup = (what: string): FlowNode => ({
  icon: "🏢",
  label: "Tenant lookup",
  sub: "id + org id",
  detail: `FastAPI looks up the ${what} by id AND your organization; another tenant's ${what} is a 404.`,
  tone: "green",
  stops: [404],
});

const flows = {
  login: {
    title: "Signing you in",
    method: "POST",
    packet: "🔑",
    nodes: [
      { icon: "🖥️", label: "Login Form", sub: "Zod ✓", detail: "React Hook Form + Zod checked email and password.", tone: "blue" },
      bff("/api/auth/login", "Next.js route handler forwards the credentials."),
      { icon: "🚦", label: "Rate limiter", sub: "Redis", detail: "Redis counts failed logins; too many returns 429, Redis down returns 503 (fail-closed).", tone: "red", stops: [429, 503] },
      { icon: "🔐", label: "Argon2 verify", sub: "password hash", detail: "FastAPI compares the password with the stored Argon2 hash; a wrong one is a 401.", tone: "yellow", stops: [401, 422] },
      { icon: "🍪", label: "Cookies", sub: "HttpOnly", detail: "Access + refresh tokens saved in HttpOnly cookies, hidden from JavaScript.", tone: "yellow" },
    ],
  },
  signup: {
    title: "Creating your workspace",
    method: "POST",
    packet: "📨",
    nodes: [
      { icon: "🖥️", label: "Signup Form", sub: "Zod ✓", detail: "Form data validated in the browser.", tone: "blue" },
      bff("/api/auth/signup", "Next.js forwards organization and owner details."),
      pydantic("FastAPI validates the signup DTO again (email, slug, password length)."),
      { icon: "🔍", label: "Duplicate check", sub: "slug + email", detail: "An existing organization slug or user email is a 409.", tone: "yellow", stops: [409] },
      { icon: "🗄️", label: "Database", sub: "1 transaction", detail: "Password hashed; organization and owner saved together.", tone: "db" },
    ],
  },
  logout: {
    title: "Logging out",
    method: "POST",
    packet: "🚪",
    nodes: [
      { icon: "🖱️", label: "Log out", sub: "Click", detail: "Logout requested from the browser.", tone: "blue" },
      bff("/api/auth/logout", "Next.js reads the tokens from cookies."),
      authGuard,
      { icon: "🚫", label: "Revoke", sub: "DB + Redis", detail: "Refresh token revoked; access token jti blacklisted in Redis until it expires.", tone: "red", stops: [503] },
      { icon: "🧹", label: "Clear", sub: "Cookies + cache", detail: "Cookies deleted and query cache cleared.", tone: "yellow" },
    ],
  },
  session: {
    title: "Checking your session",
    method: "GET",
    packet: "🍪",
    nodes: [
      { icon: "🍪", label: "Cookie", sub: "access_token", detail: "Browser sends the HttpOnly cookie automatically.", tone: "yellow" },
      { icon: "N", label: "Server Component", sub: "Next.js", detail: "Next.js server reads the token from the cookie.", tone: "dark" },
      authGuard,
      { icon: "👤", label: "Dashboard", sub: "Rendered", detail: "Your name and role arrive on the page.", tone: "blue" },
    ],
  },
  customers: {
    title: "Loading customers",
    method: "GET",
    packet: "📦",
    preview: "table",
    nodes: [
      { icon: "📋", label: "useQuery", sub: "TanStack", detail: "TanStack Query starts the request (no cache yet).", tone: "blue" },
      bff("/api/customers", "Next.js adds the token from the cookie."),
      authGuard,
      { icon: "🏢", label: "Tenant filter", sub: "WHERE org_id", detail: "Only your organization's rows, with OFFSET/LIMIT pagination.", tone: "green" },
      { icon: "🗄️", label: "Database", sub: "SELECT", detail: "Rows come back and fill the table.", tone: "db" },
    ],
  },
  customer: {
    title: "Loading customer",
    method: "GET",
    packet: "📦",
    preview: "record",
    nodes: [
      { icon: "📋", label: "useQuery", sub: "detail key", detail: "TanStack Query asks for one record by id.", tone: "blue" },
      bff("/api/customers/:id", "Next.js adds the token from the cookie."),
      authGuard,
      tenantLookup("customer"),
      { icon: "🗄️", label: "Database", sub: "SELECT", detail: "The record arrives and the form is filled.", tone: "db" },
    ],
  },
  create: {
    title: "Creating customer",
    method: "POST",
    packet: "➕",
    nodes: [
      { icon: "📝", label: "Form", sub: "Zod ✓", detail: "Customer form validated.", tone: "blue" },
      bff("/api/customers", "Next.js forwards the new customer."),
      authGuard,
      pydantic("FastAPI validates name and email; your organization id is taken from the token, never the body."),
      { icon: "🗄️", label: "Database", sub: "INSERT", detail: "Saved. A duplicate email in your organization hits the unique constraint (409).", tone: "db", stops: [409] },
    ],
  },
  update: {
    title: "Saving changes",
    method: "PATCH",
    packet: "✏️",
    nodes: [
      { icon: "📝", label: "Edit Form", sub: "Zod ✓", detail: "Changed fields validated.", tone: "blue" },
      bff("/api/customers/:id", "Next.js forwards the PATCH request."),
      authGuard,
      pydantic("FastAPI validates only the fields you sent (exclude_unset)."),
      tenantLookup("customer"),
      { icon: "🗄️", label: "Database", sub: "UPDATE", detail: "Saved. A duplicate email is a 409; detail cache updated, list refetched.", tone: "db", stops: [409] },
    ],
  },
  delete: {
    title: "Deleting customer",
    method: "DELETE",
    packet: "🗑️",
    nodes: [
      { icon: "🖱️", label: "Confirm", sub: "Delete", detail: "You confirmed the delete.", tone: "blue" },
      bff("/api/customers/:id", "Next.js forwards the DELETE request."),
      authGuard,
      ownerGuard,
      tenantLookup("customer"),
      { icon: "🗄️", label: "Database", sub: "DELETE", detail: "Removed. A customer with invoices is protected by RESTRICT (409).", tone: "db", stops: [409] },
    ],
  },
  invoices: {
    title: "Loading invoices",
    method: "GET",
    packet: "📦",
    preview: "table",
    nodes: [
      { icon: "📋", label: "useQuery", sub: "TanStack", detail: "TanStack Query starts the request (no cache yet).", tone: "blue" },
      bff("/api/invoices", "Next.js adds the token from the cookie."),
      authGuard,
      { icon: "🏢", label: "Tenant filter", sub: "WHERE org_id", detail: "Only your organization's invoices, newest first, with OFFSET/LIMIT.", tone: "green" },
      { icon: "🗄️", label: "Database", sub: "selectinload", detail: "Invoices and their line items come back in two queries (no N+1).", tone: "db" },
    ],
  },
  invoice: {
    title: "Loading invoice",
    method: "GET",
    packet: "🧾",
    preview: "record",
    nodes: [
      { icon: "📋", label: "useQuery", sub: "detail key", detail: "TanStack Query asks for one invoice by id.", tone: "blue" },
      bff("/api/invoices/:id", "Next.js adds the token from the cookie."),
      authGuard,
      tenantLookup("invoice"),
      { icon: "🗄️", label: "Database", sub: "SELECT", detail: "The invoice and its line items arrive.", tone: "db" },
    ],
  },
  "invoice-create": {
    title: "Creating invoice",
    method: "POST",
    packet: "🧾",
    nodes: [
      { icon: "📝", label: "Invoice Form", sub: "Zod ✓", detail: "Customer, line items and amounts validated.", tone: "blue" },
      bff("/api/invoices", "Next.js forwards the new invoice."),
      authGuard,
      pydantic("FastAPI checks 1-100 line items, quantity > 0, 2 decimals and the currency code."),
      { icon: "🧮", label: "Totals", sub: "customer + Decimal", detail: "The customer must be in your organization (else 404); every total is recalculated with Decimal.", tone: "green", stops: [404] },
      { icon: "🗄️", label: "Database", sub: "LOCK + INSERT", detail: "The organization sequence is locked, a unique invoice number is generated, and the invoice is saved in one transaction.", tone: "db" },
    ],
  },
  "invoice-update": {
    title: "Saving invoice",
    method: "PATCH",
    packet: "✏️",
    nodes: [
      { icon: "📝", label: "Edit Form", sub: "Zod ✓", detail: "Changed values validated.", tone: "blue" },
      bff("/api/invoices/:id", "Next.js forwards the PATCH request."),
      authGuard,
      pydantic("FastAPI validates the update DTO (at least one field)."),
      { icon: "⚖️", label: "Status rule", sub: "issued + unpaid", detail: "Invoice found in your organization (else 404) and only an unpaid issued invoice may change (else 409).", tone: "red", stops: [404, { status: 409, when: "only an unpaid" }] },
      { icon: "🗄️", label: "Database", sub: "UPDATE", detail: "Editable fields and server-calculated totals are saved; the generated invoice number stays unchanged.", tone: "db" },
    ],
  },
  "invoice-void": {
    title: "Voiding invoice",
    method: "POST",
    packet: "🚫",
    nodes: [
      { icon: "🖱️", label: "Confirm", sub: "Void", detail: "You confirmed the void.", tone: "blue" },
      bff("/api/invoices/:id/void", "Next.js forwards the request."),
      authGuard,
      ownerGuard,
      { icon: "⚖️", label: "Void rule", sub: "no payments", detail: "Invoice found in your organization (404), not already void and without payments (409).", tone: "red", stops: [404, 409] },
      { icon: "🗄️", label: "Database", sub: "UPDATE", detail: "Status set to void and the balance closed; the record is kept.", tone: "db" },
    ],
  },
  organization: {
    title: "Loading organization",
    method: "GET",
    packet: "🏢",
    preview: "record",
    nodes: [
      { icon: "📋", label: "useQuery", sub: "workspace key", detail: "TanStack Query requests the current organization.", tone: "blue" },
      bff("/api/organizations/current", "Next.js reads the access token from the HttpOnly cookie."),
      authGuard,
      { icon: "🏢", label: "Tenant ID", sub: "current user", detail: "The organization id comes from the authenticated database user, not browser input.", tone: "green", stops: [404] },
      { icon: "🗄️", label: "Database", sub: "SELECT", detail: "The organization name and unique slug return to the settings form.", tone: "db" },
    ],
  },
  "organization-update": {
    title: "Saving organization",
    method: "PATCH",
    packet: "🏢",
    nodes: [
      { icon: "📝", label: "Settings form", sub: "Zod ✓", detail: "Name and URL-safe slug are validated in the browser.", tone: "blue" },
      bff("/api/organizations/current", "Next.js forwards the PATCH with the server-held token."),
      authGuard,
      ownerGuard,
      pydantic("FastAPI validates changed fields; a duplicate slug returns 409."),
      { icon: "🗄️", label: "Database", sub: "UPDATE", detail: "The tenant identity commits, then the organization cache is replaced.", tone: "db", stops: [409] },
    ],
  },
  members: {
    title: "Loading organization team",
    method: "GET",
    packet: "👥",
    preview: "table",
    nodes: [
      { icon: "📋", label: "useQuery", sub: "member page", detail: "TanStack Query requests the selected member page.", tone: "blue" },
      bff("/api/members", "Next.js forwards pagination with the HttpOnly access token."),
      authGuard,
      ownerGuard,
      { icon: "🏢", label: "Tenant scope", sub: "organization_id", detail: "Only users from the owner's organization can be listed.", tone: "green" },
      { icon: "🗄️", label: "Database", sub: "COUNT + SELECT", detail: "The paginated member directory returns with total pages.", tone: "db" },
    ],
  },
  "member-create": {
    title: "Creating member",
    method: "POST",
    packet: "👤",
    nodes: [
      { icon: "📝", label: "Member form", sub: "Zod ✓", detail: "Name, email and temporary password are validated.", tone: "blue" },
      bff("/api/members", "Next.js forwards the member payload without exposing the access token."),
      authGuard,
      ownerGuard,
      pydantic("FastAPI validates email and password, then Argon2 hashes the password."),
      { icon: "🗄️", label: "Database", sub: "INSERT member", detail: "The user is saved inside the owner's organization; duplicate email returns 409.", tone: "db", stops: [409] },
    ],
  },
  "member-update": {
    title: "Updating member access",
    method: "PATCH",
    packet: "🛡️",
    nodes: [
      { icon: "🖱️", label: "Owner action", sub: "role / status", detail: "The owner changes a role or active state.", tone: "blue" },
      bff("/api/members/:id", "Next.js forwards only the changed field."),
      authGuard,
      ownerGuard,
      tenantLookup("member"),
      { icon: "⚖️", label: "Self guard", sub: "409 protection", detail: "An owner cannot demote or deactivate their own account.", tone: "red", stops: [409] },
      { icon: "🗄️", label: "Database", sub: "UPDATE", detail: "The change commits and cached member pages are invalidated.", tone: "db" },
    ],
  },
  "logout-all": {
    title: "Logging out every device",
    method: "POST",
    packet: "🚪",
    nodes: [
      { icon: "🖱️", label: "Security action", sub: "Confirm", detail: "The current user requests global session revocation.", tone: "blue" },
      bff("/api/auth/logout-all", "Next.js forwards the current access token."),
      authGuard,
      { icon: "🚫", label: "Revoke all", sub: "DB + Redis", detail: "Refresh tokens are revoked, token version increments and the current JTI is blacklisted.", tone: "red", stops: [503] },
      { icon: "🧹", label: "Clear browser", sub: "cookies + cache", detail: "Next.js clears cookies; the browser clears query cache and returns to login.", tone: "yellow" },
    ],
  },
  page: {
    title: "Opening page",
    method: "GET",
    packet: "📄",
    nodes: [
      { icon: "🖱️", label: "Click", sub: "Link", detail: "You opened a new page.", tone: "blue" },
      { icon: "🛡️", label: "proxy.ts", sub: "Auth check", detail: "Proxy checks the access cookie (refreshes if needed).", tone: "yellow" },
      { icon: "N", label: "Next.js", sub: "Server render", detail: "Next.js renders the page on the server.", tone: "dark" },
      { icon: "🖥️", label: "Browser", sub: "Stream", detail: "The page streams into your browser.", tone: "blue" },
    ],
  },
} satisfies Record<string, Flow>;

export type FlowName = keyof typeof flows;

const tones = {
  blue: "bg-[#e5f6ff] text-[#1267c9] border-[#72c8f1]",
  dark: "bg-[#082d63] text-white border-[#082d63]",
  green: "bg-[#e0f5ef] text-[#0f8a6d] border-[#7fd3bd]",
  db: "bg-[#e9f0ff] text-[#3046a8] border-[#9fb0f0]",
  yellow: "bg-[#fff4c8] text-[#7a5a05] border-[#f0c557]",
  red: "bg-[#ffe3eb] text-[#a3234c] border-[#f1a8bc]",
};

const methodColors = {
  GET: "bg-[#1267c9] text-white",
  POST: "bg-[#159447] text-white",
  PATCH: "bg-[#e4a51d] text-[#082d63]",
  DELETE: "bg-[#d7344f] text-white",
};

// Index of the first backend step (0 = browser, 1 = Next.js BFF). Also used
// when a request failed but no real trace is available.
const FIRST_BACKEND_NODE = 2;
const FAILURE_VISIBLE_MS = 2500;

// Slow motion: the whole flow fits in the demo duration, however many steps.
const stepMsFor = (flow: Flow) =>
  Math.max(1, REQUEST_DEMO_MS / flow.nodes.length);

// Which step rejected the request. A step lists the statuses it can return;
// when two steps share a status (e.g. 409), FastAPI's message decides.
function failNodeFor(flow: Flow, status: number, detail: string | undefined) {
  const message = detail?.toLowerCase() ?? "";
  const matches = (stop: Stop) =>
    typeof stop === "number"
      ? stop === status
      : stop.status === status && message.includes(stop.when);

  const byMessage = flow.nodes.findIndex((node) =>
    node.stops?.some((stop) => typeof stop !== "number" && matches(stop)),
  );
  if (byMessage >= FIRST_BACKEND_NODE) return byMessage;

  const byStatus = flow.nodes.findIndex((node) =>
    node.stops?.some((stop) => typeof stop === "number" && matches(stop)),
  );
  if (byStatus >= FIRST_BACKEND_NODE) return byStatus;

  // Unknown server error: blame the database step; unreachable or another
  // 4xx: the first FastAPI step.
  return status >= 500 ? flow.nodes.length - 1 : FIRST_BACKEND_NODE;
}

// These run during server rendering, so the browser never sees their events.
const demoFlows = new Set<FlowName>(["session", "page"]);

const failureTitles: Record<FlowName, string> = {
  login: "Sign in failed",
  signup: "Account not created",
  logout: "Log out failed",
  session: "Session check failed",
  customers: "Could not load customers",
  customer: "Could not load customer",
  create: "Customer not created",
  update: "Changes not saved",
  delete: "Customer not deleted",
  invoices: "Could not load invoices",
  invoice: "Could not load invoice",
  "invoice-create": "Invoice not created",
  "invoice-update": "Invoice not saved",
  "invoice-void": "Invoice not voided",
  organization: "Could not load organization",
  "organization-update": "Organization not saved",
  members: "Could not load team",
  "member-create": "Member not created",
  "member-update": "Member access not updated",
  "logout-all": "Could not log out all devices",
  page: "Page failed to load",
};

type Outcome = {
  // Furthest node the real request has reached so far.
  reached: number;
  failAt?: number;
  // Real measurements shown under each node.
  info: (string | undefined)[];
};

// Turns the recorded run (real HTTP status + BFF trace) into node results.
function outcomeOf(run: RequestRun | undefined, flowName: FlowName): Outcome {
  if (!run) return { reached: 0, info: [] };

  if (run.finishedAt === undefined) {
    return { reached: 1, info: ["sent"] };
  }

  const flow: Flow = flows[flowName];
  const last = flow.nodes.length - 1;
  const { status = 0, trace } = run;
  const info: (string | undefined)[] = ["sent"];

  if (!trace) {
    info[1] = status === 0 ? "no response" : `HTTP ${status}`;
    return { reached: 1, failAt: 1, info };
  }

  if (trace.bffStopped) {
    info[1] = `${trace.bffStopped.status} · ${trace.bffMs}ms`;
    return { reached: 1, failAt: 1, info };
  }

  info[1] = `${trace.bffMs}ms total`;

  if (trace.api) {
    const { status: apiStatus, ms, detail } = trace.api;

    if (apiStatus === 0 || apiStatus >= 400) {
      const failAt = failNodeFor(flow, apiStatus, detail);

      // Every check before the failing one really passed.
      for (let index = FIRST_BACKEND_NODE; index < failAt; index++) {
        info[index] = "passed";
      }
      info[failAt] = apiStatus === 0 ? `unreachable · ${ms}ms` : `${apiStatus} · ${ms}ms`;

      return { reached: failAt, failAt, info };
    }

    for (let index = FIRST_BACKEND_NODE; index < last; index++) {
      info[index] = "passed";
    }
    info[FIRST_BACKEND_NODE] = `✓ ${apiStatus} · ${ms}ms`;
  }

  info[last] =
    trace.cookies === "set"
      ? "cookies set"
      : trace.cookies === "cleared"
        ? "cookies cleared"
        : flowName === "logout" || flowName === "logout-all"
          ? "done"
          : "via FastAPI";

  return { reached: last, info };
}

function useLatestRun(flow: FlowName) {
  const tracked = demoFlows.has(flow) ? undefined : (flow as TrackedFlow);

  return useSyncExternalStore(
    subscribeRuns,
    () => (tracked ? getLatestRun(tracked) : undefined),
    () => undefined,
  );
}

// Replays the real request: it advances only as far as real events allow,
// one step per STEP_MS at most, and waits (with a live timer) when the
// server has not answered yet.
export function RequestAnimation({
  flow: flowName,
  error,
}: {
  flow: FlowName;
  error?: string | null;
}) {
  const run = useLatestRun(flowName);
  // The clock is read only inside timer callbacks, never during render:
  // Next.js flags Date.now() in render because a prerender would freeze it.
  // null = not ticked yet (first paint / server render).
  const [clock, setClock] = useState<{ mountedAt: number; now: number } | null>(null);

  // Ignore a finished run left over from an earlier request.
  const isStale =
    run !== undefined &&
    run.finishedAt !== undefined &&
    !error &&
    (clock === null || run.startedAt < clock.mountedAt - 1000);
  const currentRun = isStale ? undefined : run;

  const outcome = outcomeOf(currentRun, flowName);
  const stepMs = stepMsFor(flows[flowName]);
  const startedAt = currentRun?.startedAt ?? clock?.mountedAt ?? 0;
  // The request can start a moment after this component's last tick, so
  // elapsed time may briefly be negative.
  const elapsed = clock ? clock.now - startedAt : 0;
  const paced = Math.max(0, Math.floor(elapsed / stepMs));
  const shown = Math.min(outcome.reached, paced);
  const finished = currentRun?.finishedAt !== undefined;
  const settled = finished && shown >= outcome.reached;

  useEffect(() => {
    if (settled || demoFlows.has(flowName)) return;

    const tick = () => {
      const time = Date.now();
      setClock((current) => ({
        mountedAt: current?.mountedAt ?? time,
        now: time,
      }));
    };
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 100);

    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [settled, flowName]);

  if (demoFlows.has(flowName)) {
    return error ? (
      <FailedRequest flowName={flowName} error={error} />
    ) : (
      <DemoAnimation flowName={flowName} />
    );
  }

  if (error && !currentRun) {
    return <FailedRequest flowName={flowName} error={error} />;
  }

  const flow: Flow = flows[flowName];
  const sizes = nodeSizes(flow);
  const failedHere = settled && outcome.failAt !== undefined;
  const waiting = !finished && shown === 1 && paced >= 2;
  const node = flow.nodes[shown];

  return (
    <div
      role={failedHere ? "alert" : "status"}
      aria-live="polite"
      className={`rounded-3xl border-2 bg-white p-4 shadow-[0_8px_0_rgba(8,45,99,0.07)] sm:p-6 ${failedHere ? "border-[#f1a8bc]" : "border-[#72c8f1]"}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        {failedHere ? (
          <p className="flex items-center gap-2 font-black text-[#a3234c]">
            <span className="grid size-5 place-items-center rounded-full bg-[#d7344f] text-xs text-white">✕</span>
            {failureTitles[flowName]}
          </p>
        ) : settled ? (
          <p className="flex items-center gap-2 font-black text-[#28712f]">
            <span className="grid size-5 place-items-center rounded-full bg-[#159447] text-xs text-white">✓</span>
            {flow.title} — done
          </p>
        ) : (
          <p className="flex items-center gap-2 font-black text-[#082d63]">
            <span className="inline-block size-4 animate-spin rounded-full border-2 border-[#1267c9] border-t-transparent" />
            {flow.title}...
          </p>
        )}
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-[#e8f8dc] px-2 py-1 text-[10px] font-black uppercase tracking-wider text-[#28712f]">
            ● Live
          </span>
          <MethodBadge method={flow.method} />
        </div>
      </div>

      <div className="mt-5 flex items-start">
        {flow.nodes.map((item, index) => {
          const isFailed = failedHere && index === outcome.failAt;
          const isCurrent = index === shown && !isFailed && !settled;
          const isDone = index < shown || (settled && index === shown && !isFailed);

          return (
            <div key={item.label} className={index === 0 ? "flex" : "flex flex-1"}>
              {index > 0 && (
                <div className={`relative mx-0.5 h-1 flex-1 rounded-full bg-[#d9edf7] sm:mx-1 ${sizes.line} ${waiting && index === 2 ? "animate-pulse bg-[#ffd65a]" : ""}`}>
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${isFailed ? "bg-[#d7344f]" : "bg-[#1267c9]"}`}
                    style={{ width: index <= shown ? "100%" : "0%" }}
                  />
                  {index === shown && !settled && (
                    <span
                      key={`packet-${index}`}
                      className="ll-packet text-lg drop-shadow"
                      style={{ animationDuration: `${stepMs * 0.8}ms` }}
                    >
                      {flow.packet}
                    </span>
                  )}
                </div>
              )}

              <div className={`flex flex-col items-center text-center ${sizes.column}`}>
                <span className={`relative grid place-items-center ${sizes.box} ${isFailed ? "ll-shake" : ""}`}>
                  {isCurrent && (
                    <span className="absolute inset-0 animate-ping rounded-2xl bg-[#ffd65a]/60" />
                  )}
                  <span
                    className={`relative grid place-items-center rounded-2xl border-2 font-black transition ${sizes.box} ${sizes.icon} ${tones[item.tone]} ${isCurrent ? "scale-110 ring-4 ring-[#ffd65a]" : ""} ${isFailed ? "ring-4 ring-[#d7344f]" : ""} ${index > shown ? "opacity-40" : ""}`}
                  >
                    {item.icon}
                  </span>
                  {isDone && index > 0 && (
                    <span className="ll-row-in absolute -right-2 -top-2 grid size-5 place-items-center rounded-full border-2 border-white bg-[#159447] text-[10px] font-black text-white">
                      ✓
                    </span>
                  )}
                  {isFailed && (
                    <span className="ll-row-in absolute -right-2 -top-2 grid size-6 place-items-center rounded-full border-2 border-white bg-[#d7344f] text-xs font-black text-white">
                      ✕
                    </span>
                  )}
                </span>
                <p className="mt-2 break-all text-[10px] font-black leading-tight text-[#082d63] sm:text-xs">{item.label}</p>
                <p className="text-[10px] text-[#58718c]">{item.sub}</p>
                {index <= shown && outcome.info[index] && (
                  <p className={`mt-1 rounded px-1 font-mono text-[10px] font-bold ${isFailed ? "bg-[#ffe3eb] text-[#a3234c]" : "bg-[#eef6fb] text-[#0759a8]"}`}>
                    {outcome.info[index]}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {failedHere ? (
        <p className="ll-row-in mt-5 rounded-xl border border-[#f1a8bc] bg-[#ffe3eb] px-4 py-3 text-sm font-bold text-[#a3234c]">
          <span className="mr-2 rounded-md bg-[#d7344f] px-2 py-0.5 text-xs text-white">✕ {node.label}</span>
          {error ?? outcome.info[shown] ?? "Request failed."}
        </p>
      ) : waiting ? (
        <p className="mt-5 rounded-xl bg-[#fff4c8] px-4 py-3 text-sm font-bold text-[#7a5a05]">
          <span className="mr-2 rounded-md bg-[#e4a51d] px-2 py-0.5 text-xs text-[#082d63]">⏳ {(Math.max(0, elapsed) / 1000).toFixed(1)}s</span>
          Waiting for the server to answer...
        </p>
      ) : (
        <p key={shown} className="ll-row-in mt-5 rounded-xl bg-[#f7fcff] px-4 py-3 text-sm font-bold text-[#163e6b]">
          <span className="mr-2 rounded-md bg-[#1267c9] px-2 py-0.5 text-xs text-white">{shown + 1}/{flow.nodes.length}</span>
          {node.detail}
        </p>
      )}

      {flow.preview === "table" && <TablePreview filled={settled && !failedHere} />}
      {flow.preview === "record" && <RecordPreview filled={settled && !failedHere} />}
    </div>
  );
}

// Server-rendered steps (dashboard session check, page change): the browser
// gets no events for these, so this is an illustration driven by CSS delays.
// CSS also keeps it moving inside a Suspense fallback, which is not hydrated.
function DemoAnimation({ flowName }: { flowName: FlowName }) {
  const flow: Flow = flows[flowName];
  const count = flow.nodes.length;
  const stepMs = Math.max(REQUEST_DEMO_MS, 1200) / count;
  const last = count - 1;

  const windowStyle = (k: number) => ({
    animationDuration: `${stepMs}ms`,
    animationDelay: `${k * stepMs}ms`,
    animationFillMode: k === last ? "forwards" : "none",
  });

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-3xl border-2 border-[#72c8f1] bg-white p-4 shadow-[0_8px_0_rgba(8,45,99,0.07)] sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-black text-[#082d63]">
          <span className="inline-block size-4 animate-spin rounded-full border-2 border-[#1267c9] border-t-transparent" />
          {flow.title}...
        </p>
        <div className="flex items-center gap-2">
          <span
            title="Runs on the server; the browser gets no step events, so this is an illustration."
            className="rounded-md bg-[#eef1f4] px-2 py-1 text-[10px] font-black uppercase tracking-wider text-[#657382]"
          >
            Demo
          </span>
          <MethodBadge method={flow.method} />
        </div>
      </div>

      <div className="mt-5 flex items-start">
        {flow.nodes.map((node, index) => (
          <div key={node.label} className={index === 0 ? "flex" : "flex flex-1"}>
            {index > 0 && (
              <div className="relative mx-1 mt-6 h-1 flex-1 rounded-full bg-[#d9edf7]">
                <div
                  className="ll-grow h-full rounded-full bg-[#1267c9]"
                  style={{ animationDelay: `${index * stepMs}ms` }}
                />
                <span
                  className="ll-packet text-lg drop-shadow"
                  style={{
                    animationDuration: `${stepMs * 0.8}ms`,
                    animationDelay: `${index * stepMs}ms`,
                  }}
                >
                  {flow.packet}
                </span>
              </div>
            )}

            <div className="flex w-16 flex-col items-center text-center sm:w-24">
              <span className="relative grid size-12 place-items-center sm:size-14">
                <span className="ll-window absolute inset-0" style={windowStyle(index)}>
                  <span className="absolute inset-0 animate-ping rounded-2xl bg-[#ffd65a]/60" />
                </span>
                <span
                  className={`ll-node relative grid size-12 place-items-center rounded-2xl border-2 text-xl font-black sm:size-14 sm:text-2xl ${tones[node.tone]}`}
                  style={{ animationDelay: `${index * stepMs}ms` }}
                >
                  {node.icon}
                </span>
                <span
                  className="ll-window ll-ring pointer-events-none absolute inset-0 rounded-2xl"
                  style={windowStyle(index)}
                />
              </span>
              <p className="mt-2 break-all text-[10px] font-black leading-tight text-[#082d63] sm:text-xs">{node.label}</p>
              <p className="text-[10px] text-[#58718c]">{node.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid">
        {flow.nodes.map((node, index) => (
          <p
            key={node.label}
            className="ll-window col-start-1 row-start-1 rounded-xl bg-[#f7fcff] px-4 py-3 text-sm font-bold text-[#163e6b]"
            style={windowStyle(index)}
          >
            <span className="mr-2 rounded-md bg-[#1267c9] px-2 py-0.5 text-xs text-white">{index + 1}/{count}</span>
            {node.detail}
          </p>
        ))}
      </div>
    </div>
  );
}

function FailedRequest({
  flowName,
  error,
}: {
  flowName: FlowName;
  error: string;
}) {
  const flow: Flow = flows[flowName];
  const failAt = FIRST_BACKEND_NODE;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="rounded-3xl border-2 border-[#f1a8bc] bg-white p-4 shadow-[0_8px_0_rgba(8,45,99,0.07)] sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-black text-[#a3234c]">
          <span className="grid size-5 place-items-center rounded-full bg-[#d7344f] text-xs text-white">✕</span>
          {failureTitles[flowName]}
        </p>
        <MethodBadge method={flow.method} />
      </div>

      <div className="mt-5 flex items-start">
        {flow.nodes.map((node, index) => {
          const isFailedNode = index === failAt;

          return (
            <div key={node.label} className={index === 0 ? "flex" : "flex flex-1"}>
              {index > 0 && (
                <div className="relative mx-1 mt-6 h-1 flex-1 rounded-full bg-[#d9edf7]">
                  {index <= failAt && (
                    <div className={`h-full w-full rounded-full ${isFailedNode ? "bg-[#d7344f]" : "bg-[#1267c9]"}`} />
                  )}
                </div>
              )}

              <div className="flex w-16 flex-col items-center text-center sm:w-24">
                <span className={`relative grid size-12 place-items-center sm:size-14 ${isFailedNode ? "ll-shake" : ""}`}>
                  <span
                    className={`relative grid size-12 place-items-center rounded-2xl border-2 text-xl font-black sm:size-14 sm:text-2xl ${tones[node.tone]} ${isFailedNode ? "ring-4 ring-[#d7344f]" : ""} ${index > failAt ? "opacity-40" : ""}`}
                  >
                    {node.icon}
                  </span>
                  {isFailedNode && (
                    <span className="ll-row-in absolute -right-2 -top-2 grid size-6 place-items-center rounded-full border-2 border-white bg-[#d7344f] text-xs font-black text-white">
                      ✕
                    </span>
                  )}
                </span>
                <p className="mt-2 break-all text-[10px] font-black leading-tight text-[#082d63] sm:text-xs">{node.label}</p>
                <p className="text-[10px] text-[#58718c]">{node.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      <p className="ll-row-in mt-5 rounded-xl border border-[#f1a8bc] bg-[#ffe3eb] px-4 py-3 text-sm font-bold text-[#a3234c]">
        <span className="mr-2 rounded-md bg-[#d7344f] px-2 py-0.5 text-xs text-white">✕ {flow.nodes[failAt].label}</span>
        {error}
      </p>
    </div>
  );
}

// Flows with many backend checks use smaller steps so they fit a phone.
function nodeSizes(flow: Flow) {
  return flow.nodes.length > 5
    ? { column: "w-11 sm:w-20", box: "size-9 sm:size-12", icon: "text-base sm:text-xl", line: "mt-4 sm:mt-6" }
    : { column: "w-16 sm:w-24", box: "size-12 sm:size-14", icon: "text-xl sm:text-2xl", line: "mt-6" };
}

function MethodBadge({ method }: { method: Flow["method"] }) {
  return (
    <span className={`rounded-md px-2 py-1 font-mono text-xs font-black ${methodColors[method]}`}>
      {method}
    </span>
  );
}

// Shows the animation while `active`; if the request then fails, it stays
// for a moment with a cross on the failing step, then closes itself.
export function RequestOverlay({
  flow,
  active,
  error,
}: {
  flow: FlowName;
  active: boolean;
  error?: string | null;
}) {
  const [dismissed, setDismissed] = useState(true);
  const [wasActive, setWasActive] = useState(active);

  if (active !== wasActive) {
    setWasActive(active);
    if (active) setDismissed(false);
  }

  const showFailure = !active && Boolean(error) && !dismissed;

  useEffect(() => {
    if (!showFailure) return;

    const timer = setTimeout(() => setDismissed(true), FAILURE_VISIBLE_MS);

    return () => clearTimeout(timer);
  }, [showFailure]);

  if (!active && !showFailure) return null;

  return (
    <div
      onClick={showFailure ? () => setDismissed(true) : undefined}
      className="fixed inset-0 z-50 grid place-items-center bg-[#082d63]/45 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-xl">
        <RequestAnimation flow={flow} error={showFailure ? error : null} />
      </div>
    </div>
  );
}

function TablePreview({ filled }: { filled: boolean }) {
  return (
    <div className="mt-4 overflow-hidden rounded-xl border-2 border-[#72c8f1] text-xs">
      <div className="flex items-center justify-between bg-[#1267c9] px-3 py-2 font-black text-white">
        Customers <span>+</span>
      </div>
      <div className="grid grid-cols-3 gap-2 bg-[#f7fcff] px-3 py-2 font-black text-[#082d63]">
        <span>Name</span><span>Email</span><span>Status</span>
      </div>
      {[0, 1, 2].map((row) => (
        <div key={row} className="grid grid-cols-3 gap-2 border-t border-[#d9edf7] px-3 py-2.5">
          {[0, 1, 2].map((cell) => (
            <span
              key={cell}
              className={filled ? "ll-row-in h-2 rounded bg-[#72c8f1]" : "h-2 animate-pulse rounded bg-[#e5eef4]"}
              style={filled ? { animationDelay: `${row * 120}ms` } : undefined}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function RecordPreview({ filled }: { filled: boolean }) {
  return (
    <div className="mt-4 grid gap-2 rounded-xl border-2 border-[#72c8f1] p-3 sm:grid-cols-2">
      {["Customer name", "Email"].map((label, index) => (
        <div key={label}>
          <p className="text-xs font-black text-[#163e6b]">{label}</p>
          <span
            className={filled ? "ll-row-in mt-1 block h-8 rounded-lg bg-[#e5f6ff]" : "mt-1 block h-8 animate-pulse rounded-lg bg-[#eef3f6]"}
            style={filled ? { animationDelay: `${index * 120}ms` } : undefined}
          />
        </div>
      ))}
    </div>
  );
}
