import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { useDeploymentMode } from "../contexts/DeploymentModeContext.tsx";
import { WizardProgressBar } from "../components/wizard/WizardProgressBar.tsx";
import { WizardStepBalancePeriod } from "../components/wizard/WizardStepBalancePeriod.tsx";
import { WizardStepDefaultSplit } from "../components/wizard/WizardStepDefaultSplit.tsx";
import { WizardStepNameMembers } from "../components/wizard/WizardStepNameMembers.tsx";
import { WizardStepRecurring } from "../components/wizard/WizardStepRecurring.tsx";
import { WizardStepSummary } from "../components/wizard/WizardStepSummary.tsx";
import { WizardStepType } from "../components/wizard/WizardStepType.tsx";
import { getApiErrorMessage, getHousehold } from "../lib/api.ts";
import {
  applyRecurringUpdater,
  getNextStep,
  getPrevStep,
  initialWizardState,
  isValidRecurringDraft,
  reconcileCustomSplits,
  type RecurringUpdater,
  type WizardState,
} from "../lib/household-wizard-types.ts";
import { queryKeys } from "../lib/query-keys.ts";
import { equalSplitPercentages } from "../lib/split-percentages.ts";
import { isPercentageTotalComplete } from "../lib/smart-percentages.ts";
import { submitHouseholdWizard, type WizardSubmitMode } from "../lib/submit-household-wizard.ts";
import { btnPrimary, btnSecondary } from "../lib/ui-classes.ts";

interface HouseholdWizardPageProps {
  mode?: WizardSubmitMode;
}

export function HouseholdWizardPage({ mode = "create" }: HouseholdWizardPageProps) {
  const { t } = useTranslation("wizard");
  const { t: tCommon } = useTranslation("common");
  const navigate = useNavigate();
  const { id: householdId = "" } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { isLocalMode } = useDeploymentMode();
  const [state, setState] = useState<WizardState>(initialWizardState);
  const [stepError, setStepError] = useState<string | undefined>();

  const householdQuery = useQuery({
    queryKey: queryKeys.household(householdId),
    queryFn: () => getHousehold(householdId),
    enabled: mode === "setup" && Boolean(householdId),
  });

  useEffect(() => {
    if (mode === "setup" && householdQuery.data && state.name === "") {
      setState((current) => ({ ...current, name: householdQuery.data.name }));
    }
  }, [mode, householdQuery.data, state.name]);

  const createMutation = useMutation({
    mutationFn: (wizardState: WizardState) =>
      submitHouseholdWizard(wizardState, {
        mode,
        householdId: mode === "setup" ? householdId : undefined,
      }),
    onSuccess: async (resultHouseholdId) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.tenants(resultHouseholdId) });
      await queryClient.refetchQueries({ queryKey: queryKeys.tenants(resultHouseholdId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.households });
      await queryClient.invalidateQueries({ queryKey: queryKeys.household(resultHouseholdId) });
      navigate(`/households/${resultHouseholdId}/dashboard`, { replace: true });
    },
  });

  const patchState = (patch: Partial<WizardState>) => {
    setState((current) => ({ ...current, ...patch }));
    setStepError(undefined);
  };

  const changeRecurring = (updater: RecurringUpdater) => {
    setState((current) => ({
      ...current,
      recurring: applyRecurringUpdater(current.recurring, updater),
    }));
    setStepError(undefined);
  };

  const validateRecurringDrafts = (items: WizardState["recurring"]): boolean => {
    for (const item of items) {
      if (!isValidRecurringDraft(item)) {
        setStepError(t("errorRecurringDraft"));
        return false;
      }
    }
    return true;
  };

  const validateStep = (): boolean => {
    switch (state.step) {
      case 1:
        if (state.type === null) {
          setStepError(t("errorSelectType"));
          return false;
        }
        return true;
      case 2: {
        if (state.name.trim().length === 0) {
          setStepError(t("errorNameRequired"));
          return false;
        }
        if (state.type === "shared") {
          const filled = state.members.filter((member) => member.name.trim().length > 0);
          if (filled.length === 0) {
            setStepError(t("errorAddMember"));
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
            setStepError(t("errorCustomSplitTotal"));
            return false;
          }
        }
        return true;
      }
      case 4: {
        return validateRecurringDrafts(state.recurring);
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
      setState((current) => {
        const filled = current.members.filter((member) => member.name.trim().length > 0);
        const percentages = equalSplitPercentages(filled.length);
        const customSplits = Object.fromEntries(
          filled.map((member, index) => [member.tempId, percentages[index] ?? 0]),
        );
        return { ...current, splitMode, customSplits };
      });
      setStepError(undefined);
      return;
    }
    patchState({ splitMode });
  };

  const handleMembersChange = (members: WizardState["members"]) => {
    setState((current) => ({
      ...current,
      members,
      customSplits: reconcileCustomSplits(members, current.customSplits),
    }));
    setStepError(undefined);
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
            onMembersChange={handleMembersChange}
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
            onRecurringChange={changeRecurring}
            onSkip={() => patchState({ recurring: [], step: 5 })}
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
              if (!validateRecurringDrafts(state.recurring)) {
                return;
              }
              setStepError(undefined);
              createMutation.mutate(state);
            }}
            onBackToEdit={() => patchState({ step: 5 })}
          />
        )}
      </div>

      {state.step !== 1 && state.step !== 6 && (
        <footer className="mt-10 flex flex-col-reverse gap-3 border-t border-border pt-6 md:flex-row md:items-center md:justify-between">
          <button type="button" className={`${btnSecondary} w-full md:w-auto`} onClick={goBack}>
            {tCommon("back")}
          </button>
          <button type="button" className={`${btnPrimary} w-full md:w-auto`} onClick={goNext}>
            {tCommon("next")}
          </button>
        </footer>
      )}

      {state.step === 1 && !(isLocalMode && mode === "create") && (
        <footer className="mt-10 border-t border-border pt-6">
          <button
            type="button"
            className={`${btnSecondary} w-full md:w-auto`}
            onClick={() => navigate("/households")}
          >
            {tCommon("cancel")}
          </button>
        </footer>
      )}
    </div>
  );
}
