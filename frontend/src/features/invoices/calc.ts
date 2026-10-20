// Display-only estimate for the form. The backend recalculates every amount
// with Decimal (round half up), so this can differ by a cent in rare cases.
// Only the server's values are ever shown after saving.

type PreviewLine = { quantity: string; unitPrice: string };

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function previewTotals(lines: PreviewLine[], taxRate: string) {
  const lineTotals = lines.map((line) => {
    const quantity = Number(line.quantity);
    const unitPrice = Number(line.unitPrice);

    if (!Number.isFinite(quantity) || !Number.isFinite(unitPrice)) return 0;

    return round2(quantity * unitPrice);
  });

  const subtotal = round2(lineTotals.reduce((sum, value) => sum + value, 0));
  const rate = Number(taxRate);
  const tax = Number.isFinite(rate) ? round2((subtotal * rate) / 100) : 0;

  return { lineTotals, subtotal, tax, total: round2(subtotal + tax) };
}
