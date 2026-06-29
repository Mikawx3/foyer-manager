import { zodResolver } from "@hookform/resolvers/zod";
import type { Category, CategoryColorKey } from "@foyer/types";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { btnSecondary, card } from "../../lib/ui-classes.ts";
import { createCategorySchema, type CreateCategoryForm } from "../../lib/schemas.ts";
import {
  CategoryColorPicker,
  getDefaultCategoryColor,
} from "../categories/CategoryColorPicker.tsx";
import { FormField, inputClassName } from "./FormField.tsx";

interface CategoryFormProps {
  householdId: string;
  categories: Category[];
  onSubmit: (data: CreateCategoryForm) => void;
  isPending: boolean;
}

export function CategoryForm({ householdId, categories, onSubmit, isPending }: CategoryFormProps) {
  const { t } = useTranslation("expenses");
  const { t: tCommon } = useTranslation("common");
  const { t: tValidation } = useTranslation("validation");
  const schema = useMemo(() => createCategorySchema(tValidation), [tValidation]);

  const usedColors = useMemo(
    () => categories.map((category) => category.color),
    [categories],
  );

  const defaultColor = useMemo(() => getDefaultCategoryColor(usedColors), [usedColors]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateCategoryForm>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", householdId, color: defaultColor },
  });

  const selectedColor = watch("color") ?? defaultColor;

  useEffect(() => {
    setValue("color", defaultColor);
  }, [defaultColor, setValue]);

  const submit = handleSubmit((data) => {
    onSubmit(data);
    reset({ name: "", householdId, color: defaultColor });
  });

  return (
    <form onSubmit={submit} className={`${card} space-y-3 bg-bg`}>
      <h4 className="text-sm font-semibold tracking-tight text-stone-800">{t("newCategory")}</h4>
      <input type="hidden" {...register("householdId")} />
      <input type="hidden" {...register("color")} />
      <FormField label={tCommon("name")} error={errors.name?.message}>
        <input className={inputClassName} {...register("name")} placeholder={t("categoryNamePlaceholder")} />
      </FormField>
      <CategoryColorPicker
        value={selectedColor}
        usedColors={usedColors}
        onChange={(color: CategoryColorKey) => setValue("color", color)}
      />
      <button type="submit" disabled={isPending} className={btnSecondary}>
        {isPending ? tCommon("creating") : t("addCategory")}
      </button>
    </form>
  );
}
