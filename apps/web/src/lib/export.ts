import type { Expense, Tenant } from "@foyer/types";
import type { TFunction } from "i18next";

export interface ExpenseExportMaps {
  categoryNameById: Map<string, string>;
  tenantNameById: Map<string, string>;
}

export function getCsvHeaders(t: TFunction<"export">): string[] {
  return [
    t("csvHeaderDate"),
    t("csvHeaderDescription"),
    t("csvHeaderCategory"),
    t("csvHeaderAmount"),
    t("csvHeaderPaidBy"),
    t("splitColumn"),
  ];
}

export function formatExportDate(iso: string): string {
  const date = new Date(iso);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatExportAmount(amount: number): string {
  return amount.toFixed(2).replace(".", ",");
}

function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function resolveSplitLabel(expense: Expense, tenants: Tenant[], t: TFunction<"export">): string {
  if (expense.splitMode === "custom" && expense.splits?.length) {
    return expense.splits
      .map((split) => {
        const tenant = tenants.find((entry) => entry.id === split.tenantId);
        return `${tenant?.name ?? "?"} ${Math.round(split.percentage ?? 0)}%`;
      })
      .join(" / ");
  }
  return t("splitDefault");
}

export function buildExpensesCsv(
  expenses: Expense[],
  maps: ExpenseExportMaps,
  headers: string[],
  tenants: Tenant[],
  t: TFunction<"export">,
): string {
  const rows = expenses.map((expense) => {
    const categoryName = maps.categoryNameById.get(expense.categoryId) ?? "—";
    const paidBy = maps.tenantNameById.get(expense.paidByTenantId) ?? "—";
    return [
      formatExportDate(expense.date),
      expense.description,
      categoryName,
      formatExportAmount(expense.amount),
      paidBy,
      resolveSplitLabel(expense, tenants, t),
    ]
      .map(escapeCsvField)
      .join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

export function exportExpensesToCSV(
  expenses: Expense[],
  filename: string,
  maps: ExpenseExportMaps,
  headers: string[],
  tenants: Tenant[],
  t: TFunction<"export">,
): void {
  const csv = buildExpensesCsv(expenses, maps, headers, tenants, t);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function slugifyHouseholdName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
