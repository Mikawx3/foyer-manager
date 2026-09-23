import type { AcceptInviteResponse, HouseholdAccessMember, HouseholdInviteCreated, HouseholdInvitePreview } from "@foyer/types";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { ConflictError, NotFoundError, ValidationError } from "../errors/app.errors.js";
import { claimTenantForUser } from "./tenant-claim.js";
import {
  householdInviteRepository,
  type HouseholdInviteRepository,
} from "../repositories/household-invite.repository.js";
import {
  householdMemberRepository,
  type HouseholdMemberRepository,
} from "../repositories/household-member.repository.js";
import {
  householdRepository,
  type HouseholdRepository,
} from "../repositories/household.repository.js";
import {
  tenantRepository,
  type TenantRepository,
} from "../repositories/tenant.repository.js";
import { userRepository, type UserRepository } from "../repositories/user.repository.js";
import { parseHouseholdRole } from "../lib/household-role.js";
import { signToken } from "../lib/jwt.js";

const INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000;
const BCRYPT_ROUNDS = 10;

function displayNameFromEmail(email: string): string {
  const localPart = email.split("@")[0]?.trim();
  if (localPart && localPart.length > 0) {
    return localPart.slice(0, 80);
  }
  return "Member";
}

export class InviteService {
  constructor(
    private readonly invites: HouseholdInviteRepository = householdInviteRepository,
    private readonly households: HouseholdRepository = householdRepository,
    private readonly members: HouseholdMemberRepository = householdMemberRepository,
    private readonly users: UserRepository = userRepository,
    private readonly tenants: TenantRepository = tenantRepository,
  ) {}

  async create(householdId: string, createdById: string): Promise<HouseholdInviteCreated> {
    const household = await this.households.findById(householdId);
    if (!household) {
      throw new NotFoundError("Household not found");
    }

    const invite = await this.invites.create({
      token: randomBytes(32).toString("base64url"),
      householdId,
      createdById,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    });

    return {
      token: invite.token,
      expiresAt: invite.expiresAt.toISOString(),
    };
  }

  async preview(token: string): Promise<HouseholdInvitePreview> {
    const invite = await this.requireOpenInvite(token);
    const household = await this.households.findById(invite.householdId);
    if (!household) {
      throw new NotFoundError("Household not found");
    }
    const tenants = await this.tenants.findAllByHousehold(invite.householdId);
    return {
      householdId: household.id,
      householdName: household.name,
      members: tenants
        .filter((tenant) => tenant.active)
        .map((tenant) => ({
          id: tenant.id,
          name: tenant.name,
          color: tenant.color,
          claimed: tenant.userId !== null,
        })),
    };
  }

  async listAccess(householdId: string): Promise<HouseholdAccessMember[]> {
    const household = await this.households.findById(householdId);
    if (!household) {
      throw new NotFoundError("Household not found");
    }

    const memberships = await this.members.listByHousehold(householdId);
    const access: HouseholdAccessMember[] = [];
    for (const membership of memberships) {
      const tenant = await this.tenants.findByHouseholdAndUser(householdId, membership.userId);
      const isGuest = membership.user.isGuest;
      if (isGuest && !tenant) {
        continue;
      }
      access.push({
        userId: membership.userId,
        name: tenant?.name ?? (isGuest ? "Guest" : displayNameFromEmail(membership.user.email)),
        role: parseHouseholdRole(membership.role),
        isGuest,
        email: isGuest ? null : membership.user.email,
      });
    }
    return access;
  }

  async acceptAsGuest(
    token: string,
    tenantId: string,
    existingUserId?: string,
  ): Promise<AcceptInviteResponse> {
    const invite = await this.requireOpenInvite(token);
    const tenant = await this.requireActiveMember(invite.householdId, tenantId);
    const userId = await this.resolveGuestUser(invite.householdId, existingUserId);
    await this.ensureMembership(invite.householdId, userId, "guest");
    const sessionToken = await signToken({ userId });
    return { householdId: invite.householdId, token: sessionToken, tenantId: tenant.id };
  }

  async acceptAsMember(
    token: string,
    userId: string,
    tenantId: string,
  ): Promise<AcceptInviteResponse> {
    const invite = await this.requireOpenInvite(token);
    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    if (user.isGuest) {
      throw new ValidationError("Create an account to link this member");
    }
    await claimTenantForUser(this.tenants, invite.householdId, tenantId, user.id);
    await this.ensureMembership(invite.householdId, user.id, "member");
    return { householdId: invite.householdId, token: null, tenantId };
  }

  async registerAndJoin(
    token: string,
    input: { email: string; password: string; tenantId: string },
  ): Promise<AcceptInviteResponse> {
    const invite = await this.requireOpenInvite(token);
    const tenant = await this.requireActiveMember(invite.householdId, input.tenantId);
    if (tenant.userId !== null) {
      throw new ConflictError("This member is already linked to an account");
    }
    const existing = await this.users.findByEmail(input.email);
    if (existing) {
      throw new ConflictError("Email already registered");
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const user = await this.users.createAccount({
      email: input.email.trim().toLowerCase(),
      passwordHash,
    });
    await claimTenantForUser(this.tenants, invite.householdId, input.tenantId, user.id);
    await this.ensureMembership(invite.householdId, user.id, "member");
    const sessionToken = await signToken({ userId: user.id });
    return { householdId: invite.householdId, token: sessionToken, tenantId: input.tenantId };
  }

  private async resolveGuestUser(householdId: string, existingUserId?: string): Promise<string> {
    if (existingUserId) {
      const user = await this.users.findById(existingUserId);
      if (user?.isGuest) {
        const membership = await this.members.findByUserAndHousehold(user.id, householdId);
        if (membership) {
          return user.id;
        }
      }
    }
    const user = await this.users.createGuest();
    return user.id;
  }

  private async ensureMembership(
    householdId: string,
    userId: string,
    role: "member" | "guest",
  ): Promise<void> {
    const existing = await this.members.findByUserAndHousehold(userId, householdId);
    if (!existing) {
      await this.members.create({ userId, householdId, role });
    }
  }

  private async requireActiveMember(householdId: string, tenantId: string) {
    const tenant = await this.tenants.findById(tenantId);
    if (!tenant || tenant.householdId !== householdId || !tenant.active) {
      throw new NotFoundError("Member not found");
    }
    return tenant;
  }

  private async requireOpenInvite(token: string) {
    const invite = await this.invites.findByToken(token);
    if (!invite) {
      throw new NotFoundError("Invite not found");
    }
    if (invite.expiresAt.getTime() <= Date.now()) {
      throw new ValidationError("Invite has expired");
    }
    return invite;
  }
}

export const inviteService = new InviteService();
