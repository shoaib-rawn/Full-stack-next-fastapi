import "server-only";

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import type {
  GuideLanguage,
  InterviewQuestion,
  InterviewSkill,
  SkillGuide,
  SkillSection,
} from "./skill-guide-types";

// Roman Urdu is the master guide; the English file is its translation.
const GUIDE_FILES: Record<GuideLanguage, string> = {
  ur: "ledgerlite-skill-wise-interview-guide.md",
  en: "ledgerlite-skill-wise-interview-guide.en.md",
};

const categoryRanges = [
  { end: 7, label: "Backend foundation" },
  { end: 15, label: "Database & accounting" },
  { end: 21, label: "Security & tenancy" },
  { end: 26, label: "Reliability & testing" },
  { end: 31, label: "Next.js architecture" },
  { end: 35, label: "Frontend state & UX" },
  { end: 39, label: "Business workflows" },
  { end: 44, label: "Quality & boundaries" },
] as const;

function categoryFor(skillNumber: number) {
  return (
    categoryRanges.find((range) => skillNumber <= range.end)?.label ??
    "Additional skills"
  );
}

function findGuide(language: GuideLanguage) {
  const candidates = [
    path.resolve(process.cwd(), "docs", GUIDE_FILES[language]),
    path.resolve(process.cwd(), "..", "docs", GUIDE_FILES[language]),
  ];

  return { candidates, matched: candidates.find((candidate) => existsSync(candidate)) };
}

function guidePath(language: GuideLanguage) {
  const { candidates, matched } = findGuide(language);

  if (!matched) {
    throw new Error(
      `Notebook master guide was not found. Checked: ${candidates.join(", ")}`,
    );
  }

  return matched;
}

function cleanBody(value: string) {
  return value.replace(/^\s+|\s+$/g, "");
}

function parseQuestions(body: string): InterviewQuestion[] {
  const matches = [
    ...body.matchAll(
      /\*\*Q(\d+)\.\s+(.+?)\*\*\s*\r?\n([\s\S]*?)(?=\r?\n\*\*Q\d+\.|$)/g,
    ),
  ];

  return matches.map((match) => ({
    number: Number(match[1]),
    question: cleanBody(match[2]),
    answer: cleanBody(match[3]),
  }));
}

function parseSections(body: string) {
  const headingPattern = /^###\s+(.+)$/gm;
  const headings = [...body.matchAll(headingPattern)];
  const sections: SkillSection[] = [];
  let questions: InterviewQuestion[] = [];

  headings.forEach((heading, index) => {
    const title = heading[1].trim();
    const start = (heading.index ?? 0) + heading[0].length;
    const end = headings[index + 1]?.index ?? body.length;
    const sectionBody = cleanBody(body.slice(start, end));

    if (title === "Interview questions") {
      questions = parseQuestions(sectionBody);
      return;
    }

    sections.push({ title, body: sectionBody });
  });

  return { sections, questions };
}

// The Roman Urdu master is required; the English translation is optional,
// so the notebook still works (without the toggle) if it is missing.
export function readSkillGuides(): { ur: SkillGuide; en?: SkillGuide } {
  return {
    ur: readSkillGuide("ur"),
    en: findGuide("en").matched ? readSkillGuide("en") : undefined,
  };
}

export function readSkillGuide(language: GuideLanguage = "ur"): SkillGuide {
  const markdown = readFileSync(guidePath(language), "utf8");
  const title =
    markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() ??
    "LedgerLite Skill-Wise Interview Guide";
  const skillPattern = /^## Skill (\d+)\s+[—-]\s+(.+)$/gm;
  const skillHeadings = [...markdown.matchAll(skillPattern)];

  const skills: InterviewSkill[] = skillHeadings.map((heading, index) => {
    const number = Number(heading[1]);
    const start = (heading.index ?? 0) + heading[0].length;
    const end = skillHeadings[index + 1]?.index ?? markdown.length;
    // Each skill ends at a `---` rule; anything after it (the next "# Part"
    // heading, or the request journeys after the last skill) is not part of it.
    const block = markdown.slice(start, end).split(/^---\s*$/m)[0];
    const { sections, questions } = parseSections(block);

    return {
      number,
      title: heading[2].trim(),
      category: categoryFor(number),
      sections,
      questions,
    };
  });

  return {
    title,
    skills,
    questionCount: skills.reduce(
      (total, skill) => total + skill.questions.length,
      0,
    ),
  };
}
