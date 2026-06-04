import { zodResolver } from "@hookform/resolvers/zod";
import type { Tenant } from "@foyer/types";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { btnPrimary } from "../../lib/ui-classes.ts";
import { equalSplitPercentages } from "../../lib/split-percentages.ts";
import { assignSplitsSchema, type AssignSplitsForm } from "../../lib/schemas.ts";
import {
  isPercentageTotalComplete,
  SmartPercentageInputs,
  totalFromValues,
} from "./SmartPercentageInputs.tsx";

interface SplitFormProps {
  tenants: Tenant[];
  onSubmit: (data: AssignSplitsForm) => void;
  isPending: boolean;
}

export function SplitForm({ tenants, onSubmit, isPending }: SplitFormProps) {
  const tenantItems = useMemo(
    () => tenants.map((tenant) => ({ id: tenant.id, label: tenant.name })),
    [tenants],
  );
  const tenantIds = useMemo(() => tenants.map((tenant) => tenant.id), [tenants]);

  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AssignSplitsForm>({
    resolver: zodResolver(assignSplitsSchema),
    defaultValues: {
      splits: [],
    },
  });

  useEffect(() => {
    const percentages = equalSplitPercentages(tenants.length);
    reset({
      splits: tenants.map((tenant, index) => ({
        tenantId: tenant.id,
        percentage: percentages[index] ?? 0,
      })),
    });
  }, [tenants, reset]);

  const splits = watch("splits") ?? [];
  const percentageValues = Object.fromEntries(
    tenants.map((tenant) => {
      const split = splits.find((entry) => entry.tenantId === tenant.id);
      return [tenant.id, split?.percentage ?? 0];
    }),
  );
  const total = totalFromValues(percentageValues, tenantIds);
  const splitsValid = isPercentageTotalComplete(total);

  const submit = handleSubmit(onSubmit);

  return (
    <form
      onSubmit={submit}
      className="mt-3 space-y-3 rounded-lg border border-border bg-bg p-3"
    >
      <p className="text-xs font-medium text-stone-600">Customize splits (must total 100%)</p>
      {errors.splits?.message && (
        <p className="text-sm text-negative">{errors.splits.message}</p>
      )}
      {tenants.length > 0 && (
        <SmartPercentageInputs
          items={tenantItems}
          values={percentageValues}
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
      )}
      <button type="submit" disabled={isPending || !splitsValid} className={btnPrimary}>
        {isPending ? "Saving…" : "Save splits"}
      </button>
    </form>
  );
}
