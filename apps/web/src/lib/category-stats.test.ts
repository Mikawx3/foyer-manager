import { describe, expect, it } from "vitest";
import { categoryIdFromChartClick, toggleCategoryFilter } from "./category-stats.ts";

const slices = [
  { categoryId: "rent", name: "Loyer" },
  { categoryId: "food", name: "Courses" },
];

describe("toggleCategoryFilter", () => {
  it("selects a category when none is active", () => {
    expect(toggleCategoryFilter("", "rent")).toBe("rent");
  });

  it("clears the filter when the same category is clicked again", () => {
    expect(toggleCategoryFilter("rent", "rent")).toBe("");
  });

  it("switches to another category", () => {
    expect(toggleCategoryFilter("rent", "groceries")).toBe("groceries");
  });
});

describe("categoryIdFromChartClick", () => {
  it("resolves the category from the active bar index", () => {
    expect(categoryIdFromChartClick(slices, { activeIndex: 1 })).toBe("food");
  });

  it("resolves the category from the axis label", () => {
    expect(categoryIdFromChartClick(slices, { activeLabel: "Loyer" })).toBe("rent");
  });

  it("returns undefined when the click has no active category", () => {
    expect(categoryIdFromChartClick(slices, {})).toBeUndefined();
  });
});
