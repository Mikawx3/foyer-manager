import { describe, expect, it, vi } from "vitest";
import { DEFAULT_CATEGORIES } from "../lib/default-categories.js";
import { CategoryRepository } from "./category.repository.js";

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    category: {
      createMany: vi.fn(),
    },
  },
}));

import { prisma } from "../lib/prisma.js";

describe("CategoryRepository", () => {
  it("createManyForHousehold seeds all default categories with slugs", async () => {
    const repository = new CategoryRepository();
    const householdId = "clh12345678901234567890123";

    await repository.createManyForHousehold(householdId, DEFAULT_CATEGORIES);

    expect(prisma.category.createMany).toHaveBeenCalledWith({
      data: DEFAULT_CATEGORIES.map((category) => ({
        name: category.name,
        slug: category.slug,
        householdId,
      })),
    });
  });
});
