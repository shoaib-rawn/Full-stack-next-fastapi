import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { groundLedgerBotAnswer, ledgerBotInstruction } from "@/lib/assistant-grounding";

const apiUrl = process.env.API_URL ?? "http://127.0.0.1:8000";
const provider = process.env.AI_PROVIDER === "vercel" ? "vercel" : "google";
const gatewayKey = process.env.AI_GATEWAY_API_KEY || process.env.GEMINI_API_KEY;
const modelTimeoutMs = 30_000;
type ChatTurn = { role: "user" | "assistant"; text: string };

function contextualQuestion(question: string, history: ChatTurn[]): string {
  if (!history.length) return question;
  const conversation = history.map((turn) => `${turn.role === "user" ? "Visitor" : "LedgerBot"}: ${turn.text}`).join("\n");
  return `Recent conversation for context only (earlier replies may be wrong):\n${conversation}\nCurrent visitor question: ${question}`;
}

function reply(detail: string, status: number) {
  return NextResponse.json({ detail }, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function oidcToken(request: NextRequest) {
  return request.headers.get("x-vercel-oidc-token") || process.env.VERCEL_OIDC_TOKEN;
}

export function GET(request: NextRequest) {
  const available = provider === "google"
    ? Boolean(process.env.GOOGLE_GEMINI_API_KEY)
    : Boolean(oidcToken(request) || gatewayKey);
  return NextResponse.json(
    { available, provider },
    { headers: { "Cache-Control": "no-store" } },
  );
}

async function askGoogle(question: string, history: ChatTurn[]) {
  const key = process.env.GOOGLE_GEMINI_API_KEY;
  if (!key) return reply("Google AI Studio key is not configured yet.", 503);

  const model = process.env.GOOGLE_GEMINI_MODEL ?? "gemini-3.5-flash-lite";
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: ledgerBotInstruction }] },
          contents: [{ role: "user", parts: [{ text: contextualQuestion(question, history) }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 300 },
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(modelTimeoutMs),
      },
    );
    if (!response.ok) {
      const error = await response.json().catch(() => null) as { error?: { status?: unknown } } | null;
      const code = typeof error?.error?.status === "string" ? error.error.status.slice(0, 80) : "unknown";
      console.error("ledgerbot.google_rejected", { status: response.status, code });
      const details: Record<number, string> = {
        400: "Google AI rejected the model request (400).",
        401: "Google AI Studio key was rejected (401).",
        403: "Google AI access was denied (403).",
        404: "The selected Gemini model is unavailable (404).",
        429: "Google AI rate limit reached. Please try again later (429).",
      };
      return reply(details[response.status] ?? `Google AI error (${response.status}).`, response.status === 429 ? 429 : 502);
    }
    const result = await response.json() as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const answer = result.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
    if (!answer) return reply("AI returned no answer. Please try another question.", 502);
    return NextResponse.json({ answer: groundLedgerBotAnswer(question, answer) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("ledgerbot.google_request_failed", { reason: error instanceof Error ? error.name : "unknown" });
    return error instanceof Error && error.name === "TimeoutError"
      ? reply("Google AI is taking too long. Please try again.", 504)
      : reply("Could not reach Google AI right now. Please try again.", 502);
  }
}

async function askVercel(question: string, history: ChatTurn[], request: NextRequest) {
  const key = oidcToken(request) || gatewayKey;
  if (!key) return reply("Vercel AI Gateway is not configured yet.", 503);

  try {
    const response = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.AI_GATEWAY_MODEL ?? "google/gemini-3.5-flash-lite",
        messages: [
          { role: "system", content: ledgerBotInstruction },
          { role: "user", content: contextualQuestion(question, history) },
        ],
        temperature: 0.3,
        max_tokens: 300,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(modelTimeoutMs),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => null) as {
        error?: { code?: unknown; type?: unknown };
      } | null;
      const code = typeof error?.error?.code === "string" ? error.error.code.slice(0, 80) : "unknown";
      const type = typeof error?.error?.type === "string" ? error.error.type.slice(0, 80) : "unknown";
      console.error("ledgerbot.gateway_rejected", { status: response.status, code, type });
      if (type === "customer_verification_required") {
        return reply("Vercel AI Gateway needs account verification before it can answer.", 503);
      }
      const details: Record<number, string> = {
        401: "AI Gateway rejected its API key (401).",
        402: "AI Gateway has no available credits (402).",
        403: "AI Gateway access was denied (403).",
        404: "The selected AI model is unavailable (404).",
        429: "AI is busy. Please try again shortly (429).",
      };
      return reply(details[response.status] ?? `AI Gateway error (${response.status}).`, response.status === 429 ? 429 : 502);
    }
    const result = await response.json() as { choices?: { message?: { content?: string | null } }[] };
    const answer = result.choices?.[0]?.message?.content?.trim();
    if (!answer) return reply("AI returned no answer. Please try another question.", 502);
    return NextResponse.json({ answer: groundLedgerBotAnswer(question, answer) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("ledgerbot.gateway_request_failed", { reason: error instanceof Error ? error.name : "unknown" });
    return error instanceof Error && error.name === "TimeoutError"
      ? reply("AI Gateway is taking too long. Please try again.", 504)
      : reply("Could not reach AI Gateway right now. Please try again.", 502);
  }
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  const guestToken = cookieStore.get("assistant_guest")?.value;
  if (!token && !guestToken) return reply("Complete the guest form to ask LedgerBot.", 401);

  const rawBody = await request.text();
  if (rawBody.length > 4500) return reply("Question is too long.", 413);
  let question: unknown;
  let rawHistory: unknown;
  try {
    const body = JSON.parse(rawBody) as { question?: unknown; history?: unknown };
    question = body.question;
    rawHistory = body.history;
  } catch {
    return reply("Send a valid question.", 400);
  }
  if (typeof question !== "string" || question.trim().length < 2 || question.trim().length > 500) {
    return reply("Ask a question between 2 and 500 characters.", 400);
  }
  if (rawHistory !== undefined && (!Array.isArray(rawHistory) || rawHistory.length > 6 || rawHistory.some((turn) =>
    !turn || typeof turn !== "object" || !["user", "assistant"].includes(turn.role) || typeof turn.text !== "string" || turn.text.length > 500
  ))) {
    return reply("Invalid chat history.", 400);
  }
  const history = (rawHistory ?? []) as ChatTurn[];

  try {
    if (token) {
      const auth = await fetch(`${apiUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });
      if (auth.status === 401 || auth.status === 403) return reply("Session expired. Please sign in again.", 401);
      if (!auth.ok) return reply("LedgerBot cannot verify your session right now.", 503);
    } else {
      const guest = await fetch(`${apiUrl}/assistant/guest-session/consume`, {
        method: "POST",
        headers: { Authorization: `Bearer ${guestToken}` },
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });
      if (guest.status === 401) return reply("Guest session expired. Please fill in the form again.", 401);
      if (guest.status === 429) return reply("Guest chat limit reached. Please try again later.", 429);
      if (!guest.ok) return reply("LedgerBot cannot verify guest access right now.", 503);
    }
  } catch {
    return reply("LedgerBot cannot reach the API right now.", 503);
  }

  if (/^(hi|hii+|hello|hey|hlo|salam|assalam[ -]?o[ -]?alaikum)[!.? ]*$/i.test(question.trim())) {
    return NextResponse.json(
      { answer: "Hello! I can help you find your way around LedgerLite. Ask me about Dashboard, customers, invoices, payments, Team, or Settings." },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const knownAnswer = groundLedgerBotAnswer(question.trim(), "");
  if (knownAnswer) {
    return NextResponse.json({ answer: knownAnswer }, { headers: { "Cache-Control": "no-store" } });
  }

  return provider === "google" ? askGoogle(question.trim(), history) : askVercel(question.trim(), history, request);
}
