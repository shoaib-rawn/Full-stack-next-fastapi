"use client";

import { useEffect, useState } from "react";

import { TablePreview } from "@/components/request-animation";

// Landing-page copy of the in-app "Loading customers" animation. It replays
// on a loop with example timings, so visitors can see the request journey
// without signing in.
const nodes = [
  { icon: "📋", label: "useQuery", sub: "TanStack", info: "sent", tone: "bg-[#e5f6ff] text-[#1267c9] border-[#72c8f1]", detail: "TanStack Query starts the request in the browser (no cache yet)." },
  { icon: "N", label: "/api/customers", sub: "Next.js BFF", info: "219ms total", tone: "bg-[#082d63] text-white border-[#082d63]", detail: "Next.js reads the HttpOnly cookie and adds the token as a Bearer header." },
  { icon: "🛡️", label: "Auth guard", sub: "get_current_user", info: "✓ 200 · 215ms", tone: "bg-[#fff4c8] text-[#7a5a05] border-[#f0c557]", detail: "FastAPI verifies the JWT and reloads you from the database (active, role, token version)." },
  { icon: "🏢", label: "Tenant filter", sub: "WHERE org_id", info: "passed", tone: "bg-[#e0f5ef] text-[#0f8a6d] border-[#7fd3bd]", detail: "Only your organization's rows, with OFFSET/LIMIT pagination." },
  { icon: "🗄️", label: "Database", sub: "SELECT", info: "3 rows", tone: "bg-[#e9f0ff] text-[#3046a8] border-[#9fb0f0]", detail: "PostgreSQL returns the rows and they fill the table." },
];

const STEP_MS = 1400;
const HOLD_MS = 2600;

export function LandingRequestDemo() {
  // shown = index of the step in progress; nodes.length = finished.
  const [shown, setShown] = useState(0);
  const done = shown >= nodes.length;

  useEffect(() => {
    const timer = setTimeout(
      () => setShown((current) => (current >= nodes.length ? 0 : current + 1)),
      done ? HOLD_MS : STEP_MS,
    );
    return () => clearTimeout(timer);
  }, [shown, done]);

  const current = nodes[Math.min(shown, nodes.length - 1)];

  return (
    <div className="rounded-3xl border-2 border-[#72c8f1] bg-white p-4 shadow-[0_8px_0_rgba(8,45,99,0.07)] sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {done ? (
          <p className="flex items-center gap-2 font-black text-[#28712f]">
            <span className="grid size-5 place-items-center rounded-full bg-[#159447] text-xs text-white">✓</span>
            Loading customers — done
          </p>
        ) : (
          <p className="flex items-center gap-2 font-black text-[#082d63]">
            <span className="inline-block size-4 animate-spin rounded-full border-2 border-[#1267c9] border-t-transparent" />
            Loading customers...
          </p>
        )}
        <div className="flex items-center gap-2">
          <span
            title="A replay with example timings. Inside the app the same animation shows each real request."
            className="rounded-md bg-[#e8f8dc] px-2 py-1 text-[10px] font-black uppercase tracking-wider text-[#28712f]"
          >
            ● Replay
          </span>
          <span className="rounded-md bg-[#1267c9] px-2 py-1 font-mono text-xs font-black text-white">GET</span>
        </div>
      </div>

      <div className="mt-5 flex items-start">
        {nodes.map((node, index) => {
          const isCurrent = index === shown;
          const isDone = index < shown;

          return (
            <div key={node.label} className={index === 0 ? "flex" : "flex flex-1"}>
              {index > 0 && (
                <div className="relative mx-0.5 mt-6 h-1 flex-1 rounded-full bg-[#d9edf7] sm:mx-1">
                  <div
                    className="h-full rounded-full bg-[#1267c9] transition-all duration-700"
                    style={{ width: index <= shown ? "100%" : "0%" }}
                  />
                  {isCurrent && (
                    <span
                      key={`packet-${index}`}
                      className="ll-packet text-lg drop-shadow"
                      style={{ animationDuration: `${STEP_MS * 0.8}ms` }}
                    >
                      📦
                    </span>
                  )}
                </div>
              )}

              <div className="flex w-16 flex-col items-center text-center sm:w-28">
                <span className="relative grid size-12 place-items-center sm:size-14">
                  {isCurrent && (
                    <span className="absolute inset-0 animate-ping rounded-2xl bg-[#ffd65a]/60" />
                  )}
                  <span
                    className={`relative grid size-12 place-items-center rounded-2xl border-2 text-xl font-black transition sm:size-14 sm:text-2xl ${node.tone} ${isCurrent ? "scale-110 ring-4 ring-[#ffd65a]" : ""} ${index > shown ? "opacity-40" : ""}`}
                  >
                    {node.icon}
                  </span>
                  {(isDone || done) && index > 0 && (
                    <span className="ll-row-in absolute -right-2 -top-2 grid size-5 place-items-center rounded-full border-2 border-white bg-[#159447] text-[10px] font-black text-white">
                      ✓
                    </span>
                  )}
                </span>
                <p className="mt-2 break-all text-[10px] font-black leading-tight text-[#082d63] sm:text-xs">{node.label}</p>
                <p className="text-[10px] text-[#58718c]">{node.sub}</p>
                {index <= shown && (
                  <p className="mt-1 rounded bg-[#eef6fb] px-1 font-mono text-[10px] font-bold text-[#0759a8]">
                    {node.info}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p key={shown} className="ll-row-in mt-5 rounded-xl bg-[#f7fcff] px-4 py-3 text-sm font-bold text-[#163e6b]">
        <span className="mr-2 rounded-md bg-[#1267c9] px-2 py-0.5 text-xs text-white">
          {done ? "✓" : `${shown + 1}/${nodes.length}`}
        </span>
        {done ? "The customer list is on screen. TanStack Query caches it for the next visit." : current.detail}
      </p>

      <TablePreview filled={done} />
    </div>
  );
}
