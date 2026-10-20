import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

import {
  finishRun,
  flowForRequest,
  startRun,
  traceFromHeaders,
  type TrackedFlow,
} from "@/lib/request-tracker";

export const httpClient = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10_000,
});
type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

type TrackedRequestConfig = InternalAxiosRequestConfig & {
  _run?: { flow: TrackedFlow; id: number };
};

// Report each request's real lifecycle to the request animation.
httpClient.interceptors.request.use((config: TrackedRequestConfig) => {
  const flow = flowForRequest(config.method, config.url);

  if (flow) {
    config._run = { flow, id: startRun(flow) };
  }

  return config;
});

httpClient.interceptors.response.use(
  (response) => {
    const run = (response.config as TrackedRequestConfig)._run;

    if (run) {
      finishRun(run.flow, run.id, response.status, traceFromHeaders(response.headers));
    }

    return response;
  },
  (error: AxiosError) => {
    const run = (error.config as TrackedRequestConfig | undefined)?._run;

    if (run) {
      finishRun(
        run.flow,
        run.id,
        error.response?.status ?? 0,
        traceFromHeaders(error.response?.headers),
      );
    }

    return Promise.reject(error);
  },
);

// Keeps the HTTP status so callers (e.g. retry rules) can tell a
// "not found" answer apart from a network failure.
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number | undefined,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// FastAPI puts the reason in `detail` (e.g. 409 "A customer with invoices
// cannot be deleted."). Surface that instead of axios's generic
// "Request failed with status code 409".
function toApiError(error: AxiosError): ApiError {
  const status = error.response?.status;
  const detail = (error.response?.data as { detail?: unknown } | undefined)
    ?.detail;

  if (typeof detail === "string") {
    return new ApiError(detail, status);
  }

  if (status === 403) {
    return new ApiError("Only the organization owner can do this.", status);
  }

  return new ApiError(error.message, status);
}

httpClient.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    const isUnauthorized = error.response?.status === 401;

    const isRefreshRequest = originalRequest?.url?.includes("/auth/refresh");

    if (
      !isUnauthorized ||
      !originalRequest ||
      originalRequest._retry ||
      isRefreshRequest
    ) {
      return Promise.reject(toApiError(error));
    }

    originalRequest._retry = true;

    try {
      await axios.post("/api/auth/refresh");

      return httpClient(originalRequest);
    } catch (refreshError) {
      if (typeof window !== "undefined") {
        window.location.assign(
          new URL(
            "/login?reason=session-expired",
            window.location.origin,
          ).toString(),
        );
      }

      return Promise.reject(refreshError);
    }
  },
);
