import { zodResolver } from "@hookform/resolvers/zod";
import type { Tenant } from "@foyer/types";
import { useFieldArray, useForm } from "react-hook-form";
import { btnPrimary, btnSecondary } from "../../lib/ui-classes.ts";
import { assignSplitsSchema, type AssignSplitsForm } from "../../lib/schemas.ts";
import { FormField, inputClassName, selectClassName } from "./FormField.tsx";

interface SplitFormProps {
  tenants: Tenant[];
  onSubmit: (data: AssignSplitsForm) => void;
  isPending: boolean;
}

export function SplitForm({ tenants, onSubmit, isPending }: SplitFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AssignSplitsForm>({
    resolver: zodResolver(assignSplitsSchema),
    defaultValues: {
      splits: [
        { tenantId: "", percentage: 50 },
        { tenantId: "", percentage: 50 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "splits" });

  const submit = handleSubmit(onSubmit);

  return (
    <form
      onSubmit={submit}
      className="mt-3 space-y-3 rounded-lg border border-border bg-bg p-3"
    >
      <p className="text-xs font-medium text-stone-600">Assign splits (must total 100%)</p>
      {errors.splits?.message && (
        <p className="text-sm text-negative">{errors.splits.message}</p>
      )}
      {fields.map((field, index) => (
        <div key={field.id} className="flex flex-wrap items-end gap-2">
          <FormField label="Member" error={errors.splits?.[index]?.tenantId?.message}>
            <select className={selectClassName} {...register(`splits.${index}.tenantId`)}>
              <option value="" disabled>
                Select
              </option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="%" error={errors.splits?.[index]?.percentage?.message}>
            <input
              className={`${inputClassName} w-24`}
              type="number"
              step="0.01"
              min="0"
              max="100"
              {...register(`splits.${index}.percentage`, { valueAsNumber: true })}
            />
          </FormField>
          {fields.length > 1 && (
            <button
              type="button"
              onClick={() => remove(index)}
              className={`mb-0.5 ${btnSecondary}`}
            >
              Remove
            </button>
          )}
        </div>
      ))}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => append({ tenantId: "", percentage: 0 })}
          className={btnSecondary}
        >
          Add row
        </button>
        <button type="submit" disabled={isPending} className={btnPrimary}>
          {isPending ? "Saving…" : "Save splits"}
        </button>
      </div>
    </form>
  );
}
