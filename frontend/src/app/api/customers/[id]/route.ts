import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { backendJson, BffTrace } from "@/lib/bff-trace";

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

  const response = await trace.callApi(`${apiUrl}/customers/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  const data = await backendJson(response);

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
  const payload = await request.text();

  const response = await trace.callApi(`${apiUrl}/customers/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: payload,
    cache: "no-store",
  });

  const data = await backendJson(response);

  return trace.attach(
    NextResponse.json(data, {
      status: response.status,
    }),
  );
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const trace = new BffTrace();
  const token = await getAccessToken();

  if (!token) return unauthorized(trace);

  const { id } = await context.params;

  const response = await trace.callApi(`${apiUrl}/customers/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (response.status === 204) {
    return trace.attach(
      new NextResponse(null, {
        status: 204,
      }),
    );
  }

  const data = await backendJson(response);

  return trace.attach(
    NextResponse.json(data, {
      status: response.status,
    }),
  );
}
