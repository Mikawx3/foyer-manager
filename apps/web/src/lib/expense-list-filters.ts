export interface ExpenseListFilters {
  page: number;
  limit: number;
  month: string;
  categoryId?: string;
  search?: string;
}

export function currentMonthValue(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
}
