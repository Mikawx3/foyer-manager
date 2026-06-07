import { zodResolver } from "@hookform/resolvers/zod";
import type { Category, RecurringExpense, Tenant } from "@foyer/types";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { ExpenseParticipantSplits, isCustomSplitValid } from "../expenses/ExpenseParticipantSplits.tsx";
import { resolveDefaultSplits } from "../../lib/api.ts";
import { queryKeys } from "../../lib/query-keys.ts";
import { redistributeSplits } from "../../lib/redistribute-splits.ts";
import { equalSplitPercentages } from "../../lib/split-percentages.ts";
import { safePercentage } from "../../lib/smart-percentages.ts";
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

const frequencyValues = ["weekly", "monthly", "quarterly", "yearly"] as const;

export function RecurringExpenseForm({
  householdId,
  categories,
  tenants,
  onSubmit,
  isPending,
  initialRecurring,
  submitLabel,
}: RecurringExpenseFormProps) {
  const { t } = useTranslation("recurring");
  const { t: tCommon } = useTranslation("common");
  const { t: tValidation } = useTranslation("validation");
  const schema = useMemo(() => createRecurringExpenseSchema(tValidation), [tValidation]);

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
    resolver: zodResolver(schema),
    defaultValues,
  });

  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>(
    isEdit
      ? (initialRecurring.splits.map((split) => split.tenantId) ?? allTenantIds)
      : allTenantIds,
  );
  const [useAutoSplit, setUseAutoSplit] = useState(
    isEdit ? initialRecurring.splits.length === 0 : false,
  );

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
      setSelectedParticipantIds(
        initialRecurring.splits.length > 0
          ? initialRecurring.splits.map((split) => split.tenantId)
          : allTenantIds,
      );
      setUseAutoSplit(initialRecurring.splits.length === 0);
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
          return [tenant.id, safePercentage(split?.percentage ?? 0)];
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

  const handleUseAutoSplitChange = (auto: boolean) => {
    setUseAutoSplit(auto);
    if (!auto && selectedTenants.length > 0) {
      const splits =
        autoPreview.length > 0
          ? autoPreview.map((row) => ({
              tenantId: row.tenantId,
              percentage: safePercentage(row.percentage),
            }))
          : selectedTenants.map((tenant, index) => ({
              tenantId: tenant.id,
              percentage: safePercentage(equalSplitPercentages(selectedTenants.length)[index] ?? 0),
            }));
      setValue("splits", splits);
    }
  };

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
      const { splits: _splits, ...rest } = data;
      return rest;
    }

    return {
      ...data,
      splits: selectedTenants.map((tenant) => ({
        tenantId: tenant.id,
        percentage: safePercentage(customPercentageValues[tenant.id] ?? 0),
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
      <FormField label={tCommon("title")} error={errors.title?.message}>
        <input className={inputClassName} {...register("title")} />
      </FormField>
      <FormField label={tCommon("amount")} error={errors.amount?.message}>
        <input
          className={inputClassName}
          type="number"
          step="0.01"
          min="0"
          {...register("amount", { valueAsNumber: true })}
        />
      </FormField>
      <FormField label={tCommon("category")} error={errors.category?.message}>
        <select className={selectClassName} {...register("category")} defaultValue="">
          <option value="" disabled>
            {tCommon("selectCategory")}
          </option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label={tCommon("paidBy")} error={errors.paidById?.message}>
        <select className={selectClassName} {...register("paidById")} defaultValue="">
          <option value="" disabled>
            {tCommon("selectMember")}
          </option>
          {tenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.name}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label={tCommon("frequency")} error={errors.frequency?.message}>
        <select className={selectClassName} {...register("frequency")}>
          {frequencyValues.map((value) => (
            <option key={value} value={value}>
              {tCommon(value)}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label={tCommon("startDate")} error={errors.startDate?.message}>
        <input className={inputClassName} type="date" {...register("startDate")} />
      </FormField>

      {tenants.length > 0 && (
        <ExpenseParticipantSplits
          tenants={tenants}
          selectedParticipantIds={selectedParticipantIds}
          onToggleParticipant={toggleParticipant}
          useAutoSplit={useAutoSplit}
          onUseAutoSplitChange={handleUseAutoSplitChange}
          autoPreview={autoPreview}
          expenseAmount={amount}
          customPercentageValues={customPercentageValues}
          onCustomPercentagesChange={(values) => {
            setValue(
              "splits",
              selectedTenants.map((tenant) => ({
                tenantId: tenant.id,
                percentage: safePercentage(values[tenant.id] ?? 0),
              })),
            );
          }}
          splitsError={errors.splits?.message}
        />
      )}

      <button type="submit" disabled={isPending || !customValid} className={btnPrimary}>
        {submitLabel ??
          (isPending ? tCommon("saving") : isEdit ? t("saveChanges") : t("addRecurringExpenseButton"))}
      </button>
    </form>
  );
}
