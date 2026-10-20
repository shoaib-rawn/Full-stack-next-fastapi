import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { BffTrace } from "@/lib/bff-trace";

const apiUrl = process.env.API_URL ?? "http://127.0.0.1:8000";

async function getAccessToken() {
  const cookieStore = await cookies();

  return cookieStore.get("access_token")?.value;
}

export async function GET(request: NextRequest) {
  const trace = new BffTrace();
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return trace.stop({ detail: "Authentication required." }, 401);
  }

  const query = request.nextUrl.search;

  const backendResponse = await trace.callApi(`${apiUrl}/customers${query}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const data = await backendResponse.json();

  return trace.attach(
    NextResponse.json(data, {
      status: backendResponse.status,
    }),
  );
}

export async function POST(request: NextRequest) {
  const trace = new BffTrace();
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return trace.stop({ detail: "Authentication required." }, 401);
  }

  const payload = await request.json();

  const backendResponse = await trace.callApi(`${apiUrl}/customers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = await backendResponse.json();

  return trace.attach(
    NextResponse.json(data, {
      status: backendResponse.status,
    }),
  );
}
