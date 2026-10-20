import { z } from "zod";

export const paymentSchema = z.object({
  amount: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, "Enter an amount with up to 2 decimals.")
    .refine((value) => Number(value) > 0, "Payment must be above 0."),
  method: z.enum(["cash", "bank_transfer", "card", "other"]),
  reference: z.string().trim().max(100, "Reference is too long."),
});

export const reversalSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, "Give a short reversal reason.")
    .max(250, "Reason is too long."),
});

export type PaymentFormValues = z.infer<typeof paymentSchema>;
export type ReversalFormValues = z.infer<typeof reversalSchema>;
