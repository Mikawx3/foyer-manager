import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">Add member</h3>
      <input type="hidden" {...register("householdId")} />
      <FormField label="Name" error={errors.name?.message}>
        <input className={inputClassName} {...register("name")} />
      </FormField>
      <FormField label="Email" error={errors.email?.message}>
        <input className={inputClassName} type="email" {...register("email")} />
      </FormField>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {isPending ? "Adding…" : "Add member"}
      </button>
    </form>
  );
}
