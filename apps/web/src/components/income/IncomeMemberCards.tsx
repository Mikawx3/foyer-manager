import type { Tenant } from "@foyer/types";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useFormat } from "../../hooks/useFormat.ts";
import { amount, btnSecondary, card } from "../../lib/ui-classes.ts";
import { DEFAULT_TENANT_COLOR } from "../../lib/tenant-colors.ts";

interface IncomeMemberCardsProps {
  tenants: Tenant[];
  incomeByTenant: Map<string, number>;
  onSelectTenant: (tenantId: string) => void;
  onAddForTenant: (tenantId: string) => void;
}

export function IncomeMemberCards({
  tenants,
  incomeByTenant,
  onSelectTenant,
  onAddForTenant,
}: IncomeMemberCardsProps) {
  const { t } = useTranslation("income");
  const { formatCurrency } = useFormat();

  if (tenants.length === 0) {
    return null;
  }

  return (
    <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 lg:grid-cols-3">
      {tenants.map((tenant) => {
        const total = incomeByTenant.get(tenant.id) ?? 0;
        const color = tenant.color ?? DEFAULT_TENANT_COLOR;
        const hasIncome = total > 0;

        return (
          <div key={tenant.id} className={`${card} min-w-[200px] shrink-0 md:min-w-0`}>
            <div className="flex items-center gap-3">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                style={{ backgroundColor: color }}
                aria-hidden
              >
                {tenant.name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-stone-900">{tenant.name}</p>
                {hasIncome ? (
                  <button
                    type="button"
                    className={`${amount} mt-1 block text-left text-xl text-positive hover:underline`}
                    onClick={() => onSelectTenant(tenant.id)}
                  >
                    {formatCurrency(total)}
                  </button>
                ) : (
                  <p className="mt-1 text-sm text-stone-500">{t("noIncome")}</p>
                )}
              </div>
            </div>
            {!hasIncome && (
              <button
                type="button"
                className={`${btnSecondary} mt-3 w-full gap-1 text-sm`}
                onClick={() => onAddForTenant(tenant.id)}
              >
                <Plus className="h-4 w-4" aria-hidden />
                {t("addIncome")}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
