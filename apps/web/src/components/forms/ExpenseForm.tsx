import { zodResolver } from "@hookform/resolvers/zod";
import type { Category, Tenant } from "@foyer/types";
import { useForm } from "react-hook-form";
import { btnPrimary, formCard } from "../../lib/ui-classes.ts";
import { createExpenseSchema, type CreateExpenseForm } from "../../lib/schemas.ts";
import { FormField, inputClassName, selectClassName } from "./FormField.tsx";

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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateExpenseForm>({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: {
      description: "",
      categoryId: "",
      paidByTenantId: "",
      householdId,
      date: today,
    },
  });

  const submit = handleSubmit((data) => {
    onSubmit(data);
    reset({
      description: "",
      categoryId: "",
      paidByTenantId: "",
      householdId,
      date: today,
    });
  });

  return (
    <form onSubmit={submit} className={formCard}>
      <h3 className="text-sm font-semibold tracking-tight text-stone-900">New expense</h3>
      <input type="hidden" {...register("householdId")} />
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
      <button
        type="submit"
        disabled={isPending || categories.length === 0 || tenants.length === 0}
        className={btnPrimary}
      >
        {isPending ? "Creating…" : "Create expense"}
      </button>
    </form>
  );
}
