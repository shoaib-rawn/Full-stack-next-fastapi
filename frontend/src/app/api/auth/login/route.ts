import { NextRequest, NextResponse } from "next/server";

import { BffTrace } from "@/lib/bff-trace";

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  expires_in: number;
};

const apiUrl = process.env.API_URL ?? "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  const trace = new BffTrace();
  const credentials = await request.json();

  const backendResponse = await trace.callApi(`${apiUrl}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
    cache: "no-store",
  });

  const data = await backendResponse.json();

  if (!backendResponse.ok) {
    return trace.attach(
      NextResponse.json(data, {
        status: backendResponse.status,
      }),
    );
  }

  const tokens = data as TokenResponse;

  const response = NextResponse.json({
    message: "Login successful.",
  });

  response.cookies.set("access_token", tokens.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: tokens.expires_in,
    path: "/",
  });

  response.cookies.set("refresh_token", tokens.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });

  trace.cookies("set");

  return trace.attach(response);
}
