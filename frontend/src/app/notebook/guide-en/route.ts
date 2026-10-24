import { hasEnglishGuide, readSkillGuide } from "@/features/notebook/skill-guide-parser";

// The English notebook, loaded only when a reader picks English. Keeping it
// out of the page halves what a phone has to download and parse on first load.
export async function GET() {
  if (!hasEnglishGuide()) {
    return Response.json({ detail: "English guide not found." }, { status: 404 });
  }

  return Response.json(readSkillGuide("en"), {
    headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
  });
}
