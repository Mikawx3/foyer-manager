import { zodResolver } from "@hookform/resolvers/zod";
import { SOLO_SELF_NAME } from "@foyer/types";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { btnPrimary, formCard } from "../../lib/ui-classes.ts";
import { createTenantSchema, type CreateTenantForm } from "../../lib/schemas.ts";
import { FormField, inputClassName } from "./FormField.tsx";

interface TenantFormProps {
  householdId: string;
  requireAdminName?: boolean;
  onSubmit: (data: { name: string; householdId: string; adminName?: string }) => void;
  isPending: boolean;
}

type TenantFormValues = CreateTenantForm & { adminName?: string };

export function TenantForm({
  householdId,
  requireAdminName = false,
  onSubmit,
  isPending,
}: TenantFormProps) {
  const { t } = useTranslation("members");
  const { t: tCommon } = useTranslation("common");
  const { t: tValidation } = useTranslation("validation");
  const schema = useMemo(() => {
    const base = createTenantSchema(tValidation);
    if (!requireAdminName) {
      return base;
    }
    return base.extend({
      adminName: z
        .string()
        .trim()
        .min(1, tValidation("nameRequired"))
        .max(255)
        .refine((value) => value !== SOLO_SELF_NAME, t("chooseRealName")),
    });
  }, [requireAdminName, t, tValidation]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TenantFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", householdId, adminName: "" },
  });

  const submit = handleSubmit((data) => {
    onSubmit({
      name: data.name,
      householdId: data.householdId,
      ...(data.adminName ? { adminName: data.adminName } : {}),
    });
    reset({ name: "", householdId, adminName: "" });
  });

  return (
    <form onSubmit={submit} className={formCard}>
      <h3 className="text-sm font-semibold tracking-tight text-stone-900">{t("addMemberHeading")}</h3>
      <p className="text-sm text-stone-600">{t("addMemberHint")}</p>
      <input type="hidden" {...register("householdId")} />
      {requireAdminName && (
        <FormField label={t("yourName")} error={errors.adminName?.message}>
          <input className={inputClassName} {...register("adminName")} />
        </FormField>
      )}
      <FormField label={tCommon("name")} error={errors.name?.message}>
        <input className={inputClassName} {...register("name")} />
      </FormField>
      <button type="submit" disabled={isPending} className={btnPrimary}>
        {isPending ? tCommon("adding") : t("addMemberButton")}
      </button>
    </form>
  );
}
