import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { btnPrimary, formCard } from "../../lib/ui-classes.ts";
import { createTenantSchema, type CreateTenantForm } from "../../lib/schemas.ts";
import { FormField, inputClassName } from "./FormField.tsx";

interface TenantFormProps {
  householdId: string;
  onSubmit: (data: Omit<CreateTenantForm, "email"> & { email?: string }) => void;
  isPending: boolean;
}

export function TenantForm({ householdId, onSubmit, isPending }: TenantFormProps) {
  const { t } = useTranslation("members");
  const { t: tCommon } = useTranslation("common");
  const { t: tValidation } = useTranslation("validation");
  const schema = useMemo(() => createTenantSchema(tValidation), [tValidation]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTenantForm>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", householdId },
  });

  const submit = handleSubmit((data) => {
    onSubmit({
      ...data,
      email: data.email === "" ? undefined : data.email,
    });
    reset({ name: "", email: "", householdId });
  });

  return (
    <form onSubmit={submit} className={formCard}>
      <h3 className="text-sm font-semibold tracking-tight text-stone-900">{t("addMemberHeading")}</h3>
      <input type="hidden" {...register("householdId")} />
      <FormField label={tCommon("name")} error={errors.name?.message}>
        <input className={inputClassName} {...register("name")} />
      </FormField>
      <FormField label={tCommon("emailOptional")} error={errors.email?.message}>
        <input
          className={inputClassName}
          type="email"
          autoComplete="email"
          placeholder={t("contactEmailPlaceholder")}
          {...register("email")}
        />
      </FormField>
      <button type="submit" disabled={isPending} className={btnPrimary}>
        {isPending ? tCommon("adding") : t("addMemberButton")}
      </button>
    </form>
  );
}
