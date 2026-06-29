import {
  CATEGORY_COLOR_KEYS,
  type CategoryColorKey,
} from "@foyer/types";

const COLOR_HEX: Record<CategoryColorKey, string> = {
  rent: "#f43f5e",
  groceries: "#3b82f6",
  utilities: "#f59e0b",
  internet: "#8b5cf6",
  streaming: "#ec4899",
  water: "#06b6d4",
  insurance: "#6366f1",
  transport: "#14b8a6",
  health: "#22c55e",
  teal: "#0d9488",
  pink: "#d946ef",
  other: "#6b7280",
};

const COLOR_BG_CLASS: Record<CategoryColorKey, string> = {
  rent: "bg-rent",
  groceries: "bg-groceries",
  utilities: "bg-utilities",
  internet: "bg-internet",
  streaming: "bg-streaming",
  water: "bg-water",
  insurance: "bg-insurance",
  transport: "bg-transport",
  health: "bg-health",
  teal: "bg-teal",
  pink: "bg-pink",
  other: "bg-other",
};

export { CATEGORY_COLOR_KEYS, type CategoryColorKey };

function resolveColorKey(name: string, slug?: string | null, color?: CategoryColorKey): CategoryColorKey {
  if (color) {
    return color;
  }
  const normalized = (slug ?? name).toLowerCase().trim();
  if (normalized.includes("rent") || normalized.includes("loyer")) return "rent";
  if (normalized.includes("grocer") || normalized.includes("course")) return "groceries";
  if (normalized.includes("utilit") || normalized.includes("energie") || normalized.includes("énergie")) {
    return "utilities";
  }
  if (normalized.includes("internet") || normalized.includes("wifi")) return "internet";
  if (normalized.includes("stream")) return "streaming";
  if (normalized.includes("water") || normalized.includes("eau")) return "water";
  if (normalized.includes("insur") || normalized.includes("assur")) return "insurance";
  if (normalized.includes("transport") || normalized.includes("metro")) return "transport";
  if (normalized.includes("health") || normalized.includes("sant")) return "health";
  return "other";
}

export function getCategoryColorKey(
  name: string,
  slug?: string | null,
  color?: CategoryColorKey,
): CategoryColorKey {
  return resolveColorKey(name, slug, color);
}

export function getCategoryHex(key: CategoryColorKey): string {
  return COLOR_HEX[key];
}

export function getCategoryHexForCategory(
  name: string,
  slug?: string | null,
  color?: CategoryColorKey,
): string {
  return getCategoryHex(getCategoryColorKey(name, slug, color));
}

/** @deprecated Use getCategoryHexForCategory with persisted color when available */
export function getCategoryHexForName(name: string): string {
  return getCategoryHexForCategory(name);
}

export function getCategoryBgClass(
  name: string,
  slug?: string | null,
  color?: CategoryColorKey,
): string {
  return COLOR_BG_CLASS[getCategoryColorKey(name, slug, color)];
}

export function pickUnusedCategoryColor(usedColors: readonly CategoryColorKey[]): CategoryColorKey {
  const used = new Set(usedColors);
  const unused = CATEGORY_COLOR_KEYS.find((key) => !used.has(key));
  return unused ?? CATEGORY_COLOR_KEYS[usedColors.length % CATEGORY_COLOR_KEYS.length] ?? "other";
}

export function getCategoryInlineStyle(color?: CategoryColorKey): { backgroundColor: string } | undefined {
  if (!color) {
    return undefined;
  }
  return { backgroundColor: getCategoryHex(color) };
}
