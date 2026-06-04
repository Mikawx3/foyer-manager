import type { SplitPreview, Tenant } from "@foyer/types";
import { formatCurrency } from "../../lib/format.ts";
import { amount } from "../../lib/ui-classes.ts";

interface SplitPreviewCardProps {
  activePreview: SplitPreview[];
  excludedTenants: Tenant[];
  expenseAmount: number;
}

export function SplitPreviewCard({
  activePreview,
  excludedTenants,
  expenseAmount,
}: SplitPreviewCardProps) {
  const previewTotal = activePreview.reduce((sum, row) => sum + row.amount, 0);
  const totalMatches =
    expenseAmount > 0 && Math.abs(previewTotal - expenseAmount) < 0.01;

  return (
    <div className="rounded-lg border border-border bg-bg p-4">
      <h4 className="text-sm font-semibold text-stone-800">Split preview</h4>
      <ul className="mt-3 space-y-2">
        {activePreview.map((row) => (
          <li
            key={row.tenantId}
            className="flex items-center justify-between gap-3 text-sm text-stone-800"
          >
            <span className="min-w-0 flex-1 truncate font-medium">{row.tenantName}</span>
            <span className="shrink-0 text-stone-400">············</span>
            <span className="shrink-0 tabular-nums text-stone-600">
              {row.percentage.toFixed(2)}%
            </span>
            <span className={`shrink-0 ${amount}`}>{formatCurrency(row.amount)}</span>
          </li>
        ))}
        {excludedTenants.map((tenant) => (
          <li
            key={tenant.id}
            className="flex items-center justify-between gap-3 text-sm text-stone-400"
          >
            <span className="min-w-0 flex-1 truncate line-through">{tenant.name}</span>
            <span className="shrink-0 italic">(excluded)</span>
          </li>
        ))}
      </ul>
      <p
        className={`mt-3 text-sm font-medium ${totalMatches ? "text-positive" : "text-negative"}`}
      >
        Total: {formatCurrency(previewTotal)}
        {expenseAmount > 0 && (totalMatches ? " ✓" : " — does not match expense amount")}
      </p>
    </div>
  );
}
