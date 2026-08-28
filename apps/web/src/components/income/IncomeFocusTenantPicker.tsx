import type { Tenant } from "@foyer/types";
import { useTranslation } from "react-i18next";
import { DEFAULT_TENANT_COLOR } from "../../lib/tenant-colors.ts";

interface IncomeFocusTenantPickerProps {
  tenants: Tenant[];
  value: string;
  onChange: (tenantId: string) => void;
}

export function IncomeFocusTenantPicker({
  tenants,
  value,
  onChange,
}: IncomeFocusTenantPickerProps) {
  const { t } = useTranslation("income");

  if (tenants.length <= 1) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-stone-500">{t("focusTenantLabel")}</span>
      <div
        className="inline-flex flex-wrap gap-1.5"
        role="group"
        aria-label={t("focusTenantLabel")}
      >
        {tenants.map((tenant) => {
          const selected = value === tenant.id;
          const color = tenant.color ?? DEFAULT_TENANT_COLOR;
          return (
            <button
              key={tenant.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(tenant.id)}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                selected
                  ? "border-stone-300 bg-surface text-stone-900 shadow-sm"
                  : "border-transparent bg-stone-100 text-stone-600 hover:text-stone-900"
              }`}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
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
