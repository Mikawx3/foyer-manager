import { describe, expect, it, vi } from "vitest";
import { DEFAULT_CATEGORY_NAMES } from "../lib/default-categories.js";
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
  it("createManyForHousehold seeds all default category names", async () => {
    const repository = new CategoryRepository();
    const householdId = "clh12345678901234567890123";

    await repository.createManyForHousehold(householdId, DEFAULT_CATEGORY_NAMES);

    expect(prisma.category.createMany).toHaveBeenCalledWith({
      data: DEFAULT_CATEGORY_NAMES.map((name) => ({ name, householdId })),
    });
  });
});
