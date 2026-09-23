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

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(async () => "hashed-password"),
  },
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
      updateRole: vi.fn(),
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
    promoteGuest: vi.fn(),
    deleteGuestsWithoutMembership: vi.fn(),
    deleteExpiredGuests: vi.fn(),
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
      updateRole: vi.fn(),
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
      promoteGuest: vi.fn(),
      deleteGuestsWithoutMembership: vi.fn(),
      deleteExpiredGuests: vi.fn(),
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
      updateRole: vi.fn(),
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
      promoteGuest: vi.fn(),
      deleteGuestsWithoutMembership: vi.fn(),
      deleteExpiredGuests: vi.fn(),
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

  it("rejects a guest visit on a name that already has an account", async () => {
    const { service, members, tenants } = buildInviteService({
      tenants: {
        findById: vi.fn().mockResolvedValue({ ...openMember, userId: "user-1" }),
      },
    });

    await expect(service.acceptAsGuest("a".repeat(43), tenantId)).rejects.toBeInstanceOf(
      ConflictError,
    );
    expect(members.create).not.toHaveBeenCalled();
    expect(tenants.claimIfUnclaimed).not.toHaveBeenCalled();
  });

  it("refuses to create an invite while the admin is still Me", async () => {
    const { service, invites } = buildInviteService({
      tenants: {
        findByHouseholdAndUser: vi.fn().mockResolvedValue({
          ...openMember,
          name: "Me",
          userId: "admin-1",
        }),
      },
    });

    await expect(service.create(householdId, "admin-1")).rejects.toBeInstanceOf(ConflictError);
    expect(invites.create).not.toHaveBeenCalled();
  });

  it("refuses to create an invite when the admin has no linked name", async () => {
    const { service, invites } = buildInviteService({
      tenants: {
        findByHouseholdAndUser: vi.fn().mockResolvedValue(null),
      },
    });

    await expect(service.create(householdId, "admin-1")).rejects.toBeInstanceOf(ConflictError);
    expect(invites.create).not.toHaveBeenCalled();
  });

  it("creates an invite once the admin has a real linked name", async () => {
    const { service, invites } = buildInviteService({
      tenants: {
        findByHouseholdAndUser: vi.fn().mockResolvedValue({
          ...openMember,
          name: "Alex",
          userId: "admin-1",
        }),
      },
    });

    const result = await service.create(householdId, "admin-1");

    expect(result.token).toHaveLength(43);
    expect(invites.create).toHaveBeenCalledOnce();
  });

  it("creates a new name and links it once when registering from an invite", async () => {
    const created = { ...openMember, id: "cltnew123456789012345678901", name: "Nina" };
    const { service, tenants, households, members } = buildInviteService({
      households: {
        findById: vi.fn().mockResolvedValue({
          id: householdId,
          name: "Home",
          type: "solo",
          settlementPeriod: "monthly",
          createdAt: new Date(),
        }),
      },
      users: {
        findByEmail: vi.fn().mockResolvedValue(null),
        createAccount: vi.fn().mockResolvedValue({
          id: "user-new",
          email: "nina@example.com",
          password: "hashed-password",
          googleSub: null,
          isGuest: false,
          createdAt: new Date(),
        }),
      },
      tenants: {
        create: vi.fn().mockResolvedValue(created),
        findById: vi.fn().mockResolvedValue(created),
        findByHouseholdAndUser: vi.fn().mockResolvedValue(null),
        claimIfUnclaimed: vi.fn().mockResolvedValue(true),
        countActiveByHousehold: vi.fn().mockResolvedValue(2),
      },
    });

    const result = await service.registerAndJoin("a".repeat(43), {
      email: "nina@example.com",
      password: "password1",
      name: "Nina",
    });

    expect(result).toEqual({ householdId, token: "guest-token", tenantId: created.id });
    expect(tenants.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Nina", householdId }),
    );
    expect(tenants.claimIfUnclaimed).toHaveBeenCalledOnce();
    expect(tenants.claimIfUnclaimed).toHaveBeenCalledWith(created.id, householdId, "user-new");
    expect(households.updateById).toHaveBeenCalledWith(householdId, { type: "shared" });
    expect(members.create).toHaveBeenCalledWith({
      userId: "user-new",
      householdId,
      role: "member",
    });
  });

  it("turns a guest visit into an account linked to the chosen name", async () => {
    const { service, users, tenants, members } = buildInviteService({
      users: {
        findById: vi.fn().mockResolvedValue({
          id: "guest-1",
          email: "guest+1@guests.foyer.invalid",
          password: null,
          googleSub: null,
          isGuest: true,
          createdAt: new Date(),
        }),
        findByEmail: vi.fn().mockResolvedValue(null),
      },
      members: {
        findByUserAndHousehold: vi.fn().mockResolvedValue({
          id: "mem-1",
          role: "guest",
          userId: "guest-1",
          householdId,
          createdAt: new Date(),
        }),
      },
      tenants: {
        findById: vi.fn().mockResolvedValue(openMember),
        findByHouseholdAndUser: vi.fn().mockResolvedValue(null),
        claimIfUnclaimed: vi.fn().mockResolvedValue(true),
      },
    });

    const result = await service.upgradeGuest("guest-1", householdId, {
      email: "nina@example.com",
      password: "password1",
      tenantId,
    });

    expect(result).toEqual({ householdId, token: "guest-token", tenantId });
    expect(users.promoteGuest).toHaveBeenCalledWith("guest-1", "nina@example.com", "hashed-password");
    expect(tenants.claimIfUnclaimed).toHaveBeenCalledWith(tenantId, householdId, "guest-1");
    expect(members.updateRole).toHaveBeenCalledWith("mem-1", "member");
  });
});

function buildInviteService(overrides?: {
  invites?: Partial<HouseholdInviteRepository>;
  households?: Partial<HouseholdRepository>;
  members?: Partial<HouseholdMemberRepository>;
  users?: Partial<UserRepository>;
  tenants?: Partial<TenantRepository>;
}) {
  const invites: HouseholdInviteRepository = {
    create: vi.fn().mockResolvedValue({
      id: "inv-1",
      token: "b".repeat(43),
      householdId,
      createdById: "admin-1",
      expiresAt: new Date(Date.now() + 60_000),
      createdAt: new Date(),
    }),
    findByToken: vi.fn().mockResolvedValue({
      id: "inv-1",
      token: "a".repeat(43),
      householdId,
      createdById: "admin-1",
      expiresAt: new Date(Date.now() + 60_000),
      createdAt: new Date(),
    }),
    ...overrides?.invites,
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
    ...overrides?.households,
  };
  const members: HouseholdMemberRepository = {
    listByUser: vi.fn(),
    listByHousehold: vi.fn().mockResolvedValue([]),
    findByUserAndHousehold: vi.fn().mockResolvedValue(null),
    create: vi.fn(),
    updateRole: vi.fn(),
    ...overrides?.members,
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
    promoteGuest: vi.fn(),
    deleteGuestsWithoutMembership: vi.fn(),
    deleteExpiredGuests: vi.fn(),
    ...overrides?.users,
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
    ...overrides?.tenants,
  };

  return {
    service: new InviteService(invites, households, members, users, tenants),
    invites,
    households,
    members,
    users,
    tenants,
  };
}
