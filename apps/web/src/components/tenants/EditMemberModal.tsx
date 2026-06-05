import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { Tenant } from "@foyer/types";
import { MemberColorPicker } from "../wizard/MemberColorPicker.tsx";
import { FormField, inputClassName } from "../forms/FormField.tsx";
import { Modal } from "../ui/Modal.tsx";
import { getApiErrorMessage, updateHouseholdTenant } from "../../lib/api.ts";
import { DEFAULT_TENANT_COLOR } from "../../lib/tenant-colors.ts";
import { btnPrimary, btnSecondary, inlineError } from "../../lib/ui-classes.ts";

interface EditMemberModalProps {
  isOpen: boolean;
  householdId: string;
  tenant: Tenant | null;
  onClose: () => void;
  onSaved: () => void;
}

export function EditMemberModal({
  isOpen,
  householdId,
  tenant,
  onClose,
  onSaved,
}: EditMemberModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(DEFAULT_TENANT_COLOR);

  useEffect(() => {
    if (tenant && isOpen) {
      setName(tenant.name);
      setColor(tenant.color ?? DEFAULT_TENANT_COLOR);
    }
  }, [tenant, isOpen]);

  const mutation = useMutation({
    mutationFn: () => {
      if (!tenant) {
        throw new Error("No member selected");
      }
      return updateHouseholdTenant(householdId, tenant.id, { name: name.trim(), color });
    },
    onSuccess: () => {
      onSaved();
      onClose();
    },
  });

  if (!tenant) {
    return null;
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      return;
    }
    mutation.mutate();
  };

  return (
    <Modal title="Edit member" open={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Name">
          <input
            className={inputClassName}
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            autoFocus
          />
        </FormField>
        <FormField label="Color">
          <MemberColorPicker value={color} onChange={setColor} />
        </FormField>
        {mutation.isError && (
          <p className={inlineError}>{getApiErrorMessage(mutation.error)}</p>
        )}
        <div className="flex flex-col-reverse gap-3 pt-2 md:flex-row md:flex-wrap md:justify-end">
          <button
            type="button"
            className={`${btnSecondary} w-full md:w-auto`}
            disabled={mutation.isPending}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`${btnPrimary} w-full md:w-auto`}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
