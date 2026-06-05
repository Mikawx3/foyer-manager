import type { WizardState } from "../../lib/household-wizard-types.ts";
import { isValidRecurringDraft, settlementPeriodLabel } from "../../lib/household-wizard-types.ts";
import { formatCurrency } from "../../lib/format.ts";
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
  const filledMembers = state.members.filter((member) => member.name.trim().length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-stone-900">
          Review your household
        </h2>
        <p className="mt-1 text-sm text-stone-600">Everything look good? Create your household.</p>
      </div>

      <div className={`${card} space-y-4`}>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">Household</p>
          <p className="mt-1 font-semibold text-stone-900">{state.name}</p>
          <p className="text-sm text-stone-600 capitalize">{state.type}</p>
        </div>

        {state.type === "shared" && filledMembers.length > 0 && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">Members</p>
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
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">Split</p>
            <p className="mt-1 text-sm text-stone-800 capitalize">
              {state.splitMode === "equal" ? "Equal split" : "Custom split"}
            </p>
          </div>
        )}

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
            Recurring expenses
          </p>
          {state.recurring.filter(isValidRecurringDraft).length === 0 ? (
            <p className="mt-1 text-sm text-stone-600">None</p>
          ) : (
            <ul className="mt-2 space-y-1">
              {state.recurring.filter(isValidRecurringDraft).map((item) => (
                <li key={item.tempId} className="flex justify-between gap-4 text-sm">
                  <span className="text-stone-800">
                    {item.title || "Untitled"}
                    <span className="text-stone-500"> · {item.categoryName}</span>
                  </span>
                  <span className={amount}>
                    {Number.isNaN(item.amount) ? "—" : formatCurrency(item.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
            Balance period
          </p>
          <p className="mt-1 text-sm text-stone-800">
            {settlementPeriodLabel(state.settlementPeriod)}
          </p>
        </div>
      </div>

      {error && <p className="text-sm text-negative">{error}</p>}

      <div className="flex flex-wrap items-center gap-4">
        <button type="button" className={btnPrimary} disabled={isPending} onClick={onCreate}>
          {isPending ? "Creating…" : "Create household"}
        </button>
        <button type="button" className={btnSecondary} disabled={isPending} onClick={onBackToEdit}>
          ← Back to edit
        </button>
      </div>
    </div>
  );
}
