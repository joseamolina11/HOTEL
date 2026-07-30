export function parseLocalDate(dateStr: string): Date {
  const clean = dateStr.slice(0, 10);
  const [y, m, d] = clean.split('-').map(Number);
  return new Date(y, m - 1, d);
}
