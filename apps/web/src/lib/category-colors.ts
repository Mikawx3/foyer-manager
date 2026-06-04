export type CategoryColorKey = "rent" | "groceries" | "utilities" | "internet" | "other";

const COLOR_HEX: Record<CategoryColorKey, string> = {
  rent: "#f43f5e",
  groceries: "#3b82f6",
  utilities: "#f59e0b",
  internet: "#8b5cf6",
  other: "#6b7280",
};

const COLOR_BG_CLASS: Record<CategoryColorKey, string> = {
  rent: "bg-rent",
  groceries: "bg-groceries",
  utilities: "bg-utilities",
  internet: "bg-internet",
  other: "bg-other",
};

export function getCategoryColorKey(name: string): CategoryColorKey {
  const normalized = name.toLowerCase().trim();

  if (normalized.includes("rent") || normalized.includes("loyer")) {
    return "rent";
  }
  if (normalized.includes("grocer") || normalized.includes("course")) {
    return "groceries";
  }
  if (
    normalized.includes("utilit") ||
    normalized.includes("energie") ||
    normalized.includes("énergie")
  ) {
    return "utilities";
  }
  if (normalized.includes("internet") || normalized.includes("wifi")) {
    return "internet";
  }

  return "other";
}

export function getCategoryHex(key: CategoryColorKey): string {
  return COLOR_HEX[key];
}

export function getCategoryHexForName(name: string): string {
  return getCategoryHex(getCategoryColorKey(name));
}

export function getCategoryBgClass(name: string): string {
  return COLOR_BG_CLASS[getCategoryColorKey(name)];
}
