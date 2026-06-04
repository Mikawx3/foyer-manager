import { describe, expect, it, vi } from "vitest";
import { NotFoundError } from "../errors/app.errors.js";
import type { HouseholdRepository } from "../repositories/household.repository.js";
import { HouseholdService } from "./household.service.js";

const prismaHousehold = {
  id: "clh12345678901234567890123",
  name: "Home",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("HouseholdService", () => {
  it("getById throws NotFoundError when missing", async () => {
    const repository: HouseholdRepository = {
      findById: vi.fn().mockResolvedValue(null),
      findAll: vi.fn(),
      create: vi.fn(),
      deleteById: vi.fn(),
    };
    const service = new HouseholdService(repository);

    await expect(service.getById("clh12345678901234567890123")).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("create returns mapped household", async () => {
    const repository: HouseholdRepository = {
      findById: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn().mockResolvedValue(prismaHousehold),
      deleteById: vi.fn(),
    };
    const service = new HouseholdService(repository);

    const result = await service.create({ name: "Home" });

    expect(result).toEqual({
      id: prismaHousehold.id,
      name: "Home",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
  });
});
