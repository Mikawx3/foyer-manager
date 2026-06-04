import type { Expense } from "@foyer/types";

const CSV_HEADERS = [
  "Date",
  "Description",
  "Category",
  "Amount (€)",
  "Paid by",
  "Split mode",
] as const;

export interface ExpenseExportMaps {
  categoryNameById: Map<string, string>;
  tenantNameById: Map<string, string>;
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

export function buildExpensesCsv(
  expenses: Expense[],
  maps: ExpenseExportMaps,
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
      expense.splitMode,
    ]
      .map(escapeCsvField)
      .join(",");
  });

  return [CSV_HEADERS.join(","), ...rows].join("\n");
}

export function exportExpensesToCSV(
  expenses: Expense[],
  filename: string,
  maps: ExpenseExportMaps,
): void {
  const csv = buildExpensesCsv(expenses, maps);
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
