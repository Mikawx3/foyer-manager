import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { btnPrimary, formCard } from "../../lib/ui-classes.ts";
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
    <form onSubmit={submit} className={formCard}>
      <h3 className="text-sm font-semibold tracking-tight text-stone-900">New household</h3>
      <FormField label="Name" error={errors.name?.message}>
        <input className={inputClassName} {...register("name")} placeholder="e.g. Apartment 4B" />
      </FormField>
      <button type="submit" disabled={isPending} className={btnPrimary}>
        {isPending ? "Creating…" : "Create household"}
      </button>
    </form>
  );
}
