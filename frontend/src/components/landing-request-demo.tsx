// Landing-page picture of the in-app "Loading customers" animation, shown
// in its finished state (no motion) with example timings and rows.
const nodes = [
  { icon: "📋", label: "useQuery", sub: "TanStack", info: "sent", tone: "bg-[#e5f6ff] text-[#1267c9] border-[#72c8f1]", detail: "TanStack Query starts the request in the browser (no cache yet)." },
  { icon: "N", label: "/api/customers", sub: "Next.js BFF", info: "219ms total", tone: "bg-[#082d63] text-white border-[#082d63]", detail: "Next.js reads the HttpOnly cookie and adds the token as a Bearer header." },
  { icon: "🛡️", label: "Auth guard", sub: "get_current_user", info: "✓ 200 · 215ms", tone: "bg-[#fff4c8] text-[#7a5a05] border-[#f0c557]", detail: "FastAPI verifies the JWT and reloads you from the database (active, role, token version)." },
  { icon: "🏢", label: "Tenant filter", sub: "WHERE org_id", info: "passed", tone: "bg-[#e0f5ef] text-[#0f8a6d] border-[#7fd3bd]", detail: "Only your organization's rows, with OFFSET/LIMIT pagination." },
  { icon: "🗄️", label: "Database", sub: "SELECT", info: "3 rows", tone: "bg-[#e9f0ff] text-[#3046a8] border-[#9fb0f0]", detail: "PostgreSQL returns the rows and they fill the table." },
];

const rows = [
  { name: "Ali Traders", email: "accounts@alitraders.example", status: "Active" },
  { name: "Noor Textiles", email: "billing@noortextiles.example", status: "Active" },
  { name: "Hassan & Co.", email: "finance@hassanco.example", status: "Archived" },
];

export function LandingRequestDemo() {
  return (
    <div className="rounded-3xl border-2 border-[#72c8f1] bg-white p-4 shadow-[0_8px_0_rgba(8,45,99,0.07)] sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-black text-[#28712f]">
          <span className="grid size-5 place-items-center rounded-full bg-[#159447] text-xs text-white">✓</span>
          Loading customers — done
        </p>
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-[#e8f8dc] px-2 py-1 text-[10px] font-black uppercase tracking-wider text-[#28712f]">
            200 OK
          </span>
          <span className="rounded-md bg-[#1267c9] px-2 py-1 font-mono text-xs font-black text-white">GET</span>
        </div>
      </div>

      <div className="mt-5 flex items-start">
        {nodes.map((node, index) => (
          <div key={node.label} className={index === 0 ? "flex" : "flex flex-1"}>
            {index > 0 && (
              <div className="mx-0.5 mt-6 h-1 flex-1 rounded-full bg-[#1267c9] sm:mx-1" />
            )}

            <div className="flex w-16 flex-col items-center text-center sm:w-28">
              <span className="relative grid size-12 place-items-center sm:size-14">
                <span
                  className={`grid size-12 place-items-center rounded-2xl border-2 text-xl font-black sm:size-14 sm:text-2xl ${node.tone}`}
                >
                  {node.icon}
                </span>
                {index > 0 && (
                  <span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full border-2 border-white bg-[#159447] text-[10px] font-black text-white">
                    ✓
                  </span>
                )}
              </span>
              <p className="mt-2 break-all text-[10px] font-black leading-tight text-[#082d63] sm:text-xs">{node.label}</p>
              <p className="text-[10px] text-[#58718c]">{node.sub}</p>
              <p className="mt-1 rounded bg-[#eef6fb] px-1 font-mono text-[10px] font-bold text-[#0759a8]">
                {node.info}
              </p>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-5 rounded-xl bg-[#f7fcff] px-4 py-3 text-sm font-bold text-[#163e6b]">
        <span className="mr-2 rounded-md bg-[#1267c9] px-2 py-0.5 text-xs text-white">5/5</span>
        {nodes[nodes.length - 1].detail}
      </p>

      <div className="mt-4 overflow-hidden rounded-xl border-2 border-[#72c8f1] text-xs">
        <div className="flex items-center justify-between bg-[#1267c9] px-3 py-2 font-black text-white">
          Customers <span>+</span>
        </div>
        <div className="grid grid-cols-3 gap-2 bg-[#f7fcff] px-3 py-2 font-black text-[#082d63]">
          <span>Name</span><span>Email</span><span>Status</span>
        </div>
        {rows.map((row) => (
          <div key={row.name} className="grid grid-cols-3 gap-2 border-t border-[#d9edf7] px-3 py-2.5 text-[#163e6b]">
            <span className="font-bold">{row.name}</span>
            <span className="truncate">{row.email}</span>
            <span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-black ${row.status === "Active" ? "bg-[#e0f5ef] text-[#0f8a6d]" : "bg-[#eef1f4] text-[#657382]"}`}
              >
                {row.status}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
