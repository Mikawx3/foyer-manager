import { describe, expect, it } from "vitest";
import {
  colorKeyForSlug,
  pickUnusedCategoryColor,
  slugifyCategoryName,
} from "./category-colors.js";

describe("category-colors", () => {
  it("maps default slugs to palette keys", () => {
    expect(colorKeyForSlug("rent")).toBe("rent");
    expect(colorKeyForSlug("streaming")).toBe("streaming");
    expect(colorKeyForSlug(null)).toBe("other");
  });

  it("picks the first unused color", () => {
    expect(pickUnusedCategoryColor(["rent", "groceries"])).toBe("utilities");
    expect(pickUnusedCategoryColor([])).toBe("rent");
  });

  it("cycles when all colors are used", () => {
    const allUsed = [
      "rent",
      "groceries",
      "utilities",
      "internet",
      "streaming",
      "water",
      "insurance",
      "transport",
      "health",
      "teal",
      "pink",
      "other",
    ];
    expect(pickUnusedCategoryColor(allUsed)).toBe("rent");
  });

  it("slugifies category names", () => {
    expect(slugifyCategoryName("  Pets & Vet  ")).toBe("pets-vet");
    expect(slugifyCategoryName("École")).toBe("ecole");
  });
});
