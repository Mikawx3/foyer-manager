import { zodResolver } from "@hookform/resolvers/zod";
import type { Category, RecurringExpense, Tenant } from "@foyer/types";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { ExpenseParticipantSplits, isCustomSplitValid } from "../expenses/ExpenseParticipantSplits.tsx";
import { resolveDefaultSplits } from "../../lib/api.ts";
import { queryKeys } from "../../lib/query-keys.ts";
import { redistributeSplits } from "../../lib/redistribute-splits.ts";
import { equalSplitPercentages } from "../../lib/split-percentages.ts";
import {
  createRecurringExpenseSchema,
  type CreateRecurringExpenseForm,
} from "../../lib/schemas.ts";
import { btnPrimary, formCard } from "../../lib/ui-classes.ts";
import { FormField, inputClassName, selectClassName } from "./FormField.tsx";

interface RecurringExpenseFormProps {
  householdId: string;
  categories: Category[];
  tenants: Tenant[];
  onSubmit: (data: CreateRecurringExpenseForm) => void;
  isPending: boolean;
  initialRecurring?: RecurringExpense;
  submitLabel?: string;
}

const frequencyOptions = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
] as const;

export function RecurringExpenseForm({
  householdId,
  categories,
  tenants,
  onSubmit,
  isPending,
  initialRecurring,
  submitLabel,
}: RecurringExpenseFormProps) {
  const today = new Date().toISOString().slice(0, 10);
  const allTenantIds = useMemo(() => tenants.map((tenant) => tenant.id), [tenants]);
  const isEdit = initialRecurring !== undefined;

  const defaultValues: CreateRecurringExpenseForm = isEdit
    ? {
        title: initialRecurring.title,
        amount: initialRecurring.amount,
        category: initialRecurring.category ?? "",
        paidById: initialRecurring.paidById,
        frequency: initialRecurring.frequency,
        startDate: initialRecurring.startDate.slice(0, 10),
        splits: initialRecurring.splits.map((split) => ({
          tenantId: split.tenantId,
          percentage: split.percentage,
        })),
      }
    : {
        title: "",
        amount: Number.NaN,
        category: "",
        paidById: "",
        frequency: "monthly",
        startDate: today,
        splits: [],
      };

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateRecurringExpenseForm>({
    resolver: zodResolver(createRecurringExpenseSchema),
    defaultValues,
  });

  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>(
    isEdit
      ? (initialRecurring.splits.map((split) => split.tenantId) ?? allTenantIds)
      : allTenantIds,
  );
  const [useAutoSplit, setUseAutoSplit] = useState(false);

  const amount = watch("amount") ?? 0;
  const category = watch("category") ?? "";
  const formSplits = watch("splits") ?? [];

  useEffect(() => {
    if (isEdit && initialRecurring) {
      reset({
        title: initialRecurring.title,
        amount: initialRecurring.amount,
        category: initialRecurring.category ?? "",
        paidById: initialRecurring.paidById,
        frequency: initialRecurring.frequency,
        startDate: initialRecurring.startDate.slice(0, 10),
        splits: initialRecurring.splits.map((split) => ({
          tenantId: split.tenantId,
          percentage: split.percentage,
        })),
      });
      setSelectedParticipantIds(initialRecurring.splits.map((split) => split.tenantId));
      setUseAutoSplit(false);
    }
  }, [initialRecurring, isEdit, reset]);

  const resolvedRulesQuery = useQuery({
    queryKey: queryKeys.resolvedDefaultSplits(householdId, category),
    queryFn: () => resolveDefaultSplits(householdId, category),
    enabled: Boolean(householdId) && Boolean(category),
  });

  const autoPreview = useMemo(() => {
    if (!category || selectedParticipantIds.length === 0 || amount <= 0) {
      return [];
    }
    const baseRules = resolvedRulesQuery.data ?? [];
    return redistributeSplits(tenants, selectedParticipantIds, baseRules, amount);
  }, [amount, category, resolvedRulesQuery.data, selectedParticipantIds, tenants]);

  const selectedTenants = useMemo(
    () => tenants.filter((tenant) => selectedParticipantIds.includes(tenant.id)),
    [tenants, selectedParticipantIds],
  );

  const customPercentageValues = useMemo(
    () =>
      Object.fromEntries(
        selectedTenants.map((tenant) => {
          const split = formSplits.find((entry) => entry.tenantId === tenant.id);
          return [tenant.id, split?.percentage ?? 0];
        }),
      ),
    [formSplits, selectedTenants],
  );

  useEffect(() => {
    if (!useAutoSplit && selectedTenants.length > 0 && formSplits.length === 0) {
      const percentages = equalSplitPercentages(selectedTenants.length);
      setValue(
        "splits",
        selectedTenants.map((tenant, index) => ({
          tenantId: tenant.id,
          percentage: percentages[index] ?? 0,
        })),
      );
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

  const buildPayload = (data: CreateRecurringExpenseForm): CreateRecurringExpenseForm => {
    if (useAutoSplit) {
      return {
        ...data,
        splits: autoPreview.map((row) => ({
          tenantId: row.tenantId,
          percentage: row.percentage,
        })),
      };
    }

    return {
      ...data,
      splits: selectedTenants.map((tenant) => ({
        tenantId: tenant.id,
        percentage: customPercentageValues[tenant.id] ?? 0,
      })),
    };
  };

  const submit = handleSubmit((data) => {
    onSubmit(buildPayload(data));
    if (!isEdit) {
      reset({
        title: "",
        amount: Number.NaN,
        category: "",
        paidById: "",
        frequency: "monthly",
        startDate: today,
        splits: [],
      });
      setSelectedParticipantIds(allTenantIds);
      setUseAutoSplit(false);
    }
  });

  const selectedTenantIds = selectedTenants.map((tenant) => tenant.id);
  const customValid = isCustomSplitValid(useAutoSplit, customPercentageValues, selectedTenantIds);

  return (
    <form onSubmit={submit} className={formCard}>
      <FormField label="Title" error={errors.title?.message}>
        <input className={inputClassName} {...register("title")} />
      </FormField>
      <FormField label="Amount" error={errors.amount?.message}>
        <input
          className={inputClassName}
          type="number"
          step="0.01"
          min="0"
          {...register("amount", { valueAsNumber: true })}
        />
      </FormField>
      <FormField label="Category" error={errors.category?.message}>
        <select className={selectClassName} {...register("category")} defaultValue="">
          <option value="" disabled>
            Select category
          </option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Paid by" error={errors.paidById?.message}>
        <select className={selectClassName} {...register("paidById")} defaultValue="">
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
      <FormField label="Frequency" error={errors.frequency?.message}>
        <select className={selectClassName} {...register("frequency")}>
          {frequencyOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Start date" error={errors.startDate?.message}>
        <input className={inputClassName} type="date" {...register("startDate")} />
      </FormField>

      {tenants.length > 0 && (
        <ExpenseParticipantSplits
          tenants={tenants}
          selectedParticipantIds={selectedParticipantIds}
          onToggleParticipant={toggleParticipant}
          useAutoSplit={useAutoSplit}
          onUseAutoSplitChange={setUseAutoSplit}
          autoPreview={autoPreview}
          expenseAmount={amount}
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

      <button type="submit" disabled={isPending || !customValid} className={btnPrimary}>
        {submitLabel ?? (isPending ? "Saving…" : isEdit ? "Save changes" : "Add recurring expense")}
      </button>
    </form>
  );
}
