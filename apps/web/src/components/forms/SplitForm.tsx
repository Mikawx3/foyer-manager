import { zodResolver } from "@hookform/resolvers/zod";
import type { Tenant } from "@foyer/types";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
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
  initialSplits?: { tenantId: string; percentage: number }[];
  onSubmit: (data: AssignSplitsForm) => void;
  isPending: boolean;
}

export function SplitForm({
  tenants,
  initialSplits = [],
  onSubmit,
  isPending,
}: SplitFormProps) {
  const { t: tCommon } = useTranslation("common");
  const { t: tValidation } = useTranslation("validation");
  const schema = useMemo(() => assignSplitsSchema(tValidation), [tValidation]);

  const tenantItems = useMemo(
    () => tenants.map((tenant) => ({ id: tenant.id, label: tenant.name })),
    [tenants],
  );
  const tenantIds = useMemo(() => tenants.map((tenant) => tenant.id), [tenants]);

  const initKey = useMemo(
    () =>
      `${tenantIds.join(",")}|${initialSplits.map((split) => `${split.tenantId}:${split.percentage}`).join(",")}`,
    [tenantIds, initialSplits],
  );

  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AssignSplitsForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      splits: [],
    },
  });

  useEffect(() => {
    if (tenants.length === 0) {
      reset({ splits: [] });
      return;
    }

    if (initialSplits.length > 0) {
      reset({
        splits: tenants.map((tenant) => {
          const existing = initialSplits.find((split) => split.tenantId === tenant.id);
          return {
            tenantId: tenant.id,
            percentage: existing?.percentage ?? 0,
          };
        }),
      });
      return;
    }

    const percentages = equalSplitPercentages(tenants.length);
    reset({
      splits: tenants.map((tenant, index) => ({
        tenantId: tenant.id,
        percentage: percentages[index] ?? 0,
      })),
    });
  }, [initKey, tenants, initialSplits, reset]);

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
      <p className="text-xs font-medium text-stone-600">{tCommon("customizeSplitsMustTotal")}</p>
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
        {isPending ? tCommon("saving") : tCommon("save")}
      </button>
    </form>
  );
}
