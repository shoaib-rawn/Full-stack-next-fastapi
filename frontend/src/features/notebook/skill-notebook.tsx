"use client";

import { Fragment, useMemo, useState, useSyncExternalStore } from "react";

import "./notebook.css";
import type {
  GuideLanguage,
  InterviewSkill,
  SkillGuide,
  SkillSection,
} from "./skill-guide-types";

const LEARNED_KEY = "ledgerlite:notebook-learned-skills-v2";
const LANGUAGE_KEY = "ledgerlite:notebook-language";
const ALL = "all";

// Interface text. The skill content itself comes from the matching guide file.
const labels = {
  ur: {
    back: "← Wapas",
    kicker: "Ek hi revision source",
    title: "LedgerLite Interview Notebook",
    progress: "Aap ki progress",
    searchLabel: "Saari skills aur sawalon mein search",
    searchPlaceholder: "FastAPI, JWT, pagination, React... search karein",
    allSkills: "Saari skills",
    skillsButton: (count: number) => `☰ Skills (${count})`,
    close: "Band karein",
    skill: (number: number) => `Skill ${number}`,
    contents: "Skills ki fehrist",
    noMatch: "Koi skill nahi mili. Search ko chhota karein.",
    counts: (blocks: number, questions: number) => `${blocks} explanation blocks · ${questions} interview sawal`,
    learned: "✓ Seekh liya",
    markLearned: "Seekh liya mark karein",
    practice: "Kholne se pehle khud jawab dein",
    questions: "🎯 Interview sawal",
    answer: "Interview jawab",
    previous: "← Pichla",
    next: "Agla →",
    footer: (skills: number, questions: number) => `${skills} skills · ${questions} sawal · ek hi master guide se`,
    empty: "Notebook guide khali hai.",
  },
  en: {
    back: "← Back",
    kicker: "Single revision source",
    title: "LedgerLite Interview Notebook",
    progress: "Your progress",
    searchLabel: "Search all skills and questions",
    searchPlaceholder: "Search FastAPI, JWT, pagination, React...",
    allSkills: "All skills",
    skillsButton: (count: number) => `☰ Skills (${count})`,
    close: "Close",
    skill: (number: number) => `Skill ${number}`,
    contents: "Skill contents",
    noMatch: "No matching skill. Try a shorter search.",
    counts: (blocks: number, questions: number) => `${blocks} explanation blocks · ${questions} interview questions`,
    learned: "✓ Learned",
    markLearned: "Mark as learned",
    practice: "Practice before opening",
    questions: "🎯 Interview questions",
    answer: "Interview answer",
    previous: "← Previous",
    next: "Next →",
    footer: (skills: number, questions: number) => `${skills} skills · ${questions} questions · loaded from the single master guide`,
    empty: "Notebook guide is empty.",
  },
} satisfies Record<GuideLanguage, Record<string, unknown>>;

// Chosen language, remembered per browser. Roman Urdu (the master guide's
// language) is the default and the server render.
const languageListeners = new Set<() => void>();
let memoryLanguage: GuideLanguage | null = null;

function subscribeLanguage(listener: () => void) {
  languageListeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    languageListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function readLanguage(): GuideLanguage {
  try {
    const stored = window.localStorage.getItem(LANGUAGE_KEY);
    if (stored === "en" || stored === "ur") return stored;
  } catch {
    // Storage blocked: fall back to the in-memory choice.
  }
  return memoryLanguage ?? "ur";
}

function writeLanguage(language: GuideLanguage) {
  memoryLanguage = language;
  try {
    window.localStorage.setItem(LANGUAGE_KEY, language);
  } catch {
    // Storage blocked: the choice still applies for this visit.
  }
  languageListeners.forEach((listener) => listener());
}

const categoryStyles: Record<
  string,
  { solid: string; soft: string; border: string; icon: string }
> = {
  "Backend foundation": {
    solid: "#1267c9",
    soft: "#e5f6ff",
    border: "#8cc9ee",
    icon: "⚙️",
  },
  "Database & accounting": {
    solid: "#0b8b79",
    soft: "#e2faf4",
    border: "#83d6c7",
    icon: "🐘",
  },
  "Security & tenancy": {
    solid: "#d7344f",
    soft: "#ffe8ef",
    border: "#f3a8b8",
    icon: "🔐",
  },
  "Reliability & testing": {
    solid: "#7b4acb",
    soft: "#f0eaff",
    border: "#c7b0ef",
    icon: "🧪",
  },
  "Next.js architecture": {
    solid: "#152c45",
    soft: "#e9f0f6",
    border: "#9eb2c4",
    icon: "▲",
  },
  "Frontend state & UX": {
    solid: "#b86c00",
    soft: "#fff4d8",
    border: "#e8c274",
    icon: "⚛️",
  },
  "Business workflows": {
    solid: "#159447",
    soft: "#e8f8dc",
    border: "#9bd884",
    icon: "🧾",
  },
  "Quality & boundaries": {
    solid: "#92521f",
    soft: "#fff0e5",
    border: "#e4b58e",
    icon: "✅",
  },
  "Additional skills": {
    solid: "#44546a",
    soft: "#edf2f7",
    border: "#aebdca",
    icon: "+",
  },
};

const sectionStyles: Record<string, { icon: string; color: string; soft: string }> = {
  Define: { icon: "📖", color: "#1267c9", soft: "#e5f6ff" },
  Problem: { icon: "⚠️", color: "#d7344f", soft: "#ffe8ef" },
  "LedgerLite solution": { icon: "🛠️", color: "#159447", soft: "#e8f8dc" },
  Code: { icon: "⌨️", color: "#6d3fc4", soft: "#efe8ff" },
  Benefits: { icon: "✨", color: "#b86c00", soft: "#fff4d8" },
  Note: { icon: "📝", color: "#92521f", soft: "#fff0e5" },
  "LedgerLite truth table": { icon: "🔎", color: "#0b8b79", soft: "#e2faf4" },
};

// "Learned" progress lives in this browser's storage. It is read through
// useSyncExternalStore so the server render and first paint stay identical.
const learnedListeners = new Set<() => void>();
// Fallback when storage is blocked (private window).
let memoryLearned = "[]";

function subscribeLearned(listener: () => void) {
  learnedListeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    learnedListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function readLearnedRaw() {
  try {
    return window.localStorage.getItem(LEARNED_KEY) ?? memoryLearned;
  } catch {
    return memoryLearned;
  }
}

function writeLearned(numbers: number[]) {
  memoryLearned = JSON.stringify(numbers);
  try {
    window.localStorage.setItem(LEARNED_KEY, memoryLearned);
  } catch {
    // Storage blocked: progress still works for this visit.
  }
  learnedListeners.forEach((listener) => listener());
}

function parseLearned(raw: string) {
  try {
    const parsed: unknown = JSON.parse(raw);
    return new Set<number>(
      Array.isArray(parsed) ? parsed.filter((item) => typeof item === "number") : [],
    );
  } catch {
    return new Set<number>();
  }
}

export function SkillNotebook({
  guides,
}: {
  guides: { ur: SkillGuide; en?: SkillGuide };
}) {
  const chosenLanguage = useSyncExternalStore(subscribeLanguage, readLanguage, () => "ur" as const);
  const language: GuideLanguage = chosenLanguage === "en" && guides.en ? "en" : "ur";
  const guide = language === "en" && guides.en ? guides.en : guides.ur;
  const l = labels[language];
  const categories = useMemo(
    () => [...new Set(guide.skills.map((skill) => skill.category))],
    [guide.skills],
  );
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(ALL);
  const [selectedNumber, setSelectedNumber] = useState(guide.skills[0]?.number ?? 1);
  const learnedRaw = useSyncExternalStore(subscribeLearned, readLearnedRaw, () => "[]");
  const learned = useMemo(() => parseLearned(learnedRaw), [learnedRaw]);
  const [mobileContentsOpen, setMobileContentsOpen] = useState(false);

  const filteredSkills = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return guide.skills.filter((skill) => {
      if (category !== ALL && skill.category !== category) return false;
      if (!needle) return true;

      const haystack = [
        skill.title,
        skill.category,
        ...skill.sections.flatMap((section) => [section.title, section.body]),
        ...skill.questions.flatMap((question) => [question.question, question.answer]),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(needle);
    });
  }, [category, guide.skills, search]);

  const activeSkill =
    filteredSkills.find((skill) => skill.number === selectedNumber) ??
    filteredSkills[0] ??
    guide.skills.find((skill) => skill.number === selectedNumber) ??
    guide.skills[0];

  const activeIndex = guide.skills.findIndex(
    (skill) => skill.number === activeSkill?.number,
  );

  function selectSkill(skill: InterviewSkill) {
    setSelectedNumber(skill.number);
    setMobileContentsOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleLearned(skillNumber: number) {
    const updated = new Set(learned);
    if (updated.has(skillNumber)) updated.delete(skillNumber);
    else updated.add(skillNumber);
    writeLearned([...updated]);
  }

  function move(offset: number) {
    const target = guide.skills[activeIndex + offset];
    if (target) selectSkill(target);
  }

  if (!activeSkill) {
    return <main className="p-8">{l.empty}</main>;
  }

  const tone = categoryStyles[activeSkill.category];
  const progress = Math.round((learned.size / guide.skills.length) * 100);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_15%_5%,#2877c8,transparent_34%),radial-gradient(circle_at_90%_80%,#0f7a4a,transparent_35%)] bg-[#082d63] px-3 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3 text-white">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="rounded-xl border-2 border-white/40 px-4 py-2 text-sm font-black transition hover:bg-white/10 focus-visible:outline-4 focus-visible:outline-[#ffd65a]"
          >
            {l.back}
          </button>

          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#ffd65a]">
              {l.kicker}
            </p>
            <h1 className="text-lg font-black sm:text-xl">{l.title}</h1>
          </div>

          {guides.en && <LanguageToggle language={language} />}

          <div className="rounded-xl bg-white/10 px-4 py-2 text-right">
            <p className="text-xs font-bold text-[#b9d8f4]">{l.progress}</p>
            <p className="font-black text-[#ffd65a]">
              {learned.size}/{guide.skills.length} · {progress}%
            </p>
          </div>
        </header>

        <section className="mb-4 rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
          <div className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_2fr]">
            <label className="relative block">
              <span className="sr-only">{l.searchLabel}</span>
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg">⌕</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={l.searchPlaceholder}
                className="w-full rounded-xl border-2 border-transparent bg-white py-3 pl-11 pr-4 font-semibold text-[#082d63] outline-none transition focus:border-[#ffd65a]"
              />
            </label>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {[ALL, ...categories].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={`shrink-0 rounded-xl px-3 py-2 text-xs font-black transition ${
                    category === item
                      ? "bg-[#ffd65a] text-[#082d63]"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  {item === ALL ? l.allSkills : item}
                </button>
              ))}
            </div>
          </div>
        </section>

        <button
          type="button"
          onClick={() => setMobileContentsOpen((current) => !current)}
          className="mb-3 flex w-full items-center justify-between rounded-xl bg-[#ffd65a] px-4 py-3 font-black text-[#082d63] lg:hidden"
        >
          <span>{l.skillsButton(filteredSkills.length)}</span>
          <span>{mobileContentsOpen ? l.close : l.skill(activeSkill.number)}</span>
        </button>

        <div className="grid items-start gap-4 lg:grid-cols-[290px_minmax(0,1fr)]">
          <aside
            className={`${mobileContentsOpen ? "block" : "hidden"} max-h-[76vh] overflow-y-auto rounded-2xl border border-white/20 bg-[#061f46]/95 p-3 lg:sticky lg:top-4 lg:block`}
          >
            <div className="mb-3 flex items-center justify-between px-1 text-white">
              <p className="font-black">{l.contents}</p>
              <span className="text-xs text-[#9fc4e8]">
                {filteredSkills.length}/{guide.skills.length}
              </span>
            </div>

            <div className="space-y-2">
              {filteredSkills.map((skill) => {
                const style = categoryStyles[skill.category];
                const selected = skill.number === activeSkill.number;
                const isLearned = learned.has(skill.number);

                return (
                  <button
                    key={skill.number}
                    type="button"
                    onClick={() => selectSkill(skill)}
                    className={`group flex w-full items-start gap-3 rounded-xl border-2 p-3 text-left transition ${
                      selected
                        ? "translate-x-1 bg-white shadow-[0_5px_0_rgba(0,0,0,0.18)]"
                        : "border-transparent bg-white/7 text-white hover:bg-white/13"
                    }`}
                    style={selected ? { borderColor: style.solid } : undefined}
                  >
                    <span
                      className="grid size-9 shrink-0 place-items-center rounded-lg text-sm font-black text-white"
                      style={{ backgroundColor: style.solid }}
                    >
                      {isLearned ? "✓" : skill.number}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={`block text-xs font-black uppercase tracking-wide ${
                          selected ? "text-[#58718c]" : "text-[#9fc4e8]"
                        }`}
                      >
                        {style.icon} {skill.category}
                      </span>
                      <span
                        className={`mt-0.5 block text-sm font-bold leading-5 ${
                          selected ? "text-[#082d63]" : "text-white"
                        }`}
                      >
                        {skill.title}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            {!filteredSkills.length && (
              <p className="rounded-xl bg-white/10 p-4 text-center text-sm text-white">
                {l.noMatch}
              </p>
            )}
          </aside>

          <article className="nb-paper overflow-hidden rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.32)] sm:rounded-3xl">
            <div
              className="border-b-4 px-5 py-6 sm:px-8"
              style={{ backgroundColor: tone.soft, borderColor: tone.solid }}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-4">
                  <span
                    className="grid size-14 shrink-0 place-items-center rounded-2xl text-xl font-black text-white shadow-[0_5px_0_rgba(0,0,0,0.14)]"
                    style={{ backgroundColor: tone.solid }}
                  >
                    {activeSkill.number}
                  </span>
                  <div>
                    <p
                      className="text-xs font-black uppercase tracking-[0.18em]"
                      style={{ color: tone.solid }}
                    >
                      {tone.icon} {activeSkill.category}
                    </p>
                    <h2 className="mt-1 text-2xl font-black leading-tight text-[#082d63] sm:text-3xl">
                      {activeSkill.title}
                    </h2>
                    <p className="mt-2 text-sm font-bold text-[#58718c]">
                      {l.counts(activeSkill.sections.length, activeSkill.questions.length)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleLearned(activeSkill.number)}
                  className={`rounded-xl border-2 px-4 py-2 text-sm font-black transition ${
                    learned.has(activeSkill.number)
                      ? "border-[#159447] bg-[#159447] text-white"
                      : "border-[#9eb2c4] bg-white text-[#082d63] hover:border-[#159447]"
                  }`}
                >
                  {learned.has(activeSkill.number) ? l.learned : l.markLearned}
                </button>
              </div>
            </div>

            <div className="space-y-5 px-4 py-6 sm:px-8 sm:py-8">
              <div className="grid gap-4 xl:grid-cols-2">
                {activeSkill.sections.map((section) => (
                  <SectionCard
                    key={`${activeSkill.number}-${section.title}`}
                    section={section}
                  />
                ))}
              </div>

              <section className="overflow-hidden rounded-2xl border-2 border-[#ffd65a] bg-[#fffdf4]">
                <div className="flex flex-wrap items-center justify-between gap-2 bg-[#ffd65a] px-5 py-4 text-[#082d63]">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em]">{l.practice}</p>
                    <h3 className="text-xl font-black">{l.questions}</h3>
                  </div>
                  <span className="rounded-full bg-[#082d63] px-3 py-1 text-sm font-black text-white">
                    {activeSkill.questions.length}
                  </span>
                </div>

                <div className="space-y-3 p-4 sm:p-5">
                  {activeSkill.questions.map((question) => (
                    <details
                      key={`${activeSkill.number}-${question.number}`}
                      className="group overflow-hidden rounded-xl border-2 border-[#cbd9e6] bg-white open:border-[#1267c9]"
                    >
                      <summary className="flex cursor-pointer list-none items-start gap-3 p-4 font-black text-[#082d63] marker:hidden">
                        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#1267c9] text-xs text-white">
                          Q{question.number}
                        </span>
                        <span className="flex-1 leading-6"><InlineText value={question.question} /></span>
                        <span className="text-xl text-[#1267c9] transition group-open:rotate-45">+</span>
                      </summary>
                      <div className="border-t-2 border-[#e5edf4] bg-[#f8fbfd] p-4 pl-17 text-[#163e6b]">
                        <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-[#159447]">
                          {l.answer}
                        </p>
                        <MarkdownBody value={question.answer} />
                      </div>
                    </details>
                  ))}
                </div>
              </section>

              <nav className="flex items-center gap-3 border-t-2 border-[#dce6ee] pt-5">
                <button
                  type="button"
                  disabled={activeIndex <= 0}
                  onClick={() => move(-1)}
                  className="rounded-xl border-2 border-[#1267c9] px-4 py-2.5 font-black text-[#1267c9] disabled:opacity-30"
                >
                  {l.previous}
                </button>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#dce6ee]">
                  <div
                    className="h-full rounded-full bg-[#159447] transition-all"
                    style={{ width: `${((activeIndex + 1) / guide.skills.length) * 100}%` }}
                  />
                </div>
                <button
                  type="button"
                  disabled={activeIndex >= guide.skills.length - 1}
                  onClick={() => move(1)}
                  className="rounded-xl bg-[#1267c9] px-4 py-2.5 font-black text-white shadow-[0_4px_0_#082d63] disabled:opacity-30"
                >
                  {l.next}
                </button>
              </nav>
            </div>
          </article>
        </div>

        <p className="mt-4 text-center text-xs font-semibold text-[#9fc4e8]">
          {l.footer(guide.skills.length, guide.questionCount)}
        </p>
      </div>
    </main>
  );
}

// English / Roman Urdu switch; the pill slides to the chosen side.
function LanguageToggle({ language }: { language: GuideLanguage }) {
  const options: { value: GuideLanguage; label: string }[] = [
    { value: "en", label: "English" },
    { value: "ur", label: "Roman Urdu" },
  ];
  const isUr = language === "ur";

  return (
    <div
      role="radiogroup"
      aria-label="Notebook language"
      className="relative inline-grid grid-cols-2 rounded-full border-2 border-white/40 bg-white/10 p-1"
    >
      <span
        aria-hidden
        className="absolute bottom-1 top-1 rounded-full bg-[#ffd65a] transition-all duration-300 ease-out"
        style={{ left: isUr ? "50%" : "0.25rem", right: isUr ? "0.25rem" : "50%" }}
      />
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={language === option.value}
          onClick={() => writeLanguage(option.value)}
          className={`relative z-10 rounded-full px-3 py-1.5 text-xs font-black transition-colors duration-300 ${language === option.value ? "text-[#082d63]" : "text-white"}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function SectionCard({ section }: { section: SkillSection }) {
  const style = sectionStyles[section.title] ?? {
    icon: "📌",
    color: "#1267c9",
    soft: "#e5f6ff",
  };
  const wide = section.title === "Code" || section.title === "LedgerLite truth table";

  return (
    <section
      className={`overflow-hidden rounded-2xl border-2 bg-white ${wide ? "xl:col-span-2" : ""}`}
      style={{ borderColor: style.color }}
    >
      <h3
        className="flex items-center gap-2 border-b-2 px-4 py-3 text-lg font-black text-[#082d63]"
        style={{ backgroundColor: style.soft, borderColor: style.color }}
      >
        <span>{style.icon}</span>
        {section.title}
      </h3>
      <div className="p-4 leading-7 text-[#163e6b]">
        <MarkdownBody value={section.body} />
      </div>
    </section>
  );
}

function MarkdownBody({ value }: { value: string }) {
  const parts = value.split(/(```[\s\S]*?```)/g).filter(Boolean);

  return (
    <div className="space-y-3">
      {parts.map((part, index) => {
        if (part.startsWith("```")) {
          const match = part.match(/^```([^\r\n]*)\r?\n([\s\S]*?)```$/);
          const language = match?.[1]?.trim();
          const code = match?.[2]?.replace(/\s+$/, "") ?? part;

          return (
            <div key={index} className="overflow-hidden rounded-xl bg-[#071a30] shadow-inner">
              {language && (
                <p className="border-b border-white/10 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-[#8fc8ff]">
                  {language}
                </p>
              )}
              <pre className="overflow-x-auto p-4 text-sm leading-6 text-[#e7f4ff]">
                <code>{code}</code>
              </pre>
            </div>
          );
        }

        return <TextBlocks key={index} value={part} />;
      })}
    </div>
  );
}

function TextBlocks({ value }: { value: string }) {
  const lines = value.split(/\r?\n/);
  const blocks: React.ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) {
      index += 1;
      continue;
    }

    if (line.startsWith("|")) {
      const tableLines: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith("|")) {
        tableLines.push(lines[index].trim());
        index += 1;
      }
      const rows = tableLines
        .filter((row) => !/^\|?[\s:|-]+\|?$/.test(row))
        .map((row) =>
          row
            .replace(/^\||\|$/g, "")
            .split("|")
            .map((cell) => cell.trim()),
        );

      blocks.push(
        <div key={`table-${index}`} className="overflow-x-auto rounded-xl border border-[#cbd9e6]">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-[#e5f6ff] text-[#082d63]">
              <tr>
                {rows[0]?.map((cell, cellIndex) => (
                  <th key={cellIndex} className="border-b border-[#cbd9e6] px-3 py-2 font-black">
                    <InlineText value={cell} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(1).map((row, rowIndex) => (
                <tr key={rowIndex} className="odd:bg-white even:bg-[#f8fbfd]">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="border-b border-[#e5edf4] px-3 py-2 align-top">
                      <InlineText value={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith("- ")) {
        items.push(lines[index].trim().slice(2));
        index += 1;
      }
      blocks.push(
        <ul key={`list-${index}`} className="space-y-1.5 pl-1">
          {items.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="font-black text-[#159447]">✓</span>
              <span><InlineText value={item} /></span>
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    if (line.startsWith(">")) {
      const quote: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith(">")) {
        quote.push(lines[index].trim().replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push(
        <blockquote key={`quote-${index}`} className="border-l-4 border-[#ffd65a] bg-[#fff9df] px-4 py-3 font-semibold text-[#082d63]">
          <InlineText value={quote.join(" ")} />
        </blockquote>,
      );
      continue;
    }

    const paragraph: string[] = [line];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !lines[index].trim().startsWith("|") &&
      !lines[index].trim().startsWith("- ") &&
      !lines[index].trim().startsWith(">")
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push(
      <p key={`paragraph-${index}`}>
        <InlineText value={paragraph.join(" ")} />
      </p>,
    );
  }

  return blocks;
}

function InlineText({ value }: { value: string }) {
  const parts = value.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={index}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code key={index} className="rounded bg-[#e8eff5] px-1.5 py-0.5 font-mono text-[0.9em] font-bold text-[#7d1730]">
              {part.slice(1, -1)}
            </code>
          );
        }
        return <Fragment key={index}>{part}</Fragment>;
      })}
    </>
  );
}
