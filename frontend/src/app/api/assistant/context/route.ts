import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const apiUrl = process.env.API_URL ?? "http://127.0.0.1:8000";

export async function GET() {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) {
    return NextResponse.json({ detail: "Sign in to use LedgerBot." }, { status: 401 });
  }

  try {
    const response = await fetch(`${apiUrl}/invoices?page=1&size=5`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      return NextResponse.json(
        { detail: response.status === 401 ? "Session expired. Please sign in again." : "Could not load your invoices." },
        { status: response.status === 401 ? 401 : 502 },
      );
    }
    const data = await response.json() as { total?: number; items?: unknown[] };
    return NextResponse.json(
      { invoiceCount: data.total ?? 0, recentInvoiceCount: data.items?.length ?? 0 },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ detail: "LedgerBot cannot reach the API right now." }, { status: 503 });
  }
}
