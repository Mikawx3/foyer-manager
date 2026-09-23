import type { AcceptInviteResponse, HouseholdAccessMember, HouseholdInviteCreated, HouseholdInvitePreview } from "@foyer/types";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { ConflictError, NotFoundError, ValidationError } from "../errors/app.errors.js";
import { generateMemberEmail } from "../lib/member-email.js";
import { DEFAULT_TENANT_COLOR, TENANT_COLOR_PRESETS } from "../lib/tenant-colors.js";
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
    return { householdName: household.name };
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

  async acceptAsGuest(token: string, name: string): Promise<AcceptInviteResponse> {
    const invite = await this.requireOpenInvite(token);
    const user = await this.users.createGuest();
    await this.join(invite.householdId, user.id, "guest", name.trim());
    const sessionToken = await signToken({ userId: user.id });
    return { householdId: invite.householdId, token: sessionToken };
  }

  async acceptAsMember(token: string, userId: string): Promise<AcceptInviteResponse> {
    const invite = await this.requireOpenInvite(token);
    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    const name = user.isGuest ? "Guest" : displayNameFromEmail(user.email);
    const role = user.isGuest ? "guest" : "member";
    await this.join(invite.householdId, user.id, role, name);
    return { householdId: invite.householdId, token: null };
  }

  async registerAndJoin(
    token: string,
    input: { email: string; password: string },
  ): Promise<AcceptInviteResponse> {
    const invite = await this.requireOpenInvite(token);
    const existing = await this.users.findByEmail(input.email);
    if (existing) {
      throw new ConflictError("Email already registered");
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const user = await this.users.createAccount({
      email: input.email.trim().toLowerCase(),
      passwordHash,
    });
    await this.join(
      invite.householdId,
      user.id,
      "member",
      displayNameFromEmail(user.email),
    );
    const sessionToken = await signToken({ userId: user.id });
    return { householdId: invite.householdId, token: sessionToken };
  }

  private async join(
    householdId: string,
    userId: string,
    role: "member" | "guest",
    name: string,
  ): Promise<void> {
    const existing = await this.members.findByUserAndHousehold(userId, householdId);
    if (!existing) {
      await this.members.create({ userId, householdId, role });
    }
    await this.ensureTenant(householdId, userId, name);
  }

  private async ensureTenant(householdId: string, userId: string, name: string): Promise<void> {
    const existing = await this.tenants.findByHouseholdAndUser(householdId, userId);
    if (existing) {
      return;
    }

    const activeCount = await this.tenants.countActiveByHousehold(householdId);
    await this.tenants.create({
      name,
      email: generateMemberEmail(),
      color:
        TENANT_COLOR_PRESETS[activeCount % TENANT_COLOR_PRESETS.length] ??
        DEFAULT_TENANT_COLOR,
      householdId,
      userId,
    });

    const household = await this.households.findById(householdId);
    const nextCount = await this.tenants.countActiveByHousehold(householdId);
    if (household?.type === "solo" && nextCount >= 2) {
      await this.households.updateById(householdId, { type: "shared" });
    }
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
