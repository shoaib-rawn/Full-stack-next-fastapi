const formatters = new Map<string, Intl.NumberFormat>();

function formatterFor(currency: string) {
  let formatter = formatters.get(currency);

  if (!formatter) {
    formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      // Always show cents (PKR would otherwise round to whole rupees).
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    formatters.set(currency, formatter);
  }

  return formatter;
}

// Display only. The backend sends money as decimal strings ("28.60");
// totals are never calculated from these formatted values.
export function formatMoney(value: string | number, currency: string): string {
  const amount = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(amount)) return "—";

  try {
    return formatterFor(currency).format(amount);
  } catch {
    // Unknown currency code: show the plain number with its code.
    return `${amount.toFixed(2)} ${currency}`;
  }
}
