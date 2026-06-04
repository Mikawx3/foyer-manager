import { zodResolver } from "@hookform/resolvers/zod";
import type { Category, Tenant } from "@foyer/types";
import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { btnPrimary, formCard } from "../../lib/ui-classes.ts";
import { equalSplitPercentages } from "../../lib/split-percentages.ts";
import { createExpenseSchema, type CreateExpenseForm } from "../../lib/schemas.ts";
import { FormField, inputClassName, selectClassName } from "./FormField.tsx";
import {
  isPercentageTotalComplete,
  SmartPercentageInputs,
  totalFromValues,
} from "./SmartPercentageInputs.tsx";

interface ExpenseFormProps {
  householdId: string;
  categories: Category[];
  tenants: Tenant[];
  onSubmit: (data: CreateExpenseForm) => void;
  isPending: boolean;
}

export function ExpenseForm({
  householdId,
  categories,
  tenants,
  onSubmit,
  isPending,
}: ExpenseFormProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [useDefaultSplit, setUseDefaultSplit] = useState(true);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateExpenseForm>({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: {
      description: "",
      categoryId: "",
      paidByTenantId: "",
      householdId,
      date: today,
      splitMode: "default",
      splits: [],
    },
  });

  const { replace } = useFieldArray({ control, name: "splits" });

  const tenantItems = useMemo(
    () => tenants.map((tenant) => ({ id: tenant.id, label: tenant.name })),
    [tenants],
  );
  const tenantIds = useMemo(() => tenants.map((tenant) => tenant.id), [tenants]);

  useEffect(() => {
    if (useDefaultSplit) {
      setValue("splitMode", "default");
      setValue("splits", undefined);
      return;
    }

    setValue("splitMode", "custom");
    const percentages = equalSplitPercentages(tenants.length);
    replace(
      tenants.map((tenant, index) => ({
        tenantId: tenant.id,
        percentage: percentages[index] ?? 0,
      })),
    );
  }, [useDefaultSplit, tenants, setValue, replace]);

  const customSplits = watch("splits") ?? [];
  const customPercentageValues = Object.fromEntries(
    tenants.map((tenant) => {
      const split = customSplits.find((entry) => entry.tenantId === tenant.id);
      return [tenant.id, split?.percentage ?? 0];
    }),
  );
  const customTotal = totalFromValues(customPercentageValues, tenantIds);
  const customValid = isPercentageTotalComplete(customTotal);

  const submit = handleSubmit((data) => {
    const payload: CreateExpenseForm = {
      ...data,
      splitMode: useDefaultSplit ? "default" : "custom",
      ...(useDefaultSplit ? {} : { splits: data.splits }),
    };
    onSubmit(payload);
    reset({
      description: "",
      categoryId: "",
      paidByTenantId: "",
      householdId,
      date: today,
      splitMode: "default",
      splits: [],
    });
    setUseDefaultSplit(true);
  });

  return (
    <form onSubmit={submit} className={formCard}>
      <h3 className="text-sm font-semibold tracking-tight text-stone-900">New expense</h3>
      <input type="hidden" {...register("householdId")} />
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

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-stone-700">Split</legend>
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input
            type="radio"
            name="split-mode"
            checked={useDefaultSplit}
            onChange={() => setUseDefaultSplit(true)}
          />
          Use default split
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input
            type="radio"
            name="split-mode"
            checked={!useDefaultSplit}
            onChange={() => setUseDefaultSplit(false)}
          />
          Customize split
        </label>
      </fieldset>

      {!useDefaultSplit && tenants.length > 0 && (
        <div className="space-y-2 rounded-lg border border-border bg-bg p-3">
          {errors.splits?.message && (
            <p className="text-sm text-negative">{errors.splits.message}</p>
          )}
          <SmartPercentageInputs
            items={tenantItems}
            values={customPercentageValues}
            onChange={(values) => {
              setValue(
                "splits",
                tenants.map((tenant) => ({
                  tenantId: tenant.id,
                  percentage: values[tenant.id] ?? 0,
                })),
              );
            }}
          />
        </div>
      )}

      <button
        type="submit"
        disabled={
          isPending ||
          categories.length === 0 ||
          tenants.length === 0 ||
          (!useDefaultSplit && !customValid)
        }
        className={btnPrimary}
      >
        {isPending ? "Creating…" : "Create expense"}
      </button>
    </form>
  );
}
