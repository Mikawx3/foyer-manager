import { Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { NotFoundError, ValidationError } from "../errors/app.errors.js";
import type { HouseholdRepository } from "../repositories/household.repository.js";
import type { SettlementRepository } from "../repositories/settlement.repository.js";
import type { TenantRepository } from "../repositories/tenant.repository.js";
import { SettlementService } from "./settlement.service.js";

const householdId = "clh12345678901234567890123";
const fromTenantId = "clt12345678901234567890123";
const toTenantId = "clt22345678901234567890123";
const settlementId = "cls12345678901234567890123";

describe("SettlementService", () => {
  it("rejects create when tenants differ from household", async () => {
    const households: HouseholdRepository = {
      findById: vi.fn().mockResolvedValue({
        id: householdId,
        name: "Home",
        settlementPeriod: "none",
        createdAt: new Date(),
      }),
      findAll: vi.fn(),
      create: vi.fn(),
      updateById: vi.fn(),
      deleteById: vi.fn(),
    };
    const tenants: TenantRepository = {
      findById: vi.fn().mockResolvedValue(null),
      findAllByHousehold: vi.fn(),
      create: vi.fn(),
      deleteById: vi.fn(),
    };
    const service = new SettlementService(
      { findAllByHousehold: vi.fn(), findById: vi.fn(), create: vi.fn(), deleteById: vi.fn() },
      households,
      tenants,
    );

    await expect(
      service.create(householdId, {
        fromTenantId,
        toTenantId,
        amount: 50,
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects delete after 24 hours", async () => {
    const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000);
    const settlements: SettlementRepository = {
      findAllByHousehold: vi.fn(),
      findById: vi.fn().mockResolvedValue({
        id: settlementId,
        householdId,
        fromTenantId,
        toTenantId,
        amount: new Prisma.Decimal(50),
        note: null,
        date: oldDate,
        createdAt: oldDate,
      }),
      create: vi.fn(),
      deleteById: vi.fn(),
    };
    const households: HouseholdRepository = {
      findById: vi.fn().mockResolvedValue({
        id: householdId,
        name: "Home",
        settlementPeriod: "none",
        createdAt: new Date(),
      }),
      findAll: vi.fn(),
      create: vi.fn(),
      updateById: vi.fn(),
      deleteById: vi.fn(),
    };
    const service = new SettlementService(
      settlements,
      households,
      { findById: vi.fn(), findAllByHousehold: vi.fn(), create: vi.fn(), deleteById: vi.fn() },
    );

    await expect(service.delete(householdId, settlementId)).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  it("throws NotFoundError when settlement missing", async () => {
    const households: HouseholdRepository = {
      findById: vi.fn().mockResolvedValue({
        id: householdId,
        name: "Home",
        settlementPeriod: "none",
        createdAt: new Date(),
      }),
      findAll: vi.fn(),
      create: vi.fn(),
      updateById: vi.fn(),
      deleteById: vi.fn(),
    };
    const service = new SettlementService(
      { findAllByHousehold: vi.fn(), findById: vi.fn().mockResolvedValue(null), create: vi.fn(), deleteById: vi.fn() },
      households,
      { findById: vi.fn(), findAllByHousehold: vi.fn(), create: vi.fn(), deleteById: vi.fn() },
    );

    await expect(service.delete(householdId, settlementId)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
