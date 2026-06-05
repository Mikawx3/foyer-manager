import { describe, expect, it, vi } from "vitest";
import { ConflictError, ForbiddenError, NotFoundError } from "../errors/app.errors.js";
import type { HouseholdRepository } from "../repositories/household.repository.js";
import type { TenantRepository } from "../repositories/tenant.repository.js";
import type { ExpenseService } from "./expense.service.js";
import { TenantService } from "./tenant.service.js";

const householdId = "clh12345678901234567890123";
const tenantId = "clt12345678901234567890123";

const prismaTenant = {
  id: tenantId,
  name: "Alice",
  email: "alice@example.com",
  color: "#01696f",
  active: true,
  archivedAt: null,
  householdId,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
};

function createMocks(overrides?: {
  repository?: Partial<TenantRepository>;
  households?: Partial<HouseholdRepository>;
  expenses?: Partial<ExpenseService>;
}) {
  const repository: TenantRepository = {
    findById: vi.fn(),
    findAllByHousehold: vi.fn(),
    countActiveByHousehold: vi.fn(),
    create: vi.fn(),
    updateById: vi.fn(),
    softDeleteById: vi.fn(),
    deleteById: vi.fn(),
    hasHistory: vi.fn(),
    ...overrides?.repository,
  };
  const households: HouseholdRepository = {
    findById: vi.fn().mockResolvedValue({ id: householdId, type: "shared" }),
    findAll: vi.fn(),
    create: vi.fn(),
    createWithSoloTenant: vi.fn(),
    updateById: vi.fn(),
    deleteById: vi.fn(),
    ...overrides?.households,
  };
  const expenses: ExpenseService = {
    getBalances: vi.fn().mockResolvedValue([
      { tenantId, tenantName: "Alice", paid: 0, owed: 0, balance: 0, settledAmount: 0 },
    ]),
    ...overrides?.expenses,
  } as ExpenseService;

  return {
    service: new TenantService(repository, households, expenses),
    repository,
    households,
    expenses,
  };
}

describe("TenantService", () => {
  it("listByHousehold throws when household missing", async () => {
    const { service } = createMocks({
      households: { findById: vi.fn().mockResolvedValue(null) },
    });

    await expect(service.listByHousehold(householdId)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("create propagates ConflictError from repository", async () => {
    const { service } = createMocks({
      repository: {
        create: vi.fn().mockRejectedValue(new ConflictError("Email already exists")),
      },
    });

    await expect(
      service.create({
        name: "Alice",
        email: "alice@example.com",
        householdId,
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("create generates email when omitted", async () => {
    const { service, repository } = createMocks({
      repository: {
        create: vi.fn().mockResolvedValue(prismaTenant),
        countActiveByHousehold: vi.fn().mockResolvedValue(1),
      },
    });

    await service.createForHousehold(householdId, {
      name: "Bob",
      color: "#01696f",
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Bob",
        color: "#01696f",
        householdId,
        email: expect.stringMatching(/@members\.foyer\.local$/),
      }),
    );
  });

  it("updateFromHousehold updates name and color", async () => {
    const { service, repository } = createMocks({
      repository: {
        findById: vi.fn().mockResolvedValue(prismaTenant),
        updateById: vi.fn().mockResolvedValue({ ...prismaTenant, name: "Alicia", color: "#2563eb" }),
      },
    });

    const result = await service.updateFromHousehold(householdId, tenantId, {
      name: "Alicia",
      color: "#2563eb",
    });

    expect(result.tenant.name).toBe("Alicia");
    expect(repository.updateById).toHaveBeenCalledWith(tenantId, {
      name: "Alicia",
      color: "#2563eb",
    });
  });

  it("updateFromHousehold archives active tenant", async () => {
    const { service, repository } = createMocks({
      repository: {
        findById: vi.fn().mockResolvedValue(prismaTenant),
        hasHistory: vi.fn().mockResolvedValue(true),
        softDeleteById: vi.fn().mockResolvedValue({ ...prismaTenant, active: false }),
        countActiveByHousehold: vi.fn().mockResolvedValue(2),
      },
    });

    const result = await service.updateFromHousehold(householdId, tenantId, { active: false });
    expect(result.tenant.active).toBe(false);
    expect(repository.softDeleteById).toHaveBeenCalledWith(tenantId);
  });

  it("updateFromHousehold restores archived tenant and switches to shared", async () => {
    const archivedTenant = { ...prismaTenant, active: false, archivedAt: new Date() };
    const { service, repository, households } = createMocks({
      repository: {
        findById: vi.fn().mockResolvedValue(archivedTenant),
        updateById: vi.fn().mockResolvedValue({ ...prismaTenant, active: true, archivedAt: null }),
        countActiveByHousehold: vi.fn().mockResolvedValue(2),
      },
      households: {
        findById: vi
          .fn()
          .mockResolvedValueOnce({ id: householdId, type: "solo" })
          .mockResolvedValueOnce({ id: householdId, type: "solo" })
          .mockResolvedValueOnce({ id: householdId, type: "shared" }),
      },
    });

    const result = await service.updateFromHousehold(householdId, tenantId, { active: true });
    expect(result.tenant.active).toBe(true);
    expect(result.switchedToShared).toBe(true);
    expect(repository.updateById).toHaveBeenCalledWith(tenantId, {
      active: true,
      archivedAt: null,
    });
    expect(households.updateById).toHaveBeenCalledWith(householdId, { type: "shared" });
  });

  it("removeFromHousehold throws ForbiddenError when balance is non-zero", async () => {
    const { service } = createMocks({
      repository: { findById: vi.fn().mockResolvedValue(prismaTenant) },
      expenses: {
        getBalances: vi.fn().mockResolvedValue([
          { tenantId, tenantName: "Alice", paid: 0, owed: 320, balance: -320, settledAmount: 0 },
        ]),
      },
    });

    await expect(service.removeFromHousehold(householdId, tenantId)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("removeFromHousehold hard deletes when no history", async () => {
    const { service, repository } = createMocks({
      repository: {
        findById: vi.fn().mockResolvedValue(prismaTenant),
        hasHistory: vi.fn().mockResolvedValue(false),
        deleteById: vi.fn().mockResolvedValue(prismaTenant),
        countActiveByHousehold: vi.fn().mockResolvedValue(2),
      },
    });

    const result = await service.removeFromHousehold(householdId, tenantId);
    expect(result.mode).toBe("hard");
    expect(repository.deleteById).toHaveBeenCalledWith(tenantId);
  });

  it("removeFromHousehold returns 403 when history exists", async () => {
    const { service, repository } = createMocks({
      repository: {
        findById: vi.fn().mockResolvedValue(prismaTenant),
        hasHistory: vi.fn().mockResolvedValue(true),
      },
    });

    await expect(service.removeFromHousehold(householdId, tenantId)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect(repository.deleteById).not.toHaveBeenCalled();
    expect(repository.softDeleteById).not.toHaveBeenCalled();
  });

  it("removeFromHousehold switches household to solo when one active member remains", async () => {
    const { service, households } = createMocks({
      repository: {
        findById: vi.fn().mockResolvedValue(prismaTenant),
        hasHistory: vi.fn().mockResolvedValue(false),
        deleteById: vi.fn().mockResolvedValue(prismaTenant),
        countActiveByHousehold: vi.fn().mockResolvedValue(1),
      },
    });

    const result = await service.removeFromHousehold(householdId, tenantId);
    expect(result.switchedToSolo).toBe(true);
    expect(households.updateById).toHaveBeenCalledWith(householdId, { type: "solo" });
  });

  it("create switches solo household to shared when second member is added", async () => {
    const { service, households, repository } = createMocks({
      households: {
        findById: vi.fn().mockResolvedValue({ id: householdId, type: "solo" }),
      },
      repository: {
        create: vi.fn().mockResolvedValue(prismaTenant),
        countActiveByHousehold: vi.fn().mockResolvedValue(2),
      },
    });

    await service.createForHousehold(householdId, { name: "Bob" });
    expect(households.updateById).toHaveBeenCalledWith(householdId, { type: "shared" });
    expect(repository.create).toHaveBeenCalled();
  });
});
