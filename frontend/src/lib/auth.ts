import { trackedFetch } from "@/lib/request-tracker";
import type { LoginFormValues, SignupFormValues } from "@/lib/validations/auth";

type LoginResponse = {
  message: string;
};

type ApiError = {
  detail?: string;
};

export async function login(values: LoginFormValues): Promise<LoginResponse> {
  const response = await trackedFetch("login", "/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(values),
  });

  const data = (await response.json()) as LoginResponse | ApiError;

  if (!response.ok) {
    throw new Error(
      "detail" in data && data.detail ? data.detail : "Login failed.",
    );
  }

  return data as LoginResponse;
}
type SignupResponse = {
  id: number;
  organization_id: number;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
};

export async function signup(
  values: SignupFormValues,
): Promise<SignupResponse> {
  const response = await trackedFetch("signup", "/api/auth/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      organization: {
        name: values.organizationName,
        slug: values.organizationSlug,
      },
      full_name: values.fullName,
      email: values.email,
      password: values.password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      typeof data.detail === "string"
        ? data.detail
        : "Could not create account.",
    );
  }

  return data as SignupResponse;
}
