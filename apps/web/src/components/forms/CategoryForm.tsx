import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
    <form onSubmit={submit} className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <h4 className="text-sm font-medium text-slate-800">New category</h4>
      <input type="hidden" {...register("householdId")} />
      <FormField label="Name" error={errors.name?.message}>
        <input className={inputClassName} {...register("name")} placeholder="e.g. Rent" />
      </FormField>
      <button
        type="submit"
        disabled={isPending}
        className="text-sm font-medium text-slate-900 underline hover:no-underline disabled:opacity-50"
      >
        {isPending ? "Creating…" : "Add category"}
      </button>
    </form>
  );
}
