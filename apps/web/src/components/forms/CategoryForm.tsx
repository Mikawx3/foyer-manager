import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { btnSecondary, card } from "../../lib/ui-classes.ts";
import { createCategorySchema, type CreateCategoryForm } from "../../lib/schemas.ts";
import { FormField, inputClassName } from "./FormField.tsx";

interface CategoryFormProps {
  householdId: string;
  onSubmit: (data: CreateCategoryForm) => void;
  isPending: boolean;
}

export function CategoryForm({ householdId, onSubmit, isPending }: CategoryFormProps) {
  const { t } = useTranslation("expenses");
  const { t: tCommon } = useTranslation("common");
  const { t: tValidation } = useTranslation("validation");
  const schema = useMemo(() => createCategorySchema(tValidation), [tValidation]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCategoryForm>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", householdId },
  });

  const submit = handleSubmit((data) => {
    onSubmit(data);
    reset({ name: "", householdId });
  });

  return (
    <form onSubmit={submit} className={`${card} space-y-3 bg-bg`}>
      <h4 className="text-sm font-semibold tracking-tight text-stone-800">{t("newCategory")}</h4>
      <input type="hidden" {...register("householdId")} />
      <FormField label={tCommon("name")} error={errors.name?.message}>
        <input className={inputClassName} {...register("name")} placeholder={t("categoryNamePlaceholder")} />
      </FormField>
      <button type="submit" disabled={isPending} className={btnSecondary}>
        {isPending ? tCommon("creating") : t("addCategory")}
      </button>
    </form>
  );
}
