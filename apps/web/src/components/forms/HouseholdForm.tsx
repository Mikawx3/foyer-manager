import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { btnPrimary, formCard } from "../../lib/ui-classes.ts";
import { createHouseholdSchema, type CreateHouseholdForm } from "../../lib/schemas.ts";
import { FormField, inputClassName } from "./FormField.tsx";

interface HouseholdFormProps {
  onSubmit: (data: CreateHouseholdForm) => void;
  isPending: boolean;
}

export function HouseholdForm({ onSubmit, isPending }: HouseholdFormProps) {
  const { t } = useTranslation("common");
  const { t: tWizard } = useTranslation("wizard");
  const { t: tValidation } = useTranslation("validation");
  const schema = useMemo(() => createHouseholdSchema(tValidation), [tValidation]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateHouseholdForm>({
    resolver: zodResolver(schema),
    defaultValues: { name: "" },
  });

  const submit = handleSubmit((data) => {
    onSubmit(data);
    reset();
  });

  return (
    <form onSubmit={submit} className={formCard}>
      <h3 className="text-sm font-semibold tracking-tight text-stone-900">{t("newHousehold")}</h3>
      <FormField label={t("name")} error={errors.name?.message}>
        <input className={inputClassName} {...register("name")} placeholder={t("newHouseholdPlaceholder")} />
      </FormField>
      <button type="submit" disabled={isPending} className={btnPrimary}>
        {isPending ? t("creating") : tWizard("createHousehold")}
      </button>
    </form>
  );
}
