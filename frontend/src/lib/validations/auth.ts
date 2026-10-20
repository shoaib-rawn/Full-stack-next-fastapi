import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Password must contain at least 8 characters."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export const signupSchema = z.object({
  organizationName: z
    .string()
    .min(2, "Organization name is required.")
    .max(100, "Organization name is too long."),

  organizationSlug: z
    .string()
    .min(2, "Organization slug is required.")
    .max(100, "Organization slug is too long.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers, and hyphens.",
    ),

  fullName: z
    .string()
    .min(2, "Full name is required.")
    .max(100, "Full name is too long."),

  email: z.email("Enter a valid email address."),

  password: z
    .string()
    .min(8, "Password must contain at least 8 characters.")
    .max(128, "Password is too long."),
});

export type SignupFormValues = z.infer<typeof signupSchema>;
