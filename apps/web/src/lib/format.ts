export function formatCurrency(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function formatSignedCurrency(amount: number, locale: string): string {
  const formatted = formatCurrency(Math.abs(amount), locale);
  if (amount > 0) {
    return `+${formatted}`;
  }
  if (amount < 0) {
    return `−${formatted}`;
  }
  return formatted;
}

export function formatDate(date: string | Date, locale: string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function formatMonthShort(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, { month: "short" }).format(date);
}
