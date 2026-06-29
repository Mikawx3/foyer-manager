import type { ResolvedIncome, Tenant } from "@foyer/types";
import { Pencil, Plus, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Modal } from "../ui/Modal.tsx";
import { useFormat } from "../../hooks/useFormat.ts";
import { amount, btnSecondary, iconBtn } from "../../lib/ui-classes.ts";

interface TenantIncomeListModalProps {
  open: boolean;
  onClose: () => void;
  tenant: Tenant | null;
  incomes: ResolvedIncome[];
  onEdit: (income: ResolvedIncome) => void;
  onAdd: () => void;
  onResetOverride: (income: ResolvedIncome) => void;
}

function SourceBadge({ source }: { source: ResolvedIncome["source"] }) {
  const { t } = useTranslation("income");
  const className =
    source === "template"
      ? "bg-primary/10 text-primary"
      : source === "override"
        ? "bg-amber-100 text-amber-800"
        : "bg-stone-100 text-stone-700";

  return (
    <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {t(`source.${source}`)}
    </span>
  );
}

export function TenantIncomeListModal({
  open,
  onClose,
  tenant,
  incomes,
  onEdit,
  onAdd,
  onResetOverride,
}: TenantIncomeListModalProps) {
  const { t } = useTranslation("income");
  const { formatCurrency } = useFormat();

  if (!tenant) {
    return null;
  }

  const tenantIncomes = incomes.filter((income) => income.tenantId === tenant.id);

  return (
    <Modal
      title={t("memberIncomes", { name: tenant.name })}
      open={open}
      onClose={onClose}
    >
      <div className="space-y-3 p-4">
        {tenantIncomes.length === 0 ? (
          <p className="text-sm text-stone-600">{t("noIncome")}</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {tenantIncomes.map((income) => (
              <li
                key={`${income.id}-${income.source}`}
                className="flex items-center justify-between gap-3 px-3 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-stone-900">{income.label}</p>
                  <p className={`${amount} text-positive`}>{formatCurrency(income.amount)}</p>
                  <SourceBadge source={income.source} />
                  {income.note && (
                    <p className="mt-0.5 truncate text-xs text-stone-500">{income.note}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  {income.source === "override" && income.overrideId && (
                    <button
                      type="button"
                      className={iconBtn}
                      onClick={() => onResetOverride(income)}
                      aria-label={t("resetToRecurring")}
                    >
                      <RotateCcw className="h-4 w-4" aria-hidden />
                    </button>
                  )}
                  <button
                    type="button"
                    className={iconBtn}
                    onClick={() => onEdit(income)}
                    aria-label={t("editIncome")}
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <button type="button" className={`${btnSecondary} w-full gap-1`} onClick={onAdd}>
          <Plus className="h-4 w-4" aria-hidden />
          {t("addIncome")}
        </button>
      </div>
    </Modal>
  );
}
