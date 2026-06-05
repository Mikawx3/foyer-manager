import type { HouseholdType } from "@foyer/types";
import { X } from "lucide-react";
import {
  createMemberId,
  firstOfCurrentMonth,
  RECURRING_QUICK_ADD,
  type RecurringDraft,
  type RecurringQuickAddChip,
  type RecurringUpdater,
  type WizardMember,
} from "../../lib/household-wizard-types.ts";
import { btnSecondary } from "../../lib/ui-classes.ts";
import { FormField, inputClassName, selectClassName } from "../forms/FormField.tsx";

interface WizardStepRecurringProps {
  type: HouseholdType;
  members: WizardMember[];
  recurring: RecurringDraft[];
  error?: string;
  onRecurringChange: (updater: RecurringUpdater) => void;
  onSkip: () => void;
}

const frequencyOptions = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
] as const;

function isChipAlreadyAdded(recurring: RecurringDraft[], chip: RecurringQuickAddChip): boolean {
  if (chip.label === "Other") {
    return false;
  }
  return recurring.some((item) => item.categoryName === chip.categoryName);
}

export function WizardStepRecurring({
  type,
  members,
  recurring,
  error,
  onRecurringChange,
  onSkip,
}: WizardStepRecurringProps) {
  const filledMembers = members.filter((member) => member.name.trim().length > 0);
  const defaultPaidBy = filledMembers[0]?.tempId ?? "";

  const addFromChip = (chip: RecurringQuickAddChip) => {
    onRecurringChange((previous) => {
      if (isChipAlreadyAdded(previous, chip)) {
        return previous;
      }
      return [
        ...previous,
        {
          tempId: createMemberId(),
          title: chip.label === "Other" ? "" : chip.label,
          categoryName: chip.categoryName,
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
          Any fixed recurring expenses?
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          Add regular bills now, or skip and set them up later.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {RECURRING_QUICK_ADD.map((chip) => {
          const alreadyAdded = isChipAlreadyAdded(recurring, chip);
          return (
            <button
              key={chip.label}
              type="button"
              onClick={() => addFromChip(chip)}
              disabled={alreadyAdded}
              className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              {chip.emoji} {chip.label}
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
                aria-label="Remove recurring expense"
                onClick={() => removeItem(item.tempId)}
                className="absolute right-3 top-3 rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="Title">
                  <input
                    className={inputClassName}
                    value={item.title}
                    onChange={(event) => updateItem(item.tempId, { title: event.target.value })}
                    placeholder="Expense title"
                  />
                </FormField>
                <FormField label="Amount">
                  <input
                    className={inputClassName}
                    type="number"
                    min="0"
                    step="0.01"
                    value={Number.isNaN(item.amount) ? "" : item.amount}
                    onChange={(event) =>
                      updateItem(item.tempId, {
                        amount: event.target.value === "" ? Number.NaN : Number(event.target.value),
                      })
                    }
                    placeholder="0.00"
                  />
                </FormField>
                <FormField label="Frequency">
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
                        {option.label}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Start date">
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
                  <FormField label="Paid by">
                    <select
                      className={selectClassName}
                      value={item.paidByTempId}
                      onChange={(event) =>
                        updateItem(item.tempId, { paidByTempId: event.target.value })
                      }
                    >
                      {filledMembers.map((member) => (
                        <option key={member.tempId} value={member.tempId}>
                          {member.name || "Unnamed member"}
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
        Skip this step
      </button>
    </div>
  );
}
