import type { Tenant } from "@foyer/types";
import type { SplitPreview } from "@foyer/types";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { inlineError } from "../../lib/ui-classes.ts";
import {
  areCustomPercentagesValid,
  SmartPercentageInputs,
} from "../forms/SmartPercentageInputs.tsx";
import { MemberSelectorChips } from "./MemberSelectorChips.tsx";
import { SplitModeToggle } from "./SplitModeToggle.tsx";
import { SplitPreviewCard } from "./SplitPreviewCard.tsx";

interface ExpenseParticipantSplitsProps {
  tenants: Tenant[];
  selectedParticipantIds: string[];
  onToggleParticipant: (tenantId: string) => void;
  useAutoSplit: boolean;
  onUseAutoSplitChange: (value: boolean) => void;
  autoPreview: SplitPreview[];
  expenseAmount: number;
  customPercentageValues: Record<string, number>;
  onCustomPercentagesChange: (values: Record<string, number>) => void;
  splitsError?: string;
}

export function ExpenseParticipantSplits({
  tenants,
  selectedParticipantIds,
  onToggleParticipant,
  useAutoSplit,
  onUseAutoSplitChange,
  autoPreview,
  expenseAmount,
  customPercentageValues,
  onCustomPercentagesChange,
  splitsError,
}: ExpenseParticipantSplitsProps) {
  const { t } = useTranslation("common");
  const selectedSet = new Set(selectedParticipantIds);
  const selectedTenants = useMemo(
    () => tenants.filter((tenant) => selectedSet.has(tenant.id)),
    [tenants, selectedParticipantIds],
  );
  const excludedTenants = useMemo(
    () => tenants.filter((tenant) => !selectedSet.has(tenant.id)),
    [tenants, selectedParticipantIds],
  );

  const tenantItems = useMemo(
    () => selectedTenants.map((tenant) => ({ id: tenant.id, label: tenant.name })),
    [selectedTenants],
  );
  const selectedTenantIds = useMemo(
    () => selectedTenants.map((tenant) => tenant.id),
    [selectedTenants],
  );

  const customValid = areCustomPercentagesValid(customPercentageValues, selectedTenantIds);

  return (
    <div className="space-y-4">
      <MemberSelectorChips
        tenants={tenants}
        selectedIds={selectedParticipantIds}
        onToggle={onToggleParticipant}
      />

      <div className="space-y-2">
        <p className="text-sm font-medium text-stone-700">{t("split")}</p>
        <SplitModeToggle useAutoSplit={useAutoSplit} onChange={onUseAutoSplitChange} />
      </div>

      {useAutoSplit ? (
        <SplitPreviewCard
          activePreview={autoPreview}
          excludedTenants={excludedTenants}
          expenseAmount={expenseAmount}
        />
      ) : (
        <div className="space-y-2 rounded-lg border border-border bg-bg p-3">
          {splitsError && <p className={inlineError}>{splitsError}</p>}
          {!customValid && selectedTenants.length > 0 && (
            <p className="text-sm text-stone-500">{t("percentagesMustSum100")}</p>
          )}
          <SmartPercentageInputs
            items={tenantItems}
            values={customPercentageValues}
            onChange={onCustomPercentagesChange}
          />
        </div>
      )}
    </div>
  );
}

export function isCustomSplitValid(
  useAutoSplit: boolean,
  customPercentageValues: Record<string, number>,
  selectedTenantIds: string[],
): boolean {
  if (useAutoSplit) {
    return true;
  }
  return areCustomPercentagesValid(customPercentageValues, selectedTenantIds);
}
