import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { createHouseholdSchema, type CreateHouseholdForm } from "../../lib/schemas.ts";
import { FormField, inputClassName } from "./FormField.tsx";

interface HouseholdFormProps {
  onSubmit: (data: CreateHouseholdForm) => void;
  isPending: boolean;
}

export function HouseholdForm({ onSubmit, isPending }: HouseholdFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateHouseholdForm>({
    resolver: zodResolver(createHouseholdSchema),
    defaultValues: { name: "" },
  });

  const submit = handleSubmit((data) => {
    onSubmit(data);
    reset();
  });

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">New household</h3>
      <FormField label="Name" error={errors.name?.message}>
        <input className={inputClassName} {...register("name")} placeholder="e.g. Apartment 4B" />
      </FormField>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {isPending ? "Creating…" : "Create household"}
      </button>
    </form>
  );
}
