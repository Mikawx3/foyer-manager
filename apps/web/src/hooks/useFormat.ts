import { useTranslation } from "react-i18next";
import { formatCurrency, formatDate, formatSignedCurrency } from "../lib/format.ts";
import { toIntlLocale } from "../lib/locale.ts";

export function useFormat() {
  const { i18n } = useTranslation();
  const locale = toIntlLocale(i18n.language);

  return {
    locale,
    formatCurrency: (amount: number) => formatCurrency(amount, locale),
    formatDate: (date: string | Date) => formatDate(date, locale),
    formatSignedCurrency: (amount: number) => formatSignedCurrency(amount, locale),
  };
}
