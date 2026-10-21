import { NextRequest, NextResponse } from "next/server";

import { backendJson, BffTrace } from "@/lib/bff-trace";

const apiUrl = process.env.API_URL ?? "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  const trace = new BffTrace();
  const signupData = await request.text();

  const backendResponse = await trace.callApi(`${apiUrl}/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: signupData,
    cache: "no-store",
  });

  const data = await backendJson(backendResponse);

  return trace.attach(
    NextResponse.json(data, {
      status: backendResponse.status,
    }),
  );
}
