import { describe, expect, it } from "vitest";
import { DEFAULT_CATEGORY_NAMES } from "./default-categories.js";

describe("DEFAULT_CATEGORY_NAMES", () => {
  it("defines 10 default categories for new households", () => {
    expect(DEFAULT_CATEGORY_NAMES).toHaveLength(10);
    expect(DEFAULT_CATEGORY_NAMES).toContain("Rent");
    expect(DEFAULT_CATEGORY_NAMES).toContain("Utilities");
    expect(DEFAULT_CATEGORY_NAMES).toContain("Other");
  });
});
