import { z } from "zod";

export const CURRENCIES = ["PKR", "USD", "EUR", "GBP", "AED"] as const;

// Backend limits (app/schemas/invoice.py): quantity up to 12 digits, unit
// price up to 14 digits, tax rate up to 5 digits, all with 2 decimal places.
function amount(label: string, maxDigits: number, minimum: "positive" | "zero") {
  return z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .regex(/^\d+(\.\d{1,2})?$/, `${label} must be a number with up to 2 decimals.`)
    .refine(
      (value) => value.replace(".", "").length <= maxDigits,
      `${label} is too large.`,
    )
    .refine(
      (value) => (minimum === "positive" ? Number(value) > 0 : Number(value) >= 0),
      minimum === "positive" ? `${label} must be above 0.` : `${label} cannot be negative.`,
    );
}

export const lineItemSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, "Description is required.")
    .max(200, "Description is too long."),
  quantity: amount("Quantity", 12, "positive"),
  unitPrice: amount("Unit price", 14, "zero"),
});

export const invoiceFormSchema = z.object({
  customerId: z.string().min(1, "Choose a customer."),
  currency: z.string().regex(/^[A-Z]{3}$/, "Use a 3-letter currency code."),
  taxRate: amount("Tax rate", 5, "zero").refine(
    (value) => Number(value) <= 100,
    "Tax rate cannot be above 100.",
  ),
  dueDate: z.string(),
  notes: z.string().max(1000, "Notes can be at most 1000 characters."),
  lineItems: z
    .array(lineItemSchema)
    .min(1, "Add at least one line item.")
    .max(100, "An invoice can have at most 100 line items."),
});

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;
