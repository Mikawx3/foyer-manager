import type { TenantBalance } from "@foyer/types";
import { useTranslation } from "react-i18next";
import { useFormat } from "../../hooks/useFormat.ts";
import type { SuggestedSettlement } from "../../lib/suggested-settlements.ts";
import { btnPrimary, card } from "../../lib/ui-classes.ts";

interface BalanceHeadlineProps {
  balances: TenantBalance[];
  suggestions: SuggestedSettlement[];
  tenantNameById: Map<string, string>;
  onSettle: (
    fromTenantId: string,
    toTenantId: string,
    fromName: string,
    toName: string,
    amount: number,
  ) => void;
}

export function BalanceHeadline({
  balances,
  suggestions,
  tenantNameById,
  onSettle,
}: BalanceHeadlineProps) {
  const { t } = useTranslation("balances");
  const { t: tCommon } = useTranslation("common");
  const { formatCurrency } = useFormat();

  const nameOf = (tenantId: string): string => {
    const fromBalance = balances.find((row) => row.tenantId === tenantId)?.tenantName;
    return fromBalance || tenantNameById.get(tenantId) || tenantId;
  };

  const totalPersonal = balances.reduce((sum, row) => sum + row.personalShare, 0);

  if (suggestions.length === 0) {
    return (
      <section className={card}>
        <p className="text-lg font-semibold text-stone-900 md:text-xl">
          {t("summaryAllSettled")}
        </p>
        <p className="mt-1 text-sm text-stone-600">{t("summaryAllSettledHint")}</p>
      </section>
    );
  }

  const single = suggestions.length === 1 ? suggestions[0] : undefined;

  if (!single) {
    return (
      <section className={card}>
        <p className="text-lg font-semibold text-stone-900 md:text-xl">
          {t("summaryMultiple", { count: suggestions.length })}
        </p>
        <p className="mt-1 text-sm text-stone-600">{t("summaryMultipleHint")}</p>
      </section>
    );
  }

  const fromName = nameOf(single.fromTenantId);
  const toName = nameOf(single.toTenantId);

  return (
    <section className={card}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-lg font-semibold text-stone-900 md:text-xl">
            {t("summaryOwes", {
              fromName,
              toName,
              amount: formatCurrency(single.amount),
            })}
          </p>
          <p className="mt-1 text-sm text-stone-600">{t("summaryOwesHint")}</p>
          {totalPersonal > 0 && (
            <p className="mt-1 text-sm text-stone-500">
              {t("personalNote", { amount: formatCurrency(totalPersonal) })}
            </p>
          )}
        </div>
        <button
          type="button"
          className={`${btnPrimary} shrink-0`}
          onClick={() =>
            onSettle(
              single.fromTenantId,
              single.toTenantId,
              fromName,
              toName,
              single.amount,
            )
          }
        >
          {tCommon("markAsPaid")}
        </button>
      </div>
    </section>
  );
}
