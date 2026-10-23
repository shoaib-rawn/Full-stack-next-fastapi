import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";

import { ApiStatus } from "@/components/api-status";
import {
  ConceptStep,
  MiniCompanyCache,
  MiniCookie,
  MiniSync,
  MiniValidate,
} from "@/components/concept-visuals";

// Main full-stack skills learned while building this project.
const majorSkills = [
  "Python async",
  "FastAPI",
  "Pydantic v2",
  "PostgreSQL",
  "SQLAlchemy 2",
  "Alembic",
  "JWT & Argon2",
  "Redis",
  "Multi-tenant RBAC",
  "Pytest",
  "TypeScript",
  "Next.js 16",
  "React 19",
  "TanStack Query",
  "Zod forms",
  "Tailwind CSS",
  "Docker & CI",
];

// The four places a request passes through, left to right.
const lanes = [
  { name: "Browser", tech: "React 19 · TanStack Query", color: "#1267c9" },
  { name: "Next.js server", tech: "Route Handler (BFF)", color: "#7a3fd1" },
  { name: "FastAPI", tech: "Python · Pydantic · JWT", color: "#159447" },
  { name: "PostgreSQL", tech: "SQLAlchemy 2 async", color: "#be850b" },
];

// One real request, e.g. "Create customer", step by step.
const journey = [
  {
    lane: 0,
    title: "Validate in the browser",
    text: "React Hook Form and Zod check the input first, so a bad email never leaves the page.",
    concept: "Client-side validation",
  },
  {
    lane: 0,
    title: "Call our own Next.js API",
    text: "TanStack Query runs the mutation and Axios sends it to /api/customers on the same domain. The browser attaches the HttpOnly session cookie by itself, so JavaScript never sees the token.",
    concept: "Same-origin request · HttpOnly cookie",
  },
  {
    lane: 1,
    title: "Next.js acts as the middleman",
    text: "A Route Handler reads the cookie on the server, turns it into an Authorization: Bearer header and forwards the request to FastAPI. This is the Backend-for-Frontend (BFF) pattern.",
    concept: "BFF · server-side secrets",
  },
  {
    lane: 2,
    title: "FastAPI checks everything again",
    text: "Middleware adds a request ID for logging. Dependency injection verifies the JWT, loads the user and their organization, and Pydantic validates the body. The server never trusts the client.",
    concept: "Dependency injection · JWT · Pydantic",
  },
  {
    lane: 3,
    title: "Save safely in the database",
    text: "A service writes through SQLAlchemy inside a transaction, always filtered by organization_id, so one company can never read another company's data.",
    concept: "Transactions · multi-tenant isolation",
  },
  {
    lane: 0,
    title: "The answer travels back",
    text: "FastAPI returns typed JSON, Next.js passes the status through, and TanStack Query invalidates the customer list so the screen refreshes. If the token expired, Axios refreshes it once and retries.",
    concept: "Cache invalidation · token refresh",
  },
];

const tributeUrl = "https://internshipdays-wishes.vercel.app/index.html";

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f5faff] text-[#0b2e59]">
      <section className="relative isolate border-b-4 border-[#ffd65a] bg-linear-to-br from-[#073979] via-[#0e61b8] to-[#082d63] px-5 pb-16 pt-6 text-white sm:px-8 lg:px-12 lg:pb-20">
        <div className="pointer-events-none absolute -right-36 -top-44 -z-10 size-136 rounded-full bg-[#69ccf5]/30 blur-3xl" />
        <div className="pointer-events-none absolute -left-44 top-72 -z-10 size-96 rounded-full bg-[#ffd65a]/20 blur-3xl" />

        <div className="mx-auto mb-4 flex max-w-6xl items-center justify-between gap-4 rounded-2xl bg-white px-4 py-2 shadow-[0_8px_24px_rgba(4,30,68,0.25)] sm:px-6">
          <Image
            src="/logos/pseb-logo.png"
            alt="Pakistan Software Export Board (PSEB) logo"
            width={173}
            height={102}
            className="h-10 w-auto sm:h-12"
            priority
          />
          <p className="hidden text-center text-[11px] font-bold uppercase tracking-[0.2em] text-[#58718c] md:block">
            Internship project · Government of Pakistan
          </p>
          <Image
            src="/logos/moitt-logo.png"
            alt="Ministry of Information Technology & Telecom, Government of Pakistan logo"
            width={164}
            height={136}
            className="h-12 w-auto sm:h-14"
            priority
          />
        </div>

        <nav className="mx-auto flex max-w-6xl items-center justify-between rounded-2xl border border-white/25 bg-white/10 px-4 py-3 shadow-xl backdrop-blur sm:px-5">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl border-2 border-white/70 bg-white/10 text-sm font-black text-white">
              LL
            </span>
            <div>
              <p className="font-black tracking-[-0.02em]">LedgerLite</p>
              <p className="text-xs text-[#cceaff]">Accounting workspace</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/notebook"
              className="flex items-center gap-1.5 rounded-full bg-[#ffd65a] px-3 py-2 text-xs font-black text-[#082d63] shadow-[0_3px_0_#be850b] transition hover:-translate-y-0.5"
            >
              <span aria-hidden>📓</span> Notebook
            </Link>
            <Suspense fallback={<StatusFallback />}>
              <ApiStatus />
            </Suspense>
          </div>
        </nav>

        <div className="mx-auto grid max-w-6xl gap-12 pb-4 pt-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:pt-28">
          <div>
            <p className="mb-5 inline-flex rounded-md bg-[#ffd65a] px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-[#082d63]">
              My LedgerLite Journey
            </p>
            <h1 className="max-w-4xl text-5xl font-black leading-[0.98] tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl">
              Clear accounts.
              <span className="block text-[#ffd65a]">Calmer decisions.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#d7edff] sm:text-xl">
              A multi-tenant workspace for customers, invoices, payments, and the
              complete story behind every balance.
            </p>


            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/login" className="rounded-xl bg-[#ffd65a] px-5 py-3 font-black text-[#082d63] shadow-[0_4px_0_#be850b]">
                Sign in
              </Link>
              <Link href="/signup" className="rounded-xl border-2 border-white/60 bg-white/10 px-5 py-3 font-black text-white">
                Create workspace
              </Link>
            </div>
          </div>

          <div className="rounded-4xl border-2 border-white/30 bg-white/10 p-6 text-white shadow-[0_14px_0_rgba(4,30,68,0.2)] backdrop-blur sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#ffd65a]">
              Request journey
            </p>
            <div className="mt-5 grid gap-3">
              <ConceptStep number="1" title="Validate input" caption="Zod schema">
                <MiniValidate />
              </ConceptStep>
              <ConceptStep number="2" title="Protect session" caption="HttpOnly cookies">
                <MiniCookie />
              </ConceptStep>
              <ConceptStep number="3" title="Load tenant data" caption="Per company">
                <MiniCompanyCache />
              </ConceptStep>
              <ConceptStep number="4" title="Synchronize UI" caption="TanStack Query">
                <MiniSync />
              </ConceptStep>
            </div>
          </div>
        </div>
      </section>

      <section className="flex items-center border-b-4 border-[#ffd65a] bg-white px-5 py-16 sm:px-8 lg:min-h-[44rem] lg:px-12 lg:py-20">
        <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <p className="inline-flex rounded-md bg-[#e8f8dc] px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-[#159447]">
              With gratitude
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.045em] text-[#082d63] sm:text-5xl">
              I am very thankful to you.
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#58718c]">
              My heartfelt thanks to the Ministry of IT &amp; Telecom and the
              Pakistan Software Export Board (PSEB) for this internship. Building
              LedgerLite taught me 47 topics across the full stack, from FastAPI,
              PostgreSQL and secure authentication to Next.js, React and
              deployment. Thank you for the guidance, the opportunity and the
              trust that made this journey possible.
            </p>
          </div>

          <a
            href={tributeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-4xl border-2 border-[#082d63] bg-linear-to-br from-[#073979] via-[#0e61b8] to-[#082d63] p-8 text-white shadow-[0_10px_0_#041a3a] transition hover:-translate-y-1 hover:shadow-[0_14px_0_#041a3a]"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-14 place-items-center rounded-2xl bg-white text-3xl" aria-hidden>
                🎓
              </span>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#ffd65a]">
                Internship days
              </p>
            </div>
            <p className="mt-6 text-3xl font-black tracking-[-0.03em]">Tribute to PSEB</p>
            <p className="mt-3 leading-7 text-[#d7edff]">
              A small page of wishes and memories from my internship days.
            </p>
            <span className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#ffd65a] px-5 py-3 font-black text-[#082d63] shadow-[0_4px_0_#be850b]">
              Open tribute
              <span className="transition-transform group-hover:translate-x-1" aria-hidden>→</span>
            </span>
          </a>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="inline-flex rounded-md bg-[#ffd65a] px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-[#082d63]">
              47 topics
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[#082d63] sm:text-4xl">
              Full-stack skills I learned in this project.
            </h2>
          </div>

          <ul className="mt-10 flex flex-wrap gap-3">
            {majorSkills.map((skill) => (
              <li
                key={skill}
                className="rounded-full border-2 border-[#83cff4] bg-white px-4 py-2 text-sm font-black text-[#082d63] shadow-[0_4px_0_rgba(8,45,99,0.07)] transition hover:-translate-y-0.5 hover:border-[#1267c9]"
              >
                {skill}
              </li>
            ))}
          </ul>

          <div className="mt-20 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="lg:sticky lg:top-8 lg:self-start">
              <p className="inline-flex rounded-md bg-[#ffe3eb] px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-[#a3234c]">
                How a request travels
              </p>
              <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[#082d63] sm:text-4xl">
                From a click in the browser to the database, and back.
              </h2>
              <p className="mt-5 text-lg leading-8 text-[#58718c]">
                When I started, the hardest question for me was simple: how does
                one click actually reach the server? LedgerLite answers it
                visually. Every request passes through four layers, and each
                layer has one clear job.
              </p>
              <p className="mt-4 leading-7 text-[#58718c]">
                Inside the app you can watch this live: the request animation
                shows the real steps and timings of each call, read from the
                server&apos;s own trace.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border-2 border-[#83cff4] bg-white p-5">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1267c9]">
                    For beginners
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#58718c]">
                    See the full path of a request: client, server, API and
                    database, and why each step exists.
                  </p>
                </div>
                <div className="rounded-2xl border-2 border-[#83cff4] bg-white p-5">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#159447]">
                    For seniors
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#58718c]">
                    BFF auth with HttpOnly cookies, refresh rotation, tenant
                    isolation and cache invalidation in one real codebase.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-4xl border-2 border-[#082d63] bg-white p-5 shadow-[0_10px_0_rgba(8,45,99,0.12)] sm:p-7">
              <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Layers">
                {lanes.map((lane, index) => (
                  <li
                    key={lane.name}
                    className="relative rounded-2xl px-3 py-3 text-white"
                    style={{ backgroundColor: lane.color }}
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-80">
                      Layer {index + 1}
                    </p>
                    <p className="mt-1 text-sm font-black">{lane.name}</p>
                    <p className="text-[11px] opacity-90">{lane.tech}</p>
                  </li>
                ))}
              </ol>

              <ol className="relative mt-6 space-y-4 before:absolute before:bottom-4 before:left-[19px] before:top-4 before:w-0.5 before:bg-[#d7e6f3]">
                {journey.map((step, index) => {
                  const lane = lanes[step.lane];
                  return (
                    <li key={step.title} className="relative flex gap-4">
                      <span
                        className="z-10 grid size-10 shrink-0 place-items-center rounded-full text-sm font-black text-white ring-4 ring-white"
                        style={{ backgroundColor: lane.color }}
                      >
                        {index + 1}
                      </span>
                      <div className="pb-1">
                        <p className="text-[11px] font-black uppercase tracking-[0.16em]" style={{ color: lane.color }}>
                          {lane.name}
                        </p>
                        <p className="font-black text-[#082d63]">{step.title}</p>
                        <p className="mt-1 text-sm leading-6 text-[#58718c]">{step.text}</p>
                        <p className="mt-2 inline-flex rounded-md bg-[#f0f6fc] px-2 py-0.5 text-[11px] font-bold text-[#0b2e59]">
                          {step.concept}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function StatusFallback() {
  return (
    <span className="rounded-full bg-white/15 px-3 py-2 text-xs font-bold text-white">
      Checking API…
    </span>
  );
}

