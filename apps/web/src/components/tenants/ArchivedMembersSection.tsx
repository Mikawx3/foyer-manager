import { useMutation } from "@tanstack/react-query";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { Tenant } from "@foyer/types";
import { updateHouseholdTenant } from "../../lib/api.ts";
import { formatTenantName } from "../../lib/format-tenant-name.ts";
import { formatDate } from "../../lib/format.ts";
import { showMutationError, showMutationSuccess } from "../../lib/toast.ts";
import { card, btnSecondary } from "../../lib/ui-classes.ts";

interface ArchivedMembersSectionProps {
  householdId: string;
  tenants: Tenant[];
  onRestored: () => void;
}

export function ArchivedMembersSection({
  householdId,
  tenants,
  onRestored,
}: ArchivedMembersSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const restoreMutation = useMutation({
    mutationFn: (tenantId: string) =>
      updateHouseholdTenant(householdId, tenantId, { active: true }),
    onSuccess: (result) => {
      showMutationSuccess("Member restored");
      if (result.switchedToShared) {
        showMutationSuccess("Household switched to shared mode");
      }
      onRestored();
    },
    onError: showMutationError,
    onSettled: () => setRestoringId(null),
  });

  if (tenants.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 border-t border-border pt-6">
      <button
        type="button"
        className="flex w-full items-center gap-2 text-left text-sm font-semibold text-stone-600"
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <ChevronDown className="h-4 w-4 shrink-0" strokeWidth={2} />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0" strokeWidth={2} />
        )}
        Archived members ({tenants.length})
      </button>
      {isOpen && (
        <ul className="mt-3 space-y-3">
          {tenants.map((tenant) => (
            <li key={tenant.id} className={`${card} opacity-75`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold tracking-tight text-stone-600">
                    {formatTenantName(tenant)}
                  </p>
                  <p className="mt-1 text-xs text-stone-500">
                    Archived {tenant.archivedAt ? formatDate(tenant.archivedAt) : "—"}
                  </p>
                </div>
                <button
                  type="button"
                  className={btnSecondary}
                  disabled={restoreMutation.isPending && restoringId === tenant.id}
                  onClick={() => {
                    setRestoringId(tenant.id);
                    restoreMutation.mutate(tenant.id);
                  }}
                >
                  Restore
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
