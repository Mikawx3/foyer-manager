import { describe, expect, it, vi } from "vitest";
import { ValidationError } from "../errors/app.errors.js";
import type { HouseholdInviteRepository } from "../repositories/household-invite.repository.js";
import type { HouseholdMemberRepository } from "../repositories/household-member.repository.js";
import type { HouseholdRepository } from "../repositories/household.repository.js";
import type { TenantRepository } from "../repositories/tenant.repository.js";
import type { UserRepository } from "../repositories/user.repository.js";
import { InviteService } from "./invite.service.js";

vi.mock("../lib/jwt.js", () => ({
  signToken: vi.fn(async () => "guest-token"),
}));

const householdId = "clh12345678901234567890123";

describe("InviteService", () => {
  it("rejects an expired invite", async () => {
    const invites: HouseholdInviteRepository = {
      create: vi.fn(),
      findByToken: vi.fn().mockResolvedValue({
        id: "inv-1",
        token: "a".repeat(43),
        householdId,
        createdById: "user-1",
        expiresAt: new Date(Date.now() - 1000),
        createdAt: new Date(),
      }),
    };
    const service = new InviteService(invites);

    await expect(service.preview("a".repeat(43))).rejects.toBeInstanceOf(ValidationError);
  });

  it("adds a guest membership and returns a session", async () => {
    const invites: HouseholdInviteRepository = {
      create: vi.fn(),
      findByToken: vi.fn().mockResolvedValue({
        id: "inv-1",
        token: "a".repeat(43),
        householdId,
        createdById: "user-1",
        expiresAt: new Date(Date.now() + 60_000),
        createdAt: new Date(),
      }),
    };
    const households: HouseholdRepository = {
      findById: vi.fn().mockResolvedValue({
        id: householdId,
        name: "Home",
        type: "shared",
        settlementPeriod: "monthly",
        createdAt: new Date(),
      }),
      findAll: vi.fn(),
      findByIds: vi.fn(),
      create: vi.fn(),
      createWithSoloTenant: vi.fn(),
      updateById: vi.fn(),
      deleteById: vi.fn(),
    };
    const members: HouseholdMemberRepository = {
      listByUser: vi.fn(),
      listByHousehold: vi.fn(),
      findByUserAndHousehold: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
    };
    const users: UserRepository = {
      findByEmail: vi.fn(),
      findByGoogleSub: vi.fn(),
      findById: vi.fn(),
      linkGoogleSub: vi.fn(),
      createWithHousehold: vi.fn(),
      createAccount: vi.fn(),
      createGuest: vi.fn().mockResolvedValue({
        id: "guest-1",
        email: "guest+1@guests.foyer.invalid",
        password: null,
        googleSub: null,
        isGuest: true,
        createdAt: new Date(),
      }),
    };
    const tenants: TenantRepository = {
      findById: vi.fn(),
      findAllByHousehold: vi.fn(),
      findByHouseholdAndUser: vi.fn().mockResolvedValue(null),
      countActiveByHousehold: vi.fn().mockResolvedValue(1),
      create: vi.fn(),
      updateById: vi.fn(),
      softDeleteById: vi.fn(),
      deleteById: vi.fn(),
      hasHistory: vi.fn(),
    };
    const service = new InviteService(invites, households, members, users, tenants);

    const result = await service.acceptAsGuest("a".repeat(43), "Sam");

    expect(result).toEqual({ householdId, token: "guest-token" });
    expect(members.create).toHaveBeenCalledWith({
      userId: "guest-1",
      householdId,
      role: "guest",
    });
    expect(tenants.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Sam",
        householdId,
        userId: "guest-1",
      }),
    );
  });
});
