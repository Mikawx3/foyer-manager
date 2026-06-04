import type { Tenant } from "@foyer/types";

interface MemberSelectorChipsProps {
  tenants: Tenant[];
  selectedIds: string[];
  onToggle: (tenantId: string) => void;
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

          return (
            <button
              key={tenant.id}
              type="button"
              title={isDisabled ? "At least one participant required" : undefined}
              disabled={isDisabled}
              onClick={() => onToggle(tenant.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${
                isSelected
                  ? "border-violet-300 bg-violet-100 font-medium text-violet-800"
                  : "border-stone-200 bg-stone-100 text-stone-400 line-through"
              } disabled:cursor-not-allowed disabled:opacity-70`}
            >
              <span
                className={`h-2 w-2 rounded-full ${isSelected ? "bg-violet-600" : "border border-stone-300 bg-transparent"}`}
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
