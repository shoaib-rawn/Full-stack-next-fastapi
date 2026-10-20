import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { BffTrace } from "@/lib/bff-trace";

const apiUrl =
  process.env.API_URL ?? "http://127.0.0.1:8000";

export async function POST() {
  const trace = new BffTrace();
  const cookieStore = await cookies();

  const accessToken =
    cookieStore.get("access_token")?.value;

  const refreshToken =
    cookieStore.get("refresh_token")?.value;

  if (!accessToken || !refreshToken) {
    const response = NextResponse.json({
      message: "Already logged out.",
    });

    response.cookies.delete("access_token");
    response.cookies.delete("refresh_token");

    trace.cookies("cleared");

    return trace.attach(response);
  }

  const backendResponse = await trace.callApi(
    `${apiUrl}/auth/logout`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
      cache: "no-store",
    },
  );

  if (!backendResponse.ok) {
    const error = await backendResponse.json();

    return trace.attach(
      NextResponse.json(error, {
        status: backendResponse.status,
      }),
    );
  }

  const response = NextResponse.json({
    message: "Logged out successfully.",
  });

  response.cookies.delete("access_token");
  response.cookies.delete("refresh_token");

  trace.cookies("cleared");

  return trace.attach(response);
}
