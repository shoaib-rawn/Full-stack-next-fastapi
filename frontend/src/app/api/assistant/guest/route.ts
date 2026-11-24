import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const apiUrl = process.env.API_URL ?? "http://127.0.0.1:8000";

function json(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET() {
  const cookieStore = await cookies();
  const access = cookieStore.get("access_token")?.value;
  if (access) {
    try {
      const response = await fetch(`${apiUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${access}` },
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });
      if (response.ok) return json({ mode: "account" });
    } catch { /* Guest session can still be checked. */ }
  }

  const guest = cookieStore.get("assistant_guest")?.value;
  if (!guest) return json({ mode: "registration" });
  try {
    const response = await fetch(`${apiUrl}/assistant/guest-session`, {
      headers: { Authorization: `Bearer ${guest}` },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (response.ok) return json({ mode: "guest" });
    if (response.status === 401) return json({ mode: "registration" });
    return json({ detail: "Could not check guest access right now." }, 503);
  } catch {
    return json({ detail: "Could not check guest access right now." }, 503);
  }
}

export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > 1500) return json({ detail: "Form is too long." }, 413);
  let input: unknown;
  try { input = JSON.parse(raw); } catch { return json({ detail: "Invalid form." }, 400); }
  if (!input || typeof input !== "object") return json({ detail: "Invalid form." }, 400);
  const values = input as Record<string, unknown>;
  const { full_name, email, phone } = values;
  if (typeof full_name !== "string" || typeof email !== "string" || typeof phone !== "string") {
    return json({ detail: "Name, email and phone are required." }, 400);
  }

  try {
    const response = await fetch(`${apiUrl}/assistant/guests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name, email, phone }),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      if (response.status === 429) return json({ detail: "Too many signups. Please try again later." }, 429);
      if (response.status === 422) return json({ detail: "Check your name, email and phone number." }, 400);
      return json({ detail: "Could not save your details right now." }, 503);
    }
    const result = await response.json() as { session_token?: string; expires_in?: number };
    if (!result.session_token) return json({ detail: "Could not start guest chat." }, 502);
    const output = json({ mode: "guest" });
    output.cookies.set("assistant_guest", result.session_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/assistant",
      maxAge: result.expires_in ?? 24 * 3600,
    });
    return output;
  } catch {
    return json({ detail: "Could not reach the guest service right now." }, 503);
  }
}
