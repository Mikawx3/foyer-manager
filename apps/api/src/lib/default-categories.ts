export const DEFAULT_CATEGORIES = [
  { name: "Rent", slug: "rent" },
  { name: "Groceries", slug: "groceries" },
  { name: "Utilities", slug: "utilities" },
  { name: "Internet", slug: "internet" },
  { name: "Streaming", slug: "streaming" },
  { name: "Water", slug: "water" },
  { name: "Insurance", slug: "insurance" },
  { name: "Transport", slug: "transport" },
  { name: "Health", slug: "health" },
  { name: "Other", slug: "other" },
] as const;

export type DefaultCategorySlug = (typeof DEFAULT_CATEGORIES)[number]["slug"];

export type DefaultCategoryName = (typeof DEFAULT_CATEGORIES)[number]["name"];

export const DEFAULT_CATEGORY_NAMES = DEFAULT_CATEGORIES.map(
  (category) => category.name,
) as readonly DefaultCategoryName[];
