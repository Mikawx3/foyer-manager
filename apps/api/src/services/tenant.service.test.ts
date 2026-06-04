import { describe, expect, it, vi } from "vitest";
import { ConflictError, NotFoundError } from "../errors/app.errors.js";
import type { HouseholdRepository } from "../repositories/household.repository.js";
import type { TenantRepository } from "../repositories/tenant.repository.js";
import { TenantService } from "./tenant.service.js";

const householdId = "clh12345678901234567890123";

describe("TenantService", () => {
  it("listByHousehold throws when household missing", async () => {
    const repository: TenantRepository = {
      findById: vi.fn(),
      findAllByHousehold: vi.fn(),
      create: vi.fn(),
      deleteById: vi.fn(),
    };
    const households: HouseholdRepository = {
      findById: vi.fn().mockResolvedValue(null),
      findAll: vi.fn(),
      create: vi.fn(),
      deleteById: vi.fn(),
    };
    const service = new TenantService(repository, households);

    await expect(service.listByHousehold(householdId)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("create propagates ConflictError from repository", async () => {
    const repository: TenantRepository = {
      findById: vi.fn(),
      findAllByHousehold: vi.fn(),
      create: vi.fn().mockRejectedValue(new ConflictError("Email already exists")),
      deleteById: vi.fn(),
    };
    const households: HouseholdRepository = {
      findById: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      deleteById: vi.fn(),
    };
    const service = new TenantService(repository, households);

    await expect(
      service.create({
        name: "Alice",
        email: "alice@example.com",
        householdId,
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});
