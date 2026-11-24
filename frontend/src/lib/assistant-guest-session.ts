import { NextResponse } from "next/server";

const apiUrl = process.env.API_URL ?? "http://127.0.0.1:8000";

export function clearGuestCookie(response: NextResponse) {
  response.cookies.set("assistant_guest", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  clearLegacyGuestCookie(response);
}

export function clearLegacyGuestCookie(response: NextResponse) {
  response.headers.append(
    "Set-Cookie",
    `assistant_guest=; Max-Age=0; Path=/api/assistant; HttpOnly; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
  );
}

export async function revokeGuestToken(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${apiUrl}/assistant/guest-session`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    return response.ok || response.status === 401;
  } catch {
    return false;
  }
}
