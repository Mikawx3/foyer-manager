import type { AuthResponse, AuthUser, LoginPayload, RegisterPayload } from "@foyer/types";
import bcrypt from "bcryptjs";
import { ConflictError, UnauthorizedError } from "../errors/app.errors.js";
import { verifyGoogleIdToken, type GoogleTokenVerifier } from "../lib/google-identity.js";
import { signToken } from "../lib/jwt.js";
import { toHouseholdDto } from "../lib/mappers.js";
import {
  householdMemberRepository,
  type HouseholdMemberRepository,
} from "../repositories/household-member.repository.js";
import { householdRepository } from "../repositories/household.repository.js";
import { userRepository, type UserRepository } from "../repositories/user.repository.js";
import { parseHouseholdRole } from "../lib/household-role.js";
import type { GoogleAuthInput, LoginInput, RegisterInput } from "../validators/auth.validator.js";

const BCRYPT_ROUNDS = 10;

function resolveHouseholdName(
  requested: string | undefined,
  profileName: string | null,
  email: string,
): string {
  const fromRequest = requested?.trim();
  if (fromRequest) {
    return fromRequest;
  }
  const fromProfile = profileName?.trim();
  if (fromProfile) {
    return fromProfile.slice(0, 255);
  }
  const localPart = email.split("@")[0]?.trim();
  if (localPart) {
    return localPart.slice(0, 255);
  }
  return "My household";
}

export class AuthService {
  constructor(
    private readonly users: UserRepository = userRepository,
    private readonly verifyGoogleToken: GoogleTokenVerifier = verifyGoogleIdToken,
    private readonly members: HouseholdMemberRepository = householdMemberRepository,
  ) {}

  async register(input: RegisterInput): Promise<AuthResponse> {
    const existing = await this.users.findByEmail(input.email);
    if (existing) {
      throw new ConflictError("Email already registered");
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const { user, householdId } = await this.users.createWithHousehold({
      email: input.email,
      passwordHash,
      householdName: input.householdName,
    });

    return this.issueSession(user.id, householdId, true);
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await this.users.findByEmail(input.email);
    if (!user?.password) {
      throw new UnauthorizedError(
        user && !user.isGuest ? "Sign in with Google for this account" : "Invalid email or password",
      );
    }

    const valid = await bcrypt.compare(input.password, user.password);
    if (!valid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const householdId = await this.resolveSessionHouseholdId(user.id);
    return this.issueSession(user.id, householdId, false);
  }

  async loginWithGoogle(input: GoogleAuthInput): Promise<AuthResponse> {
    const identity = await this.verifyGoogleToken(input.idToken);
    if (!identity.emailVerified) {
      throw new UnauthorizedError("Google email is not verified");
    }

    const email = identity.email.trim().toLowerCase();
    const linked = await this.users.findByGoogleSub(identity.sub);
    if (linked) {
      const householdId = await this.resolveSessionHouseholdId(linked.id);
      return this.issueSession(linked.id, householdId, false);
    }

    const existing = await this.users.findByEmail(email);
    if (existing) {
      if (existing.googleSub && existing.googleSub !== identity.sub) {
        throw new ConflictError("This email is already linked to another Google account");
      }
      const user = existing.googleSub
        ? existing
        : await this.users.linkGoogleSub(existing.id, identity.sub);
      const householdId = await this.resolveSessionHouseholdId(user.id);
      return this.issueSession(user.id, householdId, false);
    }

    const householdName = resolveHouseholdName(input.householdName, identity.name, email);
    const { user, householdId } = await this.users.createWithHousehold({
      email,
      passwordHash: null,
      googleSub: identity.sub,
      householdName,
    });
    return this.issueSession(user.id, householdId, true);
  }

  async me(userId: string): Promise<AuthUser> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    const memberships = await this.members.listByUser(userId);
    const summaries = memberships.map((membership) => ({
      householdId: membership.householdId,
      role: parseHouseholdRole(membership.role),
    }));
    const only = summaries.length === 1 ? summaries[0] : undefined;
    const household = only
      ? await householdRepository.findById(only.householdId)
      : null;

    return {
      userId: user.id,
      email: user.email,
      isGuest: user.isGuest,
      householdId: household && only ? only.householdId : null,
      household: household ? toHouseholdDto(household) : null,
      memberships: summaries,
    };
  }

  private async resolveSessionHouseholdId(userId: string): Promise<string | null> {
    const memberships = await this.members.listByUser(userId);
    if (memberships.length !== 1) {
      return null;
    }
    return memberships[0]?.householdId ?? null;
  }

  private async issueSession(
    userId: string,
    householdId: string | null,
    isNewAccount: boolean,
  ): Promise<AuthResponse> {
    const token = await signToken({ userId });
    return { token, householdId, isNewAccount };
  }
}

export const authService = new AuthService();

export type { RegisterPayload, LoginPayload };
