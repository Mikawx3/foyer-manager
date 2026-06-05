import { useMutation } from "@tanstack/react-query";
import { useEffect, useId, useRef, useState } from "react";
import type { Tenant } from "@foyer/types";
import { MemberColorPicker } from "../wizard/MemberColorPicker.tsx";
import { FormField, inputClassName } from "../forms/FormField.tsx";
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
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(DEFAULT_TENANT_COLOR);

  useEffect(() => {
    if (tenant && isOpen) {
      setName(tenant.name);
      setColor(tenant.color ?? DEFAULT_TENANT_COLOR);
    }
  }, [tenant, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    cancelButtonRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

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

  if (!isOpen || !tenant) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md rounded-xl bg-surface p-6 shadow-lg"
      >
        <h2 id={titleId} className="font-semibold text-stone-900">
          Edit member
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
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
          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <button
              ref={cancelButtonRef}
              type="button"
              className={btnSecondary}
              disabled={mutation.isPending}
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className={btnPrimary} disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
