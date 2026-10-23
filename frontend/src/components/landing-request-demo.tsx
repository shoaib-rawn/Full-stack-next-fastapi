import Link from "next/link";

// Landing-page teaser for the request journey. It shows the four layers of
// the stack but keeps what happens between them hidden: the real step-by-step
// animation is waiting inside the app.
const layers = [
  { icon: "🖥️", name: "Browser", tech: "React 19", color: "#1267c9" },
  { icon: "N", name: "Next.js", tech: "BFF server", color: "#7a3fd1" },
  { icon: "⚡", name: "FastAPI", tech: "Python API", color: "#159447" },
  { icon: "🗄️", name: "PostgreSQL", tech: "Database", color: "#be850b" },
];

export function LandingRequestDemo() {
  return (
    <div className="relative overflow-hidden rounded-4xl border-2 border-[#082d63] bg-linear-to-br from-[#061f45] via-[#0a3a7a] to-[#061f45] p-6 text-white shadow-[0_12px_0_#041a3a] sm:p-10">
      {/* Blueprint grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-[#69ccf5]/25 blur-3xl" />

      <div className="relative grid gap-10 lg:grid-cols-[1.4fr_0.6fr] lg:items-center">
        <ol className="flex items-center" aria-label="The four layers of LedgerLite">
          {layers.map((layer, index) => (
            <li key={layer.name} className={index === 0 ? "flex" : "flex flex-1 items-center"}>
              {index > 0 && (
                <div className="relative mx-1 flex flex-1 items-center sm:mx-2">
                  <span className="h-0 flex-1 border-t-2 border-dashed border-white/40" />
                  <span className="absolute left-1/2 grid size-7 -translate-x-1/2 place-items-center rounded-full border-2 border-[#ffd65a] bg-[#082d63] text-xs font-black text-[#ffd65a] sm:size-8 sm:text-sm">
                    ?
                  </span>
                </div>
              )}
              <div className="flex w-16 flex-col items-center text-center sm:w-28">
                <span
                  className="grid size-14 place-items-center rounded-2xl border-2 border-white/30 text-2xl font-black shadow-[0_6px_0_rgba(0,0,0,0.25)] sm:size-20 sm:text-3xl"
                  style={{ backgroundColor: layer.color }}
                >
                  {layer.icon}
                </span>
                <p className="mt-3 text-xs font-black sm:text-sm">{layer.name}</p>
                <p className="text-[10px] text-[#cceaff] sm:text-xs">{layer.tech}</p>
              </div>
            </li>
          ))}
        </ol>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#ffd65a]">
            One click · four layers
          </p>
          <p className="mt-3 text-2xl font-black leading-tight tracking-[-0.03em] sm:text-3xl">
            What happens between the click and the database?
          </p>
          <p className="mt-3 leading-7 text-[#d7edff]">
            Sign in and watch a real request make the trip, step by step.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#ffd65a] px-5 py-3 font-black text-[#082d63] shadow-[0_4px_0_#be850b] transition hover:-translate-y-0.5"
          >
            Watch it live <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
