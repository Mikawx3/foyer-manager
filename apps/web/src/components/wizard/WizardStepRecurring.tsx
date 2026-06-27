import type { HouseholdType } from "@foyer/types";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  createMemberId,
  firstOfCurrentMonth,
  RECURRING_QUICK_ADD,
  RECURRING_QUICK_ADD_CANONICAL_CATEGORIES,
  RECURRING_QUICK_ADD_LABEL_KEYS,
  type RecurringDraft,
  type RecurringQuickAddChip,
  type RecurringUpdater,
  type WizardMember,
} from "../../lib/household-wizard-types.ts";
import { btnSecondary } from "../../lib/ui-classes.ts";
import { FormField, inputClassName, selectClassName } from "../forms/FormField.tsx";
import { CalculableAmountInput } from "../forms/CalculableAmountInput.tsx";

interface WizardStepRecurringProps {
  type: HouseholdType;
  members: WizardMember[];
  recurring: RecurringDraft[];
  error?: string;
  onRecurringChange: (updater: RecurringUpdater) => void;
  onSkip: () => void;
}

const frequencyOptions = [
  { value: "weekly", labelKey: "weekly" },
  { value: "monthly", labelKey: "monthly" },
  { value: "quarterly", labelKey: "quarterly" },
  { value: "yearly", labelKey: "yearly" },
] as const;

function isChipAlreadyAdded(recurring: RecurringDraft[], chip: RecurringQuickAddChip): boolean {
  if (chip.labelKey === "other") {
    return false;
  }
  return recurring.some(
    (item) =>
      item.categoryName === RECURRING_QUICK_ADD_CANONICAL_CATEGORIES[chip.categoryKey],
  );
}

export function WizardStepRecurring({
  type,
  members,
  recurring,
  error,
  onRecurringChange,
  onSkip,
}: WizardStepRecurringProps) {
  const { t } = useTranslation("wizard");
  const { t: tCommon } = useTranslation("common");

  const filledMembers = members.filter((member) => member.name.trim().length > 0);
  const defaultPaidBy = filledMembers[0]?.tempId ?? "";

  const addFromChip = (chip: RecurringQuickAddChip) => {
    onRecurringChange((previous) => {
      if (isChipAlreadyAdded(previous, chip)) {
        return previous;
      }
      const label = t(RECURRING_QUICK_ADD_LABEL_KEYS[chip.labelKey]);
      return [
        ...previous,
        {
          tempId: createMemberId(),
          title: chip.labelKey === "other" ? "" : label,
          categoryName: RECURRING_QUICK_ADD_CANONICAL_CATEGORIES[chip.categoryKey],
          amount: Number.NaN,
          frequency: "monthly",
          startDate: firstOfCurrentMonth(),
          paidByTempId: defaultPaidBy,
        },
      ];
    });
  };

  const updateItem = (tempId: string, patch: Partial<RecurringDraft>) => {
    onRecurringChange((previous) =>
      previous.map((item) => (item.tempId === tempId ? { ...item, ...patch } : item)),
    );
  };

  const removeItem = (tempId: string) => {
    onRecurringChange((previous) => previous.filter((item) => item.tempId !== tempId));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-stone-900">
          {t("recurringTitle")}
        </h2>
        <p className="mt-1 text-sm text-stone-600">{t("recurringSubtitle")}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {RECURRING_QUICK_ADD.map((chip) => {
          const alreadyAdded = isChipAlreadyAdded(recurring, chip);
          const label = t(RECURRING_QUICK_ADD_LABEL_KEYS[chip.labelKey]);
          return (
            <button
              key={chip.labelKey}
              type="button"
              onClick={() => addFromChip(chip)}
              disabled={alreadyAdded}
              className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              {chip.emoji} {label}
            </button>
          );
        })}
      </div>

      {recurring.length > 0 && (
        <ul className="space-y-4">
          {recurring.map((item) => (
            <li
              key={item.tempId}
              className="relative rounded-xl border border-border bg-surface p-4"
            >
              <button
                type="button"
                aria-label={t("removeRecurringExpense")}
                onClick={() => removeItem(item.tempId)}
                className="absolute right-3 top-3 rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label={tCommon("title")}>
                  <input
                    className={inputClassName}
                    value={item.title}
                    onChange={(event) => updateItem(item.tempId, { title: event.target.value })}
                    placeholder={t("recurringExpenseTitle")}
                  />
                </FormField>
                <FormField label={tCommon("amount")}>
                  <CalculableAmountInput
                    value={item.amount}
                    onChange={(nextAmount) => updateItem(item.tempId, { amount: nextAmount })}
                    placeholder={t("recurringAmountPlaceholder")}
                  />
                </FormField>
                <FormField label={tCommon("frequency")}>
                  <select
                    className={selectClassName}
                    value={item.frequency}
                    onChange={(event) =>
                      updateItem(item.tempId, {
                        frequency: event.target.value as RecurringDraft["frequency"],
                      })
                    }
                  >
                    {frequencyOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {tCommon(option.labelKey)}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label={tCommon("startDate")}>
                  <input
                    className={inputClassName}
                    type="date"
                    value={item.startDate}
                    onChange={(event) =>
                      updateItem(item.tempId, { startDate: event.target.value })
                    }
                  />
                </FormField>
                {type === "shared" && filledMembers.length > 0 && (
                  <FormField label={tCommon("paidBy")}>
                    <select
                      className={selectClassName}
                      value={item.paidByTempId}
                      onChange={(event) =>
                        updateItem(item.tempId, { paidByTempId: event.target.value })
                      }
                    >
                      {filledMembers.map((member) => (
                        <option key={member.tempId} value={member.tempId}>
                          {member.name || tCommon("unnamedMember")}
                        </option>
                      ))}
                    </select>
                  </FormField>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-sm text-negative">{error}</p>}

      <button type="button" className={btnSecondary} onClick={onSkip}>
        {t("skipThisStep")}
      </button>
    </div>
  );
}
