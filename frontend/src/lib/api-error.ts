// Kept apart from http-client so code that only checks errors (like the root
// QueryProvider) does not pull axios into every page's first load.
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number | undefined,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
