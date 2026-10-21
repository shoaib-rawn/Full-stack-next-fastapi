import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { backendJson, BffTrace } from "@/lib/bff-trace";

const apiUrl = process.env.API_URL ?? "http://127.0.0.1:8000";
type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const trace = new BffTrace();
  const token = (await cookies()).get("access_token")?.value;
  if (!token) return trace.stop({ detail: "Authentication required." }, 401);

  const { id } = await context.params;
  const response = await trace.callApi(`${apiUrl}/payments/${id}/reverse`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: await request.text(),
    cache: "no-store",
  });
  return trace.attach(NextResponse.json(await backendJson(response), { status: response.status }));
}
