import type { ReactNode } from "react";

// Small pictures that explain the concept behind each screen.
// Panels show these side by side with a short label instead of long text.

export function ConceptStep({
  number,
  title,
  caption,
  children,
}: {
  number: string;
  title: string;
  caption: string;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_8.5rem] items-center gap-2 rounded-xl border border-white/20 bg-white/10 p-3 sm:grid-cols-[1fr_11rem]">
      <div className="flex items-center gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#ffd65a] sm:size-9 font-black text-[#082d63]">
          {number}
        </span>
        <div>
          <p className="font-black leading-5">{title}</p>
          <p className="text-xs font-semibold text-[#cceaff]">{caption}</p>
        </div>
      </div>
      <div className="rounded-lg bg-white p-2 text-[#082d63] shadow-[0_3px_0_rgba(4,30,68,0.25)]">
        {children}
      </div>
    </div>
  );
}

type FlowNode = {
  icon: string;
  label: string;
  sub?: string;
  tone: "blue" | "dark" | "green" | "yellow" | "red";
};

const nodeTones = {
  blue: "bg-[#e5f6ff] text-[#1267c9]",
  dark: "bg-[#082d63] text-white",
  green: "bg-[#e0f5ef] text-[#0f8a6d]",
  yellow: "bg-[#fff4c8] text-[#7a5a05]",
  red: "bg-[#ffe3eb] text-[#a3234c]",
};

export function RequestFlow({
  nodes,
  dark = false,
}: {
  nodes: FlowNode[];
  dark?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-1">
      {nodes.map((node, index) => (
        <div key={node.label} className="flex flex-1 items-start gap-1">
          <div className="flex flex-1 flex-col items-center text-center">
            <span className={`grid size-11 place-items-center rounded-xl text-lg font-black shadow-sm ${nodeTones[node.tone]}`}>
              {node.icon}
            </span>
            <p className={`mt-1 text-[10px] font-black leading-tight ${dark ? "text-white" : "text-[#082d63]"}`}>{node.label}</p>
            {node.sub && (
              <p className={`text-[10px] ${dark ? "text-[#cceaff]" : "text-[#58718c]"}`}>{node.sub}</p>
            )}
          </div>
          {index < nodes.length - 1 && (
            <span className={`mt-3 font-black ${dark ? "text-[#ffd65a]" : "text-[#1267c9]"}`}>→</span>
          )}
        </div>
      ))}
    </div>
  );
}

export const loginFlowNodes: FlowNode[] = [
  { icon: "🖥️", label: "Login Form", sub: "(Next.js)", tone: "blue" },
  { icon: "N", label: "POST /api/auth/login", sub: "(Next.js)", tone: "dark" },
  { icon: "⚡", label: "POST /auth/login", sub: "(FastAPI)", tone: "green" },
];

export function MiniValidate() {
  return (
    <div className="space-y-1 text-[10px] font-bold">
      <div className="flex items-center justify-between rounded border border-[#b8dbea] px-1.5 py-1 text-[#58718c]">
        user@mail.com <span className="text-[#159447]">✓</span>
      </div>
      <div className="flex items-center justify-between rounded border border-[#f1a8bc] px-1.5 py-1 tracking-widest">
        •••• <span className="tracking-normal text-[#d7344f]">✕</span>
      </div>
      <p className="rounded bg-[#ffe3eb] px-1.5 py-0.5 text-[#a3234c]">Min 8 chars</p>
    </div>
  );
}

export function MiniCookie() {
  return (
    <div className="flex items-center gap-2">
      <span className="relative text-3xl">
        🍪<span className="absolute -bottom-1 -right-1 text-sm">🔒</span>
      </span>
      <div className="font-mono text-[10px] font-black leading-4 text-[#d7344f]">
        <p>HttpOnly</p>
        <p>Secure</p>
        <p>SameSite</p>
      </div>
    </div>
  );
}

export function MiniVerify() {
  return (
    <div className="flex items-center gap-2 text-[10px] font-black">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#e0f5ef] text-lg text-[#0f8a6d]">⚡</span>
      <div className="space-y-1">
        <p className="rounded bg-[#dff4cf] px-1.5 py-0.5 text-[#28712f]">✓ User</p>
        <p className="rounded bg-[#dff4cf] px-1.5 py-0.5 text-[#28712f]">✓ Organization</p>
      </div>
    </div>
  );
}

export function MiniSession() {
  return (
    <div className="flex items-center justify-between text-[10px] font-black">
      <span className="text-center"><span className="block text-xl">🛡️</span>Server</span>
      <span className="text-[#1267c9]">→</span>
      <span className="rounded bg-[#dff4cf] px-1.5 py-1 text-[#28712f]">👤 User ✓</span>
    </div>
  );
}

export function MiniFetch() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-center text-[9px] font-black"><span className="block text-xl">🗄️</span>API</span>
      <span className="text-[10px] font-black text-[#1267c9]">→</span>
      <div className="flex-1 overflow-hidden rounded border border-[#72c8f1]">
        <p className="bg-[#1267c9] px-1 text-[9px] font-black text-white">Customers</p>
        {[1, 2, 3].map((row) => (
          <div key={row} className="flex gap-1 px-1 py-0.75">
            <span className="h-1 flex-1 rounded bg-[#c5e6f7]" />
            <span className="h-1 flex-1 rounded bg-[#c5e6f7]" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function MiniOneQuery() {
  return (
    <div className="flex items-center gap-1.5 text-[9px] font-black">
      <span className="rounded bg-[#e5f6ff] px-1.5 py-2 text-[#1267c9]">1 query</span>
      <div className="flex flex-col text-[#1267c9]">
        <span>↗</span>
        <span>↘</span>
      </div>
      <div className="flex-1 space-y-1">
        <p className="rounded bg-[#ffe8ef] px-1 py-0.5 text-[#a3234c]"># Totals</p>
        <p className="rounded bg-[#e8f8dc] px-1 py-0.5 text-[#286e30]">≡ Recent</p>
      </div>
    </div>
  );
}

export function MiniSync() {
  return (
    <div className="flex items-center justify-between text-[9px] font-black">
      <span className="rounded bg-[#e8f8dc] px-1.5 py-1 text-[#286e30]">Save</span>
      <span className="text-[#1267c9]">→</span>
      <span className="rounded bg-[#fff4c8] px-1.5 py-1 text-[#7a5a05]">Invalidate</span>
      <span className="text-[#1267c9]">→</span>
      <span className="rounded bg-[#e5f6ff] px-1.5 py-1 text-[#1267c9]">↻ List</span>
    </div>
  );
}

export function MiniCompanyCache() {
  return (
    <div className="grid grid-cols-2 gap-1 text-center text-[9px] font-black">
      <span className="rounded bg-[#e5f6ff] px-1 py-1.5 text-[#1267c9]">🏢 A data</span>
      <span className="rounded bg-[#f3e9ff] px-1 py-1.5 text-[#8b3fd9]">🏢 B data</span>
      <span className="col-span-2 rounded bg-[#ffe3eb] py-0.5 text-[#a3234c]">🚫 no mixing</span>
    </div>
  );
}

export function FolderTreeVisual() {
  const rows = [
    { depth: 0, icon: "📁", name: "src/app" },
    { depth: 1, icon: "📂", name: "(auth)", bold: true },
    { depth: 2, icon: "📄", name: "layout.tsx" },
    { depth: 2, icon: "📄", name: "login/page.tsx" },
    { depth: 2, icon: "📄", name: "signup/page.tsx" },
    { depth: 1, icon: "📂", name: "(dashboard)", bold: true },
    { depth: 2, icon: "📄", name: "layout.tsx" },
    { depth: 2, icon: "📄", name: "dashboard/page.tsx" },
  ];

  return (
    <div className="grid grid-cols-[1fr_auto] gap-2">
      <div className="rounded-xl border-2 border-[#d9edf7] bg-[#f7fcff] p-3 font-mono text-xs text-[#082d63]">
        {rows.map((row, index) => (
          <p key={index} style={{ paddingLeft: `${row.depth * 14}px` }} className={row.bold ? "font-black" : ""}>
            {row.icon} {row.name}
          </p>
        ))}
      </div>
      <div className="self-start rounded-xl border-2 border-[#72c8f1] bg-white p-2 text-xs font-semibold text-[#163e6b]">
        <p className="font-black">URL:</p>
        <p className="font-mono">(auth)/login</p>
        <p>maps to URL</p>
        <p className="font-mono font-black text-[#1267c9]">/login</p>
      </div>
    </div>
  );
}

export function FormVisual() {
  return (
    <div className="rounded-xl border-2 border-[#f4acc1] bg-[#fffafb] p-3 text-xs">
      <p className="font-black text-[#163e6b]">Email</p>
      <div className="mt-1 flex items-center justify-between rounded-lg border-2 border-[#b8dbea] bg-white px-3 py-2 text-[#58718c]">
        user@example.com <span className="font-black text-[#159447]">✓</span>
      </div>
      <p className="mt-2 font-black text-[#163e6b]">Password</p>
      <div className="mt-1 rounded-lg border-2 border-[#f1a8bc] bg-white px-3 py-2 tracking-widest text-[#082d63]">••••••</div>
      <p className="mt-2 rounded-lg bg-[#ffe3eb] px-3 py-2 font-bold text-[#a3234c]">⚠ Password must be at least 8 characters</p>
      <div className="mt-3 flex items-center justify-center gap-2 font-black text-[#082d63]">
        <span className="rounded-md bg-[#e5f6ff] px-2 py-1 text-[#1267c9]">⚛ React Hook Form</span>
        <span>+</span>
        <span className="rounded-md bg-[#1f3fbf] px-2 py-1 text-white">Z Zod</span>
      </div>
    </div>
  );
}

export function BffFlowVisual() {
  return (
    <div>
      <RequestFlow nodes={loginFlowNodes} />
      <ol className="mt-3 list-decimal space-y-1 rounded-xl bg-[#fff4c8] p-3 pl-7 text-xs font-semibold text-[#163e6b]">
        <li>The login form sends the request to Next.js</li>
        <li>Next.js forwards the credentials to FastAPI</li>
        <li>FastAPI verifies them and returns tokens</li>
        <li>Next.js saves the tokens in cookies</li>
      </ol>
    </div>
  );
}

export function CookieVisual() {
  return (
    <div className="relative rounded-xl border-2 border-[#d9edf7] bg-[#f7fcff] p-4 font-mono text-xs leading-6">
      <p className="font-black text-[#082d63]">Set-Cookie:</p>
      {["access_token=...;", "HttpOnly;", "Secure;", "SameSite=Lax;", "Path=/;", "Max-Age=900"].map((line) => (
        <p key={line} className="text-[#d7344f]">{line}</p>
      ))}
      <span className="absolute bottom-3 right-3 text-5xl">🍪</span>
      <span className="absolute bottom-2 right-2 text-xl">🔒</span>
    </div>
  );
}

export function FetchVisual() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-col items-center">
        <span className="text-4xl">🗄️</span>
        <p className="text-xs font-black text-[#082d63]">FastAPI</p>
      </div>
      <div className="text-center text-[10px] font-black text-[#082d63]">
        <p>GET</p>
        <p className="text-lg text-[#1267c9]">←</p>
        <p className="font-mono">/api/customers</p>
      </div>
      <div className="flex-1 overflow-hidden rounded-xl border-2 border-[#72c8f1] text-[10px]">
        <p className="bg-[#1267c9] px-2 py-1 font-black text-white">Customers</p>
        <div className="grid grid-cols-3 gap-1 bg-[#f7fcff] px-2 py-1 font-black text-[#082d63]">
          <span>Name</span><span>Email</span><span>Status</span>
        </div>
        {[1, 2, 3].map((row) => (
          <div key={row} className="grid grid-cols-3 gap-1 px-2 py-1.5">
            <span className="h-1.5 rounded bg-[#d9edf7]" />
            <span className="h-1.5 rounded bg-[#d9edf7]" />
            <span className="h-1.5 rounded bg-[#d9edf7]" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CrudVisual() {
  return (
    <div>
      <div className="grid grid-cols-4 gap-1 text-center text-[11px] font-black">
        <span className="rounded-lg bg-[#159447] py-2 text-white">+ Create</span>
        <span className="rounded-lg bg-[#1267c9] py-2 text-white">👁 View</span>
        <span className="rounded-lg bg-[#ffd65a] py-2 text-[#082d63]">✎ Edit</span>
        <span className="rounded-lg bg-[#d7344f] py-2 text-white">🗑 Delete</span>
      </div>
      <div className="mt-3 overflow-hidden rounded-xl border-2 border-[#d9edf7] text-[11px]">
        <div className="grid grid-cols-[1fr_1.4fr_auto] gap-2 bg-[#f7fcff] px-2 py-1.5 font-black text-[#082d63]">
          <span>Name</span><span>Email</span><span>Actions</span>
        </div>
        {[["Ali Khan", "ali@example.com"], ["Sara Ahmed", "sara@example.com"]].map(([name, email]) => (
          <div key={name} className="grid grid-cols-[1fr_1.4fr_auto] gap-2 border-t border-[#d9edf7] px-2 py-1.5 text-[#163e6b]">
            <span>{name}</span><span className="truncate">{email}</span><span>👁 ✎ 🗑</span>
          </div>
        ))}
      </div>
      <p className="mt-2 rounded-lg bg-[#e5f6ff] px-2 py-1.5 text-[11px] font-bold text-[#0759a8]">
        👁 View = read-only · ✎ Edit = update / delete
      </p>
    </div>
  );
}

export function StatesVisual() {
  return (
    <div className="grid gap-2 text-xs font-bold">
      <p className="rounded-lg border-2 border-[#d9edf7] bg-[#f7fcff] px-3 py-2 text-[#1267c9]">
        <span className="mr-2 inline-block size-3 animate-spin rounded-full border-2 border-[#1267c9] border-t-transparent" />
        Loading...
      </p>
      <p className="rounded-lg border-2 border-[#f1a8bc] bg-[#ffe3eb] px-3 py-2 text-[#a3234c]">⛔ Error: Failed to load customers.</p>
      <p className="rounded-lg border-2 border-[#f0c557] bg-[#fff4c8] px-3 py-2 text-[#7a5a05]">⚠ No customers found.</p>
      <div className="flex items-center justify-center gap-1">
        {["‹", "1", "2", "3", "…", "10", "›"].map((item) => (
          <span
            key={item}
            className={item === "1"
              ? "grid size-7 place-items-center rounded-md bg-[#1267c9] text-white"
              : "grid size-7 place-items-center rounded-md border-2 border-[#d9edf7] text-[#082d63]"}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export function CacheVisual() {
  const companies = [
    { name: "Company A", id: 1, className: "border-[#1267c9] bg-[#e5f6ff]", head: "bg-[#1267c9]" },
    { name: "Company B", id: 2, className: "border-[#8b3fd9] bg-[#f3e9ff]", head: "bg-[#8b3fd9]" },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {companies.map((company) => (
        <div key={company.id} className={`overflow-hidden rounded-xl border-2 text-[11px] ${company.className}`}>
          <p className={`px-2 py-1 font-black text-white ${company.head}`}>
            {company.name}
            <span className="block text-[10px] font-semibold">(Company ID: {company.id})</span>
          </p>
          <div className="p-2 text-[#163e6b]">
            <p className="font-bold">Login par:</p>
            <p className="mt-1 rounded bg-white px-1 py-0.5 font-mono font-black">queryClient.clear()</p>
            <p className="mt-2">• Only {company.name}&apos;s data</p>
            <p>• Never shown to another company</p>
          </div>
        </div>
      ))}
    </div>
  );
}
