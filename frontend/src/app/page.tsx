import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";

import { ApiStatus } from "@/components/api-status";
import { LandingRequestDemo } from "@/components/landing-request-demo";
import { TributeCard } from "@/components/tribute-card";
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

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f5faff] text-[#0b2e59]">
      <section className="relative isolate border-b-4 border-[#ffd65a] bg-linear-to-br from-[#073979] via-[#0e61b8] to-[#082d63] px-5 pb-16 pt-6 text-white sm:px-8 lg:px-12 lg:pb-20">
        <div className="pointer-events-none absolute -right-36 -top-44 -z-10 size-136 rounded-full bg-[#69ccf5]/30 blur-3xl" />
        <div className="pointer-events-none absolute -left-44 top-72 -z-10 size-96 rounded-full bg-[#ffd65a]/20 blur-3xl" />

        <div className="mx-auto mb-4 flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-2 shadow-[0_8px_24px_rgba(4,30,68,0.25)] sm:px-6">
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

        <nav className="mx-auto flex items-center justify-between rounded-2xl border border-white/25 bg-white/10 px-4 py-3 shadow-xl backdrop-blur sm:px-5">
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

        <div className="mx-auto grid gap-12 pb-4 pt-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:pt-28">
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
        <div className="mx-auto grid w-full gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <p className="inline-flex rounded-md bg-[#e8f8dc] px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-[#159447]">
              With gratitude
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.045em] text-[#082d63] sm:text-5xl">
              I am very thankful to you.
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#58718c]">
              My heartfelt thanks to the Ministry of IT &amp; Telecom, the
              Pakistan Software Export Board (PSEB) and COMSTECH for this
              internship. Building
              LedgerLite taught me 47 topics across the full stack, from FastAPI,
              PostgreSQL and secure authentication to Next.js, React and
              deployment. Thank you for the guidance, the opportunity and the
              trust that made this journey possible.
            </p>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-[#58718c]">
              The learning continues: I am now building new skills in AI and
              Machine Learning through{" "}
              <strong className="rounded bg-[#ffd65a] px-1 font-black text-[#082d63]">
                PSEB&apos;s three-month bootcamp
              </strong>
              . PSEB has
              proved truly valuable for my growth.
            </p>
          </div>

          <TributeCard />
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
        <div className="mx-auto">
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

          <div className="mt-20">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
              <div>
                <p className="inline-flex rounded-md bg-[#ffe3eb] px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-[#a3234c]">
                  How a request travels
                </p>
                <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[#082d63] sm:text-4xl">
                  From a click in the browser to the database, and back.
                </h2>
                <p className="mt-4 text-lg leading-8 text-[#58718c]">
                  When I started, the hardest question for me was simple: how
                  does one click actually reach the server? LedgerLite answers it
                  visually. Every request passes through four layers, each with
                  one clear job, and inside the app the request animation shows
                  the real steps and timings of every call.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border-2 border-[#83cff4] bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1267c9]">
                    For beginners
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#58718c]">
                    The full path of a request, client to database, and why each
                    step exists.
                  </p>
                </div>
                <div className="rounded-2xl border-2 border-[#83cff4] bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#159447]">
                    For seniors
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#58718c]">
                    BFF auth, refresh rotation, tenant isolation and cache
                    invalidation in one real codebase.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <LandingRequestDemo />
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

