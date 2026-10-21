import { NextRequest, NextResponse } from "next/server";

import { backendJson, BffTrace } from "@/lib/bff-trace";

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  expires_in: number;
};

const apiUrl = process.env.API_URL ?? "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  const trace = new BffTrace();
  const contentType = request.headers.get("content-type") ?? "";
  const nativeForm =
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data");
  const credentials = nativeForm
    ? JSON.stringify(Object.fromEntries(await request.formData()))
    : await request.text();

  const backendResponse = await trace.callApi(`${apiUrl}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: credentials,
    cache: "no-store",
  });

  const data = await backendJson(backendResponse);

  if (!backendResponse.ok) {
    if (nativeForm) {
      const response = NextResponse.redirect(
        new URL("/login?reason=invalid-credentials", request.url),
        303,
      );
      response.headers.set("Cache-Control", "no-store");
      return trace.attach(response);
    }

    const response = NextResponse.json(data, {
      status: backendResponse.status,
    });
    response.headers.set("Cache-Control", "no-store");
    // Rate-limited (429): tell the browser how long to wait.
    const retryAfter = backendResponse.headers.get("retry-after");
    if (retryAfter) response.headers.set("Retry-After", retryAfter);
    return trace.attach(
      response,
    );
  }

  const tokens = data as TokenResponse;

  const response = nativeForm
    ? NextResponse.redirect(new URL("/dashboard", request.url), 303)
    : NextResponse.json({ message: "Login successful." });

  response.headers.set("Cache-Control", "no-store");

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
