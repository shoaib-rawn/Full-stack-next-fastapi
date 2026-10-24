"use client";

import { useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import { ApiError } from "@/lib/api-error";

type QueryProviderProps = {
  children: React.ReactNode;
};

export function QueryProvider({
  children,
}: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            // A 4xx answer (not found, forbidden, invalid) will not change on
            // a second try; retry once only for network errors and 5xx.
            retry: (failureCount, error) => {
              const status =
                error instanceof ApiError ? error.status : undefined;

              if (status !== undefined && status < 500) return false;

              return failureCount < 1;
            },
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}