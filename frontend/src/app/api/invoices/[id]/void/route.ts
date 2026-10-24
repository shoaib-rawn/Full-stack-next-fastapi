import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { backendJson, BffTrace } from "@/lib/bff-trace";

const apiUrl = process.env.API_URL ?? "http://127.0.0.1:8000";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const trace = new BffTrace();
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return trace.stop({ detail: "Authentication required." }, 401);
  }

  const { id } = await context.params;

  const response = await trace.callApi(`${apiUrl}/invoices/${id}/void`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    // The backend requires a reason and records who voided it and when.
    body: await request.text(),
    cache: "no-store",
  });

  const data = await backendJson(response);

  return trace.attach(
    NextResponse.json(data, {
      status: response.status,
    }),
  );
}
