import type { Metadata } from "next";

import { hasEnglishGuide, readSkillGuide } from "@/features/notebook/skill-guide-parser";
import { SkillNotebook } from "@/features/notebook/skill-notebook";

export const metadata: Metadata = {
  title: "LedgerLite Notebook",
  description:
    "Every skill used in LedgerLite with interview questions, read from one master guide.",
};

// Public page: reachable from the sign-in screen without logging in. The
// guide is parsed on the server from docs/ledgerlite-skill-wise-interview-guide.md
// (Roman Urdu master). The .en.md translation is served from /notebook/guide-en
// and loaded only when a reader switches to English.
export default function NotebookPage() {
  return <SkillNotebook guide={readSkillGuide("ur")} hasEnglish={hasEnglishGuide()} />;
}
