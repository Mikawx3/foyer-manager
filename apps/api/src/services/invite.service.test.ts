import { describe, expect, it, vi } from "vitest";
import { ConflictError, ValidationError } from "../errors/app.errors.js";
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
const tenantId = "clt12345678901234567890123";

const openMember = {
  id: tenantId,
  name: "Sam",
  email: "sam@members.foyer.invalid",
  color: "#01696f",
  active: true,
  archivedAt: null,
  householdId,
  userId: null,
  createdAt: new Date(),
};

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
      listByHousehold: vi.fn().mockResolvedValue([]),
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
      findById: vi.fn().mockResolvedValue(openMember),
      findAllByHousehold: vi.fn(),
      findByHouseholdAndUser: vi.fn().mockResolvedValue(null),
      claimIfUnclaimed: vi.fn(),
      countActiveByHousehold: vi.fn().mockResolvedValue(1),
      create: vi.fn(),
      updateById: vi.fn(),
      softDeleteById: vi.fn(),
      deleteById: vi.fn(),
      hasHistory: vi.fn(),
    };
    const service = new InviteService(invites, households, members, users, tenants);

    const result = await service.acceptAsGuest("a".repeat(43), tenantId);

    expect(result).toEqual({ householdId, token: "guest-token", tenantId });
    expect(members.create).toHaveBeenCalledWith({
      userId: "guest-1",
      householdId,
      role: "guest",
    });
    expect(tenants.create).not.toHaveBeenCalled();
    expect(tenants.claimIfUnclaimed).not.toHaveBeenCalled();
  });

  it("links an account to an existing member without creating another name", async () => {
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
      findById: vi.fn().mockResolvedValue({
        id: "user-2",
        email: "sam@example.com",
        password: "hash",
        googleSub: null,
        isGuest: false,
        createdAt: new Date(),
      }),
      linkGoogleSub: vi.fn(),
      createWithHousehold: vi.fn(),
      createAccount: vi.fn(),
      createGuest: vi.fn(),
    };
    const tenants: TenantRepository = {
      findById: vi.fn()
        .mockResolvedValueOnce(openMember)
        .mockResolvedValueOnce({ ...openMember, userId: "user-2" }),
      findAllByHousehold: vi.fn(),
      findByHouseholdAndUser: vi.fn().mockResolvedValue(null),
      claimIfUnclaimed: vi.fn().mockResolvedValue(true),
      countActiveByHousehold: vi.fn(),
      create: vi.fn(),
      updateById: vi.fn(),
      softDeleteById: vi.fn(),
      deleteById: vi.fn(),
      hasHistory: vi.fn(),
    };
    const service = new InviteService(invites, households, members, users, tenants);

    const result = await service.acceptAsMember("a".repeat(43), "user-2", tenantId);

    expect(result).toEqual({ householdId, token: null, tenantId });
    expect(tenants.claimIfUnclaimed).toHaveBeenCalledWith(tenantId, householdId, "user-2");
    expect(tenants.create).not.toHaveBeenCalled();
    expect(members.create).toHaveBeenCalledWith({
      userId: "user-2",
      householdId,
      role: "member",
    });
  });

  it("refuses to link a member that already has an account", async () => {
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
      findById: vi.fn(),
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
      findByUserAndHousehold: vi.fn(),
      create: vi.fn(),
    };
    const users: UserRepository = {
      findByEmail: vi.fn(),
      findByGoogleSub: vi.fn(),
      findById: vi.fn().mockResolvedValue({
        id: "user-2",
        email: "sam@example.com",
        password: "hash",
        googleSub: null,
        isGuest: false,
        createdAt: new Date(),
      }),
      linkGoogleSub: vi.fn(),
      createWithHousehold: vi.fn(),
      createAccount: vi.fn(),
      createGuest: vi.fn(),
    };
    const tenants: TenantRepository = {
      findById: vi.fn().mockResolvedValue({ ...openMember, userId: "user-1" }),
      findAllByHousehold: vi.fn(),
      findByHouseholdAndUser: vi.fn(),
      claimIfUnclaimed: vi.fn(),
      countActiveByHousehold: vi.fn(),
      create: vi.fn(),
      updateById: vi.fn(),
      softDeleteById: vi.fn(),
      deleteById: vi.fn(),
      hasHistory: vi.fn(),
    };
    const service = new InviteService(invites, households, members, users, tenants);

    await expect(service.acceptAsMember("a".repeat(43), "user-2", tenantId)).rejects.toBeInstanceOf(
      ConflictError,
    );
    expect(members.create).not.toHaveBeenCalled();
  });
});
