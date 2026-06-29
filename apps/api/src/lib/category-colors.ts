import {
  CATEGORY_COLOR_KEYS,
  type CategoryColorKey,
} from "@foyer/types";

const SLUG_COLOR_MAP: Record<string, CategoryColorKey> = {
  rent: "rent",
  groceries: "groceries",
  utilities: "utilities",
  internet: "internet",
  streaming: "streaming",
  water: "water",
  insurance: "insurance",
  transport: "transport",
  health: "health",
  other: "other",
};

export function isCategoryColorKey(value: string): value is CategoryColorKey {
  return (CATEGORY_COLOR_KEYS as readonly string[]).includes(value);
}

export function colorKeyForSlug(slug: string | null | undefined): CategoryColorKey {
  if (slug && slug in SLUG_COLOR_MAP) {
    return SLUG_COLOR_MAP[slug] ?? "other";
  }
  return "other";
}

export function pickUnusedCategoryColor(usedColors: readonly string[]): CategoryColorKey {
  const used = new Set(usedColors.filter(isCategoryColorKey));
  const unused = CATEGORY_COLOR_KEYS.find((key) => !used.has(key));
  if (unused) {
    return unused;
  }
  return CATEGORY_COLOR_KEYS[usedColors.length % CATEGORY_COLOR_KEYS.length] ?? "other";
}

export function slugifyCategoryName(name: string): string {
  const slug = name
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
  return slug.length > 0 ? slug : "category";
}
