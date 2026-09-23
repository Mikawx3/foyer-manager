import { describe, expect, it, vi } from "vitest";
import { NotFoundError } from "../errors/app.errors.js";
import type { CategoryRepository } from "../repositories/category.repository.js";
import type { DefaultSplitRepository } from "../repositories/default-split.repository.js";
import type { HouseholdRepository } from "../repositories/household.repository.js";
import type { TenantRepository } from "../repositories/tenant.repository.js";
import { DefaultSplitService } from "./default-split.service.js";

const householdId = "clh12345678901234567890123";
const categoryId = "clc12345678901234567890123";
const tenantId = "clt12345678901234567890123";
const tenantIdB = "clt22345678901234567890123";

const prismaGlobalRule = {
  id: "cld12345678901234567890123",
  householdId,
  categoryId: null,
  tenantId,
  percentage: 100,
  createdAt: new Date("2026-06-01T00:00:00.000Z"),
  updatedAt: new Date("2026-06-01T00:00:00.000Z"),
};

const prismaCategoryRule = {
  ...prismaGlobalRule,
  id: "cld22345678901234567890123",
  categoryId,
  percentage: 60,
};

function createMocks(overrides: {
  repository?: Partial<DefaultSplitRepository>;
  households?: Partial<HouseholdRepository>;
  tenants?: Partial<TenantRepository>;
  categories?: Partial<CategoryRepository>;
} = {}) {
  const repository: DefaultSplitRepository = {
    findAllByHousehold: vi.fn().mockResolvedValue([]),
    replaceForScope: vi.fn().mockResolvedValue([prismaGlobalRule]),
    deleteByCategory: vi.fn(),
    findByHouseholdAndCategory: vi.fn().mockResolvedValue([]),
    ...overrides.repository,
  };
  const households: HouseholdRepository = {
    findById: vi.fn().mockResolvedValue({ id: householdId, name: "Home", createdAt: new Date() }),
    findAll: vi.fn(),
    create: vi.fn(),
    deleteById: vi.fn(),
    ...overrides.households,
  };
  const tenants: TenantRepository = {
    findById: vi.fn().mockResolvedValue({
      id: tenantId,
      householdId,
      name: "A",
      email: "a@test.com",
      createdAt: new Date(),
    }),
    findAllByHousehold: vi.fn(),
    create: vi.fn(),
    deleteById: vi.fn(),
    ...overrides.tenants,
  };
  const categories: CategoryRepository = {
    findById: vi.fn().mockResolvedValue({ id: categoryId, name: "Rent", householdId }),
    findAllByHousehold: vi.fn(),
    create: vi.fn(),
    countExpenses: vi.fn(),
    deleteById: vi.fn(),
    ...overrides.categories,
  };

  return {
    repository,
    tenants,
    service: new DefaultSplitService(repository, households, tenants, categories),
  };
}

describe("DefaultSplitService", () => {
  it("getRules groups global and category rules", async () => {
    const { repository, service } = createMocks({
      repository: {
        findAllByHousehold: vi.fn().mockResolvedValue([prismaGlobalRule, prismaCategoryRule]),
      },
    });

    const rules = await service.getRules(householdId);

    expect(rules.global).toHaveLength(1);
    expect(rules.global[0]?.categoryId).toBeNull();
    expect(rules.byCategory[categoryId]).toHaveLength(1);
    expect(repository.findAllByHousehold).toHaveBeenCalledWith(householdId);
  });

  it("resolveForExpense prefers category rules over global", async () => {
    const { repository, service } = createMocks({
      repository: {
        findByHouseholdAndCategory: vi
          .fn()
          .mockResolvedValueOnce([prismaCategoryRule])
          .mockResolvedValueOnce([prismaGlobalRule]),
      },
    });

    const resolved = await service.resolveForExpense(householdId, categoryId);

    expect(resolved).toEqual([{ tenantId, percentage: 60 }]);
    expect(repository.findByHouseholdAndCategory).toHaveBeenCalledWith(
      householdId,
      categoryId,
    );
  });

  it("resolveForExpense falls back to equal split when no rules exist", async () => {
    const { repository, tenants, service } = createMocks({
      repository: {
        findByHouseholdAndCategory: vi.fn().mockResolvedValue([]),
      },
      tenants: {
        findAllByHousehold: vi.fn().mockResolvedValue([
          { id: tenantId, householdId, name: "A", email: "a@test.com", createdAt: new Date() },
          { id: tenantIdB, householdId, name: "B", email: "b@test.com", createdAt: new Date() },
        ]),
      },
    });

    const resolved = await service.resolveForExpense(householdId, categoryId);

    expect(resolved).toEqual([
      { tenantId, percentage: 50 },
      { tenantId: tenantIdB, percentage: 50 },
    ]);
    expect(repository.findByHouseholdAndCategory).toHaveBeenCalledWith(householdId, categoryId);
    expect(repository.findByHouseholdAndCategory).toHaveBeenCalledWith(householdId, null);
    expect(tenants.findAllByHousehold).toHaveBeenCalledWith(householdId);
  });

  it("resolveForExpense asOf omits members who joined after the expense was recorded", async () => {
    const { service } = createMocks({
      repository: {
        findByHouseholdAndCategory: vi.fn().mockResolvedValue([]),
      },
      tenants: {
        findAllByHousehold: vi.fn().mockResolvedValue([
          {
            id: tenantId,
            householdId,
            name: "A",
            email: "a@test.com",
            createdAt: new Date("2026-01-01T00:00:00.000Z"),
          },
          {
            id: tenantIdB,
            householdId,
            name: "B",
            email: "b@test.com",
            createdAt: new Date("2026-03-01T00:00:00.000Z"),
          },
        ]),
      },
    });

    const resolved = await service.resolveForExpense(
      householdId,
      categoryId,
      new Date("2026-02-01T12:00:00.000Z"),
    );

    expect(resolved).toEqual([{ tenantId, percentage: 100 }]);
  });

  it("resolveForExpense asOf omits a member who joined later the same day", async () => {
    const { service } = createMocks({
      repository: {
        findByHouseholdAndCategory: vi.fn().mockResolvedValue([]),
      },
      tenants: {
        findAllByHousehold: vi.fn().mockResolvedValue([
          {
            id: tenantId,
            householdId,
            name: "A",
            email: "a@test.com",
            createdAt: new Date("2026-03-23T10:00:00.000Z"),
          },
          {
            id: tenantIdB,
            householdId,
            name: "B",
            email: "b@test.com",
            createdAt: new Date("2026-03-23T17:00:00.000Z"),
          },
        ]),
      },
    });

    const resolved = await service.resolveForExpense(
      householdId,
      categoryId,
      new Date("2026-03-23T16:00:00.000Z"),
    );

    expect(resolved).toEqual([{ tenantId, percentage: 100 }]);
  });

  it("resolveForExpense asOf keeps a member who joined earlier the same day", async () => {
    const { service } = createMocks({
      repository: {
        findByHouseholdAndCategory: vi.fn().mockResolvedValue([]),
      },
      tenants: {
        findAllByHousehold: vi.fn().mockResolvedValue([
          {
            id: tenantId,
            householdId,
            name: "A",
            email: "a@test.com",
            createdAt: new Date("2026-01-01T00:00:00.000Z"),
          },
          {
            id: tenantIdB,
            householdId,
            name: "B",
            email: "b@test.com",
            createdAt: new Date("2026-02-01T08:00:00.000Z"),
          },
        ]),
      },
    });

    const resolved = await service.resolveForExpense(
      householdId,
      categoryId,
      new Date("2026-02-01T18:00:00.000Z"),
    );

    expect(resolved).toEqual([
      { tenantId, percentage: 50 },
      { tenantId: tenantIdB, percentage: 50 },
    ]);
  });

  it("resolveForExpense asOf rescales explicit rules without members who joined later", async () => {
    const tenantIdC = "clt32345678901234567890123";
    const { service } = createMocks({
      repository: {
        findByHouseholdAndCategory: vi.fn().mockResolvedValue([
          { ...prismaGlobalRule, tenantId, percentage: 50 },
          { ...prismaGlobalRule, id: "cld32345678901234567890123", tenantId: tenantIdB, percentage: 30 },
          { ...prismaGlobalRule, id: "cld42345678901234567890123", tenantId: tenantIdC, percentage: 20 },
        ]),
      },
      tenants: {
        findAllByHousehold: vi.fn().mockResolvedValue([
          {
            id: tenantId,
            householdId,
            name: "A",
            email: "a@test.com",
            createdAt: new Date("2026-01-01T00:00:00.000Z"),
          },
          {
            id: tenantIdB,
            householdId,
            name: "B",
            email: "b@test.com",
            createdAt: new Date("2026-01-01T00:00:00.000Z"),
          },
          {
            id: tenantIdC,
            householdId,
            name: "C",
            email: "c@test.com",
            createdAt: new Date("2026-03-01T00:00:00.000Z"),
          },
        ]),
      },
    });

    const resolved = await service.resolveForExpense(
      householdId,
      categoryId,
      new Date("2026-02-01T12:00:00.000Z"),
    );

    expect(resolved).toEqual([
      { tenantId, percentage: 62.5 },
      { tenantId: tenantIdB, percentage: 37.5 },
    ]);
  });

  it("resolveForExpense falls back to global when no category override", async () => {
    const { repository, service } = createMocks({
      repository: {
        findByHouseholdAndCategory: vi
          .fn()
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([prismaGlobalRule]),
      },
    });

    const resolved = await service.resolveForExpense(householdId, categoryId);

    expect(resolved).toEqual([{ tenantId, percentage: 100 }]);
    expect(repository.findByHouseholdAndCategory).toHaveBeenCalledWith(householdId, null);
  });

  it("setRules replaces scope after validation", async () => {
    const { repository, service } = createMocks();

    const result = await service.setRules(householdId, {
      categoryId: null,
      splits: [{ tenantId, percentage: 100 }],
    });

    expect(result).toHaveLength(1);
    expect(repository.replaceForScope).toHaveBeenCalledWith(householdId, null, [
      { tenantId, percentage: 100 },
    ]);
  });

  it("deleteCategoryRules removes category override", async () => {
    const { repository, service } = createMocks();

    await service.deleteCategoryRules(householdId, categoryId);

    expect(repository.deleteByCategory).toHaveBeenCalledWith(householdId, categoryId);
  });

  it("setRules throws when household missing", async () => {
    const { service } = createMocks({
      households: { findById: vi.fn().mockResolvedValue(null) },
    });

    await expect(
      service.setRules(householdId, {
        categoryId: null,
        splits: [{ tenantId, percentage: 100 }],
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
