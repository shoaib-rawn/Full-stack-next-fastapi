import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { BffTrace } from "@/lib/bff-trace";

const apiUrl = process.env.API_URL ?? "http://127.0.0.1:8000";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: NextRequest, context: RouteContext) {
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
    },
    cache: "no-store",
  });

  const data = await response.json();

  return trace.attach(
    NextResponse.json(data, {
      status: response.status,
    }),
  );
}
