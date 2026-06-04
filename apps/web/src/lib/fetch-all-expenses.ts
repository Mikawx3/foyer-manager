import type { Expense } from "@foyer/types";
import { getExpenses } from "./api.ts";

const FETCH_ALL_PAGE_SIZE = 100;

export async function fetchAllExpenses(householdId: string): Promise<Expense[]> {
  const all: Expense[] = [];
  let page = 1;

  while (true) {
    const result = await getExpenses(householdId, { page, limit: FETCH_ALL_PAGE_SIZE });
    all.push(...result.data);
    if (page >= result.totalPages) {
      break;
    }
    page += 1;
  }

  return all;
}
