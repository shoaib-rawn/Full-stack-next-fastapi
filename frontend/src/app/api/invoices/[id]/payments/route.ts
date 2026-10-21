import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { backendJson, BffTrace } from "@/lib/bff-trace";

const apiUrl = process.env.API_URL ?? "http://127.0.0.1:8000";
type RouteContext = { params: Promise<{ id: string }> };

async function forward(request: NextRequest, context: RouteContext, method: "GET" | "POST") {
  const trace = new BffTrace();
  const token = (await cookies()).get("access_token")?.value;
  if (!token) return trace.stop({ detail: "Authentication required." }, 401);

  const { id } = await context.params;
  const query = method === "GET" ? request.nextUrl.search : "";
  const response = await trace.callApi(`${apiUrl}/invoices/${id}/payments${query}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
    },
    body: method === "POST" ? await request.text() : undefined,
    cache: "no-store",
  });
  return trace.attach(NextResponse.json(await backendJson(response), { status: response.status }));
}

export async function GET(request: NextRequest, context: RouteContext) {
  return forward(request, context, "GET");
}

export async function POST(request: NextRequest, context: RouteContext) {
  return forward(request, context, "POST");
}
