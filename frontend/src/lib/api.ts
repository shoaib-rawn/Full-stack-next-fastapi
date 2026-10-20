type HealthResponse = {
  status: string;
  service: string;
};

type ApiHealth = {
  online: boolean;
  message: string;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export async function getApiHealth(): Promise<ApiHealth> {
  try {
    const response = await fetch(`${apiUrl}/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(2_500),
    });

    if (!response.ok) {
      return {
        online: false,
        message: `API returned ${response.status}.`,
      };
    }

    const health: HealthResponse = await response.json();

    return {
      online: health.status === "ok",
      message: `${health.service}: ${health.status}`,
    };
  } catch {
    return {
      online: false,
      message: "Start FastAPI on http://127.0.0.1:8000.",
    };
  }
}
