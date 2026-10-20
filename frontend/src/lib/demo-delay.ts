// Learning mode is opt-in. Production builds stay fast unless the public
// build-time flag is explicitly enabled.
export const LEARNING_MODE =
  process.env.NEXT_PUBLIC_LEARNING_MODE === "true";
export const REQUEST_DEMO_MS = LEARNING_MODE ? 5000 : 0;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Runs the real request in parallel with the timer, so a slow request is not
// delayed further and a failed one still waits for the animation to finish.
export async function withMinDuration<T>(
  request: Promise<T>,
  ms = REQUEST_DEMO_MS,
): Promise<T> {
  const [result] = await Promise.allSettled([request, wait(ms)]);

  if (result.status === "rejected") {
    throw result.reason;
  }

  return result.value;
}
