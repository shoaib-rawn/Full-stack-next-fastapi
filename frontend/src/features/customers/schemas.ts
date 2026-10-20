import { z } from "zod";

export const customerFormSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Customer name is required.")
    .max(100, "Customer name is too long."),

  email: z.union([z.literal(""), z.email("Enter a valid email address.")]),
});

export type CustomerFormValues = z.infer<typeof customerFormSchema>;
