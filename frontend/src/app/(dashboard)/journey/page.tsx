import type { ReactNode } from "react";

import {
  BffFlowVisual,
  CacheVisual,
  CookieVisual,
  CrudVisual,
  FetchVisual,
  FolderTreeVisual,
  FormVisual,
  StatesVisual,
} from "@/components/concept-visuals";

type Step = {
  number: number;
  title: string;
  problem: string;
  solution: string;
  result: string;
  visual: ReactNode;
};

const goals = [
  { day: 2, text: "Users can create an account and sign in" },
  { day: 2, text: "Login tokens stay secure in the browser" },
  { day: 2, text: "Protected pages don't open without signing in" },
  { day: 2, text: "Expired sessions renew safely or log out" },
  { day: 3, text: "The frontend loads customers from the real backend" },
  { day: 3, text: "Create, read, update and delete work end to end" },
  { day: 3, text: "Loading, error, empty and pagination states are clear" },
  { day: 3, text: "One company's cached data is never shown to another" },
];

const dayTwoSteps: Step[] = [
  {
    number: 1,
    title: "Organizing the login and signup pages",
    problem: "With every file in one place, the code would get mixed up.",
    solution: "Next.js Route Groups and shared layouts.",
    result: "Clean architecture that stays manageable as features grow.",
    visual: <FolderTreeVisual />,
  },
  {
    number: 2,
    title: "Stopping bad form input at the gate",
    problem: "Users could submit an empty email, an invalid email or a weak password.",
    solution: "React Hook Form + Zod.",
    result: "Clear field-level feedback before invalid data reaches the API.",
    visual: <FormVisual />,
  },
  {
    number: 3,
    title: "Never giving FastAPI tokens directly to the browser",
    problem: "A token in localStorage could be read by an injected script.",
    solution: "Next.js Route Handlers act as a BFF (Backend for Frontend).",
    result: "Secure communication without exposing tokens to client JavaScript.",
    visual: <BffFlowVisual />,
  },
  {
    number: 4,
    title: "Keeping tokens in safer cookies",
    problem: "The login had to be remembered while keeping the token out of JavaScript storage.",
    solution: "HttpOnly, Secure, SameSite cookies.",
    result: "Tokens stay out of reach of browser JavaScript.",
    visual: <CookieVisual />,
  },
];

const dayThreeSteps: Step[] = [
  {
    number: 5,
    title: "Loading customers from the real backend",
    problem: "Until now the data was static.",
    solution: "TanStack Query loads real data from FastAPI.",
    result: "Customers now load from the real backend.",
    visual: <FetchVisual />,
  },
  {
    number: 6,
    title: "The complete Create, Read, Update, Delete flow",
    problem: "Just viewing a list was not enough.",
    solution: "Forms, routes and API mutations. View is read-only; editing happens inline in the list.",
    result: "Customers have a complete CRUD flow.",
    visual: <CrudVisual />,
  },
  {
    number: 7,
    title: "Loading, error, empty and pagination states",
    problem: "A slow network or an error showed a blank screen.",
    solution: "Used React Query's built-in states.",
    result: "Every state is clear, so users always know what is happening.",
    visual: <StatesVisual />,
  },
  {
    number: 8,
    title: "Keeping each company's cache separate",
    problem: "One company's data could show up for another company.",
    solution: "The query cache is cleared on login and logout, so each company gets its own data.",
    result: "Each company's data stays isolated and secure.",
    visual: <CacheVisual />,
  },
];

export default function JourneyPage() {
  return (
    <main className="mx-auto max-w-7xl p-4 sm:p-6">
      <section className="overflow-hidden rounded-3xl border-b-4 border-[#ffd65a] bg-linear-to-r from-[#073979] via-[#1267c9] to-[#073979] p-6 text-center text-white shadow-[0_8px_0_rgba(8,45,99,0.1)] sm:p-8">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
          The LedgerLite Frontend Story — <span className="text-[#ffd65a]">Day 2 and Day 3</span>
        </h1>
        <p className="mt-3 text-[#d7edff]">
          An accounting app built not just to look good, but to work securely with real data.
        </p>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[0.8fr_1.4fr_auto_1fr] lg:items-center">
        <div className="rounded-3xl border-2 border-[#082d63] bg-white p-5 font-black leading-7 text-[#082d63] shadow-[0_6px_0_rgba(8,45,99,0.08)]">
          <span className="text-4xl">🧑‍💻</span>
          <p className="mt-3">On Day 1 we had pages and a basic UI. Now we had to make sure that:</p>
        </div>

        <ol className="grid gap-2 rounded-3xl border-2 border-[#f0c557] bg-[#fffaf0] p-4">
          {goals.map((goal, index) => (
            <li key={goal.text} className="flex items-center gap-3 text-sm font-semibold text-[#163e6b]">
              <span className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-black text-white ${goal.day === 2 ? "bg-[#d7344f]" : "bg-[#159447]"}`}>
                {goal.day}
              </span>
              <span>{index + 1}. {goal.text}</span>
            </li>
          ))}
        </ol>

        <span className="hidden text-5xl font-black text-[#1267c9] lg:block">➜</span>

        <div className="overflow-hidden rounded-3xl border-2 border-[#1267c9] bg-white">
          <p className="bg-[#1267c9] px-5 py-3 font-black text-white">We solved it in 2 days:</p>
          <div className="grid gap-3 p-4">
            <div className="flex items-center gap-3 rounded-2xl border-2 border-[#f4acc1] bg-[#ffe8ef] p-4">
              <span className="text-3xl">🔒</span>
              <p className="font-semibold text-[#082d63]"><b>Day 2:</b> Authentication and session security</p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border-2 border-[#9bd884] bg-[#e8f8dc] p-4">
              <span className="text-3xl">🗄️</span>
              <p className="font-semibold text-[#082d63]"><b>Day 3:</b> Real backend data, caching and customer CRUD</p>
            </div>
          </div>
        </div>
      </section>

      <DaySection
        day={2}
        title="Building a secure front door"
        question="Who are you, and are you allowed in?"
        tone="pink"
        steps={dayTwoSteps}
      />

      <DaySection
        day={3}
        title="Real backend data, caching and customer CRUD"
        question="Once inside, how is data loaded and managed?"
        tone="green"
        steps={dayThreeSteps}
      />
    </main>
  );
}

function DaySection({
  day,
  title,
  question,
  tone,
  steps,
}: {
  day: number;
  title: string;
  question: string;
  tone: "pink" | "green";
  steps: Step[];
}) {
  const banner = tone === "pink"
    ? "from-[#d7344f] to-[#e8517a]"
    : "from-[#15803d] to-[#22a04b]";
  const strip = tone === "pink" ? "bg-[#ffe8ef]" : "bg-[#e8f8dc]";

  return (
    <section className="mt-8">
      <div className={`flex flex-col overflow-hidden rounded-2xl sm:flex-row sm:items-center ${strip}`}>
        <h2 className={`bg-linear-to-r px-5 py-3 text-xl font-black text-white sm:text-2xl ${banner}`}>
          Day {day} — {title}
        </h2>
        <p className="px-5 py-3 font-semibold text-[#082d63]">→ {question}</p>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {steps.map((step) => (
          <StepCard key={step.number} step={step} />
        ))}
      </div>
    </section>
  );
}

function StepCard({ step }: { step: Step }) {
  return (
    <article className="flex flex-col rounded-3xl border-2 border-[#c5e6f7] bg-white p-4 shadow-[0_6px_0_rgba(8,45,99,0.06)]">
      <div className="flex items-start gap-3 rounded-2xl bg-[#e5f6ff] p-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#1267c9] text-lg font-black text-white">
          {step.number}
        </span>
        <h3 className="font-black leading-6 text-[#082d63]">{step.title}</h3>
      </div>

      <p className="mt-4 text-sm text-[#163e6b]">
        <span className="mr-2 rounded-md bg-[#ffe3eb] px-2 py-0.5 font-black text-[#a3234c]">Problem</span>
        {step.problem}
      </p>
      <p className="mt-2 text-sm text-[#163e6b]">
        <span className="mr-2 rounded-md bg-[#e5f6ff] px-2 py-0.5 font-black text-[#0759a8]">Solution</span>
        {step.solution}
      </p>

      <div className="my-4 flex-1">{step.visual}</div>

      <div className="flex items-start gap-3 rounded-2xl bg-[#e8f8dc] p-3">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#159447] text-sm font-black text-white">✓</span>
        <p className="text-sm font-semibold text-[#163e6b]">
          <span className="font-black text-[#286e30]">Result: </span>
          {step.result}
        </p>
      </div>
    </article>
  );
}

