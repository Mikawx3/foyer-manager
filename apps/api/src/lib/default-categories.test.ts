import { describe, expect, it } from "vitest";
import { DEFAULT_CATEGORIES, DEFAULT_CATEGORY_NAMES } from "./default-categories.js";

describe("DEFAULT_CATEGORIES", () => {
  it("defines 10 default categories for new households", () => {
    expect(DEFAULT_CATEGORIES).toHaveLength(10);
    expect(DEFAULT_CATEGORY_NAMES).toContain("Rent");
    expect(DEFAULT_CATEGORY_NAMES).toContain("Utilities");
    expect(DEFAULT_CATEGORY_NAMES).toContain("Other");
  });

  it("assigns a slug to each default category", () => {
    for (const category of DEFAULT_CATEGORIES) {
      expect(category.slug).toBe(category.name.toLowerCase());
    }
  });
});
