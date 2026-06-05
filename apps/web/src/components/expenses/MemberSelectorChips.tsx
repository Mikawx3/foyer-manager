import type { Tenant } from "@foyer/types";
import { DEFAULT_TENANT_COLOR } from "../../lib/tenant-colors.ts";

interface MemberSelectorChipsProps {
  tenants: Tenant[];
  selectedIds: string[];
  onToggle: (tenantId: string) => void;
}

function getTenantColor(tenant: Tenant): string {
  return tenant.color ?? DEFAULT_TENANT_COLOR;
}

export function MemberSelectorChips({
  tenants,
  selectedIds,
  onToggle,
}: MemberSelectorChipsProps) {
  const selectedSet = new Set(selectedIds);
  const onlyOneSelected = selectedIds.length <= 1;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-stone-700">Participants</p>
      <div className="flex flex-wrap gap-2">
        {tenants.map((tenant) => {
          const isSelected = selectedSet.has(tenant.id);
          const isDisabled = isSelected && onlyOneSelected;
          const color = getTenantColor(tenant);

          return (
            <button
              key={tenant.id}
              type="button"
              title={isDisabled ? "At least one participant required" : undefined}
              disabled={isDisabled}
              onClick={() => onToggle(tenant.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${
                isSelected
                  ? "font-medium text-stone-900"
                  : "border-stone-200 bg-stone-100 text-stone-400 line-through"
              } disabled:cursor-not-allowed disabled:opacity-70`}
              style={
                isSelected
                  ? { borderColor: color, backgroundColor: `${color}20` }
                  : undefined
              }
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: isSelected ? color : "transparent",
                  border: isSelected ? undefined : `1px solid ${color}`,
                }}
                aria-hidden
              />
              {tenant.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
