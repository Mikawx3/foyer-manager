import type { IncomeTemplate, Tenant } from "@foyer/types";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useFormat } from "../../hooks/useFormat.ts";
import { amount, btnSecondary, card, iconBtn } from "../../lib/ui-classes.ts";

interface RecurringIncomeSectionProps {
  templates: IncomeTemplate[];
  tenants: Tenant[];
  onAdd: () => void;
  onEdit: (template: IncomeTemplate) => void;
  onDelete: (template: IncomeTemplate) => void;
}

export function RecurringIncomeSection({
  templates,
  tenants,
  onAdd,
  onEdit,
  onDelete,
}: RecurringIncomeSectionProps) {
  const { t } = useTranslation("income");
  const { formatCurrency } = useFormat();

  const tenantNameById = new Map(tenants.map((tenant) => [tenant.id, tenant.name]));

  return (
    <section className={card}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-stone-900">{t("recurringTitle")}</h2>
          <p className="mt-1 text-sm text-stone-600">{t("recurringSubtitle")}</p>
        </div>
        <button type="button" className={`${btnSecondary} gap-1 text-sm`} onClick={onAdd}>
          <Plus className="h-4 w-4" aria-hidden />
          {t("addIncome")}
        </button>
      </div>

      {templates.length === 0 ? (
        <p className="mt-4 text-sm text-stone-500">{t("noIncome")}</p>
      ) : (
        <ul className="mt-4 divide-y divide-border rounded-lg border border-border">
          {templates
            .filter((template) => template.active)
            .map((template) => (
              <li
                key={template.id}
                className="flex items-center justify-between gap-3 px-3 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-stone-900">
                    {tenantNameById.get(template.tenantId) ?? template.tenantId}
                    <span className="mx-2 text-stone-400">·</span>
                    {template.label}
                  </p>
                  <p className={`${amount} text-positive`}>{formatCurrency(template.amount)}</p>
                  {template.note && (
                    <p className="mt-0.5 truncate text-xs text-stone-500">{template.note}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    className={iconBtn}
                    onClick={() => onEdit(template)}
                    aria-label={t("editRecurring")}
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    className={iconBtn}
                    onClick={() => onDelete(template)}
                    aria-label={t("deleteIncome")}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
        </ul>
      )}
    </section>
  );
}
