import { describe, expect, it, vi } from "vitest";
import { NotFoundError } from "../errors/app.errors.js";
import type { CategoryRepository } from "../repositories/category.repository.js";
import type { HouseholdRepository } from "../repositories/household.repository.js";
import { CategoryService } from "./category.service.js";

const householdId = "clh12345678901234567890123";

describe("CategoryService", () => {
  it("listByHousehold throws when household missing", async () => {
    const repository: CategoryRepository = {
      findById: vi.fn(),
      findAllByHousehold: vi.fn(),
      create: vi.fn(),
    };
    const households: HouseholdRepository = {
      findById: vi.fn().mockResolvedValue(null),
      findAll: vi.fn(),
      create: vi.fn(),
      deleteById: vi.fn(),
    };
    const service = new CategoryService(repository, households);

    await expect(service.listByHousehold(householdId)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("create returns mapped category", async () => {
    const prismaCategory = {
      id: "clc12345678901234567890123",
      name: "Rent",
      householdId,
    };
    const repository: CategoryRepository = {
      findById: vi.fn(),
      findAllByHousehold: vi.fn(),
      create: vi.fn().mockResolvedValue(prismaCategory),
    };
    const households: HouseholdRepository = {
      findById: vi.fn().mockResolvedValue({ id: householdId, name: "Home", createdAt: new Date() }),
      findAll: vi.fn(),
      create: vi.fn(),
      deleteById: vi.fn(),
    };
    const service = new CategoryService(repository, households);

    const result = await service.create({ name: "Rent", householdId });

    expect(result).toEqual(prismaCategory);
  });
});
