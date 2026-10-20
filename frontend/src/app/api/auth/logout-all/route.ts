import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { BffTrace } from "@/lib/bff-trace";

const apiUrl = process.env.API_URL ?? "http://127.0.0.1:8000";

export async function POST() {
  const trace = new BffTrace();
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    const response = NextResponse.json({ message: "Already logged out." });
    response.cookies.delete("access_token");
    response.cookies.delete("refresh_token");
    return trace.attach(response);
  }

  const backendResponse = await trace.callApi(`${apiUrl}/auth/logout-all`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!backendResponse.ok) {
    return trace.attach(
      NextResponse.json(await backendResponse.json(), {
        status: backendResponse.status,
      }),
    );
  }

  const response = NextResponse.json({ message: "All sessions logged out." });
  response.cookies.delete("access_token");
  response.cookies.delete("refresh_token");
  trace.cookies("cleared");
  return trace.attach(response);
}
