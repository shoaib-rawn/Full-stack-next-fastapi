import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { BffTrace } from "@/lib/bff-trace";

const apiUrl = process.env.API_URL ?? "http://127.0.0.1:8000";

async function forward(request: NextRequest, method: "GET" | "PATCH") {
  const trace = new BffTrace();
  const token = (await cookies()).get("access_token")?.value;

  if (!token) return trace.stop({ detail: "Authentication required." }, 401);

  const response = await trace.callApi(`${apiUrl}/organizations/current`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(method === "PATCH" ? { "Content-Type": "application/json" } : {}),
    },
    body: method === "PATCH" ? JSON.stringify(await request.json()) : undefined,
    cache: "no-store",
  });

  return trace.attach(
    NextResponse.json(await response.json(), { status: response.status }),
  );
}

export async function GET(request: NextRequest) {
  return forward(request, "GET");
}

export async function PATCH(request: NextRequest) {
  return forward(request, "PATCH");
}
