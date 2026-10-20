import Link from "next/link";

import { readSkillGuide } from "./skill-guide-parser";
import "./notebook.css";

// Card on the sign-in page that opens the learning notebook.
export function NotebookTeaser() {
  const guide = readSkillGuide();

  return (
    <Link
      href="/notebook"
      className="group mt-8 flex items-center gap-4 overflow-hidden rounded-2xl border-2 border-[#082d63] bg-linear-to-br from-[#082d63] to-[#1267c9] p-4 text-white shadow-[0_6px_0_#041a3a] transition hover:-translate-y-1 hover:shadow-[0_10px_0_#041a3a]"
    >
      {/* A small book whose cover swings open on hover. */}
      <span className="relative h-16 w-12 shrink-0 [perspective:400px]">
        <span className="nb-paper absolute inset-0 rounded-r-md" />
        <span className="absolute inset-0 grid origin-left place-items-center rounded-r-md border-l-4 border-[#be850b] bg-[#ffd65a] text-2xl shadow-md transition-transform duration-700 group-hover:[transform:rotateY(-70deg)]">
          📓
        </span>
      </span>

      <span className="flex-1">
        <span className="block text-xs font-black uppercase tracking-[0.2em] text-[#ffd65a]">
          Learning notebook
        </span>
        <span className="mt-0.5 block text-lg font-black">Every skill behind this app</span>
        <span className="block text-xs text-[#cceaff]">
          {guide.skills.length} skills · {guide.questionCount} interview questions
        </span>
      </span>

      <span className="text-2xl transition-transform group-hover:translate-x-1">→</span>
    </Link>
  );
}
