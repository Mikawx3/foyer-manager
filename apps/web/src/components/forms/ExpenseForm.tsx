import { zodResolver } from "@hookform/resolvers/zod";
import type { Category, Expense, Tenant } from "@foyer/types";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { ExpenseParticipantSplits, isCustomSplitValid } from "../expenses/ExpenseParticipantSplits.tsx";
import { resolveDefaultSplits } from "../../lib/api.ts";
import { queryKeys } from "../../lib/query-keys.ts";
import { redistributeSplits } from "../../lib/redistribute-splits.ts";
import { equalSplitPercentages } from "../../lib/split-percentages.ts";
import {
  createExpenseSchema,
  updateExpenseSchema,
  type CreateExpenseForm,
  type UpdateExpenseForm,
} from "../../lib/schemas.ts";
import { btnPrimary, formCard } from "../../lib/ui-classes.ts";
import { FormField, inputClassName, selectClassName } from "./FormField.tsx";

type ExpenseFormValues = CreateExpenseForm | UpdateExpenseForm;

interface ExpenseFormProps {
  householdId: string;
  categories: Category[];
  tenants: Tenant[];
  onSubmit: (data: ExpenseFormValues) => void;
  isPending: boolean;
  variant?: "create" | "edit";
  initialExpense?: Expense;
  initialParticipantIds?: string[];
  initialSplits?: { tenantId: string; percentage: number }[];
  title?: string;
  submitLabel?: string;
}

export function ExpenseForm({
  householdId,
  categories,
  tenants,
  onSubmit,
  isPending,
  variant = "create",
  initialExpense,
  initialParticipantIds,
  initialSplits,
  title,
  submitLabel,
}: ExpenseFormProps) {
  const today = new Date().toISOString().slice(0, 10);
  const allTenantIds = useMemo(() => tenants.map((tenant) => tenant.id), [tenants]);

  const defaultValues: ExpenseFormValues =
    variant === "edit" && initialExpense
      ? {
          amount: initialExpense.amount,
          description: initialExpense.description,
          categoryId: initialExpense.categoryId,
          paidByTenantId: initialExpense.paidByTenantId,
          date: initialExpense.date.slice(0, 10),
          splitMode: initialExpense.splitMode,
          splits: initialSplits ?? [],
          participantIds: initialParticipantIds ?? allTenantIds,
        }
      : {
          amount: Number.NaN,
          description: "",
          categoryId: "",
          paidByTenantId: "",
          householdId,
          date: today,
          splitMode: "default",
          splits: [],
          participantIds: allTenantIds,
        };

  const schema = variant === "edit" ? updateExpenseSchema : createExpenseSchema;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>(
    initialParticipantIds ?? allTenantIds,
  );
  const [useAutoSplit, setUseAutoSplit] = useState(
    initialExpense ? initialExpense.splitMode === "default" : true,
  );

  const amount = watch("amount") ?? 0;
  const categoryId = watch("categoryId") ?? "";
  const formSplits = watch("splits") ?? [];

  useEffect(() => {
    setSelectedParticipantIds(initialParticipantIds ?? allTenantIds);
  }, [initialParticipantIds, allTenantIds]);

  useEffect(() => {
    if (variant === "create") {
      setValue("householdId", householdId);
    }
  }, [householdId, setValue, variant]);

  const resolvedRulesQuery = useQuery({
    queryKey: queryKeys.resolvedDefaultSplits(householdId, categoryId),
    queryFn: () => resolveDefaultSplits(householdId, categoryId),
    enabled: Boolean(householdId) && Boolean(categoryId),
  });

  const autoPreview = useMemo(() => {
    if (!categoryId || selectedParticipantIds.length === 0 || amount <= 0) {
      return [];
    }
    const baseRules = resolvedRulesQuery.data ?? [];
    return redistributeSplits(tenants, selectedParticipantIds, baseRules, amount);
  }, [
    amount,
    categoryId,
    resolvedRulesQuery.data,
    selectedParticipantIds,
    tenants,
  ]);

  const selectedTenants = useMemo(
    () => tenants.filter((tenant) => selectedParticipantIds.includes(tenant.id)),
    [tenants, selectedParticipantIds],
  );

  const customPercentageValues = useMemo(() => {
    return Object.fromEntries(
      selectedTenants.map((tenant) => {
        const split = formSplits.find((entry) => entry.tenantId === tenant.id);
        return [tenant.id, split?.percentage ?? 0];
      }),
    );
  }, [formSplits, selectedTenants]);

  useEffect(() => {
    if (!useAutoSplit && selectedTenants.length > 0) {
      if (formSplits.length === 0) {
        const percentages = equalSplitPercentages(selectedTenants.length);
        setValue(
          "splits",
          selectedTenants.map((tenant, index) => ({
            tenantId: tenant.id,
            percentage: percentages[index] ?? 0,
          })),
        );
      }
    }
  }, [formSplits.length, useAutoSplit, selectedTenants, setValue]);

  const toggleParticipant = (tenantId: string) => {
    setSelectedParticipantIds((current) => {
      if (current.includes(tenantId)) {
        if (current.length <= 1) {
          return current;
        }
        return current.filter((id) => id !== tenantId);
      }
      return [...current, tenantId];
    });
  };

  const allParticipantsSelected =
    selectedParticipantIds.length === allTenantIds.length &&
    allTenantIds.every((id) => selectedParticipantIds.includes(id));

  const buildPayload = (data: ExpenseFormValues): ExpenseFormValues => {
    const participantIds = selectedParticipantIds;

    if (useAutoSplit) {
      if (allParticipantsSelected) {
        return {
          ...data,
          splitMode: "default",
          participantIds,
          splits: undefined,
        };
      }
      return {
        ...data,
        splitMode: "custom",
        participantIds,
        splits: autoPreview.map((row) => ({
          tenantId: row.tenantId,
          percentage: row.percentage,
        })),
      };
    }

    return {
      ...data,
      splitMode: "custom",
      participantIds,
      splits: selectedTenants.map((tenant) => ({
        tenantId: tenant.id,
        percentage: customPercentageValues[tenant.id] ?? 0,
      })),
    };
  };

  const submit = handleSubmit((data) => {
    onSubmit(buildPayload(data));
    if (variant === "create") {
      reset({
        description: "",
        categoryId: "",
        paidByTenantId: "",
        householdId,
        date: today,
        splitMode: "default",
        splits: [],
        participantIds: allTenantIds,
        amount: Number.NaN,
      });
      setSelectedParticipantIds(allTenantIds);
      setUseAutoSplit(true);
    }
  });

  const selectedTenantIds = selectedTenants.map((tenant) => tenant.id);
  const customValid = isCustomSplitValid(useAutoSplit, customPercentageValues, selectedTenantIds);

  const heading = title ?? (variant === "edit" ? "Edit expense" : "New expense");
  const buttonLabel =
    submitLabel ?? (isPending ? "Saving…" : variant === "edit" ? "Save changes" : "Create expense");

  return (
    <form onSubmit={submit} className={formCard}>
      <h3 className="text-sm font-semibold tracking-tight text-stone-900">{heading}</h3>
      {variant === "create" && <input type="hidden" {...register("householdId")} />}
      <input type="hidden" {...register("splitMode")} />

      <FormField label="Amount" error={errors.amount?.message}>
        <input
          className={inputClassName}
          type="number"
          step="0.01"
          min="0"
          {...register("amount", { valueAsNumber: true })}
        />
      </FormField>
      <FormField label="Description" error={errors.description?.message}>
        <input className={inputClassName} {...register("description")} />
      </FormField>
      <FormField label="Category" error={errors.categoryId?.message}>
        <select className={selectClassName} {...register("categoryId")} defaultValue="">
          <option value="" disabled>
            Select category
          </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </FormField>

      {tenants.length > 0 && (
        <ExpenseParticipantSplits
          tenants={tenants}
          selectedParticipantIds={selectedParticipantIds}
          onToggleParticipant={toggleParticipant}
          useAutoSplit={useAutoSplit}
          onUseAutoSplitChange={setUseAutoSplit}
          autoPreview={autoPreview}
          expenseAmount={Number(amount) || 0}
          customPercentageValues={customPercentageValues}
          onCustomPercentagesChange={(values) => {
            setValue(
              "splits",
              selectedTenants.map((tenant) => ({
                tenantId: tenant.id,
                percentage: values[tenant.id] ?? 0,
              })),
            );
          }}
          splitsError={errors.splits?.message}
        />
      )}

      <FormField label="Paid by" error={errors.paidByTenantId?.message}>
        <select className={selectClassName} {...register("paidByTenantId")} defaultValue="">
          <option value="" disabled>
            Select member
          </option>
          {tenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.name}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Date" error={errors.date?.message}>
        <input className={inputClassName} type="date" {...register("date")} />
      </FormField>

      <button
        type="submit"
        disabled={
          isPending ||
          categories.length === 0 ||
          tenants.length === 0 ||
          !customValid ||
          selectedParticipantIds.length === 0
        }
        className={btnPrimary}
      >
        {buttonLabel}
      </button>
    </form>
  );
}
