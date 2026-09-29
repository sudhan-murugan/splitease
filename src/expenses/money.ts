// Money helpers. All arithmetic is done in integer cents so that sums are
// exact; values are converted to/from 2-decimal strings only at the edges.

// Accepts a 2-decimal amount (API number or pg numeric string) → cents
export function toCents(value: number | string): number {
  return Math.round(Number(value) * 100);
}

// cents → "123.45" / "-0.50", the format used in the DB and API responses
export function formatCents(cents: number): string {
  const abs = Math.abs(cents);
  const sign = cents < 0 ? '-' : '';
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
}

// Splits totalCents into `parts` shares that differ by at most one cent and
// sum exactly to the total. The first (total % parts) shares get the extra cent.
export function splitEqually(totalCents: number, parts: number): number[] {
  const base = Math.floor(totalCents / parts);
  const remainder = totalCents % parts;
  return Array.from(
    { length: parts },
    (_, i) => base + (i < remainder ? 1 : 0),
  );
}
