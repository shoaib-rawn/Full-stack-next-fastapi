import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const apiUrl = process.env.API_URL ?? "http://127.0.0.1:8000";
const model = process.env.AI_GATEWAY_MODEL ?? "google/gemini-3.5-flash-lite";
const gatewayKey = process.env.AI_GATEWAY_API_KEY || process.env.GEMINI_API_KEY;

function reply(detail: string, status: number) {
  return NextResponse.json({ detail }, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export function GET() {
  return NextResponse.json(
    { available: Boolean(gatewayKey) },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: NextRequest) {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) return reply("Sign in to ask LedgerBot.", 401);

  const rawBody = await request.text();
  if (rawBody.length > 1200) return reply("Question is too long.", 413);

  let question: unknown;
  try {
    question = (JSON.parse(rawBody) as { question?: unknown }).question;
  } catch {
    return reply("Send a valid question.", 400);
  }
  if (typeof question !== "string" || question.trim().length < 2 || question.trim().length > 500) {
    return reply("Ask a question between 2 and 500 characters.", 400);
  }

  try {
    const auth = await fetch(`${apiUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (auth.status === 401 || auth.status === 403) return reply("Session expired. Please sign in again.", 401);
    if (!auth.ok) return reply("LedgerBot cannot verify your session right now.", 503);
  } catch {
    return reply("LedgerBot cannot reach the API right now.", 503);
  }

  const key = gatewayKey;
  if (!key) return reply("AI is not configured yet. Please try the invoice snapshot for now.", 503);

  try {
    const response = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: "You are LedgerBot, a concise help assistant for LedgerLite, a multi-tenant accounting app. Help users understand customers, invoices, payments, reports, and app navigation. Do not claim to have accessed their records. No account data is supplied. Do not invent balances or transaction results. Never ask for passwords or API keys. If asked to change records, explain the relevant screen; you cannot execute changes. Keep the answer under 120 words." },
            { role: "user", content: question.trim() },
          ],
          temperature: 0.3,
          max_tokens: 300,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(20000),
      });
    if (response.status === 429) return reply("AI is busy. Please try again shortly.", 429);
    if (!response.ok) return reply("AI could not answer right now.", 502);

    const result = await response.json() as { choices?: { message?: { content?: string | null } }[] };
    const answer = result.choices?.[0]?.message?.content?.trim();
    if (!answer) return reply("AI returned no answer. Please try another question.", 502);
    return NextResponse.json({ answer }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return reply("AI request timed out. Please try again.", 504);
  }
}
