import { z } from "zod";

export const organizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Organization name is required.")
    .max(100, "Organization name is too long."),
  slug: z
    .string()
    .trim()
    .min(2, "Organization slug is required.")
    .max(100, "Organization slug is too long.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers and single hyphens.",
    ),
});

export const memberCreateSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Member name is required.")
    .max(100, "Member name is too long."),
  email: z.email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must contain at least 8 characters.")
    .max(128, "Password is too long."),
});

export type OrganizationFormValues = z.infer<typeof organizationSchema>;
export type MemberCreateValues = z.infer<typeof memberCreateSchema>;
