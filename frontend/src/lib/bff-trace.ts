import "server-only";

import { NextResponse } from "next/server";

import { TRACE_HEADER, type RequestTrace } from "@/lib/request-trace";

// FastAPI's error text, read from a copy so the route can still read the body.
// Kept short and ASCII-only because it travels in a response header.
async function errorDetail(response: Response) {
  try {
    const body = (await response.clone().json()) as { detail?: unknown };
    return typeof body.detail === "string"
      ? body.detail.replace(/[^\x20-\x7e]/g, "").slice(0, 160)
      : undefined;
  } catch {
    return undefined;
  }
}

// Records what a BFF route handler really did, then attaches it to the
// response so the browser's request animation can show real steps.
export class BffTrace {
  private readonly startedAt = performance.now();
  private trace: Omit<RequestTrace, "bffMs"> = {};

  // Calls FastAPI and records its real status and duration.
  async callApi(url: string, init: RequestInit): Promise<Response> {
    const start = performance.now();

    try {
      const response = await fetch(url, init);
      this.trace.api = {
        status: response.status,
        ms: Math.round(performance.now() - start),
        detail: response.ok ? undefined : await errorDetail(response),
      };
      return response;
    } catch {
      this.trace.api = {
        status: 0,
        ms: Math.round(performance.now() - start),
      };
      return Response.json(
        { detail: "FastAPI is not reachable." },
        { status: 502 },
      );
    }
  }

  cookies(kind: "set" | "cleared") {
    this.trace.cookies = kind;
  }

  // The BFF answers by itself without calling FastAPI.
  stop(body: unknown, status: number) {
    this.trace.bffStopped = { status };
    return this.attach(NextResponse.json(body, { status }));
  }

  attach<T extends Response>(response: T): T {
    const trace: RequestTrace = {
      ...this.trace,
      bffMs: Math.round(performance.now() - this.startedAt),
    };
    response.headers.set(TRACE_HEADER, JSON.stringify(trace));
    return response;
  }
}
