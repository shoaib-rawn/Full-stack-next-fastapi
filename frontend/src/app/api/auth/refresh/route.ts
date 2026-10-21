import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { backendJson, BffTrace } from "@/lib/bff-trace";

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  expires_in: number;
};

const apiUrl = process.env.API_URL ?? "http://127.0.0.1:8000";

export async function POST() {
  const trace = new BffTrace();
  const cookieStore = await cookies();

  const refreshToken = cookieStore.get("refresh_token")?.value;

  if (!refreshToken) {
    return trace.stop({ detail: "Refresh token is missing." }, 401);
  }

  const backendResponse = await trace.callApi(`${apiUrl}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refresh_token: refreshToken,
    }),
    cache: "no-store",
  });

  const data = await backendJson(backendResponse);

  if (!backendResponse.ok) {
    const response = NextResponse.json(data, {
      status: backendResponse.status,
    });

    response.cookies.delete("access_token");
    response.cookies.delete("refresh_token");
    trace.cookies("cleared");

    return trace.attach(response);
  }

  const tokens = data as TokenResponse;

  const response = NextResponse.json({
    message: "Session refreshed.",
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
