import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { WizardProgressBar } from "../components/wizard/WizardProgressBar.tsx";
import { WizardStepBalancePeriod } from "../components/wizard/WizardStepBalancePeriod.tsx";
import { WizardStepDefaultSplit } from "../components/wizard/WizardStepDefaultSplit.tsx";
import { WizardStepNameMembers } from "../components/wizard/WizardStepNameMembers.tsx";
import { WizardStepRecurring } from "../components/wizard/WizardStepRecurring.tsx";
import { WizardStepSummary } from "../components/wizard/WizardStepSummary.tsx";
import { WizardStepType } from "../components/wizard/WizardStepType.tsx";
import { getApiErrorMessage } from "../lib/api.ts";
import {
  getNextStep,
  getPrevStep,
  initialWizardState,
  type WizardState,
} from "../lib/household-wizard-types.ts";
import { queryKeys } from "../lib/query-keys.ts";
import { equalSplitPercentages } from "../lib/split-percentages.ts";
import { isPercentageTotalComplete } from "../lib/smart-percentages.ts";
import { submitHouseholdWizard } from "../lib/submit-household-wizard.ts";
import { btnPrimary, btnSecondary } from "../lib/ui-classes.ts";

export function HouseholdWizardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [state, setState] = useState<WizardState>(initialWizardState);
  const [stepError, setStepError] = useState<string | undefined>();

  const createMutation = useMutation({
    mutationFn: submitHouseholdWizard,
    onSuccess: async (householdId) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.households });
      navigate(`/households/${householdId}/dashboard`);
    },
  });

  const patchState = (patch: Partial<WizardState>) => {
    setState((current) => ({ ...current, ...patch }));
    setStepError(undefined);
  };

  const validateStep = (): boolean => {
    switch (state.step) {
      case 1:
        if (state.type === null) {
          setStepError("Select a household type to continue.");
          return false;
        }
        return true;
      case 2: {
        if (state.name.trim().length === 0) {
          setStepError("Household name is required.");
          return false;
        }
        if (state.type === "shared") {
          const filled = state.members.filter((member) => member.name.trim().length > 0);
          if (filled.length === 0) {
            setStepError("Add at least one member with a name.");
            return false;
          }
        }
        return true;
      }
      case 3: {
        if (state.splitMode === "custom") {
          const filled = state.members.filter((member) => member.name.trim().length > 0);
          const total = filled.reduce(
            (sum, member) => sum + (state.customSplits[member.tempId] ?? 0),
            0,
          );
          if (!isPercentageTotalComplete(total)) {
            setStepError("Custom split percentages must total 100%.");
            return false;
          }
        }
        return true;
      }
      case 4: {
        for (const item of state.recurring) {
          if (item.title.trim().length === 0) {
            setStepError("Each recurring expense needs a title.");
            return false;
          }
          if (Number.isNaN(item.amount) || item.amount <= 0) {
            setStepError("Each recurring expense needs a valid amount.");
            return false;
          }
        }
        return true;
      }
      default:
        return true;
    }
  };

  const goNext = () => {
    if (!validateStep()) {
      return;
    }
    patchState({ step: getNextStep(state.step, state.type) });
  };

  const goBack = () => {
    setStepError(undefined);
    patchState({ step: getPrevStep(state.step, state.type) });
  };

  const handleTypeSelect = (type: WizardState["type"]) => {
    setStepError(undefined);
    setState((current) => ({
      ...current,
      type,
      step: getNextStep(1, type),
    }));
  };

  const handleSplitModeChange = (splitMode: WizardState["splitMode"]) => {
    if (splitMode === "custom") {
      const filled = state.members.filter((member) => member.name.trim().length > 0);
      const percentages = equalSplitPercentages(filled.length);
      const customSplits = Object.fromEntries(
        filled.map((member, index) => [member.tempId, percentages[index] ?? 0]),
      );
      patchState({ splitMode, customSplits });
      return;
    }
    patchState({ splitMode });
  };

  const submitError =
    createMutation.isError && createMutation.error !== null
      ? getApiErrorMessage(createMutation.error)
      : undefined;

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-8rem)] w-full max-w-2xl flex-col py-8">
      <WizardProgressBar step={state.step} />

      <div className="mt-10 flex-1">
        {state.step === 1 && (
          <WizardStepType value={state.type} onSelect={handleTypeSelect} />
        )}

        {state.step === 2 && state.type !== null && (
          <WizardStepNameMembers
            type={state.type}
            name={state.name}
            members={state.members}
            nameError={stepError}
            membersError={stepError}
            onNameChange={(name) => patchState({ name })}
            onMembersChange={(members) => patchState({ members })}
          />
        )}

        {state.step === 3 && state.type === "shared" && (
          <WizardStepDefaultSplit
            members={state.members}
            splitMode={state.splitMode}
            customSplits={state.customSplits}
            error={stepError}
            onSplitModeChange={handleSplitModeChange}
            onCustomSplitsChange={(customSplits) => patchState({ customSplits })}
          />
        )}

        {state.step === 4 && state.type !== null && (
          <WizardStepRecurring
            type={state.type}
            members={state.members}
            recurring={state.recurring}
            error={stepError}
            onRecurringChange={(recurring) => patchState({ recurring })}
            onSkip={() => patchState({ step: 5 })}
          />
        )}

        {state.step === 5 && (
          <WizardStepBalancePeriod
            value={state.settlementPeriod}
            onChange={(settlementPeriod) => patchState({ settlementPeriod })}
          />
        )}

        {state.step === 6 && (
          <WizardStepSummary
            state={state}
            isPending={createMutation.isPending}
            error={submitError ?? stepError}
            onCreate={() => {
              setStepError(undefined);
              createMutation.mutate(state);
            }}
            onBackToEdit={() => patchState({ step: 5 })}
          />
        )}
      </div>

      {state.step !== 1 && state.step !== 6 && (
        <footer className="mt-10 flex items-center justify-between border-t border-border pt-6">
          <button type="button" className={btnSecondary} onClick={goBack}>
            Back
          </button>
          <button type="button" className={btnPrimary} onClick={goNext}>
            Next
          </button>
        </footer>
      )}

      {state.step === 1 && (
        <footer className="mt-10 flex justify-start border-t border-border pt-6">
          <button type="button" className={btnSecondary} onClick={() => navigate("/households")}>
            Cancel
          </button>
        </footer>
      )}
    </div>
  );
}
