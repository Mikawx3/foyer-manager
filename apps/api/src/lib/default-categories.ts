export const DEFAULT_CATEGORY_NAMES = [
  "Rent",
  "Groceries",
  "Utilities",
  "Internet",
  "Streaming",
  "Water",
  "Insurance",
  "Transport",
  "Health",
  "Other",
] as const;

export type DefaultCategoryName = (typeof DEFAULT_CATEGORY_NAMES)[number];
