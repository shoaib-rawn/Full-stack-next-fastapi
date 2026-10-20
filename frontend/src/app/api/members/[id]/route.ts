import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { BffTrace } from "@/lib/bff-trace";

const apiUrl = process.env.API_URL ?? "http://127.0.0.1:8000";
type MemberRouteContext = { params: Promise<{ id: string }> };

export async function PATCH(
  request: NextRequest,
  context: MemberRouteContext,
) {
  const trace = new BffTrace();
  const token = (await cookies()).get("access_token")?.value;

  if (!token) return trace.stop({ detail: "Authentication required." }, 401);

  const { id } = await context.params;
  const response = await trace.callApi(`${apiUrl}/members/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(await request.json()),
    cache: "no-store",
  });

  return trace.attach(
    NextResponse.json(await response.json(), { status: response.status }),
  );
}
