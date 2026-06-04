import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { btnSecondary, card } from "../../lib/ui-classes.ts";
import { createCategorySchema, type CreateCategoryForm } from "../../lib/schemas.ts";
import { FormField, inputClassName } from "./FormField.tsx";

interface CategoryFormProps {
  householdId: string;
  onSubmit: (data: CreateCategoryForm) => void;
  isPending: boolean;
}

export function CategoryForm({ householdId, onSubmit, isPending }: CategoryFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCategoryForm>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: { name: "", householdId },
  });

  const submit = handleSubmit((data) => {
    onSubmit(data);
    reset({ name: "", householdId });
  });

  return (
    <form onSubmit={submit} className={`${card} space-y-3 bg-bg`}>
      <h4 className="text-sm font-semibold tracking-tight text-stone-800">New category</h4>
      <input type="hidden" {...register("householdId")} />
      <FormField label="Name" error={errors.name?.message}>
        <input className={inputClassName} {...register("name")} placeholder="e.g. Rent" />
      </FormField>
      <button type="submit" disabled={isPending} className={btnSecondary}>
        {isPending ? "Creating…" : "Add category"}
      </button>
    </form>
  );
}
