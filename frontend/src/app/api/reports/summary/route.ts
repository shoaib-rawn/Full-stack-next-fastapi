import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { backendJson, BffTrace } from "@/lib/bff-trace";

const apiUrl = process.env.API_URL ?? "http://127.0.0.1:8000";

export async function GET() {
  const trace = new BffTrace();
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    return trace.stop({ detail: "Authentication required." }, 401);
  }

  const backendResponse = await trace.callApi(`${apiUrl}/reports/summary`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const data = await backendJson(backendResponse);

  return trace.attach(
    NextResponse.json(data, { status: backendResponse.status }),
  );
}
