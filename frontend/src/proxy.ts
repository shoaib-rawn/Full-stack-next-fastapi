import { NextRequest, NextResponse } from "next/server";

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

const apiUrl = process.env.API_URL ?? "http://127.0.0.1:8000";

export async function proxy(request: NextRequest) {
  const accessToken = request.cookies.get("access_token")?.value;

  const refreshToken = request.cookies.get("refresh_token")?.value;

  if (accessToken) {
    return NextResponse.next();
  }

  if (!refreshToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const backendResponse = await fetch(`${apiUrl}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refresh_token: refreshToken,
    }),
    cache: "no-store",
  });

  if (!backendResponse.ok) {
    const response = NextResponse.redirect(new URL("/login", request.url));

    response.cookies.delete("access_token");
    response.cookies.delete("refresh_token");

    return response;
  }

  const tokens = (await backendResponse.json()) as TokenResponse;

  const response = NextResponse.redirect(request.url);

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

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/customers/:path*",
    "/invoices/:path*",
    "/team/:path*",
    "/settings/:path*",
    "/journey/:path*",
  ],
};
