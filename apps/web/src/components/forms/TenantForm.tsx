import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { btnPrimary, formCard } from "../../lib/ui-classes.ts";
import { createTenantSchema, type CreateTenantForm } from "../../lib/schemas.ts";
import { FormField, inputClassName } from "./FormField.tsx";

interface TenantFormProps {
  householdId: string;
  onSubmit: (data: CreateTenantForm) => void;
  isPending: boolean;
}

export function TenantForm({ householdId, onSubmit, isPending }: TenantFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTenantForm>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: { name: "", email: "", householdId },
  });

  const submit = handleSubmit((data) => {
    onSubmit(data);
    reset({ name: "", email: "", householdId });
  });

  return (
    <form onSubmit={submit} className={formCard}>
      <h3 className="text-sm font-semibold tracking-tight text-stone-900">Add member</h3>
      <input type="hidden" {...register("householdId")} />
      <FormField label="Name" error={errors.name?.message}>
        <input className={inputClassName} {...register("name")} />
      </FormField>
      <FormField label="Email" error={errors.email?.message}>
        <input className={inputClassName} type="email" {...register("email")} />
      </FormField>
      <button type="submit" disabled={isPending} className={btnPrimary}>
        {isPending ? "Adding…" : "Add member"}
      </button>
    </form>
  );
}
