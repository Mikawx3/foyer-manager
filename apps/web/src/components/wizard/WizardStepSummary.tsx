import { useTranslation } from "react-i18next";
import { useFormat } from "../../hooks/useFormat.ts";
import type { WizardState } from "../../lib/household-wizard-types.ts";
import {
  isValidRecurringDraft,
  recurringCategoryTranslationKey,
  RECURRING_QUICK_ADD_CATEGORY_KEYS,
  settlementPeriodTranslationKey,
} from "../../lib/household-wizard-types.ts";
import { amount, btnPrimary, btnSecondary, card } from "../../lib/ui-classes.ts";

interface WizardStepSummaryProps {
  state: WizardState;
  isPending: boolean;
  error?: string;
  onCreate: () => void;
  onBackToEdit: () => void;
}

export function WizardStepSummary({
  state,
  isPending,
  error,
  onCreate,
  onBackToEdit,
}: WizardStepSummaryProps) {
  const { t } = useTranslation("wizard");
  const { t: tCommon } = useTranslation("common");
  const { formatCurrency } = useFormat();

  const filledMembers = state.members.filter((member) => member.name.trim().length > 0);

  const categoryDisplayName = (categoryName: string): string => {
    const key = recurringCategoryTranslationKey(categoryName);
    return key !== null ? t(RECURRING_QUICK_ADD_CATEGORY_KEYS[key]) : categoryName;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-stone-900">
          {t("summaryTitle")}
        </h2>
        <p className="mt-1 text-sm text-stone-600">{t("summarySubtitle")}</p>
      </div>

      <div className={`${card} space-y-4`}>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
            {t("summaryHousehold")}
          </p>
          <p className="mt-1 font-semibold text-stone-900">{state.name}</p>
          <p className="text-sm text-stone-600">
            {tCommon("householdType", {
              type: state.type === "solo" ? tCommon("solo") : tCommon("shared"),
            })}
          </p>
        </div>

        {state.type === "shared" && filledMembers.length > 0 && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
              {t("summaryMembers")}
            </p>
            <ul className="mt-2 space-y-1">
              {filledMembers.map((member) => (
                <li key={member.tempId} className="flex items-center gap-2 text-sm text-stone-800">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: member.color }}
                  />
                  {member.name}
                </li>
              ))}
            </ul>
          </div>
        )}

        {state.type === "shared" && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
              {t("summarySplit")}
            </p>
            <p className="mt-1 text-sm text-stone-800">
              {state.splitMode === "equal" ? tCommon("equalSplit") : tCommon("customSplit")}
            </p>
          </div>
        )}

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
            {t("summaryRecurringExpenses")}
          </p>
          {state.recurring.filter(isValidRecurringDraft).length === 0 ? (
            <p className="mt-1 text-sm text-stone-600">{tCommon("none")}</p>
          ) : (
            <ul className="mt-2 space-y-1">
              {state.recurring.filter(isValidRecurringDraft).map((item) => (
                <li key={item.tempId} className="flex justify-between gap-4 text-sm">
                  <span className="text-stone-800">
                    {item.title || tCommon("untitled")}
                    <span className="text-stone-500"> · {categoryDisplayName(item.categoryName)}</span>
                  </span>
                  <span className={amount}>
                    {Number.isNaN(item.amount) ? tCommon("dash") : formatCurrency(item.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
            {t("summaryBalancePeriod")}
          </p>
          <p className="mt-1 text-sm text-stone-800">
            {t(settlementPeriodTranslationKey(state.settlementPeriod))}
          </p>
        </div>
      </div>

      {error && <p className="text-sm text-negative">{error}</p>}

      <div className="flex flex-col-reverse gap-3 md:flex-row md:flex-wrap md:items-center md:gap-4">
        <button
          type="button"
          className={`${btnSecondary} w-full md:w-auto`}
          disabled={isPending}
          onClick={onBackToEdit}
        >
          {t("backToEdit")}
        </button>
        <button
          type="button"
          className={`${btnPrimary} w-full md:w-auto`}
          disabled={isPending}
          onClick={onCreate}
        >
          {isPending ? tCommon("creating") : t("createHousehold")}
        </button>
      </div>
    </div>
  );
}
