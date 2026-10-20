import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { BffTrace } from "@/lib/bff-trace";

const apiUrl = process.env.API_URL ?? "http://127.0.0.1:8000";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function getAccessToken() {
  const cookieStore = await cookies();

  return cookieStore.get("access_token")?.value;
}

function unauthorized(trace: BffTrace) {
  return trace.stop({ detail: "Authentication required." }, 401);
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const trace = new BffTrace();
  const token = await getAccessToken();

  if (!token) return unauthorized(trace);

  const { id } = await context.params;

  const response = await trace.callApi(`${apiUrl}/invoices/${id}`, {
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

export async function PATCH(request: NextRequest, context: RouteContext) {
  const trace = new BffTrace();
  const token = await getAccessToken();

  if (!token) return unauthorized(trace);

  const { id } = await context.params;
  const payload = await request.json();

  const response = await trace.callApi(`${apiUrl}/invoices/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = await response.json();

  return trace.attach(
    NextResponse.json(data, {
      status: response.status,
    }),
  );
}
