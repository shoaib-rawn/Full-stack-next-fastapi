import { NextRequest, NextResponse } from "next/server";

import { BffTrace } from "@/lib/bff-trace";

const apiUrl = process.env.API_URL ?? "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  const trace = new BffTrace();
  const signupData = await request.json();

  const backendResponse = await trace.callApi(`${apiUrl}/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(signupData),
    cache: "no-store",
  });

  const data = await backendResponse.json();

  return trace.attach(
    NextResponse.json(data, {
      status: backendResponse.status,
    }),
  );
}
