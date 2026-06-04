import { describe, expect, it, vi } from "vitest";
import { NotFoundError, ValidationError } from "../errors/app.errors.js";
import type { CategoryRepository } from "../repositories/category.repository.js";
import type { HouseholdRepository } from "../repositories/household.repository.js";
import { CategoryService } from "./category.service.js";

const householdId = "clh12345678901234567890123";
const categoryId = "clc12345678901234567890123";

const prismaCategory = {
  id: categoryId,
  name: "Rent",
  householdId,
};

function createMocks(overrides: {
  repository?: Partial<CategoryRepository>;
  households?: Partial<HouseholdRepository>;
} = {}) {
  const repository: CategoryRepository = {
    findById: vi.fn(),
    findAllByHousehold: vi.fn(),
    create: vi.fn(),
    countExpenses: vi.fn(),
    deleteById: vi.fn(),
    ...overrides.repository,
  };
  const households: HouseholdRepository = {
    findById: vi.fn().mockResolvedValue({ id: householdId, name: "Home", createdAt: new Date() }),
    findAll: vi.fn(),
    create: vi.fn(),
    deleteById: vi.fn(),
    ...overrides.households,
  };
  return { repository, households, service: new CategoryService(repository, households) };
}

describe("CategoryService", () => {
  it("listByHousehold throws when household missing", async () => {
    const { service } = createMocks({
      households: { findById: vi.fn().mockResolvedValue(null) },
    });

    await expect(service.listByHousehold(householdId)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("create returns mapped category", async () => {
    const { repository, service } = createMocks({
      repository: { create: vi.fn().mockResolvedValue(prismaCategory) },
    });

    const result = await service.create({ name: "Rent", householdId });

    expect(result).toEqual(prismaCategory);
    expect(repository.create).toHaveBeenCalledWith({ name: "Rent", householdId });
  });

  it("delete removes category when it has no expenses", async () => {
    const { repository, service } = createMocks({
      repository: {
        findById: vi.fn().mockResolvedValue(prismaCategory),
        countExpenses: vi.fn().mockResolvedValue(0),
        deleteById: vi.fn().mockResolvedValue(prismaCategory),
      },
    });

    const result = await service.delete(categoryId);

    expect(result).toEqual(prismaCategory);
    expect(repository.deleteById).toHaveBeenCalledWith(categoryId);
  });

  it("delete throws NotFoundError when category missing", async () => {
    const { service } = createMocks({
      repository: { findById: vi.fn().mockResolvedValue(null) },
    });

    await expect(service.delete(categoryId)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("delete throws ValidationError when category has expenses", async () => {
    const { service } = createMocks({
      repository: {
        findById: vi.fn().mockResolvedValue(prismaCategory),
        countExpenses: vi.fn().mockResolvedValue(2),
      },
    });

    await expect(service.delete(categoryId)).rejects.toBeInstanceOf(ValidationError);
  });
});
